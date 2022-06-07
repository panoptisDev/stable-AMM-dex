import { useActiveWeb3React, useBeamDistributorContract, useBeamShareContract } from '../../hooks'

import { BigNumber } from '@ethersproject/bignumber'
import { Zero } from '@ethersproject/constants'
import { useCallback } from 'react'

export default function useBeamShare() {
  const beamShareContract = useBeamShareContract()

  const depositWtihPermit = useCallback(
    async (stakeAmount: string, deadline: number, v: number, r: string, s: string) => {
      try {
        return await beamShareContract?.enterWithPermit(stakeAmount, deadline, v, r, s)
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [beamShareContract]
  )

  return { depositWtihPermit }
}
