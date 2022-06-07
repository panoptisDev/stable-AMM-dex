import { ChainId, computePairAddress, Currency, CurrencyAmount, Pair, Token } from '../sdk'

import IUniswapV2PairABI from '@sushiswap/core/abi/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'
import { useContext, useMemo } from 'react'
import { useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks'
import { GLINT_ADDRESS, FACTORY_ADDRESS, BEAMCHEF_ADDRESS, BEAM_VAULT_ADDRESS, SHAREFARM_ADDRESS } from '../constants'
import { useActiveWeb3React } from '../hooks/useActiveWeb3React'
import { PriceContext } from '../contexts/priceContext'
import { POOLS, TokenInfo } from '../constants/farms'
import { SHARE_POOLS, RewardInfo } from '../constants/sharefarms'
import { concat } from 'lodash'
import { VAULTS } from '../constants/vaults'
import { Log } from 'faunadb'
import { ftruncate } from 'fs'
import { useGlintShareRatio } from './staking/hooks'
import { useShareFarmContract } from './useContract'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
    [currencies]
  )
  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA &&
          tokenB &&
          tokenA.chainId === tokenB.chainId &&
          !tokenA.equals(tokenB) &&
          FACTORY_ADDRESS[tokenA.chainId]
          ? computePairAddress({
              factoryAddress: FACTORY_ADDRESS[tokenA.chainId],
              tokenA,
              tokenB,
            })
          : undefined
      }),
    [tokens]
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(
          CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
          CurrencyAmount.fromRawAmount(token1, reserve1.toString())
        ),
      ]
    })
  }, [results, tokens])
}

export interface TVLInfo {
  id?: string
  lpToken: string
  tvl: number
  lpPrice: number
}

export function useVaultTVL(): TVLInfo[] {
  const { chainId } = useActiveWeb3React()
  const priceData = useContext(PriceContext)
  const glintPrice = priceData?.['glint']
  const movrPrice = priceData?.['movr']
  const ribPrice = priceData?.['rib']
  const beefyPrice = priceData?.['beefy']
  const ftmPrice = priceData?.['ftm']

  const farmingPools = Object.keys(VAULTS[chainId]).map((key) => {
    return { ...VAULTS[chainId][key] }
  })

  const singlePools = farmingPools.filter((r) => !r.token1)
  const singleAddresses = singlePools.map((r) => r.lpToken)
  const lpPools = farmingPools.filter((r) => !!r.token1)
  const pairAddresses = lpPools.map((r) => r.lpToken)

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')
  const totalSupply = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'totalSupply')
  const distributorBalance = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'balanceOf', [
    BEAM_VAULT_ADDRESS[chainId],
  ])
  const distributorBalanceSingle = useMultipleContractSingleData(singleAddresses, PAIR_INTERFACE, 'balanceOf', [
    BEAM_VAULT_ADDRESS[chainId],
  ])

  return useMemo(() => {
    function isKnownToken(token: TokenInfo) {
      return (
        token.id.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase() ||
        token.symbol == 'WGLMR' ||
        token.symbol == 'MOVR' ||
        token.symbol == 'RIB' ||
        token.symbol == 'USDC' ||
        token.symbol == 'BUSD'
      )
    }

    function getPrice(token: TokenInfo) {
      if (token.id.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase()) {
        return glintPrice
      }
      if (token.symbol == 'WGLMR' || token.symbol == 'MOVR') {
        return movrPrice
      }
      if (token.symbol == 'RIB' || token.symbol == 'RIB') {
        return ribPrice
      }
      if (token.symbol == 'USDC' || token.symbol == 'BUSD' || token.symbol == 'DAI' || token.symbol == 'USDT') {
        return 1
      }
      if (token.symbol == 'BIFI') {
        return beefyPrice
      }
      if (token.symbol == 'FTN') {
        return ftmPrice
      }
      return 0
    }

    const lpTVL = results.map((result, i) => {
      const { result: reserves, loading } = result

      let { token0, token1, lpToken } = lpPools[i]

      token0 = token0.id.toLowerCase() < token1.id.toLowerCase() ? token0 : token1
      token1 = token0.id.toLowerCase() < token1.id.toLowerCase() ? token1 : token0

      if (loading) return { lpToken, tvl: 0, lpPrice: 0, id: '0' }
      if (!reserves) return { lpToken, tvl: 0, lpPrice: 0, id: '0' }

      const { reserve0, reserve1 } = reserves

      const lpTotalSupply = totalSupply[i]?.result?.[0]

      const distributorRatio = distributorBalance[i]?.result?.[0] / lpTotalSupply

      const token0price = getPrice(token0)
      const token1price = getPrice(token1)

      const token0total = Number(Number(token0price * (Number(reserve0) / 10 ** token0?.decimals)).toString())
      const token1total = Number(Number(token1price * (Number(reserve1) / 10 ** token1?.decimals)).toString())

      let lpTotalPrice = Number(token0total + token1total)

      if (isKnownToken(token0)) {
        lpTotalPrice = token0total * 2
      } else if (isKnownToken(token1)) {
        lpTotalPrice = token1total * 2
      }

      const lpPrice = lpTotalPrice / (lpTotalSupply / 10 ** 18)
      const tvl = lpTotalPrice * distributorRatio

      return {
        lpToken,
        tvl,
        lpPrice,
        id: '0',
      }
    })

    const singleTVL = distributorBalanceSingle.map((result, i) => {
      const { result: balance, loading } = result

      const { token0, lpToken } = singlePools[i]

      if (loading) return { lpToken, tvl: 0, lpPrice: 0, id: '0' }
      if (!balance) return { lpToken, tvl: 0, lpPrice: 0, id: '0' }

      const token0price = getPrice(token0)

      const token0total = Number(Number(token0price * (Number(balance) / 10 ** token0?.decimals)).toString())

      const lpPrice = token0price
      const tvl = token0total

      return {
        lpToken,
        tvl,
        lpPrice,
        id: i.toString(),
      }
    })

    return concat(singleTVL, lpTVL)
  }, [
    results,
    distributorBalanceSingle,
    chainId,
    glintPrice,
    movrPrice,
    ribPrice,
    totalSupply,
    distributorBalance,
    lpPools,
    singlePools,
  ])
}

export function useTVL(): TVLInfo[] {
  const { chainId } = useActiveWeb3React()
  const priceData = useContext(PriceContext)
  const glintPrice = priceData?.['glint']
  const movrPrice = priceData?.['glmr']
  const ribPrice = priceData?.['rib']
  const ethPrice = priceData?.['eth']
  const wbtcPrice = priceData?.['wbtc']
  const beefyPrice = priceData?.['beefy']
  const ftmPrice = priceData?.['ftm']
  const beansPrice = priceData?.['beans']
  const cgsPrice = priceData?.['cgs']

  const farmingPools = Object.keys(POOLS[chainId]).map((key) => {
    return { ...POOLS[chainId][key], lpToken: key }
  })

  const singlePools = farmingPools.filter((r) => !r.token1)
  const singleAddresses = singlePools.map((r) => r.lpToken)
  const lpPools = farmingPools.filter((r) => !!r.token1)
  const pairAddresses = lpPools.map((r) => r.lpToken)

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')
  const totalSupply = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'totalSupply')
  const distributorBalance = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'balanceOf', [
    BEAMCHEF_ADDRESS[chainId],
  ])
  const distributorBalanceSingle = useMultipleContractSingleData(singleAddresses, PAIR_INTERFACE, 'balanceOf', [
    BEAMCHEF_ADDRESS[chainId],
  ])

  return useMemo(() => {
    function isKnownToken(token: TokenInfo) {
      return (
        token.id.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase() ||
        token.symbol == 'WGLMR' ||
        token.symbol == 'GLMR' ||
        token.symbol == 'RIB' ||
        token.symbol == 'USDC' ||
        token.symbol == 'BUSD' ||
        token.symbol == 'DAI'
      )
    }

    function getPrice(token: TokenInfo) {
      if (token.id.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase()) {
        return glintPrice
      }
      if (token.symbol == 'WGLMR' || token.symbol == 'GLMR') {
        return movrPrice
      }
      if (token.symbol == 'RIB' || token.symbol == 'RIB') {
        return ribPrice
      }
      if (token.symbol == 'USDC' || token.symbol == 'BUSD' || token.symbol == 'USDT' || token.symbol == 'DAI') {
        return 1
      }
      if (token.symbol == 'ETH') {
        return ethPrice
      }
      if (token.symbol == 'WBTC') {
        return wbtcPrice
      }
      if (token.symbol == 'BIFI') {
        return beefyPrice
      }
      if (token.symbol == 'FTM') {
        return ftmPrice
      }
      if (token.symbol == 'BEANS') {
        return beansPrice
      }
      if (token.symbol == 'CGS') {
        return cgsPrice
      }
      return 0
    }

    const lpTVL = results.map((result, i) => {
      const { result: reserves, loading } = result

      let { token0, token1, lpToken } = lpPools[i]

      token0 = token0.id.toLowerCase() < token1.id.toLowerCase() ? token0 : token1
      token1 = token0.id.toLowerCase() < token1.id.toLowerCase() ? token1 : token0

      if (loading) return { lpToken, tvl: 0, lpPrice: 0 }
      if (!reserves) return { lpToken, tvl: 0, lpPrice: 0 }

      const { reserve0, reserve1 } = reserves

      const lpTotalSupply = totalSupply[i]?.result?.[0]

      const distributorRatio = distributorBalance[i]?.result?.[0] / lpTotalSupply

      const token0price = getPrice(token0)
      const token1price = getPrice(token1)

      const token0total = Number(Number(token0price * (Number(reserve0) / 10 ** token0?.decimals)).toString())
      const token1total = Number(Number(token1price * (Number(reserve1) / 10 ** token1?.decimals)).toString())

      let lpTotalPrice = Number(token0total + token1total)

      if (isKnownToken(token0)) {
        lpTotalPrice = token0total * 2
      } else if (isKnownToken(token1)) {
        lpTotalPrice = token1total * 2
      }

      const lpPriceOld = lpTotalPrice / (lpTotalSupply / 10 ** 18)
      const tvlOld = lpTotalPrice * distributorRatio
      const tvl = isNaN(tvlOld) ? 0 : tvlOld
      const lpPrice = isNaN(lpPriceOld) ? 0 : lpPriceOld

      return {
        lpToken,
        tvl,
        lpPrice,
      }
    })

    const singleTVL = distributorBalanceSingle.map((result, i) => {
      const { result: balance, loading } = result

      const { token0, lpToken } = singlePools[i]
      if (loading) return { lpToken, tvl: 0, lpPrice: 0 }
      if (!balance) return { lpToken, tvl: 0, lpPrice: 0 }

      const token0price = getPrice(token0)
      const token0total = Number(Number(token0price * (Number(balance) / 10 ** token0?.decimals)).toString())

      const lpPrice = token0price
      const tvl = token0total

      return {
        lpToken,
        tvl,
        lpPrice,
      }
    })

    return concat(singleTVL, lpTVL)
  }, [
    results,
    distributorBalanceSingle,
    chainId,
    glintPrice,
    movrPrice,
    ribPrice,
    totalSupply,
    distributorBalance,
    lpPools,
    singlePools,
  ])
}
export function useShareTVL(farms): TVLInfo[] {
  const { chainId } = useActiveWeb3React()
  const priceData = useContext(PriceContext)
  const glintPrice = priceData?.['glint']
  const movrPrice = priceData?.['glmr']
  const ribPrice = priceData?.['rib']
  const ethPrice = priceData?.['eth']
  const wbtcPrice = priceData?.['wbtc']
  const beefyPrice = priceData?.['beefy']
  const ftmPrice = priceData?.['ftm']
  const cgsPrice = priceData?.['cgs']
  const beansPrice = priceData?.['beans']
  const glintShareRatio = useGlintShareRatio()
  const sharePrice = glintShareRatio * glintPrice
  const farmingPools = Object.keys(SHARE_POOLS[chainId]).map((key) => {
    return { ...SHARE_POOLS[chainId][key] }
  })

  const singlePools = farmingPools.filter((r) => !r.token1)
  const singleAddresses = singlePools.map((r) => r.lpToken)
  const lpPools = farmingPools.filter((r) => !!r.token1)
  const pairAddresses = lpPools.map((r) => r.lpToken)

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')
  const totalSupply = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'totalSupply')
  const distributorBalance = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'balanceOf', [
    SHAREFARM_ADDRESS[chainId],
  ])
  const distributorBalanceSingle = useMultipleContractSingleData(singleAddresses, PAIR_INTERFACE, 'balanceOf', [
    SHAREFARM_ADDRESS[chainId],
  ])

  return useMemo(() => {
    function isKnownToken(token: TokenInfo) {
      return (
        token.id.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase() ||
        token.symbol == 'WGLMR' ||
        token.symbol == 'GLMR' ||
        token.symbol == 'RIB' ||
        token.symbol == 'USDC' ||
        token.symbol == 'BUSD' ||
        token.symbol == 'DAI'
      )
    }

    function getPrice(token: TokenInfo) {
      if (token.id.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase()) {
        return glintPrice
      }
      if (token.symbol == 'WGLMR' || token.symbol == 'GLMR') {
        return movrPrice
      }
      if (token.symbol == 'RIB' || token.symbol == 'RIB') {
        return ribPrice
      }
      if (token.symbol == 'USDC' || token.symbol == 'BUSD' || token.symbol == 'USDT' || token.symbol == 'DAI') {
        return 1
      }
      if (token.symbol == 'ETH') {
        return ethPrice
      }
      if (token.symbol == 'WBTC') {
        return wbtcPrice
      }
      if (token.symbol == 'BIFI') {
        return beefyPrice
      }
      if (token.symbol == 'FTM') {
        return ftmPrice
      }
      if (token.symbol == 'CGS') {
        return cgsPrice
      }
      if (token.symbol == 'BEANS') {
        return beansPrice
      }
      if (token.symbol == 'SHARE') {
        return sharePrice
      }
      return 0
    }

    const lpTVL = results.map((result, i) => {
      const { result: reserves, loading } = result

      let { token0, token1, lpToken } = lpPools[i]
      const contract = useShareFarmContract()
      const args = [String(i)]

      token0 = token0.id.toLowerCase() < token1.id.toLowerCase() ? token0 : token1
      token1 = token0.id.toLowerCase() < token1.id.toLowerCase() ? token1 : token0

      if (loading) return { lpToken, tvl: 0, lpPrice: 0 }
      if (!reserves) return { lpToken, tvl: 0, lpPrice: 0 }

      const { reserve0, reserve1 } = reserves

      const lpTotalSupply = farms[i]?.totalStaked.toString()

      const distributorRatio = distributorBalance[i]?.result?.[0] / lpTotalSupply

      const token0price = getPrice(token0)
      const token1price = getPrice(token1)

      const token0total = Number(Number(token0price * (Number(reserve0) / 10 ** token0?.decimals)).toString())
      const token1total = Number(Number(token1price * (Number(reserve1) / 10 ** token1?.decimals)).toString())

      let lpTotalPrice = Number(token0total + token1total)

      if (isKnownToken(token0)) {
        lpTotalPrice = token0total * 2
      } else if (isKnownToken(token1)) {
        lpTotalPrice = token1total * 2
      }

      const lpPriceOld = lpTotalPrice / (lpTotalSupply / 10 ** 18)
      const tvlOld = lpTotalPrice * distributorRatio
      const tvl = isNaN(tvlOld) ? 0 : tvlOld
      const lpPrice = isNaN(lpPriceOld) ? 0 : lpPriceOld

      return {
        lpToken,
        tvl,
        lpPrice,
      }
    })

    const singleTVL = distributorBalanceSingle.map((result, i) => {
      const { result: balance, loading } = result

      const { token0, lpToken } = singlePools[i]
      if (loading) return { lpToken, tvl: 0, lpPrice: 0 }
      if (!balance || !farms) return { lpToken, tvl: 0, lpPrice: 0 }

      const token0price = getPrice(token0)
      const token0total = Number(
        Number(token0price * Number(farms[i].totalStaked.toString() / 10 ** token0?.decimals)).toString()
      )
      console.log('tvl here')
      if (farms) {
        console.log(farms[i].totalStaked.toString())
      }

      console.log(token0total)

      const lpPrice = token0price
      const tvl = token0total

      return {
        lpToken,
        tvl,
        lpPrice,
      }
    })

    return concat(singleTVL, lpTVL)
  }, [
    results,
    distributorBalanceSingle,
    chainId,
    glintPrice,
    movrPrice,
    ribPrice,
    totalSupply,
    distributorBalance,
    lpPools,
    singlePools,
  ])
}

export function useV2PairsWithPrice(
  currencies: [Currency | undefined, Currency | undefined][]
): [PairState, Pair | null, number][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
    [currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA &&
          tokenB &&
          tokenA.chainId === tokenB.chainId &&
          !tokenA.equals(tokenB) &&
          FACTORY_ADDRESS[tokenA.chainId]
          ? computePairAddress({
              factoryAddress: FACTORY_ADDRESS[tokenA.chainId],
              tokenA,
              tokenB,
            })
          : undefined
      }),
    [tokens]
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')
  const totalSupply = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'totalSupply')

  const priceData = useContext(PriceContext)
  const glintPrice = priceData?.['glint']
  const movrPrice = priceData?.['glmr']
  const ribPrice = priceData?.['rib']
  const ethPrice = priceData?.['eth']
  const wbtcPrice = priceData?.['wbtc']
  const beefyPrice = priceData?.['beefy']
  const ftmPrice = priceData?.['ftm']
  const beansPrice = priceData?.['beans']
  return useMemo(() => {
    function isKnownToken(token: Token) {
      return (
        token.address.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase() ||
        token.symbol == 'WGLMR' ||
        token.symbol == 'MOVR' ||
        token.symbol == 'RIB' ||
        token.symbol == 'USDC' ||
        token.symbol == 'BUSD'
      )
    }

    function getPrice(token: Token) {
      if (token.address.toLowerCase() == GLINT_ADDRESS[chainId].toLowerCase()) {
        return glintPrice
      }
      if (token.symbol == 'WGLMR' || token.symbol == 'GLMR') {
        return movrPrice
      }
      if (token.symbol == 'RIB' || token.symbol == 'RIB') {
        return ribPrice
      }
      if (token.symbol == 'USDC' || token.symbol == 'BUSD' || token.symbol == 'USDT' || token.symbol == 'DAI') {
        return 1
      }
      if (token.symbol == 'ETH') {
        return ethPrice
      }
      if (token.symbol == 'WBTC') {
        return wbtcPrice
      }
      if (token.symbol == 'BIFI') {
        return beefyPrice
      }
      if (token.symbol == 'FTM') {
        return ftmPrice
      }
      if (token.symbol == 'BEANS') {
        return beansPrice
      }
      return 0
    }

    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null, 0]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null, 0]
      if (!reserves) return [PairState.NOT_EXISTS, null, 0]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

      const lpTotalSupply = totalSupply[i]?.result?.[0]

      const token0price = getPrice(token0)
      const token1price = getPrice(token1)

      const token0total = Number(Number(token0price * (Number(reserve0) / 10 ** token0?.decimals)).toString())
      const token1total = Number(Number(token1price * (Number(reserve1) / 10 ** token1?.decimals)).toString())

      let lpTotalPrice = Number(token0total + token1total)

      if (isKnownToken(token0)) {
        lpTotalPrice = token0total * 2
      } else if (isKnownToken(token1)) {
        lpTotalPrice = token1total * 2
      }

      const lpPrice = lpTotalPrice / (lpTotalSupply / 10 ** 18)

      return [
        PairState.EXISTS,
        new Pair(
          CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
          CurrencyAmount.fromRawAmount(token1, reserve1.toString())
        ),
        lpPrice,
      ]
    })
  }, [results, chainId, glintPrice, movrPrice, ribPrice, tokens, totalSupply, ethPrice, wbtcPrice])
}

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB])
  return useV2Pairs(inputs)[0]
}
