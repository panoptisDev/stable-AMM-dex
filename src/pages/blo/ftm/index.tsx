import React, { useEffect, useState } from 'react'
import { BigNumber } from 'bignumber.js'
import {
  ApprovalState,
  useActiveWeb3React,
  useApproveCallback,
  useBloContract,
  useVestingContract,
} from '../../../hooks'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import Container from '../../../components/Container'
import BloModal from '../../../components/Blo'
import { useLingui } from '@lingui/react'
import QuestionHelper from '../../../components/QuestionHelper'
import Button from '../../../components/Button'
import { BLO_ADDRESS, BLO_VESTING } from '../../../constants/addresses'
import { useBloData } from '../../../features/blo/hooks'
import useBlo from '../../../features/blo/useBlo'
import { tryParseAmount } from '../../../functions/parse'
import { useToken } from '../../../hooks/Tokens'
import { useTokenBalance } from '../../../state/wallet/hooks'
import { ethers } from 'ethers'
import { getFtmPrice } from '../../../features/farm/hooks'
import { formatNumber } from '../../../functions'

/* eslint-disable */

const Staking: React.FC = () => {
  // This config is required for number formatting
  BigNumber.config({
    EXPONENTIAL_AT: 1000,
    DECIMAL_PLACES: 80,
  })

  const { account, chainId } = useActiveWeb3React()
  const { i18n } = useLingui()
  const bloContract = useBloContract(BLO_ADDRESS[chainId])
  const bloVestingContract = useVestingContract(BLO_VESTING[chainId])
  const [bloData] = useBloData(bloContract)
  const [claimAmount, setClaimAmount] = useState('0')
  const { buy } = useBlo()
  const [claimOpen, setClaimOpen] = useState(true)

  const [ftmPrice, setFtmPrice] = useState(null)
  useEffect(() => {
    getFtmPrice().then((result) => setFtmPrice(result))
    async function getClaimAmount() {
      const claimAmnt = await bloVestingContract?.hasClaim({ from: account })
      setClaimAmount(claimAmnt.toString())
    }
    if (account && bloVestingContract && claimOpen) {
      getClaimAmount()
    }
  }, [])

  const paymentToken = useToken(bloData?.paymentToken) // tu je payment token
  const paymentTokenBalance = useTokenBalance(account, paymentToken) // tu maš payment token balance
  const [depositValue, setDepositValue] = useState('') // sem not shrani deposit amount
  const typedDepositValue = tryParseAmount('999999999', paymentToken)
  const [pendingTx, setPendingTx] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)

  const [approvalState, approve] = useApproveCallback(typedDepositValue, BLO_ADDRESS[chainId]) // tu maš approval state
  const [hasStarted, setHasStarted] = useState(true)

  const glintPrice = parseFloat(ethers.utils.formatEther(bloData?.tokenPrice ? bloData?.tokenPrice : '0').toString())
  const totalRaised = parseFloat(ethers.utils.formatEther(bloData?.totalRaised ? bloData?.totalRaised : '0').toString())
  const totalGlintBought = totalRaised > 0 ? totalRaised / glintPrice : 0

  return (
    <div className="blo-container staking-container" style={{ marginTop: -33 }}>
      {showModal && (
        <BloModal
          isOpen={showModal}
          onDismiss={() => {
            setShowModal(!showModal)
          }}
          onClose={() => {
            setShowModal(!showModal)
          }}
          bloData={bloData}
          amount={paymentTokenBalance}
          approvalState={approvalState}
        />
      )}
      {showClaimModal && (
        <BloModal
          isOpen={showModal}
          onDismiss={() => {
            setShowClaimModal(!showClaimModal)
          }}
          onClose={() => {
            setShowClaimModal(!showClaimModal)
          }}
          bloData={bloData}
          amount={paymentTokenBalance}
          approvalState={approvalState}
        />
      )}
      <Container maxWidth="5xl" className="space-y-6">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
          <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />
          <div
            className="flex-col mt-8 mb-12 items-center mr-auto ml-auto justify-center bg-deepCove py-6 px-6"
            style={{ maxWidth: 650 }}
          >
            <Button
              color="gradient"
              className="w-1/5 absolute right right-0 bg-linear-gradient text-sm md:text-md text-white"
              style={{ height: 40, lineHeight: '13px', color: 'white', right: 26, width: 120, top: 6 }}
              disabled={false}
              onClick={() => {
                window.location.href = '/ftm'
              }}
            >
              Bridge FTM
            </Button>
            <div className="mt-6 mb-4 flex justify-center">
              <img src="/images/blo-fantom.svg" />
            </div>
            <div className="mb-4 text-white flex justify-center border w-full border-lightBlueSecondary p-2 font-bold px-6">
              Beamswap Liquidity Offering / BLO
            </div>
            <div className="flex-col bg-inputBlue">
              <div className="flex justify-between px-6 py-4">
                <div className="text-white text-xl">
                  {bloData?.buyOpen == 'true' ? 'Sale is now OPEN until Feb 11th 8 PM UTC' : 'Sale is now CLOSED'}
                </div>
                <div className="text-aqua mt-1">
                  <QuestionHelper
                    text={`You need to hold at least ${ethers.utils.formatEther(
                      bloData?.MIN_SHARE ? bloData?.MIN_SHARE : '0'
                    )} SHARE OR Stake at least ${ethers.utils.formatEther(
                      bloData?.MIN_LP ? bloData?.MIN_LP : '0'
                    )} LP in GLINT-GLMR Farm`}
                  />
                </div>
              </div>
            </div>
            <div className="flex-col bg-blue">
              <div className="flex justify-start px-3 py-4">
                <img src="/images/tokens/glint.png" width={48} height={48} style={{ maxHeight: 48 }} />
                <div className="flex flex-col justify-start ml-5">
                  <div className="text-sm text-aqua">Sold</div>
                  <div className="text-white text-xl">{formatNumber(totalGlintBought)} GLINT</div>
                  {/* <div className="text-jordyBlue text-sm">30% of total sale</div>*/}
                </div>
              </div>
            </div>
            <div className="flex justify-center w-full px-6 py-6 bg-inputBlue">
              {bloData?.eligibleToBuy == 'true' &&
                bloData?.buyOpen == 'true' &&
                approvalState == ApprovalState.APPROVED && (
                  <>
                    <Button
                      color="gradient"
                      className="w-full bg-linear-gradient text-sm md:text-md text-white"
                      style={{ height: 48, color: 'white' }}
                      disabled={bloData?.buyOpen == 'false'}
                      onClick={() => {
                        setShowModal(true)
                      }}
                    >
                      BUY
                    </Button>
                  </>
                )}
              {bloData?.eligibleToBuy == 'true' &&
                bloData?.buyOpen == 'true' &&
                approvalState == ApprovalState.NOT_APPROVED && (
                  <>
                    <Button
                      color="gradient"
                      className="w-full bg-linear-gradient text-sm md:text-md text-white"
                      style={{ height: 48, color: 'white' }}
                      disabled={false}
                      onClick={() => {
                        approve()
                      }}
                    >
                      APPROVE
                    </Button>
                  </>
                )}
              {bloData?.eligibleToBuy == 'true' &&
                bloData?.buyOpen == 'true' &&
                approvalState == ApprovalState.PENDING && (
                  <>
                    <Button
                      color="gradient"
                      className="w-full bg-linear-gradient text-sm md:text-md text-white"
                      style={{ height: 48, color: 'white' }}
                      disabled={true}
                      onClick={() => {
                        approve()
                      }}
                    >
                      APPROVING...
                    </Button>
                  </>
                )}
            </div>
            {bloData?.buyOpen == 'true' && (
              <div className="mb-4 text-white flex justify-center border w-full border-lightBlueSecondary p-2 font-bold px-6">
                {bloData?.eligibleToBuy == 'true' && 'You are ELIGIBLE to Buy'}
                {bloData?.eligibleToBuy == 'false' && 'You are NOT ELIGIBLE to Buy'}
                {bloData?.eligibleToBuy == 'false' && (
                  <QuestionHelper
                    text={`You need to hold at least ${ethers.utils.formatEther(
                      bloData?.MIN_SHARE
                    )} SHARE OR Stake at least ${ethers.utils.formatEther(bloData?.MIN_LP)} LP in GLINT-GLMR Farm`}
                  />
                )}
              </div>
            )}

            <div className="flex flex-col pb-6 pt-6">
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">Total committed</div>
                <div className="text-aqua text-right">
                  {ethers.utils.formatUnits(bloData?.totalRaised ? bloData?.totalRaised : '0')} FTM (
                  {(
                    (parseFloat(ethers.utils.formatUnits(bloData?.totalRaised ? bloData?.totalRaised : '0')) / 46728) *
                    100
                  ).toFixed(2)}
                  %)
                </div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">FTM to Raise</div>
                <div className="text-white text-right">46,728 FTM</div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">Price per GLINT</div>
                <div className="text-white text-right">
                  $
                  {(
                    parseFloat(ethers.utils.formatUnits(bloData?.tokenPrice ? bloData?.tokenPrice : '0')) * ftmPrice
                  ).toFixed(6)}
                </div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">FTM per GLINT</div>
                <div className="text-white text-right">
                  {parseFloat(ethers.utils.formatUnits(bloData?.tokenPrice ? bloData?.tokenPrice : '0'))} FTM
                </div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">Your contributed FTM</div>
                <div className="text-white text-right">
                  {parseFloat(
                    ethers.utils.formatUnits(bloData?.userInfo ? bloData?.userInfo?.buyAmount : '0', 18)
                  ).toFixed(3)}{' '}
                  FTM ($
                  {(
                    parseFloat(ethers.utils.formatUnits(bloData?.userInfo ? bloData?.userInfo?.buyAmount : '0', 18)) *
                    ftmPrice
                  ).toFixed(3)}
                  )
                </div>
              </div>
              {claimOpen == true && (
                <div className="flex-col bg-blue mt-5">
                  <div className="flex justify-start px-3 py-4 w-full">
                    <div className="flex flex-col justify-start mx-4 w-full">
                      <div className="text-sm text-aqua">Amount to claim</div>
                      <div className="text-white text-xl mb-3">
                        {ethers.utils.formatUnits(claimAmount ? claimAmount : '0')} GLINT
                      </div>

                      <>
                        <Button
                          color="gradient"
                          className="w-full bg-linear-gradient text-sm md:text-md text-white"
                          style={{ height: 48, color: 'white' }}
                          disabled={
                            pendingTx || parseFloat(ethers.utils.formatUnits(claimAmount ? claimAmount : '0')) == 0
                          }
                          onClick={async () => {
                            // setShowModal(true)
                            setPendingTx(true)
                            try {
                              const tx = await bloVestingContract.claim()
                              await tx.wait()
                            } catch (error) {
                              console.error(error)
                              setPendingTx(false)
                            }

                            setPendingTx(false)
                          }}
                        >
                          CLAIM
                        </Button>
                      </>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="flex justify-center pb-3 pt-3 mt-3">
                  <div className="text-aqua">FANTOM BIO</div>
                </div>
                <div className="mb-4 text-white flex justify-center border w-full border-lightBlueSecondary p-2 font-bold px-6">
                  <p style={{ textAlignLast: 'center' }}>
                    Fantom is a fast, high-throughput open-source smart contract platform for digital assets and dApps.
                  </p>
                </div>
                <div className="flex justify-center gap-3 bg-blue pb-7 pt-7">
                  <a href="https://twitter.com/FantomFDN" target={'_blank'}>
                    <img src="/images/blo-twitter.svg" width={36} height={36} />
                  </a>
                  <a href="https://fantom.foundation/" target={'_blank'}>
                    <img src="/images/blo-web.svg" width={36} height={36} />
                  </a>
                  <a href="https://t.me/fantom_english" target={'_blank'}>
                    <img src="/images/blo-telegram.svg" width={36} height={36} />
                  </a>
                  <a href="https://docs.fantom.foundation/" target={'_blank'}>
                    <img src="/images/blo-docs.svg" width={36} height={36} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </DoubleGlowShadow>
      </Container>
    </div>
  )
}

export default Staking
