import { useActiveWeb3React, useBeamDistributorContract, useBeansBloContract, useBloContract } from '../../hooks'

import { BigNumber } from '@ethersproject/bignumber'
import { Zero } from '@ethersproject/constants'
import { useCallback } from 'react'
import { BLO_ADDRESS, BEANS_BLO_ADDRESS } from '../../constants/addresses'

export default function useBlo() {
  const { chainId } = useActiveWeb3React()
  const contract = useBloContract(BLO_ADDRESS[chainId])
  const beanscontract = useBeansBloContract(BEANS_BLO_ADDRESS[chainId])
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

  const buyGlmr = useCallback(
    async (amount: BigNumber) => {
      console.log('value amount')
      console.log(amount.toString())

      try {
        return await beanscontract?.buy({ value: amount.toString() })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [contract]
  )

  return { buy, buyGlmr }
}
