import React, { useState } from 'react'
import { formatNumber, formatPercent } from '../../functions'
import { t } from '@lingui/macro'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import Modal from '../../components/Modal'

import Dots from '../../components/Dots'
import { AUTHTRAIL_IDO, SHARE_ADDRESS } from '../../constants/addresses'
import { tryParseAmount } from '../../functions/parse'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import Progress from 'react-progressbar'

import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks'
import { getIdoData, getIdoDataOptimized, getUserData, getUserDataOptimized, useIdoData } from './hooks'
import { IDOInfo } from '../../constants/idos'
import useIdoSc from './useIdoSc'
import { ethers } from 'ethers'
import RegisterModal from './RegisterModal'
import { KYC_WALLETS } from '../../constants/kycwallets'
import QuestionHelper from '../../components/QuestionHelper'
import Clock from '../../layouts/Default/SaleCountdown'
import BuyModal from './BuyModal'
import { ChainId } from '../../sdk'
import ShareLockedClock from '../../layouts/Default/ShareLockCountdown'

interface IdoModalProps {
  isOpen: boolean
  onDismiss: () => void
  onClose: () => void
  farm: any
}

const IdoModal: React.FC<IdoModalProps> = ({ isOpen, onDismiss, farm }) => {
  const { account, chainId } = useActiveWeb3React()

  const [view, setView] = useState('about')
  const [pendingTx, setPendingTx] = useState(false)
  const [lockTime, setLockTime] = useState("0") // 0 for no lock, 1 for 7 days, 2 for 30 days
  const addTransaction = useTransactionAdder()
  const [data, idoExists, idoChainId] = useIdoData(AUTHTRAIL_IDO[chainId])
  const idoData = data as IDOInfo
 /* const [totalRaised, saleOpen, claimOpen, canContribute, freeOpen, registrationOpen, raiseCap] = getIdoData(
    AUTHTRAIL_IDO[chainId],
    parseInt(chainId.toString()),
    idoData?.paymentToken?.decimals,
    idoData?.version
  )*/
  const [idoDataOptimized] = getIdoDataOptimized(
    AUTHTRAIL_IDO[chainId]
  )
  const totalRaised = idoDataOptimized?idoDataOptimized?.totalRaised:"0"
  const saleOpen:boolean =idoDataOptimized?idoDataOptimized?.saleOpen:false
  const freeOpen:boolean = idoDataOptimized?idoDataOptimized?.openForAll:false
  const registrationOpen:boolean = idoDataOptimized?idoDataOptimized?.registrationOpen:false
  const raiseCap = idoDataOptimized?idoDataOptimized?.raiseCap:"50000"
  
  const typedDepositValue = tryParseAmount('900000000000000000000000', idoData?.paymentToken)
  const [approvalState, approve] = useApproveCallback(typedDepositValue, AUTHTRAIL_IDO[chainId])




  const {  unstake } = useIdoSc(chainId == ChainId.MOONBEAM ? "0x59d9259F15ce7654252d782fB26FC279d431919F" : AUTHTRAIL_IDO[chainId])
  /*const [tokenAmount, buyAmount, claimAmount, whiteListed, claimed, unlockTime, stakedBalance, tier, lockedTime] = getUserData(
    AUTHTRAIL_IDO[chainId],
    parseInt(idoChainId.toString()),
    account
  )*/
  const [userDataOptimized] = getUserDataOptimized(AUTHTRAIL_IDO[chainId]);
  const tokenAmount = userDataOptimized?userDataOptimized?.tokenAmount:"0"
  const buyAmount = userDataOptimized?userDataOptimized?.buyAmount:"0"
  const claimAmount = userDataOptimized?userDataOptimized?.claimAmount:"0"
  const whiteListed:boolean = userDataOptimized?userDataOptimized?.whiteListed:false
  const unlockTime = userDataOptimized?userDataOptimized?.unlockTime:"0"
  const stakedBalance = userDataOptimized?userDataOptimized?.stakedBalance:"0"
  const tier = userDataOptimized?userDataOptimized?.tier:"0"
  const lockedTime = userDataOptimized?userDataOptimized?.lockedTime:"0"
  
  
  
  const time = parseFloat(unlockTime?.toString()) * 1000 - Date.parse(new Date().toString())
  const estimatedAllocation = Number(tokenAmount)
  const estimatedSwapAmount = estimatedAllocation * Number(idoData?.tokenPrice)
  const unlockedShare = parseFloat(stakedBalance?.toString()) > 0 && time < 0 ? true : false
  const userShareBalance = useTokenBalance(account, useToken(SHARE_ADDRESS[chainId]))
  const percCompleted = Number(totalRaised) / (Number(raiseCap) != 0 ? Number(raiseCap) : 50000) * 100
  const diffBuy = freeOpen ? 250 : estimatedSwapAmount - Number(buyAmount)
  const disableBuy = Number(buyAmount) == estimatedSwapAmount && Number(tokenAmount) != 0 ? true : false

  const isKyc = KYC_WALLETS.find(wallet => wallet == account.toLowerCase())


  const [registerModal, setRegisterModal] = useState(false)
  const [buyModal, setBuyModal] = useState(false)
  let allocation
  if (parseInt(tier.toString()) == 1) {
    allocation = 250
    if (parseInt(lockedTime.toString()) == 1) {
      allocation = 275
    } else if (parseInt(lockedTime.toString()) == 2) {
      allocation = 375
    }
  } else if (parseInt(tier.toString()) == 2) {
    allocation = 600
    if (parseInt(lockedTime.toString()) == 1) {
      allocation = 660
    } else if (parseInt(lockedTime.toString()) == 2) {
      allocation = 900
    }
  } else if (parseInt(tier.toString()) == 3) {
    allocation = 2500
    if (parseInt(lockedTime.toString()) == 1) {
      allocation = 2750
    } else if (parseInt(lockedTime.toString()) == 2) {
      allocation = 3750
    }
  }


  const { i18n } = useLingui()

  const getModalContent = () => (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxWidth={1000}
      border={false}
      background={'transparent'}
    >
      <RegisterModal
        isOpen={registerModal}
        onDismiss={() => { setRegisterModal(!registerModal) }}
        onClose={() => { setRegisterModal(!registerModal) }}
      />
      <BuyModal
        isOpen={buyModal}
        onDismiss={() => { setBuyModal(!buyModal) }}
        onClose={() => { setBuyModal(!buyModal) }}
      />
      <div className='mt-5 mb-5'>
        <div className="flex flex-col md:flex-row justify-between items-center p-3 bg-blue md:px-10 py-10 mb-5">
          <div className="flex-col flex md:flex-row gap-2 order-2 md:order-1 w-full md:w-auto">
            <div className={`${view == "about" ? 'bg-deepCove text-white px-4 py-2 cursor-pointer bg-linear-gradient' : 'bg-deepCove text-white px-4 py-2 cursor-pointer'}`} style={{ height: 40 }} onClick={() => { setView('about') }}>About The Project</div>
            <div className={`${view == "join" ? 'bg-deepCove text-white px-4 py-2 cursor-pointer bg-linear-gradient' : 'bg-deepCove text-white px-4 py-2 cursor-pointer'}`} style={{ height: 40 }} onClick={() => {
              setView('join')
            }}>Join Pool</div>
            <div className={`${view == "claim" ? 'bg-deepCove text-white px-4 py-2 cursor-pointer bg-linear-gradient hidden' : 'bg-deepCove text-white px-4 py-2 cursor-pointer hidden'}`} style={{ height: 40 }} onClick={() => { setView('claim') }}>Claim</div>
          </div>
          <div className="flex gap-3 text-white items-center order-1 md:order-2 justify-between md:justify-center w-full md:w-auto mb-5 md:mb-0">
            <div className='text-white' style={{ fontSize: 22 }}>Project Details</div>
            <div className="p-1 px-2 bg-darkBlue cursor-pointer" onClick={onDismiss} style={{ border: '2px solid #1F357D' }}>x</div>
          </div>
        </div>

        {view == "about" && (<>
          <div className="bg-blue py-8 px-5 flex md:flex-row flex-col gap-3">
            <div className="flex flex-col md:w-3/5">
              <div className="flex gap-2 items-center">
                <img src="/images/authtrail-logo.png" className="p-2 bg-inputBlue hidden md:block" height={100} width={100} style={{ border: '2px solid #1F357D' }} />
                <div className="flex-col gap-2 md:flex hidden">
                  <div className="flex justify-between items-center">
                    <div className="text-white" style={{ fontSize: 28 }}>Authtrail</div>
                    <div className="text-aqua px-4 py-2 text-center bg-inputBlue rounded-sm" style={{ fontSize: 14 }}>  <a href="https://authtrail.com/" target="_blank" rel="noreferrer">Project Website</a></div>
                  </div>
                  <div className="flex p-3 w-full relative text-white" style={{ border: '2px solid #1F357D' }}>
                    {AUTHTRAIL_IDO[chainId]}
                  </div>
                </div>
                <div className="flex flex-col md:hidden" style={{ width: '-webkit-fill-available' }}>
                  <div className="flex items-center justify-between md:hidden w-full">
                    <div className="flex flex-col gap-2 items-start">
                      <div className="text-white" style={{ fontSize: 28 }}>Authtrail</div>
                      <div className="text-aqua px-4 py-2 text-center bg-inputBlue rounded-sm" style={{ fontSize: 14 }}>Project Website</div>
                    </div>
                    <img src="/images/authtrail-logo.png" className="p-2 bg-inputBlue md:hidden" height={100} width={100} style={{ border: '2px solid #1F357D' }} />
                  </div>
                  <div className="flex p-3 w-full relative text-white text-xs mt-2" style={{ border: '2px solid #1F357D', fontSize: 10 }}>
                    {AUTHTRAIL_IDO[chainId]}
                  </div>
                </div>
              </div>
              <div className="bg-inputBlue p-5 mt-3" style={{ maxHeight: 410, overflow: 'scroll', border: '2px solid #1F357D' }}>
                <div className="pb-3" style={{ borderBottom: '2px solid #1F357D' }}>
                  <div className="text-aqua font-bold">Highlights</div>
                  <ul className='text-white ml-5 mt-3' style={{ listStyleType: 'disc' }}>
                    <li className='mb-2'>$AUT is the utility token for the Authtrail ecosystem and powers its functionalities.</li>
                    <li className='mb-2'>Authtrail is a Moonbeam-based SaaS data integrity platform for enterprise users.</li>
                    <li className='mb-2'>The project has already raised $3.6M from top VCs in a strategic round of funding and has implemented the Authtrail solution in the real economy.</li>
                  </ul>
                </div>
                <div className="pb-3 mt-5" style={{ borderBottom: '2px solid #1F357D' }}>
                  <div className="text-aqua font-bold">Products</div>
                  <div className='text-white mt-3'>The core Authtrail solution is a comprehensive platform for enterprise data integrity built on Moonbeam Network but blockchain-agnostic by design. It allows users to secure, track, verify and share trusted data which enhances everyday business operations and boosts the value of products or services. The complete ecosystem further incorporates Authtrail Validator, Authtrail Public Explorer, Integration Tools, etc. </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:w-2/5 bg-inputBlue p-5" style={{ border: '2px solid #1F357D' }}>
              <div className="text-start text-jordyBlue mb-3">Fundraising Goal</div>
              <div className="flex justify-between items-center pb-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-white font-bold" style={{ fontSize: 36 }}>
                  {formatNumber(Number(raiseCap?.toString() != "0" ? raiseCap : 50000), true)}
                </div>
                <img src="/images/tokens/usdc.png" width={30} height={'auto'} style={{ maxHeight: 30 }} />
              </div>
              <div className="bg-deepCove p-3 text-white mt-3" style={{ fontSize: 16 }}>
                Note that you need to have at least 100K SHARE to participate in the sale.
              </div>
              <div className="mt-3">
                <div className="flex justify-between items-center">
                  <div className="text-white">Ticker Token</div>
                  <div className="px-2 text-royalBlue font-bold rounded-sm" style={{ border: '2px solid #5B53D8' }}>$AUT</div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-white">Personal Allocation</div>
                  <div className="text-white">{whiteListed ? formatNumber(allocation, true) : "TBA"}</div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-white">Registered</div>
                  <div className={`${whiteListed ? 'text-aqua' : 'text-white'}`}>{whiteListed ? "Yes" : "No"}</div>
                </div>
                {Number(stakedBalance) > 0 && (
                  <>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-white">Locked SHARE</div>
                    <div className="text-white">{formatNumber(Number(stakedBalance))}</div>
                  </div>
                    <div className="flex justify-between items-center mt-2">
                    <div className="text-white">Unlocks in</div>
                    <div className="text-white"> <ShareLockedClock deadline={unlockTime}/></div>
                  </div>
                  </>
                 
                )}
                
                {whiteListed && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-white">Tier</div>
                    <div className="text-white">{tier}</div>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="text-white">Price per token</div>
                  <div className="text-white">$0.2</div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-white">IDO Date</div>
                  <div className="text-white">Apr 12th 2022, 15:00PM UTC</div>
                </div>
                {unlockedShare && (
                  <div
                    className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer" style={{ lineHeight: '45px' }}

                    onClick={async () => {
                      setPendingTx(true)
                      try {

                        const tx = await unstake(ethers.utils.parseEther(stakedBalance?.toString()).toString())
                        await tx.wait()
                        addTransaction(tx, {
                          summary: `Claimed SHARE`,
                        })
                      } catch (error) {
                        console.error(error)
                        setPendingTx(false)
                        onDismiss()
                      }
                      setPendingTx(false)
                    }}
                  >
                    Unlock SHARE
                  </div>
                )}

                {registrationOpen && !whiteListed && Number(userShareBalance?.toSignificant()) >= 100000 && (
                  <div
                    className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                    style={{ lineHeight: '45px' }}
                    onClick={() => {
                      setRegisterModal(true)

                    }}
                  >
                    Apply Now
                  </div>
                )}
                {registrationOpen && !whiteListed && Number(userShareBalance?.toSignificant()) < 100000 && (
                  <>
                    <div
                      className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                      style={{ lineHeight: '45px' }}
                    >
                      Not Enough SHARE
                      <QuestionHelper
                        text={
                          <>
                            <div>Check and withdraw from Syrup pools or</div>
                            <div>get SHARE by staking GLINT on Beamshare</div>
                          </>
                        }
                      />
                    </div>

                  </>
                )}
                {whiteListed && !isKyc && (
                  <a
                    className="bg-deepCove mt-5 text-white text-center cursor-pointer mt-2 hover:text-aqua flex justify-center" style={{ lineHeight: '45px' }}
                    href="https://fractal.id/authorize?client_id=q8ThQnupxjJHSJs9sUPn_45YUcbpk_oM2mAd83ToskU&redirect_uri=https%3A%2F%2Fapp.beamswap.io&response_type=code&scope=contact%3Aread%20verification.basic%3Aread%20verification.basic.details%3Aread%20verification.liveness%3Aread%20verification.liveness.details%3Aread%20verification.wallet%3Aread%20verification.wallet.details%3Aread"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Complete KYC
                  </a>
                )}

                {whiteListed && isKyc && (
                  <a
                    className="bg-deepCove mt-5 text-aqua text-center cursor-pointer mt-2 flex justify-center" style={{ lineHeight: '45px', pointerEvents: "none" }}
                  >
                    KYC Completed
                  </a>
                )}


              </div>
            </div>

          </div>

          <div className="flex md:flex-row flex-col gap-3 mt-5">
            <div className="flex flex-col md:w-1/2 bg-blue p-5" style={{ border: '2px solid #1F357D' }}>
              <div className="text-aqua">Tokenomics</div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Name</div>
                  <div className="text-white">Authtrail Token</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Symbol</div>
                  <div className="text-white">AUT</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Blockchain</div>
                  <div className="text-white">Moonbeam</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Total Supply</div>
                  <div className="text-white">150,000,000 AUT</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Listing Price</div>
                  <div className="text-white">$0.4</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:w-1/2 bg-blue p-5" style={{ border: '2px solid #1F357D' }}>
              <div className="text-aqua">Docks Details</div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Total AUT for sale</div>
                  <div className="text-white">250,000 AUT</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Total Raise</div>
                  <div className="text-white">$50,000</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Starts</div>
                  <div className="text-white">Apr 12th 2022, 15:00PM UTC</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Token Distribution</div>
                  <div className="text-white text-right">Community Round Vesting Schedule</div>
                </div>
                <div className="flex justify-between items-center mb-2 bg-darkBlue p-2 mt-2" style={{ border: '2px solid #1F357D' }}>
                  <div className="text-jordyBlue">Price</div>
                  <div className="text-white">$0.2</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5 w-full">
            <div className="flex flex-col bg-blue p-5 w-full" style={{ border: '2px solid #1F357D' }}>
              <div className="text-aqua mb-5">Social Media</div>
              <div className="flex gap-3 items-center justify-center md:justify-between flex-wrap md:flex-nowrap">
                <a href="https://authtrail.com/" target="_blank" rel="noreferrer" className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/4" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-web.png" />
                  <div>Website</div>
                </a>
                <a href="https://twitter.com/authtrail" target="_blank" rel="noreferrer" className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/4" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-twitter.png" />
                  <div>Twitter</div>
                </a>
                <a href="https://t.me/Authtrail" target="_blank" rel="noreferrer" className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/4" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-telegram.png" />
                  <div>Telegram</div>
                </a>
                <a href="https://authtrail.com/wp-content/uploads/Authtrail-Whitepaper-v1.0-1.pdf" target="_blank" rel="noreferrer" className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/4" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-docs.png" />
                  <div>Litepaper</div>
                </a>


                {/* <div className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/6" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-twitter.png" />
                  <div>Twitter</div>
                </div>
                <div className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/6" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-telegram.png" />
                  <div>Telegram</div>
                </div>
                <div className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/6" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-discord.png" />
                  <div>Discord</div>
                </div>
                <div className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/6" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-medium.png" />
                  <div>Medium</div>
                </div>
                <div className="bg-darkBlue px-5 py-2 text-center text-jordyBlue flex flex-col items-center justify-center w-1/6" style={{ border: '2px solid #1F357D' }}>
                  <img className='mb-3' src="/images/ido-docs.png" />
                  <div>Litepaper</div>
                </div> */}
              </div>
            </div>
          </div>
        </>)}

        {view == "join" && (<>
          <div className="flex-col items-center bg-darkBlue w-full md:w-1/2 " style={{ border: '2px solid #1F357D' }}>
            <img src="/images/authtrail-banner.png" />
            <div className="flex flex-row justify-between mx-6 items-center pb-4 mb-5 mt-3" style={{ borderBottom: '2px solid #1F357D' }}>
              <div className="text-white font-md font-bold text-bold" style={{ fontSize: 20 }}>Community Round</div>
            </div>
            <div className="flex-col mx-6 mt-5 pb-4 gap-5 mb-4" style={{ borderBottom: '2px solid #1F357D' }}>
              <div className="flex justify-between text-white mb-3">
                <div>Total Raise</div>
                <div className="font-bold">{formatNumber(Number(raiseCap?.toString() != "0" ? raiseCap : 50000), true)}</div>
              </div>
              {whiteListed && (
                <>
                  <div className="flex justify-between text-white mb-3" style={{ borderBottom: '2px solid #1F357D' }}>
                    <div>Allocation</div>
                    <div className="font-bold">{formatNumber(estimatedAllocation)} {idoData?.idoSymbol} ({formatNumber(estimatedSwapAmount, true)})</div>
                  </div>
                  <div className="flex justify-between text-white mb-3">
                    <div>Amount sent</div>
                    <div className="font-bold">{formatNumber(Number(buyAmount), true)}</div>
                  </div>
                  <div className="flex justify-between text-white mb-3">
                    <div>Tokens purchased</div>
                    <div className="font-bold">{formatNumber(Number(claimAmount))} {idoData?.idoSymbol}</div>
                  </div>
                </>
              )}

            </div>
            <div className="flex mx-6 mb-3 ido" style={{ height: 30 }}>
              <Progress completed={percCompleted} width={100} color={'#00FFFF'} />
            </div>
            <div className="flex justify-between text-white mb-3 mx-6">
              <div className="text-jordyBlue text-xs">Total Committed</div>
              <div className="font-bold text-aqua text-xs">{formatNumber(Number(totalRaised), true)} ({formatPercent(percCompleted)})</div>
            </div>
            {!saleOpen && !whiteListed && Number(raiseCap) != Number(totalRaised) && (
              <div className="flex justify-center bg-lightBlueSecondary text-jordyBlue m-5 text-center p-3">
                <Clock deadline={1649775600} />{' '}
              </div>
            )}
            {saleOpen && !whiteListed && Number(raiseCap) != Number(totalRaised) && (
              <div className="flex justify-center bg-lightBlueSecondary text-jordyBlue m-5 text-center p-3">
                In Progress
              </div>
            )}

            {!saleOpen && !whiteListed && Number(raiseCap) == Number(totalRaised) && (
              <div className="flex justify-center bg-lightBlueSecondary text-jordyBlue m-5 text-center p-3">
                Ended!
              </div>
            )}

            {whiteListed && approvalState == ApprovalState.NOT_APPROVED && (
              <div
                className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                style={{ lineHeight: '45px' }}
                onClick={() => {
                  approve()

                }}
              >
                Approve
              </div>
            )}

            {whiteListed && approvalState == ApprovalState.PENDING && (
              <div
                className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                style={{ pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' }}

              >
                <Dots>{i18n._(t`Approving`)}</Dots>
              </div>
            )}

            {!saleOpen && whiteListed && approvalState == ApprovalState.APPROVED && (
              <div className="mx-5">
                <div
                  className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                  style={{ pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' }}

                >
                  <Clock deadline={1649775600} />{' '}
                </div>
              </div>
            )}

            {freeOpen.toString() == 'true' && (
              <>
                {approvalState === ApprovalState.NOT_APPROVED && saleOpen && whiteListed && (
                  <div
                    className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                    // style={saleOpen ? { pointerEvents: 'none', opacity: '0.7' } : {}}
                    onClick={() => {
                      approve()
                    }}
                  >
                    Approve
                  </div>
                )}
                {approvalState === ApprovalState.PENDING && saleOpen && whiteListed  && (
                  <div
                    className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                    style={{ pointerEvents: 'none', opacity: '0.7' }}
                    onClick={() => { }}
                  >
                    <Dots>Approving</Dots>
                  </div>
                )}
                {approvalState === ApprovalState.APPROVED && saleOpen && whiteListed  && (
                  <div className="mx-5">
                    <div
                      className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                      style={diffBuy == 0 ? { pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' } : { lineHeight: '45px' }}
                      onClick={() => {
                        diffBuy != 0 ? setBuyModal(true) : ''
                      }}
                    >
                      {diffBuy != 0 ? 'Buy' : 'No USDC Balance'}
                    </div>
                  </div>
                )}
              </>
            )}
            {freeOpen.toString() == 'false' && (
              <>
                {approvalState === ApprovalState.APPROVED && whiteListed && !disableBuy && saleOpen && (
                  <div className="mx-5">
                    <div
                      className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                      style={saleOpen && disableBuy ? { pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' } : { lineHeight: '45px' }}
                      onClick={() => {
                        saleOpen && !disableBuy ? setBuyModal(true) : console.log('not open')
                      }}
                    >
                      Buy
                    </div>
                  </div>
                )}
                {approvalState === ApprovalState.APPROVED && whiteListed && disableBuy && (
                  <div
                    className="w-full bg-linear-gradient mt-5 text-white text-center cursor-pointer mb-3"
                    style={{ pointerEvents: 'none', opacity: '0.7', lineHeight: '45px' }}
                    onClick={() => {
                      saleOpen && !disableBuy ? setBuyModal(true) : console.log('not open')
                    }}
                  >
                    Bought Max
                  </div>
                )}
              </>
            )}

          </div>
        </>)}

        {view == "claim" && (<>
          <div className="bg-blue p-5 gap-3">
            <div className="bg-darkBlue m-3 flex flex-col text-center items-center justify-center p-5" style={{ border: '2px solid #1F357D' }}>
              <div className="text-aqua text-center">Docks - Authtrail</div>
              <div className="text-white text-center mt-2 pb-3" style={{ borderBottom: '2px solid #1F357D' }}>Here you can claim your tokens. The tokens are gradually released following the vesting schedule.</div>
              <div className="text-aqua text-center mt-3">Vesting Schedule</div>


            </div>
          </div>
        </>)}
      </div>

    </Modal>
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {getModalContent()}
    </Modal>
  )
}

export default React.memo(IdoModal)
