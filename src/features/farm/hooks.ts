import { CurrencyAmount, JSBI, MASTERCHEF_ADDRESS } from '../../sdk'
import { Chef } from './enum'
import { GLINT, MASTERCHEF_V2_ADDRESS, MINICHEF_ADDRESS } from '../../constants'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../../state/multicall/hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useBeamDistributorContract,
  useBNBPairContract,
  useglintGlimmerContract,
  useBeamVaultContract,
  useGlmrUsdcContract,
  useRibMovrContract,
  useEthUsdcContract,
  useWbtcUsdcContract,
  useBeansGlmrContract,
  useFtmUsdcContract,
  useBifiGlmrContract,
  useCgsUsdcContract,
} from '../../hooks'

import { Contract } from '@ethersproject/contracts'
import { Zero } from '@ethersproject/constants'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import zip from 'lodash/zip'
import { useToken } from '../../hooks/Tokens'
import { useVaultInfo, useVaults } from '../vault/hooks'
import { useGlintShareRatio } from '../../hooks/staking/hooks'
const { default: axios } = require('axios')

export function useChefContract(chef: Chef) {
  const beamDistributorContract = useBeamDistributorContract()
  const contracts = useMemo(
    () => ({
      [Chef.MASTERCHEF]: beamDistributorContract,
      [Chef.MASTERCHEF_V2]: beamDistributorContract,
      [Chef.MINICHEF]: beamDistributorContract,
    }),
    [beamDistributorContract]
  )
  return useMemo(() => {
    return contracts[chef]
  }, [contracts, chef])
}

export function useChefContracts(chefs: Chef[]) {
  const beamDistributorContract = useBeamDistributorContract()
  const contracts = useMemo(
    () => ({
      [Chef.MASTERCHEF]: beamDistributorContract,
      [Chef.MASTERCHEF_V2]: beamDistributorContract,
      [Chef.MINICHEF]: beamDistributorContract,
    }),
    [beamDistributorContract]
  )
  return chefs.map((chef) => contracts[chef])
}

export function useUserInfo(farm, token) {
  const { account } = useActiveWeb3React()

  const contract = useChefContract(0)

  const args = useMemo(() => {
    if (!account) {
      return
    }
    return [String(farm.id), String(account)]
  }, [farm, account])

  const result = useSingleCallResult(args ? contract : null, 'userInfo', args)?.result

  const value = result?.[0]
  const harvestValue = result?.[3]

  const amount = value ? JSBI.BigInt(value.toString()) : undefined
  const nextHarvestUntil = harvestValue ? JSBI.BigInt(harvestValue.toString()) : undefined

  return {
    amount: amount ? CurrencyAmount.fromRawAmount(token, amount) : undefined,
    nextHarvestUntil: nextHarvestUntil ? JSBI.toNumber(nextHarvestUntil) * 1000 : undefined,
  }
}

export function usePendingTokens(farm) {
  const { account, chainId } = useActiveWeb3React()

  const contract = useChefContract(0)

  const args = useMemo(() => {
    if (!account) {
      return
    }
    return [String(farm.id), String(account)]
  }, [farm, account])

  const result = useSingleCallResult(args ? contract : null, 'pendingTokens', args)?.result

  const value = result?.amounts

  if (value == undefined) return 0

  value.forEach((v) => {
    v = JSBI.BigInt(v.toString())
  })

  const amount = value ? value : undefined

  return amount
}

export function usePendingToken(farm, contract) {
  const { account } = useActiveWeb3React()

  const args = useMemo(() => {
    if (!account || !farm) {
      return
    }
    return [String(farm.pid), String(account)]
  }, [farm, account])

  const pendingTokens = useSingleContractMultipleData(
    args ? contract : null,
    'pendingTokens',
    args.map((arg) => [...arg, '0'])
  )

  return useMemo(() => pendingTokens, [pendingTokens])
}

export function useGlintPositions(contract?: Contract | null) {
  const { account } = useActiveWeb3React()

  const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const args = useMemo(() => {
    if (!account || !numberOfPools) {
      return
    }
    return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid), String(account)])
  }, [numberOfPools, account])

  const pendingGlint = useSingleContractMultipleData(args ? contract : null, 'pendingTokens', args)

  const userInfo = useSingleContractMultipleData(args ? contract : null, 'userInfo', args)

  return useMemo(() => {
    if (!pendingGlint || !userInfo) {
      return []
    }
    return zip(pendingGlint, userInfo)
      .map((data, i) => ({
        id: args[i][0],
        pendingGlint: data[0].result?.amounts || Zero,
        amount: data[1].result?.[0] || Zero,
        symbol: data[0].result?.symbols,
      }))
      .filter(({ pendingGlint, amount }) => {
        return pendingGlint || (amount && !amount.isZero())
      })
  }, [args, pendingGlint, userInfo])
}

export function usePoolRewardsPerSec(contract?: Contract | null) {
  const { account } = useActiveWeb3React()

  const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const args = useMemo(() => {
    if (!account || !numberOfPools) {
      return
    }
    return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid), String(account)])
  }, [numberOfPools, account])

  const args2 = useMemo(() => {
    if (!account || !numberOfPools) {
      return
    }
    return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid)])
  }, [numberOfPools])

  const pendingGlint = useSingleContractMultipleData(args ? contract : null, 'poolRewardsPerSec', args2)
  const userInfo = useSingleContractMultipleData(args ? contract : null, 'userInfo', args)

  return useMemo(() => {
    if (!pendingGlint) {
      return []
    }
    return zip(pendingGlint).map((data, i) => ({
      id: args[i][0],
      rewardsPerSec: data[0].result?.rewardsPerSec || Zero,
      symbol: data[0].result?.symbols,
    }))
  }, [args, pendingGlint])
}

export function usePositions() {
  return useGlintPositions(useBeamDistributorContract())
}

export function useRewardsPerSecPosition() {
  return usePoolRewardsPerSec(useBeamDistributorContract())
}

export function useGlmrPrices() {
  return useAsync2(useCoingeckoApi, true)
  // return await getGlmrPrice();
}

export function useBeansPrices() {
  return useAsync2(useCoingeckoApiBeans, true)
  // return await getGlmrPrice();
}

export function useFantomPrices() {
  return useAsync2(useCoingeckoApiFantom, true)
  // return await getGlmrPrice();
}

export function useBeefyPrices() {
  return useAsync2(useCoingeckoApiBeefy, true)
  // return await getGlmrPrice();
}

const useAsync2 = (asyncFunction, immediate = true) => {
  const [value, setValue] = useState(null)

  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the below useEffect is not called
  // on every render, but only if asyncFunction changes.
  const execute = useCallback(() => {
    return asyncFunction().then((response) => {
      let [prices] = response
      setValue({ data: { ...prices?.data } })
    })
  }, [asyncFunction])
  // Call execute if we want to fire it right away.
  // Otherwise execute can be called later, such as
  // in an onClick handler.
  useEffect(() => {
    const intervalId = setInterval(() => {
      execute()
    }, 60000)

    if (immediate) {
      execute()
    }

    return () => {
      clearInterval(intervalId) //This is important
    }
  }, [execute, immediate])

  return useMemo(() => {
    return value
  }, [value])
}

export function useGlintFarms(contract?: Contract | null) {
  const { account } = useActiveWeb3React()

  const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const args = useMemo(() => {
    if (!numberOfPools) {
      return
    }
    return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid)])
  }, [numberOfPools])

  const poolInfo = useSingleContractMultipleData(args ? contract : null, 'poolInfo', args)

  return useMemo(() => {
    if (!poolInfo) {
      return []
    }
    return zip(poolInfo).map((data, i) => ({
      id: args[i][0],
      lpToken: data[0].result?.['lpToken'] || '',
      allocPoint: data[0].result?.['allocPoint'] || '',
      lastRewardBlock: data[0].result?.['lastRewardBlock'] || '',
      accGlintPerShare: data[0].result?.['accBeamPerShare'] || '',
      depositFeeBP: data[0].result?.['depositFeeBP'] || '',
      harvestInterval: data[0].result?.['harvestInterval'] || '',
      totalLp: data[0].result?.['totalLp'] || '',
      rewarders: data[0].result?.['rewarders'] || '',
    }))
  }, [args, poolInfo])
}

const useAsync = (asyncFunction, immediate = true) => {
  const [value, setValue] = useState(null)

  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the below useEffect is not called
  // on every render, but only if asyncFunction changes.
  const execute = useCallback(() => {
    return asyncFunction().then((response) => {
      let [prices] = response
      setValue({ data: { ...prices?.data } })
    })
  }, [asyncFunction])
  // Call execute if we want to fire it right away.
  // Otherwise execute can be called later, such as
  // in an onClick handler.
  useEffect(() => {
    const intervalId = setInterval(() => {
      execute()
    }, 60000)

    if (immediate) {
      execute()
    }

    return () => {
      clearInterval(intervalId) //This is important
    }
  }, [execute, immediate])

  return useMemo(() => {
    return value
  }, [value])
}

export function usePriceApi() {
  return Promise.all([axios.get('/api/prices')])
}

export function useCoingeckoApi() {
  return Promise.all([axios.get('https://api.coingecko.com/api/v3/simple/price?ids=moonbeam&vs_currencies=usd')])
}

export function useCoingeckoApiBeans() {
  return Promise.all([axios.get('https://api.coingecko.com/api/v3/simple/price?ids=moonbeans&vs_currencies=usd')])
}
export function useCoingeckoApiFantom() {
  return Promise.all([axios.get('https://api.coingecko.com/api/v3/simple/price?ids=fantom&vs_currencies=usd')])
}
export function useCoingeckoApiBeefy() {
  return Promise.all([axios.get('https://api.coingecko.com/api/v3/simple/price?ids=beefy-finance&vs_currencies=usd')])
}

export function usePrice(pairContract?: Contract | null, pairDecimals?: number | null, invert: boolean = false) {
  const { account, chainId } = useActiveWeb3React()

  const result = useSingleCallResult(pairContract ? pairContract : null, 'getReserves', undefined, NEVER_RELOAD)?.result

  const _reserve1 = invert ? result?.['reserve0'] : result?.['reserve1']
  const _reserve0 = invert ? result?.['reserve1'] : result?.['reserve0']

  const price = _reserve1 ? (Number(_reserve1) / Number(_reserve0)) * (pairDecimals ? 10 ** pairDecimals : 1) : 0

  return price
}

export function useTokenInfo(tokenContract?: Contract | null) {
  const { account, chainId } = useActiveWeb3React()

  const _totalSupply = useSingleCallResult(tokenContract ? tokenContract : null, 'totalSupply', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const _burnt = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0x000000000000000000000000000000000000dEaD'],
    NEVER_RELOAD
  )?.result?.[0]

  const _lockedInBeamshare = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0x4204cAd97732282d261FbB7088e07557810A6408'],
    NEVER_RELOAD
  )?.result?.[0]

  const _idoVesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0x154e71Eed5344Fc815B159f1a9500c97A3C39b4c'],
    NEVER_RELOAD
  )?.result?.[0]

  const _p1Vesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0x806F16c24e28a23FE597a794F1487274a79d20f5'],
    NEVER_RELOAD
  )?.result?.[0]

  const _p2Vesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0xac7c023eE92F3d430aaEeD835e7F25050FE231CC'],
    NEVER_RELOAD
  )?.result?.[0]

  const _seedVesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0xbb23b67168F00621dF1Fe253B955d4Cdf5a8CE33'],
    NEVER_RELOAD
  )?.result?.[0]

  const _advisorVesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0xeD813F9367fCd36a1547Ef104099e0c563D04058'],
    NEVER_RELOAD
  )?.result?.[0]

  const _marketingVesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0xe949543Dcd3545a60E4B64db63d7ebf555237E53'],
    NEVER_RELOAD
  )?.result?.[0]

  const _stratInvestVesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0xa52Cf4aFe31487390F5500789F670C354c326E20'],
    NEVER_RELOAD
  )?.result?.[0]

  const _teamVesting = useSingleCallResult(
    tokenContract ? tokenContract : null,
    'balanceOf',
    ['0xFE8E2b85aD539EBc863056ee3ece39DcF6F01b46'],
    NEVER_RELOAD
  )?.result?.[0]

  const marketing = JSBI.BigInt('5000000000000000000000000')
  const initialLiq = JSBI.BigInt('9000000000000000000000000')
  const IDOVested = JSBI.BigInt('11375000000000000000000000')
  const idoVesting = _idoVesting ? JSBI.BigInt(_idoVesting.toString()) : JSBI.BigInt(0)
  const p1Vesting = _p1Vesting ? JSBI.BigInt(_p1Vesting.toString()) : JSBI.BigInt(0)
  const p2Vesting = _p2Vesting ? JSBI.BigInt(_p2Vesting.toString()) : JSBI.BigInt(0)
  const seedVesting = _seedVesting ? JSBI.BigInt(_seedVesting.toString()) : JSBI.BigInt(0)
  const advisorVesting = _advisorVesting ? JSBI.BigInt(_advisorVesting.toString()) : JSBI.BigInt(0)
  const marketingVesting = _marketingVesting ? JSBI.BigInt(_marketingVesting.toString()) : JSBI.BigInt(0)
  const investVesting = _stratInvestVesting ? JSBI.BigInt(_stratInvestVesting.toString()) : JSBI.BigInt(0)
  const teamVesting = _teamVesting ? JSBI.BigInt(_teamVesting.toString()) : JSBI.BigInt(0)
  const beamshareLocked = _lockedInBeamshare ? JSBI.BigInt(_lockedInBeamshare.toString()) : JSBI.BigInt(0)
  const lockedInVaults = _lockedInBeamshare
    ? JSBI.add(
        JSBI.add(
          JSBI.add(
            JSBI.add(
              JSBI.add(
                JSBI.add(
                  JSBI.add(JSBI.add(JSBI.add(JSBI.add(beamshareLocked, marketing), initialLiq), idoVesting), p1Vesting),
                  p2Vesting
                ),
                seedVesting
              ),
              advisorVesting
            ),
            marketingVesting
          ),
          investVesting
        ),
        teamVesting
      )
    : JSBI.BigInt(0)

  const totalSupply = _totalSupply ? JSBI.BigInt(_totalSupply.toString()) : JSBI.BigInt(0)
  const burnt = _burnt ? JSBI.BigInt(_burnt.toString()) : JSBI.BigInt(0)

  const circulatingSupply = JSBI.subtract(
    JSBI.subtract(
      JSBI.subtract(
        JSBI.subtract(
          JSBI.subtract(
            JSBI.subtract(
              JSBI.subtract(
                JSBI.subtract(
                  JSBI.subtract(
                    JSBI.subtract(JSBI.subtract(JSBI.subtract(totalSupply, burnt), beamshareLocked), marketing),
                    idoVesting
                  ),
                  initialLiq
                ),
                p1Vesting
              ),
              p2Vesting
            ),
            seedVesting
          ),
          advisorVesting
        ),
        marketingVesting
      ),
      investVesting
    ),
    teamVesting
  )

  const token = useToken(tokenContract.address)

  return useMemo(() => {
    if (!token) {
      return {
        totalSupply: '0',
        burnt: '0',
        circulatingSupply: '0',
        lockedInVaults: '0',
      }
    }

    return {
      totalSupply: CurrencyAmount.fromRawAmount(token, totalSupply).toFixed(0),
      burnt: CurrencyAmount.fromRawAmount(token, burnt).toFixed(0),
      vaults: CurrencyAmount.fromRawAmount(token, lockedInVaults).toFixed(0),
      circulatingSupply: CurrencyAmount.fromRawAmount(token, circulatingSupply).toFixed(0),
    }
  }, [totalSupply, burnt, circulatingSupply, token, lockedInVaults])
}

export function useFarms() {
  return useGlintFarms(useBeamDistributorContract())
}

export function usePricesApi() {
  const glmrPrice = useGlmrPrice()
  //const glmrPrices = useGlmrPrices()
  const fantomPrice = useFtmPrice()
  const beefyPrice = useBifiPrice()

  // const fantomPrices = useFantomPrices()
  //  const beefyPrices = useBeefyPrices()
  // const beefyId = 'beefy-finance'
  //const beefyPrice = beefyPrices?.data?.[beefyId].usd
  //const fantomPrice = fantomPrices?.data?.fantom.usd
  // const glmrPrice = glmrPrices?.data?.moonbeam.usd
  const glintPrice = useGlintPrice()
  const cgsPrice = useCgsPrice()
  const ribPrice = 1
  const ethPrice = useEthPrice()
  const glintShareRatio = useGlintShareRatio()
  // const wbtcPrice = useWbtcPrice()
  const wbtcPrice = 42000
  const usdcPrice = 1
  const bnbPrice = useBNBPrice()

  const glintPriceUsd = glintPrice * glmrPrice
  const sharePrice = glintPriceUsd * glintShareRatio
  const beansPrice = useBEANSPrice()
  const beansusd = beansPrice * glmrPrice

  return useMemo(() => {
    return {
      glmr: glmrPrice,
      glint: glintPriceUsd, //glintPriceUsd
      rib: 1,
      usdc: usdcPrice,
      eth: ethPrice,
      wbtc: wbtcPrice,
      bnb: bnbPrice,
      beefy: beefyPrice,
      ftm: fantomPrice,
      share: sharePrice,
      beans: beansusd,
      cgs:cgsPrice,
      mock: 1,
      busd: 1,
    }
  }, [
    glmrPrice,
    ribPrice,
    glintPrice,
    usdcPrice,
    ethPrice,
    wbtcPrice,
    bnbPrice,
    beefyPrice,
    fantomPrice,
    sharePrice,
    beansusd,
    cgsPrice
  ])
}

export function useFarmsApi() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAsync(usePriceApi, true)
}

export async function getFtmPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=fantom&vs_currencies=usd')
  const ftmPrice = response.data.fantom.usd
  return ftmPrice
}

export async function getBeansPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=moonbeans&vs_currencies=usd')
  const ftmPrice = response.data.moonbeans.usd
  return ftmPrice
}

export function useGlmrPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useGlmrUsdcContract(), 12, true)
}

export function useCgsPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useCgsUsdcContract(), 12, false)
}

export function useGlintPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useglintGlimmerContract(), 0, true)
}

export function useBEANSPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useBeansGlmrContract(), 0, false)
}

export function useRibPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useRibMovrContract(), 0, true)
}

export function useEthPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useEthUsdcContract(), 12, true)
}

export function useFtmPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useFtmUsdcContract(), 12, true)
}

export function useBifiPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useBifiGlmrContract(), 0, false)
}
export function useWbtcPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useWbtcUsdcContract(), 12, true)
}

export function useBNBPrice() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrice(useBNBPairContract())
}

export function useBeamDistributorInfo(contract) {
  const glintPerBlock = useSingleCallResult(contract ? contract : null, 'beamPerSec', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const totalAllocPoint = useSingleCallResult(contract ? contract : null, 'totalAllocPoint', undefined, NEVER_RELOAD)
    ?.result?.[0]

  return useMemo(() => ({ glintPerBlock, totalAllocPoint }), [glintPerBlock, totalAllocPoint])
}

export function useDistributorInfo() {
  return useBeamDistributorInfo(useBeamDistributorContract())
}
