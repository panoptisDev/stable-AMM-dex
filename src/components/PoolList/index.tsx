import { ChevronDown, ChevronUp } from 'react-feather'
import { formatNumber, formatPercent } from '../../functions/format'
import { useActiveWeb3React, useFuse } from '../../hooks'

import Card from '../../components/Card'
import CardHeader from '../../components/CardHeader'
import Dots from '../../components/Dots'
import DoubleLogo from '../../components/DoubleLogo'
import Head from 'next/head'
import Paper from '../../components/Paper'
import React, { useContext, useMemo } from 'react'
import Router, { useRouter } from 'next/router'
import Search from '../../components/Search'
import { useCurrency } from '../../hooks/Tokens'
import useSortableData from '../../hooks/useSortableData'
import { usePositions, useFarms, useDistributorInfo, useRewardsPerSecPosition } from '../../features/farm/hooks'
import { PriceContext } from '../../contexts/priceContext'
import { useTVL } from '../../hooks/useV2Pairs'
import { POOLS } from '../../constants/farms'
import { useOneDayBlock, useSushiPairs } from '../../services/graph'
import toLower from 'lodash/toLower'
import { AVERAGE_BLOCK_TIME } from '../../constants'
import { ethers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import DoubleGlowShadow from '../DoubleGlowShadow'
// import useFarms from '../../hooks/useZapperFarms'

const TokenBalance = ({ farm }: any) => {
  const currency0 = useCurrency(farm?.liquidityPair?.token0?.id)
  const currency1 = useCurrency(farm?.liquidityPair?.token1?.id)
  return (
    <>
      {farm.type === 'BLP' && (
        <Paper className="bg-deepCove">
          <div
            className="grid grid-cols-3 px-4 py-4 text-sm cursor-pointer select-none mb-6"
            onClick={() =>
              Router.push(`zap?poolAddress=${farm.lpToken}&currencyId=0xcd3B51D98478D53F4515A306bE565c6EebeF1D58`)
            }
            style={{ border: '2px solid #1F357D' }}
          >
            <div className="flex items-center">
              <div className="mr-4">
                <DoubleLogo currency0={currency0} currency1={currency1} size={32} margin={true} />
              </div>
              <div className="hidden sm:block text-white whitespace-nowrap">
                {farm && farm.liquidityPair?.token0?.symbol + '-' + farm.liquidityPair?.token1?.symbol}
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div>
                <div className="text-right text-white">{formatNumber(farm.tvl, true)} </div>
                <div className="text-right text-jordyBlue">
                  {formatNumber(parseFloat(farm.totalLp.toString()) / 1e18, false)} LP
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div className="text-xl font-semibold text-right text-white">{formatPercent(farm.roiPerYear * 100)} </div>
            </div>
          </div>
        </Paper>
      )}
    </>
  )
}

const PoolList = () => {
  const router = useRouter()
  const type = router.query.filter as string
  const farms = useFarms()
  const priceData = useContext(PriceContext)
  const { chainId } = useActiveWeb3React()
  const distributorInfo = useDistributorInfo()
  const positions = usePositions()
  const glintPrice = priceData?.['glint']
  const tvlInfo = useTVL()
  const rewardsPerSec = useRewardsPerSecPosition()
  const farmAddresses = useMemo(() => farms.map((farm) => farm.lpToken), [farms])
  const farmingPools = Object.keys(POOLS[chainId]).map((key) => {
    return { ...POOLS[chainId][key], lpToken: key }
  })

  const block1d = useOneDayBlock({ chainId, shouldFetch: !!chainId })
  const swapPairs = useSushiPairs({
    chainId,
    variables: {
      where: {
        id_in: farmAddresses.map(toLower),
      },
    },
    shouldFetch: !!farmAddresses,
  })

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

  const blocksPerDay = 86400 / Number(AVERAGE_BLOCK_TIME[chainId])
  const map = (pool) => {
    pool.owner = 'Beamswap'
    pool.balance = 0
    pool.type = pool.id == '5' ? 'NONE' : 'BLP'
    const pair = POOLS[chainId][pool.lpToken]
    pool.liquidityPair = pair

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
    pool.tvl = tvl
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
    pool.roiPerYear = roiPerYear
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
  }

  const data = farms.map(map).filter((farm) => {
    return type in FILTER ? FILTER[type](farm) : true
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
  // Search Setup
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
  const { items, requestSort, sortConfig } = useSortableData(farms)

  // Sorting Setup

  return (
    <>
      <Head>
        <title>Zap</title>
        <meta name="description" content="Farm GLINT by staking LP (Liquidity Provider) tokens" />
      </Head>
      <div className="container staking-container max-w-2xl px-0 mx-auto sm:px-4">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
          <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />
          <Card
            className="h-full rounded bg-blue"
            header={
              <CardHeader className="flex items-center justify-between bg-blue">
                <div className="flex flex-col items-center justify-between w-full bg-lightBlueSecondary">
                  <div className="items-center hidden md:flex">
                    {/* <BackButton defaultRoute="/pool" /> */}
                    <div className="py-3 text-md whitespace-nowrap text-aqua">Select a Pool to Zap Into</div>
                  </div>
                  {/* <Search search={search} term={term} /> */}
                </div>
              </CardHeader>
            }
          >
            {/* All Farms */}
            <div className="grid grid-cols-3 px-4 pb-4 text-sm text-jordyBlue mx-5">
              <div
                className="flex items-center cursor-pointer hover:text-jordyBlue"
                onClick={() => requestSort('symbol')}
              >
                <div>Pool</div>
                {sortConfig &&
                  sortConfig.key === 'symbol' &&
                  ((sortConfig.direction === 'ascending' && <ChevronUp size={12} />) ||
                    (sortConfig.direction === 'descending' && <ChevronDown size={12} />))}
              </div>
              <div className="cursor-pointer hover:text-jordyBlue" onClick={() => requestSort('tvl')}>
                <div className="flex items-center justify-end">
                  <div>TVL</div>
                  {sortConfig &&
                    sortConfig.key === 'tvl' &&
                    ((sortConfig.direction === 'ascending' && <ChevronUp size={12} />) ||
                      (sortConfig.direction === 'descending' && <ChevronDown size={12} />))}
                </div>
              </div>
              <div className="cursor-pointer hover:text-jordyBlue" onClick={() => requestSort('roiPerYear')}>
                <div className="flex items-center justify-end">
                  <div>APR</div>
                  {sortConfig &&
                    sortConfig.key === 'roiPerYear' &&
                    ((sortConfig.direction === 'ascending' && <ChevronUp size={12} />) ||
                      (sortConfig.direction === 'descending' && <ChevronDown size={12} />))}
                </div>
              </div>
            </div>
            <div className="flex-col space-y-2 mx-8 pb-5">
              {items && items.length > 0 ? (
                items.map((farm: any, i: number) => {
                  return <TokenBalance key={farm.address + '_' + i} farm={farm} />
                })
              ) : (
                <>
                  {term ? (
                    <div className="w-full py-6 text-center">No Results.</div>
                  ) : (
                    <div className="w-full py-6 text-center">
                      <Dots>Fetching Pools</Dots>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </DoubleGlowShadow>
      </div>
    </>
  )
}

export default PoolList
