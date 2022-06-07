import BigNumber from 'bignumber.js'
import { useBeamShareContract } from '..'
import { ethers } from 'ethers'
import { useWeb3React } from '@web3-react/core'
import { useContext, useEffect, useState } from 'react'
import { useGlintContract } from '..'
import { PriceContext } from '../../contexts/priceContext'
import { SHARE_ADDRESS } from '../../constants'

export const useGlintTVL = () => {
  const [data, setData] = useState<number | null>(null)
  const glintContract = useGlintContract()
  const { chainId } = useWeb3React()
  const beamShareAddress = SHARE_ADDRESS[chainId]
  const priceData = useContext(PriceContext)

  const glintPrice = priceData?.['glint']

  useEffect(() => {
    const fetchData = async () => {
      const totalGlintBalance = await glintContract.balanceOf(beamShareAddress)
      const converted = new BigNumber(ethers.utils.formatEther(totalGlintBalance.toString()))
      const TVL = converted.multipliedBy(glintPrice)
      setData(TVL.toNumber())
    }

    fetchData()
  }, [glintPrice, beamShareAddress, glintContract])

  return data
}

export const useStakedGlint = () => {
  const [stakedGlint, setstakedGlint] = useState<BigNumber | null>(null)
  const { account } = useWeb3React()
  const beamShareContract = useBeamShareContract()

  useEffect(() => {
    const fetchData = async () => {
      const userBalance = await beamShareContract.BEAMBalance(account)
      const coverted = new BigNumber(ethers.utils.formatEther(userBalance.toString()))
      setstakedGlint(coverted)
    }
    let refreshInterval
    if (account) {
      fetchData()
      refreshInterval = setInterval(fetchData, 5000)
    }
    return () => clearInterval(refreshInterval)
  }, [account, beamShareContract])

  return stakedGlint
}

export const useGlintUserBalance = () => {
  const [userGlintBalance, setGlintUserBalance] = useState<BigNumber | null>(null)
  const { account } = useWeb3React()
  const glintContract = useGlintContract()

  useEffect(() => {
    const fetchGlintUserBalance = async () => {
      const totalUserGlintBalance = await glintContract.balanceOf(account)
      const covertedBalance = new BigNumber(ethers.utils.formatEther(totalUserGlintBalance.toString()))
      setGlintUserBalance(covertedBalance)
    }
    let refreshInterval
    if (account) {
      fetchGlintUserBalance()
      refreshInterval = setInterval(fetchGlintUserBalance, 5000)
    }
    return () => clearInterval(refreshInterval)
  }, [glintContract, account])

  return userGlintBalance
}

export const useShareUserBalance = () => {
  const [userShareBalance, setShareUserBalance] = useState<BigNumber | null>(null)
  const { account } = useWeb3React()
  const beamShareContract = useBeamShareContract()

  useEffect(() => {
    const fetchGlintUserBalance = async () => {
      const totalUserShareBalance = await beamShareContract.balanceOf(account)
      const covertedBalance = new BigNumber(ethers.utils.formatEther(totalUserShareBalance.toString()))
      setShareUserBalance(covertedBalance)
    }
    let refreshInterval
    if (account) {
      fetchGlintUserBalance()
      refreshInterval = setInterval(fetchGlintUserBalance, 5000)
    }
    return () => clearInterval(refreshInterval)
  }, [beamShareContract, account])

  return userShareBalance
}

export const useGlintAPR = () => {
  const [apr, setAPR] = useState<number | null>(null)
  const glintContract = useGlintContract()
  const { chainId } = useWeb3React()
  const beamShareAddress = SHARE_ADDRESS[chainId]

  useEffect(() => {
    const fetchAPR = async () => {
      const totalGlintBalance = await glintContract.balanceOf(beamShareAddress)
      const converted = new BigNumber(ethers.utils.formatEther(totalGlintBalance.toString()))
      setAPR((90546163.2 / converted.toNumber()) * 100)
    }
    fetchAPR()
  }, [beamShareAddress, glintContract])

  return apr
}

export const useGlintShareRatio = () => {
  const [ratio, setRatio] = useState<number | null>(null)
  const beamShareContract = useBeamShareContract()

  useEffect(() => {
    const fetchRatio = async () => {
      const ratioAmount = ethers.utils.parseEther('1')
      const ratioContract = await beamShareContract.xBEAMForBEAM(ratioAmount)
      console.log('xd')

      console.log(ratioContract)

      const coverted = new BigNumber(ethers.utils.formatEther(ratioContract.toString()))
      setRatio(coverted.toNumber())
    }
    fetchRatio()
  }, [beamShareContract])

  return ratio
}

export const useIsApproved = () => {
  const [approved, setApproved] = useState<string | null>(null)
  const { account, chainId } = useWeb3React()
  const glintContract = useGlintContract()
  const beamShareAddress = SHARE_ADDRESS[chainId]

  useEffect(() => {
    const fetchApproval = async () => {
      const checkFor = await glintContract.allowance(account, beamShareAddress)
      setApproved(checkFor.toString())
    }
    if (account) {
      fetchApproval()
    }
  }, [beamShareAddress, account, glintContract])

  return approved
}
