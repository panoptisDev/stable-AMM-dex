/* eslint-disable @next/next/link-passhref */
import { useActiveWeb3React, useFuse } from '../../hooks'

import FarmList from '../../features/farm/FarmList'
import Head from 'next/head'
import Menu from '../../features/farm/FarmMenu'
import React, { useContext, useMemo, useState } from 'react'
import { formatNumberScale } from '../../functions'
import { usePositions, useFarms, useDistributorInfo, useRewardsPerSecPosition } from '../../features/farm/hooks'
import { useRouter } from 'next/router'
import Card from '../../components/Card'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import { AVERAGE_BLOCK_TIME } from '../../constants'
import { POOLS } from '../../constants/farms'
import { PriceContext } from '../../contexts/priceContext'
import useMasterChef from '../../features/farm/useMasterChef'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useTVL } from '../../hooks/useV2Pairs'
import { getAddress } from '@ethersproject/address'
import Search from '../../components/Search'
import toLower from 'lodash/toLower'
import { useOneDayBlock, useSushiPairs } from '../../services/graph'
import { ethers } from 'ethers'
import { useGlintTVL } from '../../hooks/staking/hooks'

export default function Farm(): JSX.Element {
  const { i18n } = useLingui()
  const router = useRouter()
  const { chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [sorting, setSorting] = useState('Liquidity')
  const addTransaction = useTransactionAdder()
  const block1d = useOneDayBlock({ chainId, shouldFetch: !!chainId })

  const [farmView, setFarmView] = useState('rows')
  const shareTVL = useGlintTVL()
  const type = router.query.filter as string

  const positions = usePositions()
  const rewardsPerSec = useRewardsPerSecPosition()

  let farms = useFarms()
  // const vaults = useVaults()

  const distributorInfo = useDistributorInfo()

  const priceData = useContext(PriceContext)

  const glintPrice = priceData?.['glint']

  const tvlInfo = useTVL()

  const farmAddresses = useMemo(() => farms.map((farm) => farm.lpToken), [farms])
  const farmingPools = Object.keys(POOLS[chainId]).map((key) => {
    return { ...POOLS[chainId][key], lpToken: key }
  })

  const swapPairs = useSushiPairs({
    chainId,
    variables: {
      where: {
        id_in: farmAddresses.map(toLower),
      },
    },
    shouldFetch: !!farmAddresses,
  })
  console.log(swapPairs)

  const swapPairs1d = useSushiPairs({
    chainId,
    variables: {
      block: block1d,
      where: {
        id_in: farmAddresses.map(toLower),
      },
    },
    shouldFetch: !!block1d && !!farmAddresses,
  })

  const summTvl = tvlInfo.reduce((previousValue, currentValue) => {
    if (!isNaN(currentValue.tvl)) {
      return previousValue + currentValue.tvl
    } else {
      return 0
    }
  }, 0)

  /*let summTvlVaults = vaults.reduce((previousValue, currentValue) => {
    return previousValue + (currentValue.totalLp / 1e18) * glintPrice
  }, 0)*/

  const blocksPerDay = 86400 / Number(AVERAGE_BLOCK_TIME[chainId])

  const map = (pool) => {
    pool.owner = 'Beamswap'
    pool.balance = 0

    const pair = POOLS[chainId][pool.lpToken]
    const swapPair = swapPairs?.find((pair) => pair.id === pool.lpToken.toString().toLowerCase())
    const swapPair1d = swapPairs1d?.find((pair) => pair.id === pool.lpToken.toString().toLowerCase())

    const blocksPerHour = 3600 / AVERAGE_BLOCK_TIME[chainId]

    function getRewards() {
      const rewardPerBlock =
        ((pool.allocPoint / distributorInfo.totalAllocPoint) * (distributorInfo.glintPerBlock * 13)) / 1e18

      const defaultReward = {
        token: 'GLINT',
        icon: '/images/tokens/glint.png',
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: glintPrice,
      }

      const defaultRewards = [defaultReward]

      return defaultRewards
    }

    const rewards = getRewards()

    const poolTVL = tvlInfo.find((farmpool) => farmpool.lpToken == pool.lpToken)
    const tvl = poolTVL?.tvl

    const roiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
      }, 0) / tvl

    const feeApyPerYear =
      swapPair && swapPair1d ? ((swapPair?.volumeUSD - swapPair1d?.volumeUSD) * 0.0017 * 365) / swapPair?.reserveUSD : 0

    const roiPerHour = roiPerBlock * blocksPerHour
    const roiPerDay = roiPerHour * 24
    const roiPerMonth = roiPerDay * 30
    const roiPerYear = roiPerDay * 365 + feeApyPerYear

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
      feeApyPerYear,
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

  let data = farms.map(map).filter((farm) => {
    return type in FILTER ? FILTER[type](farm) : true
  })

  const boosted = data.filter(function (farm) {
    return farm.pair.featured
  })

  let pendingRewardsTotal = 0
  data.forEach((d) => {
    if (d.pendingGlint) {
      if (d.pendingGlint.length > 0) {
        d.pendingGlint.forEach((g) => {
          pendingRewardsTotal += parseFloat(ethers.utils.formatUnits(g)) * glintPrice
        })
      }
    }
  })

  data = data.filter((farm) => {
    let flag = true
    if (
      farm.lpToken == '0xAcc15dC74880C9944775448304B263D191c6077F' ||
      farm.lpToken == '0x99588867e817023162F4d4829995299054a5fC57' ||
      farm.lpToken == '0xb929914B89584b4081C7966AC6287636F7EfD053' ||
      (farm.lpToken == '0xfC422EB0A2C7a99bAd330377497FD9798c9B1001' && type !== "finished")
    ) {
      flag = false
    }
    return flag
  })

  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol', 'pair.token0.name', 'pair.token1.name'],
    threshold: 0.4,
  }

  const sortingOption: { key: string; value: string }[] = [
    { key: 'Featured', value: 'symbol' },
    { key: 'APR', value: 'roiPerYear' },
    { key: 'Liquidity', value: 'tvl' },
    { key: 'Earnings', value: 'pendingGlint' },
  ]

  const { result, term, search } = useFuse({
    data,
    options,
  })

  result.forEach((pool) => {
    pool.cardRewards = rewardsPerSec.filter((obj) => {
      return obj.id == pool.id
    })
  })

  const valueStaked = positions.reduce((previousValue, currentValue) => {
    const pool = farmingPools.find((r) => parseInt(r.id.toString()) == parseInt(currentValue.id))
    const poolTvl = tvlInfo.find((r) => getAddress(r.lpToken) == getAddress(pool?.lpToken))

    if (!isNaN(poolTvl?.lpPrice)) {
      return previousValue + (currentValue.amount / 1e18) * poolTvl?.lpPrice
    } else {
      return 0
    }
  }, 0)

  const { harvestMany } = useMasterChef()

  return (
    <>
      <Head>
        <title>Beamswap | Farm</title>
        <meta key="description" name="description" content="Deposit your LP tokens to earn $GLINT token with ease." />
      </Head>

      <div className="container px-0 mx-auto pb-6 farm-container mt-12 flex justify-center">
        <DoubleGlowShadow maxWidth={false} opacity={'0.2'}>
          <div className={`grid grid-cols-12 gap-2 min-h-1/2 mr-auto ml-auto`} style={{ maxWidth: 1200 }}>
            <div className={`col-span-12`}>
              <div
                className="bg-deepCove flex-none sm:flex flex-col justify-center items-center py-5 px-5 mb-8 farms-header md:flex-row"
                style={{ gap: 16, height: 'unset' }}
              >
                <div
                  className="md:text-lg text-sm font-lg text-white pr-0 mr-auto ml-auto mb-5 md:mb-0 text-center md:text-left"
                  style={{ fontSize: 54, fontWeight: 'bold' }}
                >
                  FARM
                </div>
                <div className="text-lg px-2 py-3 flex justify-between mb-5 md:mb-0" style={{ height: 'fit-content' }}>
                  <div className="text-jordyBlue mr-2">Total Value Locked</div>
                  <div className="text-white">
                    {formatNumberScale(shareTVL ? summTvl + shareTVL : summTvl, true, 2)}
                  </div>
                </div>
                <div className="text-lg px-2 py-3 flex justify-between mb-5 md:mb-0" style={{ height: 'fit-content' }}>
                  <div className="text-jordyBlue mr-2">My Holdings</div>
                  <div className="text-white">{formatNumberScale(valueStaked, true, 2)}</div>
                </div>
                <div className="text-lg px-2 py-3 flex justify-between mb-5 md:mb-0" style={{ height: 'fit-content' }}>
                  <div className="text-jordyBlue mr-2">Pending Rewards</div>
                  <div className="text-white">{formatNumberScale(pendingRewardsTotal, true, 2)}</div>
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
                      try {
                        const tx = await harvestMany(pids)
                        addTransaction(tx, {
                          summary: `${i18n._(t`Harvest Multiple`)} GLINT`,
                        })
                      } catch (error) {
                        console.error(error)
                      }
                      setPendingTx(false)
                    }}
                  >
                    Harvest All
                  </div>
                )}
              </div>
              <div className="sub-menu bg-transparent mt-5 mb-5 flex-col md:flex justify-between md:flex-row">
                <div className="flex mr-3 cursor-pointer" style={{ height: 42 }}>
                  <div
                    className="bg-lightBlueSecondary p-2 flex items-center"
                    style={{ background: `${farmView === 'rows' ? '#1F357D' : '#05113B'}` }}
                    onClick={() => {
                      setFarmView('rows')
                    }}
                  >
                    <img src="/images/farms-rows.png" width={15} height={15} />
                  </div>
                  <div
                    className="bg-lightBlueSecondary p-2 flex items-center"
                    style={{ background: `${farmView === 'cards' ? '#1F357D' : '#05113B'}` }}
                    onClick={() => {
                      setFarmView('cards')
                    }}
                  >
                    <img src="/images/farms-cards.png" width={15} height={15} />
                  </div>
                </div>
                <div className="menu">
                  <Menu
                    term={term}
                    onSearch={(value) => {
                      search(value)
                    }}
                    positionsLength={positions.length}
                  />
                </div>
                <div className="flex mt-3 mb-3 md:mt-0 md:mb-0">
                  <div className="text-white mr-3 sort-by" style={{ height: 42, lineHeight: '42px' }}>
                    Sort By
                  </div>
                  <div className="bg-lightBlueSecondary pr-3" style={{ width: 160, height: 42 }}>
                    <select
                      value={sorting}
                      onChange={(e) => setSorting(e.target.value)}
                      className="bg-lightBlueSecondary text-white pr-1 pl-1"
                      style={{ width: 150, height: 42 }}
                    >
                      {sortingOption.map((pageSize) => (
                        <option
                          className="bg-lightBlueSecondary"
                          key={pageSize.key}
                          value={pageSize.value}
                          style={{ width: 170 }}
                        >
                          {pageSize.key}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div
                  className={'mb-8 px-1 md:px-0 flex justify-center w-full md:w-2/6'}
                  style={{ border: '2px solid #1F357D', height: 42 }}
                >
                  <div className="text-white mr-5 ml-5 hidden md:block" style={{ lineHeight: '38px' }}>
                    Search
                  </div>
                  <Search
                    className={'bg-transparent farm-search'}
                    placeholder={'Search by farm, name, symbol and address'}
                    term={term}
                    search={(value: string): void => {
                      search(value)
                    }}
                  />
                </div>
              </div>
              <Card className="z-4">
                <div className={`md:space-x-4 space-y-4 md:space-y-0 `}>
                  <div className={`col-span-12 md:col-span-9 `}>
                    <FarmList
                      boosted={boosted}
                      farms={result}
                      term={term}
                      filter={FILTER}
                      view={farmView}
                      sortBy={sorting}
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
