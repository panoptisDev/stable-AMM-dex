import { useActiveWeb3React, useContract, useLockerContract, useTokenContract } from '../../hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { Zero } from '@ethersproject/constants'
import { useCallback, useEffect, useState } from 'react'
import { useVestingContract } from '../../hooks/'
import { SEED_VESTING, P1_VESTING, P2_VESTING, IDO_VESTING } from '../../constants/addresses'
import { useSingleCallResult } from '../../state/multicall/hooks'

export default function useVesting(account: string) {
  const seedContract = useVestingContract(SEED_VESTING, false)
  const p1Contract = useVestingContract(P1_VESTING, false)
  const p2Contract = useVestingContract(P2_VESTING, false)
  const idoContract = useVestingContract(IDO_VESTING, false)

  const [poolData, setPoolData] = useState<any>([])
  const fetchClaimData = useCallback(async () => {
    const [seedClaimAmount, p1ClaimAmount, p2ClaimAmount, idoClaimAmount] = await Promise.all([
      seedContract?.hasClaim({ from: account }),
      p1Contract?.hasClaim({ from: account }),
      p2Contract?.hasClaim({ from: account }),
      idoContract?.hasClaim({ from: account }),
    ])
    setPoolData({
      seedClaimAmount,
      p1ClaimAmount,
      p2ClaimAmount,
      idoClaimAmount,
    })
  }, [])
  useEffect(() => {
    fetchClaimData()
  }, [])

  console.log(poolData)
  if (poolData) return poolData
}
