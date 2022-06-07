import { useActiveWeb3React, useBeamDistributorContract } from '../../hooks'

import { BigNumber } from '@ethersproject/bignumber'
import { Zero } from '@ethersproject/constants'
import { useCallback } from 'react'

export default function useMasterChef() {
  const contract = useBeamDistributorContract()

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        return await contract?.deposit(pid, amount.toString())
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [contract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        return await contract?.withdraw(pid, amount)
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [contract]
  )

  const harvest = useCallback(
    async (pid: number) => {
      try {
        return await contract?.deposit(pid, Zero)
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [contract]
  )

  const harvestMany = useCallback(
    async (pid: string[]) => {
      try {
        return await contract?.harvestMany(pid)
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [contract]
  )

  // Deposit with permit
  const depositWithPermit = useCallback(
    async (pid: number, amount: BigNumber, deadline: number, v: number, r: string, s: string) => {
      try {
        return await contract?.depositWithPermit(pid, amount.toString(), deadline, v, r, s)
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [contract]
  )

  return { deposit, withdraw, harvest, harvestMany, depositWithPermit }
}
