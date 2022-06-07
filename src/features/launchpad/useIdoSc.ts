import { useActiveWeb3React, useBeamDistributorContract, useIdoContract } from '../../hooks'

import { BigNumber } from '@ethersproject/bignumber'
import { Zero } from '@ethersproject/constants'
import { useCallback } from 'react'

export default function useIdoSc(address: string) {
  const contract = useIdoContract(address)

  // Deposit
  const buy = useCallback(
    async (amount: BigNumber) => {
      try {
        return await contract?.buy(amount.toString())
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [contract]
  )

  // claim
  const claim = useCallback(async () => {
    try {
      return await contract?.claim()
    } catch (e) {
      console.error(e)
      return e
    }
  }, [contract])

  // Deposit
  const register = useCallback(async (lockTime: string) => {
    try {
      return await contract?.register(lockTime)
    } catch (e) {
      console.error(e.message)
      return e
    }
  }, [contract])

  const unstake = useCallback(async (amount: string) => {
    try {
      return await contract?.unstake(amount)
    } catch (e) {
      console.error(e.message)
      return e
    }
  }, [contract])

  return { buy, register, claim,unstake }
}
