import React, { useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { BigNumber } from 'bignumber.js'
import { useGlintShareRatio } from '../../hooks/staking/hooks'
import Web3 from 'web3'
import { useActiveWeb3React } from '../../hooks'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import IUniswapV2PairABI from '../..//constants/abis/uniswap-v2-pair.json'
import BEANS_ABI from '../../constants/abis/beans.json'
import Container from '../../components/Container'
import { t } from '@lingui/macro'
import { formatNumber } from '../../functions'
import { useLingui } from '@lingui/react'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { PriceContext } from '../../contexts/priceContext'
import { getPortfolio, getTokenBalances } from '../../services/covalent'
import BalancesDisplay from '../../features/portfolio/BalancesDisplay'
import LiquidityBalancesDisplay from '../../features/portfolio/LiquidityBalancesDisplay'
import Loader from '../../components/Loader'
import { useDistributorInfo, useFarms, usePositions } from '../../features/farm/hooks'
import {
  usePositionsShare,
  useDistributorInfoShare,
  useRewardsPerSecPosition,
  useShareFarms,
} from '../../features/sharefarm/hooks'
import { useShareTVL, useTVL } from '../../hooks/useV2Pairs'
import { POOLS } from '../../constants/farms'
import { AVERAGE_BLOCK_TIME, PORTFOLIO_PAIRS } from '../../constants'
import { useRouter } from 'next/router'
import useMasterChef from '../../features/farm/useMasterChef'
import useShareFarmChef from '../../features/sharefarm/useMasterChef'
import FarmBalancesDisplay from '../../features/portfolio/FarmBalancesDisplay'
import HistoryDisplay from '../../features/portfolio/HistoryDisplay'
import { SHARE_POOLS } from '../../constants/sharefarms'
import SharefarmBalancesDisplay from '../../features/portfolio/SharefarmBalancesDisplay'
import Head from 'next/head'

/* eslint-disable */

const Portfolio: React.FC = () => {
  // This config is required for number formatting
  BigNumber.config({
    EXPONENTIAL_AT: 1000,
    DECIMAL_PLACES: 80,
  })

  const { account, chainId } = useActiveWeb3React()
  const allPairs = PORTFOLIO_PAIRS
  const { i18n } = useLingui()
  const [balances, setBalances] = useState<any>()
  const [liqBalances, setliqBalances] = useState<any>()
  const [totalValueBalances, setTotalValueBalances] = useState(0)
  const [totalValueLiqBalances, settotalValueLiqBalances] = useState(0)
  const [portfolioBalances, setPortfolioBalances] = useState<any>()
  const [loading, setLoading] = useState(false)
  const glintShareRatio = useGlintShareRatio()
  const priceData = useContext(PriceContext)
  const glintPrice = priceData?.['glint']
  const beansPrice = priceData?.['beans']
  const cgsPrice = priceData?.['cgs']

  const farms = useFarms()
  const positions = usePositions()
  const tvlInfo = useTVL()

  const distributorInfo = useDistributorInfo()
  const blocksPerDay = 86400 / Number(AVERAGE_BLOCK_TIME[chainId])
  const map = (pool) => {
    pool.owner = 'Beamswap'
    pool.balance = 0

    const pair = POOLS[chainId][pool.lpToken]

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
    const lpPrice = poolTVL?.lpPrice
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
      lpPrice,
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
  const router = useRouter()
  const type = router.query.filter as string
  const data = farms.map(map).filter((farm) => {
    return type in FILTER ? FILTER[type](farm) : true
  })

  const pids: string[] = []
  for (const pos of positions) {
    if (Number(pos.pendingGlint.toString()) / 1e18 > 0) {
      pids.push(pos.id)
    }
  }

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

  let farmingValue = 0
  const farmDataDisplay = pids.map((pid) => {
    const result = data?.find((pool) => pool.id == pid)
    const lpPrice = parseFloat(result?.lpPrice)
    const staked = parseFloat(ethers.utils.formatEther(result?.amount))
    const total = lpPrice * staked
    farmingValue = farmingValue + total
    return result
  })

  const { harvestMany } = useMasterChef()
  const { harvestManyShare } = useShareFarmChef()
  const tokens = [
    {
      logo: '/images/tokens/glint.png',
    },
  ]

  const positionsShare = usePositionsShare()
  const rewardsPerSec = useRewardsPerSecPosition()
  const farmsShare = useShareFarms()
  const distributorInfoShare = useDistributorInfoShare()
  const tvlInfoShare = useShareTVL(farmsShare)

  const mapShare = (pool) => {
    pool.owner = 'Beamswap'
    pool.balance = 0

    const pair = SHARE_POOLS[chainId][pool.id]

    const blocksPerHour = 3600 / AVERAGE_BLOCK_TIME[chainId]

    function getRewards() {
      const rewardPerBlock = (distributorInfoShare[pair?.id]?.rewardsPerSec * 13) / 1e18

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

    const poolTVL = tvlInfoShare.find((farmpool) => farmpool.lpToken == pool.lpToken)

    const tvl = poolTVL?.tvl
    const lpPrice = poolTVL?.lpPrice
    const roiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
      }, 0) / tvl

    const roiPerHour = roiPerBlock * blocksPerHour
    const roiPerDay = roiPerHour * 24
    const roiPerMonth = roiPerDay * 30
    const roiPerYear = roiPerDay * 365
    const endTimestamp = Number(distributorInfoShare[pair?.id]?.endTimestamp?.toString())

    const position = positionsShare.find((position) => position.id === pool.id)

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
      lpPrice,
      endTimestamp,
    }
  }
  const FILTERSHARE = {
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
  const dataShare = farmsShare.map(mapShare).filter((farm) => {
    return type in FILTERSHARE ? FILTERSHARE[type](farm) : true
  })

  const pidsShare: string[] = []
  for (const pos of positionsShare) {
    if (Number(pos.pendingGlint.toString()) / 1e18 > 0) {
      pidsShare.push(pos.id)
    }
  }
  let pendingRewardsTotalShare = 0
  dataShare.forEach((d) => {
    if (d.pendingGlint) {
      pendingRewardsTotalShare += parseFloat(ethers.utils.formatUnits(d.pendingGlint)) * d.rewards[0].rewardPrice
    }
  })

  let shareFarmingValue = 0

  const shareataDisplay = pidsShare.map((pid) => {
    const result = dataShare?.find((pool) => pool.id == pid)
    const lpPrice = parseFloat(result?.lpPrice)
    const staked = parseFloat(ethers.utils.formatEther(result?.amount))
    const total = lpPrice * staked
    shareFarmingValue = shareFarmingValue + total
    return result
  })
  console.log(shareataDisplay)

  useEffect(() => {
    async function getBalances() {
      const response = await getTokenBalances(chainId, account)

      const tempBalances = []
      const tempLiqBalances = []
      let totalValueBalances = 0
      let totalValueLiqBalances = 0
      const balancesArray = await Promise.all(
        response?.data?.items.map(async (d) => {
          if (d?.contract_address == '0xdc8cb2e48d0a6283e50de3f59fc9f60fbc709792') return
          const balance = new BigNumber(ethers.utils.formatUnits(d?.balance, d?.contract_decimals))
          const logo = d?.logo_url
          const name = d?.contract_ticker_symbol
          let price
          if (name == 'DAI') {
            price = new BigNumber(1)
          } else if (name == 'SHARE') {
            price = new BigNumber(glintPrice * glintShareRatio)
          } else if (name == 'BEANS') {
            price = new BigNumber(beansPrice)
          } else if (name == 'CGS') {
            price = new BigNumber(cgsPrice)
          } else {
            price = new BigNumber(d?.quote_rate)
          }
          let beansDividends
          const web3 = new Web3('https://moonbeam.blastapi.io/325f3726-0397-4266-9fcd-b3ff8e0f1135')
          if (d?.contract_address == '0x65b09ef8c5a096c5fd3a80f1f7369e56eb932412') {
            const beansSc = new web3.eth.Contract(BEANS_ABI as any, d?.contract_address)
            const divsCall = await beansSc.methods.getAccountDividendsInfo(account).call()
            const divs = parseFloat(web3.utils.fromWei(divsCall[4], 'ether'))
            beansDividends = divs
          }
          //  const price = name == "DAI"?new BigNumber("1"):new BigNumber(d?.quote_rate)
          const dollarValue = balance.multipliedBy(price)

          let token0, token1
          if (name == 'BEAM-LP') {
            const contractAddress = d?.contract_address
            const findPair = allPairs.find((pair) => pair.pair.toString().toLowerCase() == contractAddress)
            console.log(findPair)

            if (findPair) {
              const obj = {
                balance: balance,
                logo: logo,
                name: name,
                price: price,
                dollarValue: dollarValue,
                currency: d?.contract_address,
                isPair: name == 'BEAM-LP' ? true : false,
                token0: findPair.token0,
                token1: findPair.token1,
                token0Symbol: findPair.token0Symbol,
                token1Symbol: findPair.token1Symbol,
                beansDividends: beansDividends,
              }

              if (balance.toNumber() > 0 && price.toNumber() > 0) {
                totalValueLiqBalances = totalValueLiqBalances + dollarValue.toNumber()
                tempLiqBalances.push(obj)
                return obj
              }
            } else {
              const pairSc = new web3.eth.Contract(IUniswapV2PairABI as any, d?.contract_address)
              token0 = await pairSc.methods.token0().call()
              const token0Contract = new web3.eth.Contract(IUniswapV2PairABI as any, token0)
              token1 = await pairSc.methods.token1().call()
              const token1Contract = new web3.eth.Contract(IUniswapV2PairABI as any, token1)
              const token0Symbol = await token0Contract.methods.symbol().call()
              const token1Symbol = await token1Contract.methods.symbol().call()
              const obj = {
                balance: balance,
                logo: logo,
                name: name,
                price: price,
                dollarValue: dollarValue,
                currency: d?.contract_address,
                isPair: name == 'BEAM-LP' ? true : false,
                token0: token0,
                token1: token1,
                token0Symbol: token0Symbol,
                token1Symbol: token1Symbol,
                beansDividends: beansDividends,
              }

              if (balance.toNumber() > 0 && price.toNumber() > 0) {
                totalValueLiqBalances = totalValueLiqBalances + dollarValue.toNumber()
                tempLiqBalances.push(obj)
                return obj
              }
            }
          } else {
            const obj = {
              balance: balance,
              logo: logo,
              name: name,
              price: price,
              dollarValue: dollarValue,
              currency: d?.contract_address,
              isPair: name == 'BEAM-LP' ? true : false,
              token0: token0,
              token1: token1,
              beansDividends: beansDividends,
            }

            if (balance.toNumber() > 0) {
              totalValueBalances = totalValueBalances + dollarValue.toNumber()
              tempBalances.push(obj)
              return obj
            }
          }
        })
      )
      setBalances(tempBalances.filter((a) => a.currency != '0xdc8cb2e48d0a6283e50de3f59fc9f60fbc709792')) //filter out dividens tracker
      setliqBalances(tempLiqBalances)
      setTotalValueBalances(totalValueBalances)
      settotalValueLiqBalances(totalValueLiqBalances)
      setLoading(false)
    }
    async function getPortfolioBalances() {
      const response = await getPortfolio(chainId, account)
      console.log(response.data.items)

      const tempPortfolio = []
      const balancesArray = await Promise.all(
        response?.data?.items.map(async (d) => {
          const decimals = d?.contract_decimals
          const logo = d?.logo_url
          const name = d?.contract_ticker_symbol
          let price
          if (name == 'DAI') {
            price = new BigNumber(1)
          } else if (name == 'SHARE') {
            price = new BigNumber(glintPrice * glintShareRatio)
          } else {
            price = new BigNumber(d?.quote_rate)
          }

          const web3 = new Web3('https://moonbeam.blastapi.io/325f3726-0397-4266-9fcd-b3ff8e0f1135')
          let token0, token1
          const tempHoldings = []
          if (name == 'BEAM-LP') {
            const contractAddress = d?.contract_address
            const findPair = allPairs.find((pair) => pair.pair.toString().toLowerCase() == contractAddress)
            console.log(findPair)

            if (findPair) {
              token0 = findPair.token0
              token1 = findPair.token1
              const token0Symbol = findPair.token0Symbol
              const token1Symbol = findPair.token1Symbol
              const holdings = await Promise.all(
                d?.holdings?.map(async (hold) => {
                  const date = new Date(hold.timestamp).toLocaleString().split(',')[0]
                  const open = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.open?.balance, decimals)),
                    price: new BigNumber(hold?.open?.quote),
                  }
                  const low = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.low?.balance, decimals)),
                    price: new BigNumber(hold?.low?.quote),
                  }
                  const high = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.high?.balance, decimals)),
                    price: new BigNumber(hold?.high?.quote),
                  }
                  const close = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.close?.balance, decimals)),
                    price: new BigNumber(hold?.close?.quote),
                  }
                  const obj = {
                    date: date,
                    low: low,
                    high: high,
                    close: close,
                    open: open,
                    rate: hold?.quote_rate,
                  }
                  return obj
                })
              )
              const obj = {
                logo: logo,
                name: name,
                price: price,
                currency: d?.contract_address,
                isPair: name == 'BEAM-LP' ? true : false,
                token0: token0,
                token1: token1,
                token0Symbol: token0Symbol,
                token1Symbol: token1Symbol,
                holdings: holdings,
              }
              tempPortfolio.push(obj)
              return obj
            } else {
              const pairSc = new web3.eth.Contract(IUniswapV2PairABI as any, d?.contract_address)
              token0 = await pairSc.methods.token0().call()
              const token0Contract = new web3.eth.Contract(IUniswapV2PairABI as any, token0)
              token1 = await pairSc.methods.token1().call()
              const token1Contract = new web3.eth.Contract(IUniswapV2PairABI as any, token1)
              const token0Symbol = await token0Contract.methods.symbol().call()
              const token1Symbol = await token1Contract.methods.symbol().call()

              const holdings = await Promise.all(
                d?.holdings?.map(async (hold) => {
                  const date = new Date(hold.timestamp).toLocaleString().split(',')[0]
                  const open = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.open?.balance, decimals)),
                    price: new BigNumber(hold?.open?.quote),
                  }
                  const low = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.low?.balance, decimals)),
                    price: new BigNumber(hold?.low?.quote),
                  }
                  const high = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.high?.balance, decimals)),
                    price: new BigNumber(hold?.high?.quote),
                  }
                  const close = {
                    balance: new BigNumber(ethers.utils.formatUnits(hold?.close?.balance, decimals)),
                    price: new BigNumber(hold?.close?.quote),
                  }
                  const obj = {
                    date: date,
                    low: low,
                    high: high,
                    close: close,
                    open: open,
                    rate: hold?.quote_rate,
                  }
                  return obj
                })
              )
              const obj = {
                logo: logo,
                name: name,
                price: price,
                currency: d?.contract_address,
                isPair: name == 'BEAM-LP' ? true : false,
                token0: token0,
                token1: token1,
                token0Symbol: token0Symbol,
                token1Symbol: token1Symbol,
                holdings: holdings,
              }
              tempPortfolio.push(obj)
              return obj
            }
          } else {
            const holdings = await Promise.all(
              d?.holdings?.map(async (hold) => {
                const date = new Date(hold.timestamp).toLocaleString().split(',')[0]
                const open = {
                  balance: new BigNumber(ethers.utils.formatUnits(hold?.open?.balance, decimals)),
                  price: new BigNumber(hold?.open?.quote),
                }
                const low = {
                  balance: new BigNumber(ethers.utils.formatUnits(hold?.low?.balance, decimals)),
                  price: new BigNumber(hold?.low?.quote),
                }
                const high = {
                  balance: new BigNumber(ethers.utils.formatUnits(hold?.high?.balance, decimals)),
                  price: new BigNumber(hold?.high?.quote),
                }
                const close = {
                  balance: new BigNumber(ethers.utils.formatUnits(hold?.close?.balance, decimals)),
                  price: new BigNumber(hold?.close?.quote),
                }
                const obj = {
                  date: date,
                  low: low,
                  high: high,
                  close: close,
                  open: open,
                  rate: hold?.quote_rate,
                }
                return obj
              })
            )
            const obj = {
              logo: logo,
              name: name,
              price: price,
              currency: d?.contract_address,
              isPair: name == 'BEAM-LP' ? true : false,
              token0: token0,
              token1: token1,
              holdings: holdings,
            }
            tempPortfolio.push(obj)
            return obj
          }
        })
      )
      setLoading(false)
      setPortfolioBalances(tempPortfolio)
    }

    if (account) {
      setLoading(true)
      getBalances()
      getPortfolioBalances()
    }
  }, [glintPrice, account])
  const addTransaction = useTransactionAdder()
  const [pendingTx, setPendingTx] = useState(false)
  return (
    <>
      <Head>
        <title>Beamswap | Portfolio Tracker</title>
        <meta key="description" name="description" content="Beamswap portfolio tracker offers users an insight into their portfolio with historic overview." />
      </Head>

      <Container maxWidth="5xl" className="space-y-6">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <div className="flex-col items-center gap-10 justify-center w-full">
            <div className="flex justify-between bg-blue p-6">
              <div className="text-white">My Portfolio</div>
              {account && (
                <div className="text-aqua">
                  {formatNumber(
                    totalValueLiqBalances +
                    totalValueBalances +
                    farmingValue +
                    pendingRewardsTotal +
                    pendingRewardsTotalShare +
                    shareFarmingValue,
                    true
                  )}
                </div>
              )}
              {!account && 'Connect Wallet'}
            </div>

            <div className="flex-col md:flex md:flex-row justify-center gap-3">
              <div
                className="flex-col justify-between bg-blue p-6 mt-5 w-full md:w-1/3"
                style={{ maxHeight: 400, overflowY: 'scroll' }}
              >
                <div className="text-white">Token breakdown</div>
                <table className="w-full text-left mt-3 mb-3">
                  <th className="text-aqua">Asset</th>
                  <th className="text-aqua">Price</th>
                  <th className="text-aqua">Amount</th>
                  {loading && (
                    <tr>
                      <div className="flex justify-center mt-10 items-center">
                        <span className="mr-1 text-white">Loading data</span>
                        <Loader stroke="white" />
                      </div>
                    </tr>
                  )}
                  {balances?.length == 0 && !loading && (
                    <tr>
                      <div
                        className="flex justify-center mt-10 items-center"
                        onClick={() =>
                          router.push(
                            '/exchange/swap/?inputCurrency=GLMR&outputCurrency=0xcd3b51d98478d53f4515a306be565c6eebef1d58'
                          )
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="mr-1 text-white">No Tokens Found. Buy Tokens.</span>
                      </div>
                    </tr>
                  )}
                  {balances && !loading && <BalancesDisplay balances={balances}></BalancesDisplay>}
                </table>
                <div className="mt-5 pt-3 px-3" style={{ borderTop: '2px solid #1F357D' }}>
                  <div className="flex justify-between">
                    <div className="text-white">Total</div>
                    <div className="text-aqua">{totalValueBalances ? formatNumber(totalValueBalances, true) : 0}</div>
                  </div>
                </div>
              </div>

              <div
                className="flex-col justify-between bg-blue p-6 mt-5 w-full md:w-2/3"
                style={{ maxHeight: 400, overflowY: 'scroll' }}
              >
                <div className="text-white">Farming Rewards</div>
                <table className="w-full text-left mt-3 mb-3">
                  <th className="text-aqua">Asset</th>
                  <th className="text-aqua">Staked</th>
                  <th className="text-aqua">Earned</th>
                  {loading && (
                    <tr>
                      <div className="flex justify-center mt-10 items-center">
                        <span className="mr-1 text-white">Loading data</span>
                        <Loader stroke="white" />
                      </div>
                    </tr>
                  )}
                  {farmDataDisplay?.length == 0 && !loading && (
                    <tr>
                      <div
                        className="flex justify-center mt-10 items-center"
                        onClick={() => router.push('/farm')}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="mr-1 text-white">No Farm Balances Found. Start Farming.</span>
                      </div>
                    </tr>
                  )}
                  {farmDataDisplay && !loading && <FarmBalancesDisplay data={farmDataDisplay}></FarmBalancesDisplay>}
                </table>
                <div className="mt-5 pt-3 px-3" style={{ borderTop: '2px solid #1F357D' }}>
                  <div className="flex justify-between">
                    <div className="text-white">Total Value</div>
                    <div className="text-aqua">{formatNumber(farmingValue + pendingRewardsTotal, true)}</div>
                  </div>
                  {pids.length > 0 && (
                    <div
                      className="text-white bg-linear-gradient py-2 mb-5 md:mb-0 text-center mt-5"
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
              </div>
            </div>

            <div className="flex-col justify-between bg-blue p-6 mt-5 w-full">
              <div className="text-white">Your Liquidity Positions</div>
              <table className="w-full text-left mt-3 mb-3">
                <th className="text-aqua">Asset</th>
                {<th className="text-aqua">Amount</th>}
                <th className="text-aqua">Value</th>

                {loading && (
                  <tr>
                    <div className="flex justify-center mt-10 items-center">
                      <span className="mr-1 text-white">Loading data</span>
                      <Loader stroke="white" />
                    </div>
                  </tr>
                )}

                {liqBalances?.length == 0 && !loading && (
                  <tr>
                    <div
                      className="flex justify-center mt-10 items-center"
                      onClick={() => router.push('/zap')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="mr-1 text-white">No LP tokens Found. Get LPs.</span>
                    </div>
                  </tr>
                )}

                {liqBalances && !loading && <LiquidityBalancesDisplay balances={liqBalances}></LiquidityBalancesDisplay>}
              </table>
              <div className="mt-5 pt-3 px-3" style={{ borderTop: '2px solid #1F357D' }}>
                <div className="flex justify-between">
                  <div className="text-white">Total Value</div>
                  <div className="text-aqua">{formatNumber(totalValueLiqBalances, true)}</div>
                </div>
              </div>
            </div>

            <div className="flex-col justify-between bg-blue p-6 mt-5 w-full">
              <div className="text-white">Sharefarm Rewards</div>
              <table className="w-full text-left mt-3 mb-3">
                <th className="text-aqua">Asset</th>
                {<th className="text-aqua">Staked</th>}
                <th className="text-aqua">Earned</th>
                <th className="text-aqua">Rewards Duration</th>
                {loading && (
                  <tr>
                    <div className="flex justify-center mt-10 items-center">
                      <span className="mr-1 text-white">Loading data</span>
                      <Loader stroke="white" />
                    </div>
                  </tr>
                )}

                {shareataDisplay?.length == 0 && !loading && (
                  <tr>
                    <div
                      className="flex justify-center mt-10 items-center"
                      onClick={() => router.push('/beamshare')}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="mr-1 text-white">No Sharefarm Balances Found. Get SHARE.</span>
                    </div>
                  </tr>
                )}
                {shareataDisplay && !loading && (
                  <SharefarmBalancesDisplay data={shareataDisplay}></SharefarmBalancesDisplay>
                )}
              </table>
              <div className="mt-5 pt-3 px-3" style={{ borderTop: '2px solid #1F357D' }}>
                <div className="flex justify-between">
                  <div className="text-white">Total Value</div>
                  <div className="text-aqua">{formatNumber(pendingRewardsTotalShare + shareFarmingValue, true)}</div>
                </div>
                {pidsShare.length > 0 && (
                  <div
                    className="text-white bg-linear-gradient py-2 mb-5 md:mb-0 text-center mt-5 "
                    style={{ height: 50, lineHeight: '31px', cursor: 'pointer', borderRadius: 2 }}
                    onClick={async () => {
                      setPendingTx(true)
                      const pids: string[] = []
                      for (const pos of positionsShare) {
                        if (Number(pos.pendingGlint.toString()) / 1e18 > 0) {
                          pids.push(pos.id)
                        }
                      }
                      try {
                        const tx = await harvestManyShare(pids)
                        addTransaction(tx, {
                          summary: `Harvested ShareFarms Rewards`,
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
            </div>

            <HistoryDisplay balances={portfolioBalances} loading={loading} />
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}

export default Portfolio
