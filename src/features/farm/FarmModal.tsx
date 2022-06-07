import React, { useState, useContext } from 'react'
import { usePendingTokens, useUserInfo } from './hooks'
import { formatBalance, formatNumber, formatNumberScale, formatPercent } from '../../functions'
import { t } from '@lingui/macro'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { isMobile } from 'react-device-detect'
import DoubleLogo from '../../components/DoubleLogo'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Token, ZERO, Percent, JSBI } from '../../sdk'
import Settings from '../../components/Settings'

import Button from '../../components/Button'
import Dots from '../../components/Dots'
import { BEAMCHEF_ADDRESS } from '../../constants/addresses'
import { Input as NumericalInput } from '../../components/NumericalInput'
import { getAddress } from '@ethersproject/address'
import { tryParseAmount } from '../../functions/parse'
import useMasterChef from './useMasterChef'
import usePendingReward from './usePendingReward'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'

import { useCurrency } from '../../hooks/Tokens'
import { useV2PairsWithPrice } from '../../hooks/useV2Pairs'
import { GLINT_ADDRESS } from '../../constants/tokens'
import { WNATIVE } from '../../constants'
import { PriceContext } from '../../contexts/priceContext'
import { ApprovalState, useApproveCallback } from '../../hooks'
import { useV2LiquidityTokenPermit } from '../../hooks/useERC20Permit'

interface FarmModalProps {
  isOpen: boolean
  onDismiss: () => void
  onClose: () => void
  farm: any
}

const YieldDetails: React.FC<FarmModalProps> = ({ isOpen, onDismiss, farm }) => {
  const { account, chainId } = useActiveWeb3React()

  const { i18n } = useLingui()

  let token0 = useCurrency(farm.pair.token0?.id)
  let token1 = useCurrency(farm.pair.token1?.id)

  const priceData = useContext(PriceContext)

  const glintPrice = priceData?.['glint']
  const movrPrice = priceData?.['glmr']
  const ribPrice = priceData?.['rib']

  const [selectedFarm, setSelectedFarm] = useState<string>(null)
  const [showDetails, setShowDetails] = useState(false)

  const [stakeState, setStakeState] = useState('stake')

  let [data] = useV2PairsWithPrice([[token0, token1]])
  let [state, pair, pairPrice] = data

  function getTvl() {
    let lpPrice = 0
    let decimals = 18
    if (farm.lpToken.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase()) {
      lpPrice = glintPrice
      decimals = farm.pair.token0?.decimals
    } else if (farm.lpToken.toLowerCase() == WNATIVE[chainId].toLowerCase()) {
      lpPrice = movrPrice
    } else if (farm.lpToken.toLowerCase() == '0xbD90A6125a84E5C512129D622a75CDDE176aDE5E'.toLowerCase()) {
      lpPrice = ribPrice
    } else {
      lpPrice = pairPrice
    }

    farm.lpPrice = lpPrice
    farm.glintPrice = glintPrice

    return Number(farm.totalLp / 10 ** decimals) * lpPrice
  }

  const pendingGlint = usePendingTokens(farm)

  const tvl = getTvl()

  const roiPerBlock =
    farm?.rewards?.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
    }, 0) / tvl

  const roiPerHour = roiPerBlock * farm.blocksPerHour
  const roiPerDay = roiPerHour * 24
  const roiPerMonth = roiPerDay * 30
  const roiPerYear = roiPerDay * 365

  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')

  const addTransaction = useTransactionAdder()

  const liquidityToken = new Token(
    chainId,
    getAddress(farm.lpToken),
    farm.pair.token1 ? 18 : farm.pair.token0 ? farm.pair.token0.decimals : 18,
    farm.pair.token1 ? farm.pair.symbol : farm.pair.token0.symbol,
    farm.pair.token1 ? farm.pair.name : farm.pair.token0.name
  )
  // TODO: Replace these
  const { amount, nextHarvestUntil } = useUserInfo(farm, liquidityToken)
  const isLpToken = farm.pair.token1 ? true : false

  const totalPoolTokens = useTokenBalance(BEAMCHEF_ADDRESS[chainId], liquidityToken)

  const poolTokenPercentage =
    !!amount && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens?.quotient, amount?.quotient)
      ? new Percent(amount?.quotient, totalPoolTokens?.quotient)
      : undefined

  // User liquidity token balance
  const balance = useTokenBalance(account, liquidityToken)

  const reward = usePendingReward(farm)

  const typedDepositValue = tryParseAmount(depositValue, liquidityToken)
  const typedWithdrawValue = tryParseAmount(withdrawValue, liquidityToken)

  const [approvalState, approve] = useApproveCallback(typedDepositValue, BEAMCHEF_ADDRESS[chainId])

  // allowance handling
  const { gatherPermitSignature, signatureData } = useV2LiquidityTokenPermit(
    typedDepositValue,
    BEAMCHEF_ADDRESS[chainId]
  )

  async function onAttemptToApprove() {
    if (gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code > 1) {
          await approve()
        }
      }
    } else {
      await approve()
    }
  }

  const renderApproveNoSign = () => {
    return approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING ? (
      <Button
        className="w-full"
        size="sm"
        variant="outlined"
        color="gradient"
        disabled={approvalState === ApprovalState.PENDING}
        onClick={approve}
      >
        {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : i18n._(t`Approve`)}
      </Button>
    ) : (
      <Button
        className="bg-linear-gradient mr-4 ml-4 mb-12 opacity-80 hover:opacity-100"
        size="sm"
        variant="outlined"
        color="white"
        style={{ width: '-webkit-fill-available' }}
        disabled={pendingTx || !typedDepositValue || balance.lessThan(typedDepositValue)}
        onClick={async () => {
          setPendingTx(true)
          try {
            // KMP decimals depend on asset, SLP is always 18
            const tx = await deposit(farm?.id, depositValue.toBigNumber(liquidityToken?.decimals))

            addTransaction(tx, {
              summary: `${i18n._(t`Deposit`)} ${
                farm.pair.token1 ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}` : farm.pair.token0.symbol
              }`,
            })
          } catch (error) {
            console.error(error)
          }
          setPendingTx(false)
        }}
      >
        {i18n._(t`Stake`)}
      </Button>
    )
  }

  const renderApproveSign = () => {
    return signatureData === null ? (
      <div className="px-4 pb-12">
        <Button
          color="gradient"
          className="w-full bg-linear-gradient text-sm md:text-md"
          style={{ height: 48 }}
          disabled={signatureData !== null}
          onClick={onAttemptToApprove}
        >
          {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : i18n._(t`Sign & Stake`)}
        </Button>
      </div>
    ) : (
      <Button
        className="bg-linear-gradient mr-4 ml-4 mb-12 opacity-80 hover:opacity-100"
        size="sm"
        variant="outlined"
        color="white"
        style={{ width: '-webkit-fill-available' }}
        disabled={pendingTx || !typedDepositValue || balance.lessThan(typedDepositValue)}
        onClick={async () => {
          setPendingTx(true)
          try {
            // KMP decimals depend on asset, SLP is always 18
            const tx = await depositWithPermit(
              farm?.id,
              depositValue.toBigNumber(liquidityToken?.decimals),
              signatureData.deadline,
              signatureData.v,
              signatureData.r,
              signatureData.s
            )

            addTransaction(tx, {
              summary: `${i18n._(t`Deposit`)} ${
                farm.pair.token1 ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}` : farm.pair.token0.symbol
              }`,
            })
          } catch (error) {
            console.error(error)
          }
          setPendingTx(false)
        }}
      >
        {i18n._(t`Stake`)}
      </Button>
    )
  }

  const { deposit, withdraw, harvest, depositWithPermit } = useMasterChef()

  const getModalContent = () => (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      className="bg-blue"
      style={{ backgroundColor: '#ffffff !important' }}
      maxWidth={1000}
      border={false}
      background={'#0C1A4A'}
    >
      <div className="space-y-4">
        <ModalHeader title={i18n._(t`Manage Farm`)} onClose={onDismiss} />
        <div className="wrapper flex-col md:flex md:flex-row" style={{ marginBottom: 20 }}>
          <div className="first md:w-3/5 bg-blue ml-3 mr-3 md:mr-0" style={{ border: '1px solid #1F357D' }}>
            <div className="flex col-span-2 space-x-4 md:col-span-1 px-3 py-6 bg-darkBlue">
              <div className={`flex flex justify-start ${token1 ? 'md:flex-row' : ''}`}>
                <div className="flex gap-3 text-white" style={{ lineHeight: '27px' }}>
                  <CurrencyLogo currency={token0} size={isMobile ? 30 : 30} />
                  <span className="flex font-bold">{farm?.pair?.token0?.symbol}</span>

                  {farm?.pair?.token1?.symbol && <span>-</span>}

                  {farm?.pair?.token1?.symbol && <CurrencyLogo currency={token1} size={isMobile ? 30 : 30} />}
                  {token1 && <span className="flex font-bold">{farm?.pair?.token1?.symbol}</span>}
                  {!token1 && token0?.symbol == 'GLINT' && <div className="flex gap-2"></div>}
                </div>
              </div>
            </div>
            <div className="flex-col md:flex md:flex-row bg-darkBlue pb-5 md:pb-0">
              <div
                className="px-4 md:w-1/3 py-2 md:py-4 flex md:flex-col justify-between md:items-start items-start border-transparent border-lightBlueSecondary border text-xs mr-3 ml-3 mb-5"
                style={{ borderWidth: 2 }}
              >
                <div className="text-aqua text-xs mb-0 md:mb-3">Liquidity</div>
                <div className="text-white font-bold text-sm">{formatNumberScale(tvl, true, 2)}</div>
              </div>
              <div
                className="px-4 md:w-1/3 py-2 md:py-4 flex md:flex-col justify-between md:items-start items-start border-transparent border-lightBlueSecondary border text-xs mr-3 ml-3 mb-5"
                style={{ borderWidth: 2 }}
              >
                <div className="text-aqua mb-0 md:mb-3 text-xs">Pool Weight</div>
                <div className="text-white font-bold text-sm">{farm?.allocPoint?.div(10).toString()}x</div>
              </div>
              <div
                className="px-4 md:w-1/3 py-2 md:py-4 flex md:flex-col justify-between md:items-start items-start border-transparent border-lightBlueSecondary border text-xs mr-3 ml-3 md:mb-5"
                style={{ borderWidth: 2 }}
              >
                <div className="text-aqua mb-0 md:mb-3 text-xs">APR</div>
                <div className="text-white font-bold text-sm">
                  {roiPerYear > 1000000 ? '100000000%+' : formatPercent(roiPerYear * 100)}
                </div>
              </div>
            </div>
            <div className="px-4 py-2 flex-col md:flex md:flex-row justify-between text-xs bg-deepCove">
              <div className="flex-col md:flex md:flex-row justify-between md:justify-start md:flex-col ml-3 mt-3 md:mt-0 pb-2 md:pb-0">
                <div className="flex justify-between md:flex-col ml-0 border-b border-blue md:border-none pb-2 md:pb-0">
                  <div className="py-1 flex justify-between border-transparent text-xs mr-3 mt-3">
                    <div className="text-aqua mr-6 text-xs">Staked</div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg pb-1">
                      {formatNumberScale(amount?.toSignificant(6)) ?? 0}
                    </div>
                    <div className="text-jordyBlue font-bold text-xs">
                      {farm.lpPrice !== NaN
                        ? formatNumber(Number(amount?.toSignificant(4, undefined, 2)) * farm.lpPrice ?? 0, true)
                        : 0}
                      {!amount && '$0.0'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between md:flex-col ml-0">
                  <div className="py-1 flex justify-between border-transparent text-xs mr-3 mt-3">
                    <div className="text-aqua mr-6 text-xs">Your share</div>
                  </div>
                  <div className="text-white font-bold text-lg pb-1 mt-3 mr-3 md:mt-0 md:mr-0">
                    {poolTokenPercentage?.greaterThan(0) ? poolTokenPercentage?.toFixed(6) + '%' : '0%'}
                  </div>
                </div>
              </div>

              <div className="flex-col md:w-2/3 bg-darkBlue p-6 m-3 rounded-sm">
                <div className="text-aqua mr-6 text-xs">Pending Rewards</div>
                <div className="text-white font-bold text-lg pb-1">
                  {pendingGlint.length <= 1 && i18n._(t`${formatNumber(pendingGlint[0].toFixed(18))}`)}
                  {pendingGlint.length > 1 &&
                    i18n._(t`${formatNumber(pendingGlint[0].add(pendingGlint[1]).toFixed(18))}`)}
                  {!account && '0'}
                </div>
                <div className="text-jordyBlue font-bold text-xs">
                  {pendingGlint.length <= 1 &&
                    i18n._(t`$${formatNumber((parseFloat(formatBalance(pendingGlint[0])) * glintPrice).toFixed(18))}`)}
                  {pendingGlint.length > 1 &&
                    i18n._(
                      t`$${formatNumber(
                        pendingGlint[0].add(parseFloat(formatBalance(pendingGlint[1])) * glintPrice).toFixed(18)
                      )}`
                    )}
                </div>
                {(pendingGlint.length <= 1 || pendingGlint.length > 1) && (
                  <div className="mt-4 pb-4">
                    <Button
                      color="gradient"
                      className="w-full bg-linear-gradient md:text-md text-sm"
                      style={{ height: 48 }}
                      variant={!!nextHarvestUntil && nextHarvestUntil > Date.now() ? 'outlined' : 'filled'}
                      disabled={!!nextHarvestUntil && nextHarvestUntil > Date.now()}
                      onClick={async () => {
                        setPendingTx(true)
                        try {
                          const tx = await harvest(farm.id)
                          addTransaction(tx, {
                            summary: `${i18n._(t`Harvest`)} ${
                              farm.pair.token1
                                ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}`
                                : farm.pair.token0.symbol
                            }`,
                          })
                        } catch (error) {
                          console.error(error)
                        }
                        setPendingTx(false)
                      }}
                    >
                      {pendingGlint.length <= 1 && i18n._(t`Harvest`)}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="second md:w-2/5 mt-6 md:mt-0 mr-3 md:mr-0">
            <div className="flex-col bg-darkBlue md:mr-3 ml-3" style={{ border: '1px solid #1F357D', height: '100%' }}>
              <div className="flex justify-between m-4 mt-6">
                <div className="flex">
                  <div
                    className={`${
                      stakeState == 'stake' ? 'bg-lightBlueSecondary text-aqua' : 'bg-deepCove text-white'
                    } py-2 px-4 cursor-pointer hover:text-aqua hover:bg-lightBlueSecondary`}
                    onClick={() => setStakeState('stake')}
                    style={{ transition: '0.3s all' }}
                  >
                    Stake
                  </div>
                  <div
                    className={`${
                      stakeState == 'unstake' ? 'bg-lightBlueSecondary text-aqua' : 'bg-deepCove text-white'
                    } py-2 px-4 cursor-pointer hover:text-aqua hover:bg-lightBlueSecondary`}
                    onClick={() => setStakeState('unstake')}
                    style={{ transition: '0.3s all' }}
                  >
                    Unstake
                  </div>
                </div>
                <div className="bg-inputBlue text-aqua" style={{ height: '32px', lineHeight: '25px' }}>
                  <Settings />
                </div>
              </div>

              {stakeState == 'stake' && (
                <div>
                  {account && (
                    <div className="pr-4 mb-2 text-left text-aqua">
                      <div className="flex mr-4 ml-4">
                        <div>
                          <span className="font-bold">{farm?.pair?.token0?.symbol}</span>
                          {farm?.pair?.token1?.symbol && <span>-</span>}
                          {token1 && <span className="font-bold">{farm?.pair?.token1?.symbol}</span>}
                          <span className="text-white ml-1">Balance</span>
                        </div>
                        <div className="ml-auto">
                          {formatNumberScale(balance?.toSignificant(4, undefined, 2) ?? 0, false, 4)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="relative flex items-center mb-5 mr-4 ml-4">
                    <NumericalInput
                      className="px-4 py-4 pr-20 bg-deepCove focus:ring focus:ring-lightBlueSecondary placeholder text-jordyBlue"
                      value={depositValue}
                      onUserInput={setDepositValue}
                    />
                    {account && (
                      <Button
                        variant="outlined"
                        color="white"
                        size="xs"
                        onClick={() => {
                          if (!balance.equalTo(ZERO)) {
                            if (liquidityToken?.symbol == 'GLINT') {
                              try {
                                const minValue = 1 / 10 ** (liquidityToken?.decimals - 10)
                                const newValue = parseFloat(balance.toFixed(liquidityToken?.decimals)) - minValue
                                setDepositValue(newValue.toFixed(liquidityToken?.decimals))
                              } catch (e) {
                                setDepositValue(balance.toFixed(liquidityToken?.decimals))
                              }
                            } else {
                              setDepositValue(balance.toFixed(liquidityToken?.decimals))
                            }
                          }
                        }}
                        style={{ borderRadius: 2 }}
                        className="absolute border-0 right-4 focus:ring focus:ring-light-purple bg-royalBlue text-white"
                      >
                        {i18n._(t`MAX`)}
                      </Button>
                    )}
                  </div>
                  {!isLpToken ? renderApproveNoSign() : renderApproveSign()}
                </div>
              )}

              {stakeState == 'unstake' && (
                <div>
                  <div className="col-span-2 text-center md:col-span-1">
                    {farm.depositFeeBP && !isMobile && (
                      <div className="pr-4 mb-2 text-left cursor-pointer text-secondary" style={{ height: '24px' }} />
                    )}
                    {account && (
                      <div className="pr-4 mb-2 text-left flex justify-between mr-4 ml-4">
                        <div className="text-aqua font-bold">
                          {i18n._(t`STAKED`)}{' '}
                          <span className="text-white font-normal" style={{ marginLeft: 2 }}>
                            Balance
                          </span>
                        </div>
                        <div className="text-aqua">{formatNumberScale(amount?.toSignificant(6)) ?? 0}</div>
                      </div>
                    )}
                    <div className="relative flex items-center mb-5 mr-4 ml-4">
                      <NumericalInput
                        className="px-4 py-4 pr-20 bg-deepCove focus:ring focus:ring-lightBlueSecondary placeholder text-jordyBlue"
                        value={withdrawValue}
                        onUserInput={setWithdrawValue}
                      />
                      {account && (
                        <Button
                          variant="outlined"
                          color="white"
                          size="xs"
                          onClick={() => {
                            if (!amount.equalTo(ZERO)) {
                              setWithdrawValue(amount.toFixed(liquidityToken?.decimals))
                            }
                          }}
                          style={{ borderRadius: 2 }}
                          className="absolute border-0 right-4 focus:ring focus:ring-light-purple bg-royalBlue text-white"
                        >
                          {i18n._(t`MAX`)}
                        </Button>
                      )}
                    </div>
                    <Button
                      className="bg-linear-gradient mr-4 ml-4 mb-12 opacity-80 hover:opacity-100"
                      size="sm"
                      variant="outlined"
                      color="white"
                      style={{ width: '-webkit-fill-available' }}
                      disabled={pendingTx || !typedWithdrawValue || amount.lessThan(typedWithdrawValue)}
                      onClick={async () => {
                        setPendingTx(true)
                        try {
                          // KMP decimals depend on asset, SLP is always 18
                          const tx = await withdraw(farm?.id, withdrawValue.toBigNumber(liquidityToken?.decimals))
                          addTransaction(tx, {
                            summary: `${i18n._(t`Withdraw`)} ${
                              farm.pair.token1
                                ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}`
                                : farm.pair.token0.symbol
                            }`,
                          })
                        } catch (error) {
                          console.error(error)
                        }

                        setPendingTx(false)
                      }}
                    >
                      {i18n._(t`Unstake`)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {getModalContent()}
    </Modal>
  )
}

export default React.memo(YieldDetails)
