/* eslint-disable @next/next/link-passhref */
import { useActiveWeb3React, useFuse } from '../../hooks'

import FarmList from '../../features/sharefarm/FarmList'
import React, { useContext, useState } from 'react'
import { formatNumberScale } from '../../functions'
import { usePositionsShare, useDistributorInfoShare, useRewardsPerSecPosition } from '../../features/sharefarm/hooks'
import { useRouter } from 'next/router'
import Card from '../../components/Card'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import { AVERAGE_BLOCK_TIME } from '../../constants'
import { SHARE_POOLS } from '../../constants/sharefarms'
import { PriceContext } from '../../contexts/priceContext'
import useShareFarmChef from '../../features/sharefarm/useMasterChef'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useShareTVL } from '../../hooks/useV2Pairs'
import { getAddress } from '@ethersproject/address'
import { ethers } from 'ethers'
import { useShareFarms } from '../../features/sharefarm/hooks'

export default function ShareFarm(): JSX.Element {
  const { i18n } = useLingui()
  const router = useRouter()
  const { chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)

  const [sorting, setSorting] = useState('Liquidity')
  const addTransaction = useTransactionAdder()

  const step = router.query.syrup as string

  if (step && document.getElementById('step') != null) {
    document.getElementById('step').scrollIntoView()
    setTimeout(function () {
      router.replace('/beamshare', undefined, { shallow: true })
    }, 2000)
  }

  const [farmView, setFarmView] = useState('rows')
  const type = router.query.filter as string

  const positions = usePositionsShare()
  const rewardsPerSec = useRewardsPerSecPosition()

  const farms = useShareFarms()

  // const vaults = useVaults()

  const distributorInfo = useDistributorInfoShare()

  const priceData = useContext(PriceContext)

  const tvlInfo = useShareTVL(farms)
  console.log(tvlInfo)

  const farmingPools = Object.keys(SHARE_POOLS[chainId]).map((key) => {
    return { ...SHARE_POOLS[chainId][key] }
  })

  const summTvl = tvlInfo.reduce((previousValue, currentValue) => {
    if (!isNaN(currentValue.tvl)) {
      return previousValue + currentValue.tvl
    } else {
      return 0
    }
  }, 0)

  const blocksPerDay = 86400 / Number(AVERAGE_BLOCK_TIME[chainId])

  const map = (pool) => {
    pool.owner = 'Beamswap'
    pool.balance = 0

    const pair = SHARE_POOLS[chainId][pool.id]

    const blocksPerHour = 3600 / AVERAGE_BLOCK_TIME[chainId]

    function getRewards() {
      const rewardPerBlock = (distributorInfo[pair?.id]?.rewardsPerSec * 13) / 1e18

      const defaultReward = {
        token: pair?.reward.symbol,
        icon: '/images/tokens/' + pair?.reward.symbol.toLowerCase() + '.png',
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: priceData[pair?.reward.symbol.toLowerCase()],
      }

      const defaultRewards = [defaultReward]
      return defaultRewards
    }

    const rewards = getRewards()

    const poolTVL = tvlInfo[pool.id]
    const tvl = poolTVL?.tvl

    const roiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
      }, 0) / tvl

    const roiPerHour = roiPerBlock * blocksPerHour
    const roiPerDay = roiPerHour * 24
    const roiPerMonth = roiPerDay * 30
    const roiPerYear = roiPerDay * 365

    const position = positions.find((position) => position.id === pool.id)

    return {
      ...pool,
      ...position,
      pair: {
        ...pair,
        decimals: 18,
      },
      roiPerBlock,
      roiPerHour,
      roiPerDay,
      roiPerMonth,
      roiPerYear,
      rewards,
      tvl,
      blocksPerHour,
    }
  }

  const FILTER = {
    my: (farm) => farm?.amount && !farm.amount.isZero(),
    stables: (farm) =>
      farm.pair.token0?.symbol == 'USDC' ||
      farm.pair.token1?.symbol == 'USDC' ||
      farm.pair.token0?.symbol == 'USDT' ||
      farm.pair.token1?.symbol == 'USDT' ||
      farm.pair.token0?.symbol == 'BUSD' ||
      farm.pair.token1?.symbol == 'BUSD' ||
      farm.pair.token0?.symbol == 'DAI' ||
      farm.pair.token1?.symbol == 'DAI',
    finished: (farm) => farm?.allocPoint == 0,
  }

  const data = farms.map(map).filter((farm) => {
    return type in FILTER ? FILTER[type](farm) : true
  })

  console.log(data)

  let pendingRewardsTotal = 0
  data.forEach((d) => {
    if (d.pendingGlint) {
      pendingRewardsTotal += parseFloat(ethers.utils.formatUnits(d.pendingGlint)) * d.rewards[0].rewardPrice
    }
  })

  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol', 'pair.token0.name', 'pair.token1.name'],
    threshold: 0.4,
  }

  const { result, term } = useFuse({
    data,
    options,
  })

  result.forEach((pool) => {
    pool.cardRewards = rewardsPerSec.filter((obj) => {
      return obj.id == pool.id
    })
  })

  result.reverse()

  const valueStaked = positions.reduce((previousValue, currentValue) => {
    const pool = data.find((r) => parseInt(r.id.toString()) == parseInt(currentValue.id))
    const poolTvl = tvlInfo.find(
      (r) => getAddress(r.lpToken) == getAddress(pool?.lpToken ? pool?.lpToken : farmingPools[currentValue.id].lpToken)
    )

    if (!isNaN(poolTvl?.lpPrice)) {
      return previousValue + (currentValue.amount / 1e18) * poolTvl?.lpPrice
    } else {
      return 0
    }
  }, 0)

  /*const valueWallet = positions.reduce((previousValue, currentValue) => {
    const pool = data.find((r) => parseInt(r.id.toString()) == parseInt(currentValue.id))
    const poolTvl = tvlInfo.find(
      (r) => getAddress(r.lpToken) == getAddress(pool?.lpToken ? pool?.lpToken : farmingPools[currentValue.id].lpToken)
    )
    const token = useToken(poolTvl.lpToken)
    const tokenBalance = useTokenBalance(account,token)
    
    if (!isNaN(poolTvl?.lpPrice)) {
      console.log(poolTvl)
      return previousValue + (Number(tokenBalance.toSignificant())) * poolTvl?.lpPrice
    } else {
      return 0
    }
  }, 0)*/

  const { harvestManyShare } = useShareFarmChef()

  return (
    <>
      <div className="container px-0 mx-auto pb-6 farm-container mt-12 flex justify-center bg-blue p-6">
        <DoubleGlowShadow maxWidth={false} opacity={'0.2'}>
          <div
            className="header flex justify-center p-3 bg-inputBlue text-aqua mt-5 mb-5 mr-5 ml-5"
            style={{ borderRadius: 2 }}
            id="step"
          >
            STEP 2: Stake SHARE and receive awards.{' '}
          </div>
          <div className={`grid grid-cols-12 gap-2 min-h-1/2 mr-auto ml-auto p-6`} style={{ maxWidth: 1200 }}>
            <div className={`col-span-12`}>
              <div
                className="bg-deepCove flex-none sm:flex flex-col justify-center items-center py-5 px-5 mb-8 farms-header md:flex-row"
                style={{ gap: 16, height: 'unset' }}
              >
                <div
                  className="text-lg px-2 py-3 flex justify-between mb-5 md:mb-0 items-center"
                  style={{ height: 'fit-content' }}
                >
                  <div className="text-jordyBlue mr-2">Total Value Locked</div>
                  <div className="text-white text-sm">{formatNumberScale(summTvl, true, 2)}</div>
                </div>
                <div
                  className="text-lg px-2 py-3 flex justify-between mb-5 md:mb-0 items-center"
                  style={{ height: 'fit-content' }}
                >
                  <div className="text-jordyBlue mr-2">My Holdings</div>
                  <div className="text-white text-sm">{formatNumberScale(valueStaked, true, 2)}</div>
                </div>
                <div
                  className="text-lg px-2 py-3 flex justify-between mb-5 md:mb-0 items-center"
                  style={{ height: 'fit-content' }}
                >
                  <div className="text-jordyBlue mr-2">Pending Rewards</div>
                  <div className="text-white text-sm">{formatNumberScale(pendingRewardsTotal, true, 2)}</div>
                </div>
                {positions.length > 0 && (
                  <div
                    className="text-white bg-linear-gradient px-4 py-2 mb-5 md:mb-0 text-center md:mr-5"
                    style={{ height: 50, lineHeight: '31px', cursor: 'pointer', borderRadius: 2 }}
                    onClick={async () => {
                      setPendingTx(true)
                      const pids: string[] = []
                      for (const pos of positions) {
                        if (Number(pos.pendingGlint.toString()) / 1e18 > 0) {
                          pids.push(pos.id)
                        }
                      }
                      if (pids.length > 0) {
                        try {
                          const tx = await harvestManyShare(pids)
                          addTransaction(tx, {
                            summary: `${i18n._(t`Harvest`)} BEANS`,
                          })
                        } catch (error) {
                          console.error(error)
                        }
                      }

                      setPendingTx(false)
                    }}
                  >
                    Harvest
                  </div>
                )}
              </div>
              <div className="sub-menu bg-transparent mt-5 mb-5 flex-col md:flex justify-between md:flex-row"></div>
              <Card className="z-4">
                <div className={`md:space-x-4 space-y-4 md:space-y-0 `}>
                  <div className={`col-span-12 md:col-span-9 `}>
                    <FarmList
                      farms={result}
                      term={term}
                      filter={FILTER}
                      view={farmView}
                      sortBy={sorting}
                      showFilter={false}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </DoubleGlowShadow>
      </div>
    </>
  )
}
