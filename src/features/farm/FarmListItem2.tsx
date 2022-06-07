import { classNames, formatBalance, formatNumber, formatNumberScale, formatPercent } from '../../functions'

import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { ChainId, MASTERCHEF_ADDRESS, Token, ZERO } from '../../sdk'
import { Chef, PairType } from './enum'

import Button from '../../components/Button'
import Dots from '../../components/Dots'
import { MASTERCHEF_V2_ADDRESS } from '../../constants'
import { BEAMCHEF_ADDRESS, MINICHEF_ADDRESS } from '../../constants/addresses'
import { Input as NumericalInput } from '../../components/NumericalInput'
import { getAddress } from '@ethersproject/address'
import { tryParseAmount } from '../../functions/parse'
import useMasterChef from './useMasterChef'
import usePendingReward from './usePendingReward'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useToken } from '../../hooks/Tokens'

import { Disclosure } from '@headlessui/react'
import DoubleLogo from '../../components/DoubleLogo'
import Image from '../../components/Image'
import React, { useContext, useState } from 'react'
import { useCurrency } from '../../hooks/Tokens'
import { useV2PairsWithPrice } from '../../hooks/useV2Pairs'
import { GLINT_ADDRESS } from '../../constants/tokens'
import { useActiveWeb3React } from '../../hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import CurrencyLogo from '../../components/CurrencyLogo'
import { isMobile } from 'react-device-detect'
import YieldDetails from '../../components/YieldDetails'
import IconWrapper from '../../components/IconWrapper'
import { WNATIVE } from '../../constants'
import { PriceContext } from '../../contexts/priceContext'
import { Info } from 'react-feather'
import Link from 'next/link'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import Typography from '../../components/Typography'
import { usePendingTokens, useUserInfo } from './hooks'
import FarmModal from './FarmModal'
import { ethers } from 'ethers'
import QuestionHelper from '../../components/QuestionHelper'

const FarmListItem2 = ({ farm, ...rest }) => {
  const { chainId, account } = useActiveWeb3React()

  let token0 = useCurrency(farm.pair.token0?.id)
  let token1 = useCurrency(farm.pair.token1?.id)

  const priceData = useContext(PriceContext)

  const glintPrice = priceData?.['glint']
  const glmrPrice = priceData?.['glmr']
  const ribPrice = priceData?.['rib']

  const [selectedFarm, setSelectedFarm] = useState<string>(null)
  const [showDetails, setShowDetails] = useState(false)

  let [data] = useV2PairsWithPrice([[token0, token1]])
  let [state, pair, pairPrice] = data

  function getTvl() {
    let lpPrice = 0
    let decimals = 18
    if (farm.lpToken.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase()) {
      lpPrice = glintPrice
      decimals = farm.pair.token0?.decimals
    } else if (farm.lpToken.toLowerCase() == WNATIVE[chainId].toLowerCase()) {
      lpPrice = glmrPrice
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

  const { i18n } = useLingui()

  return (
    <React.Fragment>
      <Disclosure {...rest}>
        {({ open }) => (
          <div className="mb-4 w-full md:w-1/3 cursor-default farm-item">
            {showDetails && (
              <FarmModal
                isOpen={showDetails}
                onDismiss={() => setShowDetails(false)}
                farm={farm}
                onClose={() => setShowDetails(false)}
              />
            )}
            <Disclosure.Button
              className={classNames(
                open && '',
                'w-full text-left select-none bg-deepCove  text-white text-sm md:text-lg'
              )}
              style={{ border: '2px solid #1F357D', cursor: 'default' }}
            >
              <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
              <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />
              <div className="flex flex-col">
                <div
                  className="flex col-span-2 space-x-4 md:col-span-1 mx-4  py-6"
                  style={{ borderBottom: '2px solid #1F357D' }}
                >
                  {token1 ? (
                    <DoubleLogo currency0={token0} currency1={token1} size={isMobile ? 30 : 30} />
                  ) : (
                    <div className="flex items-center">
                      <CurrencyLogo currency={token0} size={isMobile ? 30 : 30} />
                    </div>
                  )}

                  <div
                    className={`flex flex justify-center ml-auto ${token1 ? 'md:flex-row' : ''}`}
                    style={{ marginLeft: 'auto' }}
                  >
                    <div className="flex gap-3 font-bold">
                      <span className="flex">{farm?.pair?.token0?.symbol}</span>
                      {farm?.pair?.token1?.symbol && <span>-</span>}
                      {token1 && <span className="flex">{farm?.pair?.token1?.symbol}</span>}
                      {!token1 && token0?.symbol == 'GLINT' && (
                        <div className="flex gap-2">
                          {/* <span className="text-emphasis underline hover:text-yellow">Unstake</span>
                          <Link href="/vaults">
                            <span className="text-emphasis underline hover:text-yellow">Use Vaults</span>
                          </Link> */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 border-transparent text-xs mr-3 ml-3 mb-3 flex justify-between mt-4">
                  <div>
                    <div className="text-white text-lg opacity-40">APR</div>
                    {roiPerBlock != 0 && (
                      <div className="text-white text-sm">
                        {roiPerYear > 1000000 ? '100000000%+' : formatPercent((roiPerYear + farm.feeApyPerYear) * 100)}
                        <QuestionHelper
                          text={
                            <>
                              <div>Reward APR: {formatPercent(roiPerYear * 100)}</div>
                              <div>LP APR: {formatPercent(farm.feeApyPerYear * 100)}</div>
                            </>
                          }
                        />
                      </div>
                    )}

                    {roiPerBlock == 0 && (
                      <div className="text-white text-sm">
                        {roiPerYear > 1000000 ? '100000000%+' : formatPercent(0 * 100)}
                        <QuestionHelper
                          text={
                            <>
                              <div>Reward APR: {formatPercent(0)}</div>
                              <div>LP APR: {formatPercent(farm.feeApyPerYear * 100)}</div>
                            </>
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-white text-lg opacity-40">LIQUIDITY</div>
                    <div className="text-white text-sm">{formatNumberScale(tvl, true, 2)}</div>
                  </div>
                </div>
                <div className="flex justify-center gap-5 p-3">
                  <div
                    className="bg-gradient-to-r from-light-purple via-dark-purple to-light-blue text-xs text-center cursor-pointer opacity-80 hover:opacity-100"
                    style={{ width: '95%', transition: '0.3s all', borderRadius: 2 }}
                  >
                    <div
                      className="bg-darkBlue px-4 py-2 text-sm"
                      onClick={() => {
                        setShowDetails(true)
                      }}
                      style={{ margin: 2, borderRadius: 2 }}
                    >
                      {/* <h1 className="neon-text">Manage Farm</h1> */}
                      Manage Farm
                    </div>
                  </div>
                </div>
                <div
                  className={
                    farm?.symbol?.length > 1
                      ? 'flex-row items-center space-x-4 flex justify-between mr-4 ml-4 mb-3'
                      : 'flex-row items-center space-x-4 flex justify-between mr-4 ml-4 mb-8'
                  }
                >
                  {farm?.cardRewards.map(
                    (reward, i) =>
                      (reward.rewardsPerSec.length <= 1 && (
                        <div
                          key={i}
                          className="text-xs md:text-xs whitespace-nowrap flex mb-3 mt-6"
                          style={{ lineHeight: '25px' }}
                        >
                          <span className="mr-1">
                            <img
                              src={'/images/tokens/' + reward.symbol[0].toLowerCase() + '.png'}
                              height={25}
                              width={25}
                            />
                          </span>
                          <span className="mr-1">
                            {formatNumber(ethers.utils.formatUnits(reward.rewardsPerSec[0].mul(86400), 18))}
                          </span>
                          <span className="mr-1">{reward.symbol[0].toLowerCase()}</span>
                          <span>{i18n._(t`/ DAY`)}</span>
                        </div>
                      )) ||
                      (reward.rewardsPerSec.length > 1 && (
                        // <div key={i} className="text-xs md:text-xs whitespace-nowrap">
                        //   {formatNumber(reward.rewardPerDay)} {farm.symbol[0]} <span>&</span> {farm.symbol[1]}{' '}
                        //   {i18n._(t`/ DAY`)}
                        // </div>

                        <div
                          key={i}
                          className="text-xs md:text-xs whitespace-nowrap mt-6"
                          style={{ lineHeight: '25px' }}
                        >
                          <div className="flex mb-2" style={{ lineHeight: '25px' }}>
                            <span className="mr-1">
                              <img
                                src={'/images/tokens/' + reward.symbol[0].toLowerCase() + '.png'}
                                height={25}
                                width={25}
                                style={{ borderRadius: 10 }}
                              />
                            </span>
                            <span className="mr-1">
                              {formatNumber(ethers.utils.formatUnits(reward.rewardsPerSec[0].mul(86400), 18))}
                            </span>
                            <span className="mr-1">{farm.symbol[0]}</span>
                            <span>{i18n._(t`/ DAY`)}</span>
                          </div>
                          <div className="flex" style={{ lineHeight: '25px' }}>
                            <span className="mr-1">
                              <img
                                src={'/images/tokens/' + reward.symbol[1].toLowerCase() + '.png'}
                                height={25}
                                width={25}
                                style={{ borderRadius: 10 }}
                              />
                            </span>
                            <span className="mr-1">
                              {formatNumber(ethers.utils.formatUnits(reward.rewardsPerSec[1].mul(86400), 18))}
                            </span>
                            <span className="mr-1">{farm.symbol[1]}</span>
                            <span>{i18n._(t`/ DAY`)}</span>
                          </div>
                        </div>
                      ))
                  )}
                  {farm?.cardRewards[0]?.rewardsPerSec.length <= 1 && (
                    <div className="text-xs md:text-xs whitespace-nowrap mb-3 mt-6">
                      <div className="flex" style={{ lineHeight: '25px' }}>
                        <span className="mr-1">EARNED</span>
                        <span className="mr-1">
                          <img
                            src={'/images/tokens/' + 'glint' + '.png'}
                            height={25}
                            width={25}
                            style={{ borderRadius: 10 }}
                          />
                        </span>
                        <span className="mr-1">
                          {account && formatNumber(pendingGlint[0] / 1e18)} {!account && 0}
                        </span>
                      </div>
                    </div>
                  )}
                  {farm?.cardRewards[0]?.rewardsPerSec.length > 1 && (
                    <div className="text-xs md:text-xs whitespace-nowrap mt-6">
                      <div>
                        <div className="flex mb-2" style={{ lineHeight: '25px' }}>
                          <span className="mr-1">EARNED</span>
                          <span className="mr-1">
                            <img
                              src={'/images/tokens/' + farm.cardRewards[0].symbol[0].toLowerCase() + '.png'}
                              height={25}
                              width={25}
                              style={{ borderRadius: 10 }}
                            />
                          </span>
                          <span className="mr-1">
                            {account && formatBalance(pendingGlint[0])} {!account && 0}
                          </span>
                        </div>
                        <div className="flex" style={{ lineHeight: '25px' }}>
                          <span className="mr-1">EARNED</span>
                          <span className="mr-1">
                            <img
                              src={'/images/tokens/' + farm.cardRewards[0].symbol[1].toLowerCase() + '.png'}
                              height={25}
                              width={25}
                              style={{ borderRadius: 10 }}
                            />
                          </span>
                          <span className="mr-1">
                            {account && formatBalance(pendingGlint[1])} {!account && 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* <div className="flex flex-col items-end justify-center">
                  <div
                    className="font-bold flex justify items-center text-righttext-high-emphesis"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFarm(farm.id)
                    }}
                  >
                    <IconWrapper size="16px" marginRight={'10px'}>
                      <Info />
                    </IconWrapper>                    
                    {roiPerYear > 1000000 ? '100000000%+' : formatPercent(roiPerYear * 100)}
                  </div>
                  <div className="text-xs text-right md:text-white text-white">{i18n._(t`annualized`)}</div>
                </div> */}
              </div>
            </Disclosure.Button>
          </div>
        )}
      </Disclosure>
      {!!selectedFarm && (
        <YieldDetails
          key={farm.id}
          isOpen={selectedFarm == farm.id}
          onDismiss={() => setSelectedFarm(null)}
          roiPerDay={roiPerDay}
          roiPerMonth={roiPerMonth}
          roiPerYear={roiPerYear}
          token0={token0}
          token1={token1}
          lpPrice={farm.lpPrice}
          glintPrice={glintPrice}
        />
      )}
    </React.Fragment>
  )
}

export default FarmListItem2
