import React, { useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { BigNumber } from 'bignumber.js'
import {
  useGlintAPR,
  useGlintTVL,
  useGlintUserBalance,
  useGlintShareRatio,
  useStakedGlint,
  useShareUserBalance,
} from '../../hooks/staking/hooks'
import { useActiveWeb3React, useBeamShareContract } from '../../hooks'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import Button from '../../components/Button'
import Container from '../../components/Container'
import Progress from 'react-progressbar'
import { Input as NumericalInput } from '../../components/NumericalInput'
import { t } from '@lingui/macro'
import { ApprovalState, useApproveCallback } from '../../hooks'
import { AUTHTRAIL_IDO, BEAMSHARE_ADDRESS, GLINT_ADDRESS } from '../../constants'
import { ChainId, Token } from '../../sdk'
import { tryParseAmount } from '../../functions'
import { useLingui } from '@lingui/react'
import Dots from '../../components/Dots'
import Settings from '../../components/Settings'
import { useTransactionAdder } from '../../state/transactions/hooks'
import Web3Connect from '../../components/Web3Connect'
import { PriceContext } from '../../contexts/priceContext'
import { useBeamSharePermit } from '../../hooks/useERC20Permit'
import { useCountUp } from 'use-count-up'
import { setHardwareWallet } from '../../state/user/hooks'
import { getTransfers } from '../../services/covalent'
import ShareFarm from '../sharefarm'
import { usePositionsShare, useShareFarms } from '../../features/sharefarm/hooks'
import { useShareTVL } from '../../hooks/useV2Pairs'
import { getAddress } from 'ethers/lib/utils'
import { SHARE_POOLS } from '../../constants/sharefarms'
import { getUserData } from '../../features/launchpad/hooks'
import QuestionHelper from '../../components/QuestionHelper'
import Head from 'next/head'

/* eslint-disable */

const Staking: React.FC = () => {
  // This config is required for number formatting
  BigNumber.config({
    EXPONENTIAL_AT: 1000,
    DECIMAL_PLACES: 80,
  })

  const { account, chainId, library } = useActiveWeb3React()

  const { i18n } = useLingui()
  const tvl = useGlintTVL()
  const apr = useGlintAPR()
  const totalUserGlintBalance = useGlintUserBalance()
  const totalUserShareBalance = useShareUserBalance()
  const glintBalances = useStakedGlint()

  const glintShareRatio = useGlintShareRatio()
  const priceData = useContext(PriceContext)
  const glintPrice = priceData?.['glint']
  const addTransaction = useTransactionAdder()
  const [prevValue, setPrevValue] = useState(0)
  const onComplete = () => {
    setPrevValue(glintBalance ? glintBalance : 0)
    return { shouldRepeat: true, delay: 10 }
  }

  const beamShareContract = useBeamShareContract()

  const [stakeState, setStakeState] = useState('stake')

  const liquidityToken = new Token(chainId, GLINT_ADDRESS[chainId], 18, 'GLINT', 'Beamswap Token')

  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')

  const [toShare, settoShare] = useState(0)
  const [fromShare, setfromShare] = useState(0)
  const [pendingTx, setPendingTx] = useState(false)

  const typedDepositValue = tryParseAmount(depositValue, liquidityToken)
  const typedWithdrawValue = tryParseAmount(withdrawValue, liquidityToken)
  const [hardwareWallet] = setHardwareWallet()

  const positions = usePositionsShare()
  const farms = useShareFarms()
  const tvlInfo = useShareTVL(farms)

  const farmingPools = Object.keys(SHARE_POOLS[chainId]).map((key) => {
    return { ...SHARE_POOLS[chainId][key] }
  })

  const valueStaked = positions.reduce((previousValue, currentValue) => {
    const pool = farms.find((r) => parseInt(r.id.toString()) == parseInt(currentValue.id))
    const poolTvl = tvlInfo.find(
      (r) => getAddress(r.lpToken) == getAddress(pool?.lpToken ? pool?.lpToken : farmingPools[currentValue.id].lpToken)
    )

    if (!isNaN(poolTvl?.lpPrice)) {
      console.log(poolTvl)
      return previousValue + currentValue.amount / 1e18
    } else {
      return 0
    }
  }, 0)
  const [tokenAmount, buyAmount, claimAmount, whiteListed, claimed, unlockTime, stakedBalance, tier, lockedTime] = getUserData(
    chainId == ChainId.MOONBEAM?"0x59d9259F15ce7654252d782fB26FC279d431919F":AUTHTRAIL_IDO[chainId],
    parseInt(chainId.toString()),
    account
  )
  const glintBalance = glintBalances?.toNumber() + (valueStaked + Number(stakedBalance) * glintShareRatio)
  const { value, reset } = useCountUp({
    isCounting: true,
    start: prevValue,
    end: glintBalance ? glintBalance : 0,
    duration: 1,
    easing: 'easeInCubic',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    updateInterval: 0,
    onComplete: onComplete,
  })
  console.log('value staked')
  console.log(valueStaked)

  const [approvalState, approve] = useApproveCallback(typedDepositValue, BEAMSHARE_ADDRESS[chainId])
  //const { depositWtihPermit } = useBeamShare()
  const { gatherPermitSignature, signatureData } = useBeamSharePermit(typedDepositValue, beamShareContract.address)

  useEffect(() => {
    async function depositPermit() {
      setPendingTx(true)
      try {
        const stakeAmount = ethers.utils.parseEther(depositValue)
        //  const tx = await beamShareContract.enter(stakeAmount)
        const tx = await beamShareContract.enterWithPermit(
          stakeAmount,
          signatureData.deadline,
          signatureData.v,
          signatureData.r,
          signatureData.s
        )

        addTransaction(tx, {
          summary: `${i18n._(t`Deposit`)} ${'GLINT'}`,
        })
      } catch (error) {
        if (error?.code > 1) {
          await approve()
          setPendingTx(false)
        }
        console.error(error)
      }
      setPendingTx(false)
    }

    async function getTransfersToShare() {
      const response = await getTransfers(chainId, account, GLINT_ADDRESS[chainId])
      console.log(response)
      let sentValue = 0
      const newArray = response?.data?.items.map((d) => {
        if (d?.to_address == beamShareContract.address.toLowerCase() && d?.transfers[0].transfer_type == 'OUT') {
          sentValue = sentValue + parseFloat(ethers.utils.formatEther(d?.transfers[0].delta))
          console.log(d?.transfers[0])
        }

        return sentValue
      })
      console.log('to share: ' + sentValue)
      settoShare(sentValue)
    }

    async function getTransfersFromShare() {
      const response = await getTransfers(chainId, account, GLINT_ADDRESS[chainId])
      console.log(response)
      let sentValue = 0
      const newArray = response?.data?.items.map((d) => {
        if (
          d?.transfers[0].to_address == account.toLowerCase() &&
          d?.transfers[0].from_address == beamShareContract.address.toLowerCase() &&
          d?.transfers[0].transfer_type == 'IN'
        ) {
          sentValue = sentValue + parseFloat(ethers.utils.formatEther(d?.transfers[0].delta))
          // console.log(d?.transfers[0]);
        }

        return sentValue
      })
      console.log('FROM SHARE: ' + sentValue)
      setfromShare(sentValue)
      return sentValue
    }

    if (signatureData && !pendingTx) {
      depositPermit()
    }
    if (account) {
      getTransfersToShare()
      getTransfersFromShare()
    }
  }, [signatureData])

  async function onAttemptToApprove() {
    if (gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code > 1) {
          await approve()
        }
      }
    } else {
      await approve()
    }
  }

  const renderApproveNoSign = () => {
    return approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING ? (
      <Button
        className="bg-linear-gradient mr-4 ml-4 mb-12 opacity-80 hover:opacity-100"
        size="sm"
        variant="outlined"
        color="white"
        style={{ width: '-webkit-fill-available' }}
        disabled={approvalState === ApprovalState.PENDING}
        onClick={approve}
      >
        {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : i18n._(t`Approve`)}
      </Button>
    ) : (
      <Button
        className="bg-linear-gradient mr-4 ml-4 mb-12 opacity-80 hover:opacity-100"
        size="sm"
        variant="outlined"
        color="white"
        style={{ width: '-webkit-fill-available' }}
        disabled={!typedDepositValue}
        onClick={async () => {
          setPendingTx(true)
          try {
            const stakeAmount = ethers.utils.parseEther(depositValue)
            //  const tx = await beamShareContract.enter(stakeAmount)
            const tx = await beamShareContract.enter(stakeAmount)

            addTransaction(tx, {
              summary: `${i18n._(t`Deposit`)} ${'GLINT'}`,
            })
          } catch (error) {
            console.error(error)
          }
          setPendingTx(false)
        }}
      >
        {i18n._(t`Stake`)}
      </Button>
    )
  }

  const renderApproveSign = () => {
    if (approvalState === ApprovalState.APPROVED) {
      return renderApproveNoSign()
    } else {
      return signatureData === null ? (
        <div className="px-4 pb-12">
          <Button
            color="gradient"
            className="w-full bg-linear-gradient text-sm md:text-md"
            style={{ height: 48 }}
            disabled={signatureData !== null}
            onClick={onAttemptToApprove}
          >
            {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : i18n._(t`Sign and Stake`)}
          </Button>
        </div>
      ) : (
        <Button
          className="bg-linear-gradient mr-4 ml-4 mb-12 opacity-80 hover:opacity-100"
          size="sm"
          variant="outlined"
          color="white"
          style={{ width: '-webkit-fill-available' }}
          disabled={!typedDepositValue}
          onClick={async () => {
            setPendingTx(true)
            try {
              const stakeAmount = ethers.utils.parseEther(depositValue)
              //  const tx = await beamShareContract.enter(stakeAmount)
              const tx = await beamShareContract.enterWithPermit(
                stakeAmount,
                signatureData.deadline,
                signatureData.v,
                signatureData.r,
                signatureData.s
              )

              addTransaction(tx, {
                summary: `${i18n._(t`Deposit`)} ${'GLINT'}`,
              })
            } catch (error) {
              console.error(error)
            }
            setPendingTx(false)
          }}
        >
          {!pendingTx && i18n._(t`Stake`)}
          {pendingTx && i18n._(t`Staking...`)}
        </Button>
      )
    }
  }

  return (
    <>
      <Head>
        <title>Beamswap | Beamshare</title>
        <meta
          key="description"
          name="description"
          content="Beamshare is a single-sided auto-compounding pool for the $GLINT token."
        />
      </Head>

      <div className="staking-container">
        <Container maxWidth="5xl" className="space-y-6">
          <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
            <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
            <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />

            <div className="flex-col staking-wrapper bg-blue p-7" style={{ justifyContent: 'center' }}>
              <div
                className="header flex justify-center p-3 bg-inputBlue text-aqua mt-5 mb-5 mr-5 ml-5 md:mr-0 md:ml-0"
                style={{ borderRadius: 2 }}
              >
                STEP 1: Stake GLINT, Receive SHARE Immediately
              </div>
              <div className="flex-col md:flex md:flex-row pt-5" style={{ borderTop: '2px solid #1F357D' }}>
                <div className="text-center ml-0 md:ml-12 mt-8 md:w-1/2 mb-5" style={{ minWidth: '320px' }}>
                  <div className="flex justify-between text-white" style={{ whiteSpace: 'nowrap' }}>
                    <div className="" style={{ textAlign: 'center', paddingBottom: 10, paddingRight: 5 }}>
                      1 SHARE
                    </div>
                    <div className="text-aqua" style={{ textAlign: 'center', paddingBottom: 10, fontWeight: 'bold' }}>
                      {glintShareRatio ? glintShareRatio.toFixed(4) : 0} GLINT
                    </div>
                  </div>
                  <div className="flex rounded-md">
                    <Progress completed={100} width={100} color={'#00FFFF'} />
                  </div>
                  <div
                    className="flex justify-between text-white mt-5 pt-5"
                    style={{ whiteSpace: 'nowrap', borderTop: '2px solid #1F357D' }}
                  >
                    <div className="" style={{ textAlign: 'center', paddingBottom: 10, paddingRight: 5 }}>
                      GLINT Earned
                    </div>
                    <div className="text-white" style={{ textAlign: 'center', paddingBottom: 10, fontWeight: 'bold' }}>
                      {glintBalance && toShare && (
                        <div className="flex-col">
                          <div className="flex text-right justify-end font-normal">
                            $
                            {glintBalance > 0 && glintBalance - (toShare - fromShare) > 0
                              ? new BigNumber(glintBalance - (toShare - fromShare))
                                .multipliedBy(glintPrice)
                                .toNumber()
                                .toLocaleString('en-US')
                              : (glintBalance * glintPrice).toLocaleString('en-US')}
                          </div>
                          <div className="flex">
                            <img
                              className="mr-2"
                              src="/images/tokens/glint.png"
                              width="25px"
                              height="25px"
                              style={{ maxHeight: 25, maxWidth: 25 }}
                            ></img>
                            <div className="font-normal">
                              {glintBalance && glintBalance - (toShare - fromShare) > 0
                                ? (glintBalance - (toShare - fromShare)).toLocaleString('en-US')
                                : glintBalance.toLocaleString('en-US')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex justify-between text-white mt-5 pt-5"
                    style={{ whiteSpace: 'nowrap', borderTop: '2px solid #1F357D', borderBottom: '2px solid #1F357D' }}
                  >
                    <div className="" style={{ textAlign: 'center', paddingBottom: 10, paddingRight: 5 }}>
                      GLINT Staked
                    </div>
                    <div className="text-white" style={{ textAlign: 'center', paddingBottom: 10, fontWeight: 'bold' }}>
                      {toShare > 0 && (
                        <div className="flex-col">
                          <div className="flex text-right justify-end font-normal">
                            $
                            {toShare && totalUserShareBalance?.toNumber() + valueStaked > 0
                              ? new BigNumber(toShare - fromShare)
                                .multipliedBy(glintPrice)
                                .toNumber()
                                .toLocaleString('en-US')
                              : '0.00'}
                          </div>
                          <div className="flex">
                            <img
                              className="mr-2"
                              src="/images/tokens/glint.png"
                              width="25px"
                              height="25px"
                              style={{ maxHeight: 25, maxWidth: 25 }}
                            ></img>
                            <div className="font-normal">
                              {toShare && totalUserShareBalance?.toNumber() + valueStaked > 0
                                ? (toShare - fromShare).toLocaleString('en-US')
                                : 0}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-white mt-0 pt-5" style={{ whiteSpace: 'nowrap' }}>
                    <div className="" style={{ textAlign: 'center', paddingBottom: 10, paddingRight: 5 }}>
                      SHARE Balance
                      <QuestionHelper
                        text={
                          <>
                            <div>Including staked in sharefarm or locked in launchpad</div>
                          </>
                        }
                      />
                    </div>
                    <div className="text-white" style={{ textAlign: 'center', paddingBottom: 10, fontWeight: 'bold' }}>
                      {totalUserShareBalance && (
                        <div className="flex-col">
                          <div className="flex">
                            <img
                              className="mr-2"
                              src="/images/tokens/share.png"
                              width="25px"
                              height="25px"
                              style={{ maxHeight: 25, maxWidth: 25 }}
                            ></img>
                            <div className="font-normal">
                              {totalUserShareBalance
                                ? (totalUserShareBalance.toNumber() + valueStaked + Number(stakedBalance)).toLocaleString('en-US')
                                : 0}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex justify-between text-white mt-5 pt-5"
                    style={{ whiteSpace: 'nowrap', borderTop: '2px solid #1F357D' }}
                  >
                    <div className="" style={{ textAlign: 'center', paddingBottom: 10, paddingRight: 5 }}>
                      TVL
                    </div>
                    <div className="text-white" style={{ textAlign: 'center', paddingBottom: 10, fontWeight: 'bold' }}>
                      <div>${tvl ? tvl.toLocaleString('en-US') : '0'}</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-white mt-1 pt-1" style={{ whiteSpace: 'nowrap' }}>
                    <div className="" style={{ textAlign: 'center', paddingBottom: 10, paddingRight: 5 }}>
                      Approximate APR
                    </div>
                    <div className="text-white" style={{ textAlign: 'center', paddingBottom: 10, fontWeight: 'bold' }}>
                      <div>{apr ? apr.toLocaleString('en-US') : '0'}%</div>
                    </div>
                  </div>

                  {!account && (
                    <Web3Connect size="lg" color="white" style={{ height: 54 }} className="w-full bg-linear-gradient" />
                  )}

                  {account && (
                    <div>
                      <div className="flex justify-between items-center m-4 mr-0 ml-0 mt-6">
                        <div className="flex">
                          <div
                            className={`${stakeState == 'stake' ? 'bg-lightBlueSecondary text-aqua' : 'bg-deepCove text-white'
                              } py-2 px-4 cursor-pointer hover:text-aqua hover:bg-lightBlueSecondary flex items-center`}
                            onClick={() => setStakeState('stake')}
                            style={{ transition: '0.3s all' }}
                          >
                            Stake
                          </div>
                          <div
                            className={`${stakeState == 'unstake' ? 'bg-lightBlueSecondary text-aqua' : 'bg-deepCove text-white'
                              } py-2 px-4 cursor-pointer hover:text-aqua hover:bg-lightBlueSecondary flex items-center`}
                            onClick={() => setStakeState('unstake')}
                            style={{ transition: '0.3s all' }}
                          >
                            Unstake
                          </div>
                        </div>
                        <div className="bg-inputBlue px-2" style={{ lineHeight: '22px', maxHeight: 30, color: 'white' }}>
                          <Settings />
                        </div>
                      </div>
                      {stakeState == 'stake' && (
                        <div className="mt-5 pt-3" style={{ borderTop: '2px solid #1F357D' }}>
                          {account && (
                            <div className="mb-2 text-left text-aqua">
                              <div className="flex">
                                <div>
                                  <span>GLINT</span>
                                  <span className="text-white ml-1">Balance</span>
                                </div>
                                <div className="ml-auto">
                                  {totalUserGlintBalance ? totalUserGlintBalance.toFixed(4) : 0}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="relative flex items-center mb-5">
                            <NumericalInput
                              className="px-4 py-4 pr-20 bg-deepCove focus:ring focus:ring-lightBlueSecondary placeholder text-jordyBlue"
                              value={depositValue}
                              onUserInput={setDepositValue}
                            />
                            {account && (
                              <Button
                                size="xs"
                                onClick={() => {
                                  if (!totalUserGlintBalance.isZero()) {
                                    setDepositValue(totalUserGlintBalance.toString())
                                  }
                                }}
                                style={{ borderRadius: 2 }}
                                className="absolute border-0 right-4 focus:ring focus:ring-light-purple bg-royalBlue text-white"
                              >
                                {i18n._(t`MAX`)}
                              </Button>
                            )}
                          </div>
                          {hardwareWallet ? renderApproveNoSign() : renderApproveSign()}
                        </div>
                      )}

                      {stakeState == 'unstake' && (
                        <div className="mt-5 pt-3" style={{ borderTop: '2px solid #1F357D' }}>
                          <div className="col-span-2 text-center md:col-span-1">
                            {account && (
                              <div className="mb-2 text-left flex justify-between">
                                <div className="text-aqua font-bold">
                                  {i18n._(t`SHARE`)}{' '}
                                  <span className="text-white font-normal" style={{ marginLeft: 2 }}>
                                    Balance
                                  </span>
                                </div>
                                <div className="text-aqua">
                                  {totalUserShareBalance ? totalUserShareBalance.toFixed(4) : 0}
                                </div>
                              </div>
                            )}
                            <div className="relative flex items-center mb-5">
                              <NumericalInput
                                className="px-4 py-4 pr-20 bg-deepCove focus:ring focus:ring-lightBlueSecondary placeholder text-jordyBlue"
                                value={withdrawValue}
                                onUserInput={setWithdrawValue}
                              />
                              {account && (
                                <Button
                                  variant="outlined"
                                  color="white"
                                  size="xs"
                                  onClick={() => {
                                    if (!totalUserShareBalance.isEqualTo(0)) {
                                      setWithdrawValue(totalUserShareBalance.toFixed(liquidityToken?.decimals))
                                    }
                                  }}
                                  style={{ borderRadius: 2 }}
                                  className="absolute border-0 right-4 focus:ring focus:ring-light-purple bg-royalBlue text-white"
                                >
                                  {i18n._(t`MAX`)}
                                </Button>
                              )}
                            </div>
                            <Button
                              className="bg-linear-gradient mb-12 opacity-80 hover:opacity-100"
                              size="sm"
                              variant="outlined"
                              color="white"
                              style={{ width: '-webkit-fill-available' }}
                              disabled={pendingTx || !typedWithdrawValue}
                              onClick={async () => {
                                setPendingTx(true)
                                try {
                                  // KMP decimals depend on asset, SLP is always 18
                                  const stakeAmount = ethers.utils.parseEther(withdrawValue)
                                  const tx = await beamShareContract.leave(stakeAmount)

                                  addTransaction(tx, {
                                    summary: `${i18n._(t`Withdraw`)} ${'GLINT'}`,
                                  })
                                } catch (error) {
                                  console.error(error)
                                }

                                setPendingTx(false)
                              }}
                            >
                              {i18n._(t`Unstake`)}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className="staking-description w-full md:w-1/2 flex-col flex align-center items-center md:ml-7"
                  style={{ maxWidth: '400px' }}
                >
                  <img src="/images/beamshare-logo.svg" className="mr-auto ml-auto mt-auto mb-auto" />
                </div>
              </div>
              <div className="staking-description bg-darkBlue flex-col p-7">
                <div className="text-md font-bold text-white mb-3" style={{ fontSize: 18 }}>
                  Beamshare Information
                </div>
                <div
                  className="staking-info text-white pt-3 mb-3"
                  style={{ borderTop: '2px solid #1F357D', fontSize: 14 }}
                >
                  Stake GLINT here and receive SHARE as receipt representing your share of the pool. This pool{' '}
                  <b>automatically compounds by using a portion of all trade fees to buy back GLINT</b> which means the
                  SHARE to GLINT ratio will grow over time!
                </div>
                <div
                  className="staking-info text-white pt-3 mb-3"
                  style={{ borderTop: '2px solid #1F357D', fontSize: 14 }}
                >
                  Like liquidity providing (LP), you will earn fees according to your share in the pool.
                </div>
                <div className="staking-info text-white pt-3" style={{ borderTop: '2px solid #1F357D', fontSize: 14 }}>
                  You can return the SHARE token back into the pool and you will receive back more GLINT than you have
                  initially deposited.
                </div>
              </div>
            </div>
            <ShareFarm />
          </DoubleGlowShadow>
        </Container>
      </div>
    </>
  )
}

export default Staking
