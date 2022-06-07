import { useCallback, useEffect, useState } from 'react'

import { BigNumber } from '@ethersproject/bignumber'
import Fraction from '../entities/Fraction'
import { POOL_DENY } from '../constants'
import orderBy from 'lodash/orderBy'
import range from 'lodash/range'
//import sushiData from '@sushiswap/sushi-data'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useBoringHelperContract } from './useContract'

// Todo: Rewrite in terms of web3 as opposed to subgraph
const useZapperFarms = () => {
  const [farms, setFarms] = useState<any | undefined>()
  const { account } = useActiveWeb3React()
  const boringHelperContract = useBoringHelperContract()

  const fetchAllFarms = useCallback(async () => {
    return;
    let [pools, liquidityPositions, averageBlockTime, sushiPrice, kashiPairs, sushiPairs, masterChef] =
      await Promise.all([
        "1", "2", "1", "2", "1", "2", "1"
      ])

    const pairAddresses = pools




    // console.log('farms:', farms)
    const sorted = orderBy(farms, ['pid'], ['desc'])

    const pids = sorted.map((pool) => {
      return pool.pid
    })

    if (account) {
      const userFarmDetails = await boringHelperContract?.pollPools(account, pids)
      // console.log('userFarmDetails:', userFarmDetails)
      const userFarms = userFarmDetails
        .filter((farm: any) => {
          return farm.balance.gt(BigNumber.from(0)) || farm.pending.gt(BigNumber.from(0))
        })
        .map((farm: any) => {
          // console.log('userFarm:', farm.pid.toNumber(), farm)

          const pid = farm.pid.toNumber()
          const farmDetails: any = sorted.find((pair: any) => pair.pid === pid)

          let deposited
          let depositedUSD
          if (farmDetails && farmDetails.type === 'KMP') {
            deposited = Fraction.from(
              farm.balance,
              BigNumber.from(10).pow(farmDetails.liquidityPair.asset.decimals)
            ).toString()
            depositedUSD =
              farmDetails.totalAssetStaked && farmDetails.totalAssetStaked > 0
                ? (Number(deposited) * Number(farmDetails.tvl)) / farmDetails.totalAssetStaked
                : 0
          } else {
            deposited = Fraction.from(farm.balance, BigNumber.from(10).pow(18)).toString(18)
            depositedUSD =
              farmDetails.slpBalance && Number(farmDetails.slpBalance / 1e18) > 0
                ? (Number(deposited) * Number(farmDetails.tvl)) / (farmDetails.slpBalance / 1e18)
                : 0
          }
          const pending = Fraction.from(farm.pending, BigNumber.from(10).pow(18)).toString(18)

          return {
            ...farmDetails,
            type: farmDetails.type, // KMP or SLP
            depositedLP: deposited,
            depositedUSD: depositedUSD,
            pendingSushi: pending,
          }
        })
      setFarms({ farms: sorted, userFarms: userFarms })
      // console.log('userFarms:', userFarms)
    } else {
      setFarms({ farms: sorted, userFarms: [] })
    }
  }, [account, boringHelperContract])

  useEffect(() => {
    fetchAllFarms()
  }, [fetchAllFarms])

  return farms
}

export default useZapperFarms
