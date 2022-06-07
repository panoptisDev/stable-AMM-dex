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
import { ChevronDownIcon } from '@heroicons/react/solid'
import FarmDetails from './FarmDetails'
import QuestionHelper from '../../components/QuestionHelper'

const FarmListItem3 = ({ farm, ...rest }) => {
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
          <div className="mb-4 w-full cursor-default">
            {/* {showDetails && (
              <FarmModal
                isOpen={showDetails}
                onDismiss={() => setShowDetails(false)}
                farm={farm}
                onClose={() => setShowDetails(false)}
              />
            )} */}
            <Disclosure.Button
              className={classNames(
                open && '',
                'w-full text-left select-none bg-deepCove  text-white text-sm md:text-lg'
              )}
              style={{ border: '2px solid #1F357D', cursor: 'default',
              boxShadow: `${farm.pair.featured ? '0px 0px 20px #0ff' : ''}`
             }}
            >
              <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
              <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />
              <div className="flex justify-between md:justify-initial flex-wrap">
                <div className="flex w-1/6 col-span-2 space-x-4 md:col-span-1 mx-4  py-6 items-center">
                  {token1 ? (
                    <DoubleLogo currency0={token0} currency1={token1} size={isMobile ? 30 : 30} />
                  ) : (
                    <div className="flex items-center">
                      <CurrencyLogo currency={token0} size={isMobile ? 30 : 30} />
                    </div>
                  )}

                  <div className={`flex flex justify-center ml-3 ${token1 ? 'md:flex-row' : ''}`}>
                    <div className="flex gap-2 font-bold">
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
                <div className="w-1/6 px-4 py-2 border-transparent text-xs mr-3 ml-3 mb-3 flex justify-center mt-4 items-center hidden md:flex">
                  <div>
                    {roiPerBlock != 0 && (
                      <div className="text-white text-lg ml-4">
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
                      <div className="text-white text-lg ml-4">
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
                </div>
                <div className="w-1/6 px-4 py-2 border-transparent text-xs mr-3 ml-3 mb-3 flex justify-center mt-4 items-center hidden md:flex">
                  <div>
                    <div className="text-white text-lg">{formatNumberScale(tvl, true, 2)}</div>
                  </div>
                </div>
                <div
                  className={
                    farm?.symbol?.length > 1
                      ? 'w-1/6 flex-row items-center space-x-4 flex justify-end mr-4 ml-4 mb-3'
                      : 'w-1/6 flex-row items-center space-x-4 flex justify-end mr-4 ml-4 mb-4'
                  }
                >
                  {
                    <div className="text-xs md:text-lg whitespace-nowrap mb-3 mt-6">
                      <div className="flex-col">
                        <div className="mr-1 text-aqua" style={{ textAlign: 'right' }}>
                          <span className="mr-1 text-white text-right">
                            {pendingGlint[0] != null && formatNumber((pendingGlint[0] / 1e18) * glintPrice, true)}{' '}
                            {!account && 0}
                          </span>
                        </div>
                        <div className="flex" style={{ lineHeight: '25px' }}>
                          <span className="mr-1">
                            <img
                              src={'/images/tokens/' + 'glint' + '.png'}
                              height={25}
                              width={25}
                              style={{ borderRadius: 10 }}
                            />
                          </span>
                          {pendingGlint[0] != null && formatNumber(pendingGlint[0] / 1e18)} {!account && 0}
                        </div>
                      </div>
                    </div>
                  }
                </div>
                <div className="w-1/6 flex justify-center gap-5 p-3 items-center hidden md:flex">
                  <div
                    className="text-xs text-center cursor-pointer text-aqua"
                    style={{ width: '95%', transition: '0.3s all', borderRadius: 8 }}
                  >
                    <div
                      className="px-4 py-2 text-sm flex items-center justify-center"
                      onClick={() => {
                        setShowDetails(!showDetails)
                      }}
                      style={{ margin: 2, borderRadius: 8 }}
                    >
                      {/* <h1 className="neon-text">Manage Farm</h1> */}
                      Details
                      <ChevronDownIcon
                        style={{
                          transition: '0.3s all',
                          transform: `${showDetails ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                        }}
                        width={20}
                        height={20}
                      />
                    </div>
                  </div>
                </div>
                {/* insert detailed content here */}
                {showDetails && ApprovalState.APPROVED && (
                  <FarmDetails
                    isOpen={showDetails}
                    onDismiss={() => setShowDetails(false)}
                    farm={farm}
                    onClose={() => setShowDetails(false)}
                  />
                )}
                <div className="flex md:hidden mx-5 my-2 w-full">
                  <div className="flex justify-between w-full">
                    <div
                      className="w-1/2 border border-lightBlueSecondary text-center p-3"
                      style={{ borderRight: 'none' }}
                    >
                      <span className="text-jordyBlue pr-1">APR</span>
                      <span className="text-white font-sm">
                        {roiPerYear > 1000000 ? '100000000%+' : formatPercent(roiPerYear * 100)}
                      </span>
                    </div>
                    <div className="w-1/2 border border-lightBlueSecondary text-center p-3">
                      <span className="text-jordyBlue pr-1">Liquidity</span>
                      <span className="text-white font-sm">{formatNumberScale(tvl, true, 2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full justify-center gap-5 items-center mb-1 md:hidden">
                  <div
                    className="text-xs text-center cursor-pointer text-aqua"
                    style={{ width: '95%', transition: '0.3s all', borderRadius: 8 }}
                  >
                    <div
                      className="px-4 py-2 text-sm flex items-center justify-center"
                      onClick={() => {
                        setShowDetails(!showDetails)
                      }}
                      style={{ margin: 2, borderRadius: 8 }}
                    >
                      {/* <h1 className="neon-text">Manage Farm</h1> */}
                      Details
                      <ChevronDownIcon
                        width={20}
                        height={20}
                        style={{
                          transition: '0.3s all',
                          transform: `${showDetails ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
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

export default FarmListItem3
