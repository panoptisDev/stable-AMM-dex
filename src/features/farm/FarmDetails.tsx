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
import { useETHBalances, useTokenBalance } from '../../state/wallet/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'

import { useCurrency } from '../../hooks/Tokens'
import { useV2PairsWithPrice } from '../../hooks/useV2Pairs'
import { GLINT_ADDRESS } from '../../constants/tokens'
import { WNATIVE } from '../../constants'
import { PriceContext } from '../../contexts/priceContext'
import { ApprovalState, useApproveCallback } from '../../hooks'
import { useV2LiquidityTokenPermit } from '../../hooks/useERC20Permit'
import FarmStakeModal from './FarmStakeModal'
import Web3Connect from '../../components/Web3Connect'
import { useDerivedSwapInfo } from '../../state/swap/hooks'
import QuestionHelper from '../../components/QuestionHelper'

interface FarmDetailsProps {
  isOpen: boolean
  onDismiss: () => void
  onClose: () => void
  farm: any
}

const YieldDetails: React.FC<FarmDetailsProps> = ({ isOpen, onDismiss, farm }) => {
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

  const [showStaking, setShowStaking] = useState(false)

  const [stakingString, setStakingString] = useState('stake')

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

  console.log(farm)

  const totalPoolTokens = useTokenBalance(BEAMCHEF_ADDRESS[chainId], liquidityToken)

  const poolTokenPercentage =
    !!amount && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens?.quotient, amount?.quotient)
      ? new Percent(amount?.quotient, totalPoolTokens?.quotient)
      : undefined

  // User liquidity token balance
  const balance = useTokenBalance(account, liquidityToken)

  function getTokenObject(token) {
    if (token && token.symbol !== 'GLMR') {
      return new Token(chainId, token.id, token.decimals, token.symbol, token.name)
    } else return undefined
  }

  const token1Balance = useTokenBalance(account, getTokenObject(farm?.pair?.token0))
  const token2Balance = useTokenBalance(account, getTokenObject(farm?.pair?.token1))

  const currencyBalance = useETHBalances(account ? [account] : [])
  const reward = usePendingReward(farm)

  const typedDepositValue = tryParseAmount(depositValue, liquidityToken)
  const typedWithdrawValue = tryParseAmount(withdrawValue, liquidityToken)

  const [approvalState, approve] = useApproveCallback(typedDepositValue, BEAMCHEF_ADDRESS[chainId])

  const { currencies } = useDerivedSwapInfo(false)

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
    <>
      {showStaking && (
        <FarmStakeModal
          isOpen={showStaking}
          onDismiss={() => setShowStaking(false)}
          farm={farm}
          title={'Stake or Unstake'}
          stake={stakingString}
          onClose={() => setShowStaking(false)}
        />
      )}
      <div className="w-full flex-col pl-4 pb-6" style={{ background: '#101247' }}>
        {!account && (
          <div className="flex-col items-center justify-center mt-6 mb-6">
            <div className="text-white text-center mb-4">No Tokens staked!</div>
            <div className="text-white text-center">
              Need Liquidity Tokens?{' '}
              <a href={`/exchange/add/${farm.pair.token0?.id}/${farm.pair.token1?.id}`} target="_blank">
                <span className="text-aqua">
                  Get <span>{farm?.pair?.token0?.symbol}</span>
                  {farm?.pair?.token1?.symbol && <span className="px-1">-</span>}
                  {token1 && <span>{farm?.pair?.token1?.symbol}</span>} LP
                </span>{' '}
              </a>
            </div>
            <div className="flex mt-6 justify-center">
              {approvalState === ApprovalState.NOT_APPROVED ||
                (approvalState === ApprovalState.PENDING && (
                  <Button
                    className="w-1/5 bg-linear-gradient"
                    size="sm"
                    variant="outlined"
                    disabled={approvalState === ApprovalState.PENDING}
                    onClick={approve}
                    style={{ height: 56 }}
                  >
                    {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : i18n._(t`Approve`)}
                  </Button>
                ))}
              {!account && approvalState === 'UNKNOWN' && (
                <Web3Connect size="lg" className="w-3/5 md:w-1/5 bg-linear-gradient" style={{ height: 56 }} />
              )}
            </div>
          </div>
        )}
        {account && (
          <div className="flex-col mt-4">
            <div className="text-jordyBlue text-lg">Staked Balance</div>
            <div className="mb-2 text-left flex text-white">
              <div className="flex w-3/5 justify-between pb-3 border-b border-lightBlueSecondary">
                <div>
                  {farm?.pair?.token0?.symbol && farm?.pair?.token1?.symbol && (
                    <>
                      <span>{farm?.pair?.token0?.symbol}</span>
                      {farm?.pair?.token1?.symbol && <span className="px-1">-</span>}
                      {token1 && <span>{farm?.pair?.token1?.symbol}</span>}
                    </>
                  )}
                  {!farm?.pair?.token1?.symbol && farm?.pair?.token0.symbol && (
                    <>
                      <span>{farm?.pair?.token0?.symbol}</span>
                      <span className="mt-1">
                        <QuestionHelper text={i18n._(t`There is 4% deposit fee`)} />
                      </span>
                    </>
                  )}
                </div>
                <div className="ml-auto flex-col text-right">
                  <div className="font-bold">
                    {farm.lpPrice !== NaN
                      ? formatNumber(Number(amount?.toSignificant(4, undefined, 2)) * farm.lpPrice ?? 0, true)
                      : 0}

                    {!amount && '$0.0'}
                  </div>
                  <div>{formatNumberScale(amount?.toSignificant(5)) ?? 0}</div>
                </div>
              </div>
              <div className="w-1/3 mr-auto ml-auto">
                <Button
                  color="gradient"
                  className="w-full bg-linear-gradient md:text-md text-sm"
                  style={{ height: 48 }}
                  variant={!!nextHarvestUntil && nextHarvestUntil > Date.now() ? 'outlined' : 'filled'}
                  onClick={() => {
                    setShowStaking(true)
                    setStakingString('stake')
                  }}
                >
                  {i18n._(t`Stake`)}
                </Button>
              </div>
            </div>
            <div className="text-jordyBlue text-lg mt-3">Unstaked Holdings</div>
            <div className="mb-1 text-left text-white w-3/5">
              <div className="flex">
                <div>
                  <span>{farm?.pair?.token0?.symbol}</span>
                </div>
                <div className="ml-auto flex-col text-right">
                  <div className="font-bold">
                    {farm?.pair?.token0?.symbol !== 'GLMR' &&
                      formatNumberScale(token1Balance?.toSignificant(4, undefined, 2) ?? 0, false, 4)}
                    {farm?.pair?.token0?.symbol === 'GLMR' &&
                      formatNumberScale(currencyBalance[account]?.toSignificant(4, undefined, 2) ?? 0, false, 4)}
                  </div>
                </div>
              </div>
            </div>
            {farm?.pair?.token1 !== undefined && (
              <div className="mb-2 text-left text-white w-3/5 pb-3 border-b border-lightBlueSecondary">
                <div className="flex">
                  <div>
                    <span>{farm?.pair?.token1?.symbol}</span>
                  </div>
                  <div className="ml-auto flex-col text-right">
                    <div className="font-bold">
                      {farm?.pair?.token1?.symbol !== 'GLMR' &&
                        formatNumberScale(token2Balance?.toSignificant(4, undefined, 2) ?? 0, false, 4)}
                      {farm?.pair?.token1?.symbol === 'GLMR' &&
                        formatNumberScale(currencyBalance[account]?.toSignificant(4, undefined, 2) ?? 0, false, 4)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="text-jordyBlue text-lg">Earned</div>
            <div className="flex border-b border-lightBlueSecondary pb-3">
              <div className="flex justify-between w-3/5">
                <span>GLINT</span>
                <div className="flex-col text-right w-3/5">
                  {pendingGlint.length <= 1 && i18n._(t`${formatNumber(pendingGlint[0].toFixed(18))}`)}
                  {!account && '0'}
                </div>
              </div>
              <div className="w-1/3 mr-auto ml-auto mb-2" style={{ marginTop: -10 }}>
                <Button
                  color="gradient"
                  className="w-full bg-linear-gradient md:text-md text-sm"
                  style={{ height: 48 }}
                  variant={!!nextHarvestUntil && nextHarvestUntil > Date.now() ? 'outlined' : 'filled'}
                  disabled={pendingGlint[0]?.isZero()}
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
                  {i18n._(t`Harvest`)}
                </Button>
              </div>
            </div>
            <div className="flex mt-3 justify-between">
              <div className="flex w-3/5">
                <div className="text-aqua mr-5">
                  {farm?.id != '5' && (
                    <a
                      href={`/exchange/swap?inputCurrency=${farm.pair.token0?.id}&outputCurrency=${farm.pair.token1?.id}`}
                      target="_blank"
                    >
                      View Pair →
                    </a>
                  )}
                </div>
                <div className="text-aqua mr-5">
                  <span className="text-aqua">
                    {farm?.id == '5' && (
                      <a
                        href={`/exchange/swap/?inputCurrency=${'GLMR'}&outputCurrency=${farm.pair.token0?.id}`}
                        target="_blank"
                      >
                        Get →{farm?.pair?.token1?.symbol && <span className="px-1">-</span>}
                        {token1 && <span>{farm?.pair?.token1?.symbol}</span>} WGLMR
                      </a>
                    )}
                    {farm?.id != '5' && (
                      <a href={`/exchange/add/${farm.pair.token0?.id}/${farm.pair.token1?.id}`} target="_blank">
                        Get <span>{farm?.pair?.token0?.symbol}</span>
                        {farm?.pair?.token1?.symbol && <span className="px-1">-</span>}
                        {token1 && <span>{farm?.pair?.token1?.symbol}</span>} LP
                      </a>
                    )}
                  </span>
                </div>
              </div>
              <div className="w-1/3 ml-auto mr-auto">
                <Button
                  color="gradient"
                  className="w-full bg-inputBlue md:text-md text-sm text-aqua"
                  style={{ height: 48, background: '#142970', borderRadius: 2 }}
                  variant={!!nextHarvestUntil && nextHarvestUntil > Date.now() ? 'outlined' : 'filled'}
                  onClick={() => {
                    setShowStaking(true)
                    setStakingString('unstake')
                  }}
                >
                  {i18n._(t`Unstake`)}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return <>{getModalContent()}</>
}

export default React.memo(YieldDetails)
