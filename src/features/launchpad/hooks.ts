import { Contract, ethers } from 'ethers'
import { useWeb3React } from '@web3-react/core'
import { useEffect, useMemo, useState } from 'react'


import { RPC } from '../../connectors/index'
import IDO_ABI from '../../constants/abis/ido.json'
import ERC20_ABI from '../../constants/abis/erc20.json'
import Web3 from 'web3'
import { IDOInfo, IDOS } from '../../constants/idos'
import { useActiveWeb3React, useIdoContract, useIdoContractBlast } from '../../hooks'
import { useSingleCallResult, NEVER_RELOAD } from '../../state/multicall/hooks'
import zip from 'lodash/zip'
import { ChainId } from '../../sdk'


export function getIdoDataOptimized(address: string) {
  const { account, chainId, library } = useActiveWeb3React()
  // const blastRPC = "https://moonbeam.blastapi.io/325f3726-0397-4266-9fcd-b3ff8e0f1135"
  // const provider = new ethers.providers.JsonRpcProvider(blastRPC)
  const idoContract = useIdoContract(address)
  const saleOpen = useSingleCallResult(idoContract, 'saleOpen', undefined, NEVER_RELOAD)?.result?.[0]
  const registrationOpen = useSingleCallResult(idoContract, 'registrationOpen', undefined, NEVER_RELOAD)?.result
  const openForAll = useSingleCallResult(idoContract, 'openForAll', undefined, NEVER_RELOAD)?.result?.[0]
  const raiseCap = useSingleCallResult(idoContract, 'raiseCap', undefined, NEVER_RELOAD)?.result?.[0]
  const totalRaised = useSingleCallResult(idoContract, 'totalRaised', undefined)?.result?.[0]
  return useMemo(() => {
    return zip(registrationOpen).map((data, i) => ({
      saleOpen: saleOpen,
      registrationOpen: registrationOpen[0],
      openForAll: openForAll,
      raiseCap: ethers.utils.formatUnits(raiseCap, 6) || '50000',
      totalRaised: ethers.utils.formatUnits(totalRaised, 6)
    }))
  }, [totalRaised, openForAll, saleOpen])
}


/* eslint-disable */
export const getIdoData = (address: string, chainId: number, decimals: number, version: number) => {
  const { account, library } = useActiveWeb3React()
  const web3 = new Web3(library?.provider as any)
  const [data, setData] = useState<string | null>(null)
  const [saleOpen, setSaleOpen] = useState(false)
  const [claimOpen, setclaimOpen] = useState(false)
  const [canContribute, setcanContribute] = useState(false)
  const [registrationOpen, setregistrationOpen] = useState(false)
  const [freeOpen, setFreeOpen] = useState(false)
  const [raiseCap, setRaiseCap] = useState("0")
  // const data = "123"
  // const idoContract = useIdoContractBlast(address)




  const idoSc = new web3.eth.Contract(IDO_ABI as any, address)
  useEffect(() => {
    const fetchIdoData = async () => {
      const totalRaised = ethers.utils.formatUnits(await idoSc.methods.totalRaised().call(), decimals)
      console.log(totalRaised)

      const saleOpenSc = await idoSc.methods.saleOpen().call()
      const registrationOpenSc = await idoSc.methods.registrationOpen().call()
      const claimOpenSc = await idoSc.methods.claimOpen().call()
      const freeForAll = await idoSc.methods.openForAll().call()
      const raiseCapSc = await idoSc.methods.raiseCap().call()
      setRaiseCap(ethers.utils.formatUnits(raiseCapSc, "6"))

      setFreeOpen(freeForAll)
      const canContributeSc = true
      setregistrationOpen(registrationOpenSc)
      setSaleOpen(saleOpenSc)
      setclaimOpen(claimOpenSc)

      setData(totalRaised)
      setcanContribute(canContributeSc)
      //  setData(totalRaised.toString())
    }
    if (chainId != 0) {
      fetchIdoData()
    }
  }, [idoSc])
  return [data, saleOpen, claimOpen, canContribute, freeOpen, registrationOpen, raiseCap]
}

export const useIdoData = (address: string) => {
  // iterates through all IDOs in constant files and returns ido data if it exists
  const { account, library, chainId } = useActiveWeb3React()
  const [idoData, setIdoData] = useState<IDOInfo | null>(null)
  const [idoExists, setIdoExists] = useState(false)
  const [idoChainId, setIdoChainId] = useState(0)

  useEffect(() => {
    for (const [key, value] of Object.entries(IDOS)) {
      for (const [key2, value2] of Object.entries(value)) {
        if (key2?.toString().toLowerCase() == address.toString().toLowerCase()) {
          setIdoData(value2)
          setIdoExists(true)
          setIdoChainId(Number(key))
        }
      }
    }
  }, [idoData, idoExists, idoChainId])

  return [idoData as IDOInfo, idoExists, idoChainId]
}

export const getUserData = (idoAddress: string, chainId: number, userAddress: string) => {
  const { account, library } = useActiveWeb3React()
  const web3 = new Web3(library?.provider as any)
  const [tokenAmount, settokenAmount] = useState('0')
  const [buyAmount, setbuyAmount] = useState('0')
  const [claimAmount, setclaimAmount] = useState('0')
  const [unlockTime, setunlockTime] = useState('0')
  const [whiteListed, setwhiteListed] = useState(false)
  const [claimed, setclaimed] = useState(false)
  const [stakedBalance, setStakedBalance] = useState('0')
  const [tier, setTier] = useState('0')
  const [lockedTime, setlockTime] = useState('0')

  const idoSc = new web3.eth.Contract(IDO_ABI as any, idoAddress)

  useEffect(() => {
    const fetchIdoData = async () => {
      console.log("getting user data");

      const user = await idoSc.methods.users(userAddress).call()
      //console.log(user);

      const paymentTokenSc = new web3.eth.Contract(ERC20_ABI as any, await idoSc.methods.paymentToken().call())
      const idoTokenSc = new web3.eth.Contract(ERC20_ABI as any, await idoSc.methods.idoToken().call())
      const decimals = parseInt(await paymentTokenSc.methods.decimals().call())
      const idoTokenDecimals = parseInt(await idoTokenSc.methods.decimals().call())
      const unlockTimeSc = (await idoSc.methods.unlockTime(userAddress).call())
      const stakedBalanceSc = await idoSc.methods.stakedBalance(userAddress).call()
      setStakedBalance(ethers.utils.formatEther(stakedBalanceSc))
      setunlockTime(unlockTimeSc)
      settokenAmount(ethers.utils.formatUnits(user.tokenAmount, idoTokenDecimals)) // amount of tokens for allocation
      setbuyAmount(ethers.utils.formatUnits(user.buyAmount, decimals)) // amount of $ user has swapped
      setclaimAmount(ethers.utils.formatUnits(user.claimAmount, idoTokenDecimals)) // amount of tokens user can claim
      setwhiteListed(user.whiteListed) //if true, then user can participate
      setclaimed(user.claimed) // if user has claimed the tokens yet
      setTier(user.tier)
      setlockTime(user.lockTime)
    }
    if (account && chainId != 0) {
      fetchIdoData()
    }
  }, [idoSc])
  return [tokenAmount, buyAmount, claimAmount, whiteListed, claimed, unlockTime, stakedBalance, tier, lockedTime]
}

export function getUserDataOptimized(address: string) {
  const { account, chainId, library } = useActiveWeb3React()

  //  const blastRPC = "https://moonbeam.blastapi.io/325f3726-0397-4266-9fcd-b3ff8e0f1135"
  //  const provider = new ethers.providers.JsonRpcProvider(blastRPC)
  const idoContract = useIdoContract(address)
  const idoContractStakeBal = useIdoContract(chainId == ChainId.MOONBEAM ? "0x59d9259F15ce7654252d782fB26FC279d431919F" : address)
  //const idoContractStakeBal = new Contract(chainId == ChainId.MOONBEAM ? "0x59d9259F15ce7654252d782fB26FC279d431919F" : address, IDO_ABI, library?.provider as any)
  const user = useSingleCallResult(idoContract, 'users', [account ? account : '0x0000000000000000000000000000000000000001'])?.result
  const unlockTime = useSingleCallResult(idoContractStakeBal, 'unlockTime', [account ? account : '0x0000000000000000000000000000000000000001'], NEVER_RELOAD).result
  const stakedBalance = useSingleCallResult(idoContractStakeBal, 'stakedBalance', [account ? account : '0x0000000000000000000000000000000000000001'], NEVER_RELOAD)?.result?.[0]
  return useMemo(() => {
    if (!user) {
      return []
    }
    return zip(user).map((data, i) => ({
      tokenAmount: ethers.utils.formatUnits(user.tokenAmount, "18") || '0',
      buyAmount: ethers.utils.formatUnits(user.buyAmount, "6") || '0',
      claimAmount: ethers.utils.formatUnits(user.claimAmount, "18") || '0',
      whiteListed: user.whiteListed || false,
      unlockTime: unlockTime.toString() || '0',
      stakedBalance: ethers.utils.formatUnits(stakedBalance, "18") || '0',
      tier: user.tier.toString() || '0',
      lockedTime: user.lockTime.toString() || '0'
    }))
  }, [user])
}



