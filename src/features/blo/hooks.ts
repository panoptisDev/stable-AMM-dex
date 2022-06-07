import BigNumber from 'bignumber.js'
import { Contract, ethers } from 'ethers'
import { useWeb3React } from '@web3-react/core'
import { useContext, useEffect, useMemo, useState } from 'react'
import ERC20_ABI from '../../constants/abis/erc20.json'
import Web3 from 'web3'
import { SUPPORTED_NETWORKS } from '../../modals/NetworkModal'
import { ChainId } from '../../sdk/enums'
import { useActiveWeb3React } from '../../hooks'
import zip from 'lodash/zip'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../../state/multicall/hooks'

/* eslint-disable */
export function useBloData(contract?: Contract | null) {
  const { account } = useActiveWeb3React()
  console.log(contract)

  const buyOpen = useSingleCallResult(contract ? contract : null, 'buyOpen', undefined, NEVER_RELOAD)?.result?.[0]

  const MIN_SHARE = useSingleCallResult(contract ? contract : null, 'minShare', undefined, NEVER_RELOAD)?.result?.[0]

  const MIN_LP = useSingleCallResult(contract ? contract : null, 'minLp', undefined, NEVER_RELOAD)?.result?.[0]

  const totalRaised = useSingleCallResult(contract ? contract : null, 'totalRaised', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const tokenPrice = useSingleCallResult(contract ? contract : null, 'tokenPrice', undefined, NEVER_RELOAD)?.result?.[0]
  const paymentToken = useSingleCallResult(contract ? contract : null, 'paymentToken', undefined, NEVER_RELOAD)
    ?.result?.[0]
  const userInfo = useSingleCallResult(
    contract ? contract : null,
    'users',
    [account ? account : '0x0000000000000000000000000000000000000001'],
    NEVER_RELOAD
  )?.result

  const eligibleToBuy = useSingleCallResult(
    contract ? contract : null,
    'eligibleToBuy',
    [account ? account : '0x0000000000000000000000000000000000000001'],
    NEVER_RELOAD
  )?.result?.[0]
  console.log(eligibleToBuy)

  return useMemo(() => {
    if (!userInfo) {
      return []
    }
    return zip(userInfo).map((data, i) => ({
      buyOpen: buyOpen.toString() || '',
      MIN_SHARE: MIN_SHARE || '',
      MIN_LP: MIN_LP || '',
      totalRaised: totalRaised || '1',
      tokenPrice: tokenPrice || '1',
      userInfo: (userInfo as any) || '',
      paymentToken: paymentToken || '',
      eligibleToBuy: eligibleToBuy.toString() || 'false',
    }))
  }, [userInfo, buyOpen])
}

export function useBeansBloData(contract?: Contract | null) {
  const { account } = useActiveWeb3React()
  const buyOpen = useSingleCallResult(contract ? contract : null, 'buyOpen', undefined, NEVER_RELOAD)?.result?.[0]

  const totalRaised = useSingleCallResult(contract ? contract : null, 'totalRaised', undefined, NEVER_RELOAD)
    ?.result?.[0]

  console.log(totalRaised)

  const tokenPrice = useSingleCallResult(contract ? contract : null, 'tokenPrice', undefined, NEVER_RELOAD)?.result?.[0]
  const userInfo = useSingleCallResult(
    contract ? contract : null,
    'users',
    [account ? account : '0x0000000000000000000000000000000000000001'],
    NEVER_RELOAD
  )?.result
  return useMemo(() => {
    if (!userInfo) {
      return []
    }
    return zip(userInfo).map((data, i) => ({
      buyOpen: buyOpen.toString() || '',
      totalRaised: totalRaised || '1',
      tokenPrice: tokenPrice || '1',
      userInfo: (userInfo as any) || '',
    }))
  }, [userInfo, buyOpen])
}
