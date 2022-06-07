import React, { useContext, useEffect, useState } from 'react'
import { BigNumber } from 'bignumber.js'
import {
  useActiveWeb3React,
  useBloContract,
  useVestingContract,
} from '../../../hooks'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import Container from '../../../components/Container'
import BloModal from '../../../components/BloBeans'
import { useLingui } from '@lingui/react'
import Button from '../../../components/Button'
import { BEANS_BLO_ADDRESS, GLINT_BEANS_BLO_VESTING, BEANS_BLO_VESTING } from '../../../constants/addresses'
import { useBeansBloData } from '../../../features/blo/hooks'
import { useETHBalances } from '../../../state/wallet/hooks'
import { ethers } from 'ethers'
import { getBeansPrice } from '../../../features/farm/hooks'
import { formatNumber } from '../../../functions'
import { PriceContext } from '../../../contexts/priceContext'

/* eslint-disable */

const Staking: React.FC = () => {
  // This config is required for number formatting
  BigNumber.config({
    EXPONENTIAL_AT: 1000,
    DECIMAL_PLACES: 80,
  })

  const { account, chainId } = useActiveWeb3React()
  const { i18n } = useLingui()
  const bloContract = useBloContract(BEANS_BLO_ADDRESS[chainId])
  const bloVestingContract = useVestingContract(GLINT_BEANS_BLO_VESTING[chainId])
  const bloBeansVestingContract = useVestingContract(BEANS_BLO_VESTING[chainId])
  const [bloData] = useBeansBloData(bloContract)
  const [claimAmount, setClaimAmount] = useState('0')
  const [claimAmountBeans, setBeansClaimAmount] = useState('0')
  const [claimOpen, setClaimOpen] = useState(true)
  const priceData = useContext(PriceContext)
  const glmrPrice = priceData?.['glmr']
  const [beansPrice, setBeansPrice] = useState(1)
  useEffect(() => {
    getBeansPrice().then((result) => setBeansPrice(result))
    async function getClaimAmount() {
      const claimAmnt = await bloVestingContract?.hasClaim({ from: account })
      const claimAmntBeans = await bloBeansVestingContract?.hasClaim({ from: account })
      setClaimAmount(claimAmnt.toString())
      setBeansClaimAmount(claimAmntBeans.toString())
    }
    if (account && bloVestingContract && claimOpen) {
      getClaimAmount()
    }
  }, [])

  const paymentTokenBalance = useETHBalances(account ? [account] : [])
  //const paymentTokenBalance = useCurrencyBalance(account, GLMR) // tu maš payment token balance
  const [depositValue, setDepositValue] = useState('') // sem not shrani deposit amount
  const [pendingTx, setPendingTx] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)

  //const [approvalState, approve] = useApproveCallback(typedDepositValue, BEANS_BLO_ADDRESS[chainId]) // tu maš approval state
  const [hasStarted, setHasStarted] = useState(true)

  const glintPrice = parseFloat(ethers.utils.formatEther(bloData?.tokenPrice ? bloData?.tokenPrice : '0').toString())
  const totalRaised = parseFloat(ethers.utils.formatEther(bloData?.totalRaised ? bloData?.totalRaised : '0').toString())
  const totalGlintBought = totalRaised > 0 ? totalRaised / glintPrice : 0
  const totalBeansBought = totalRaised > 0 ? (totalRaised * glmrPrice * 0.15) / 1.6 : 0

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
          amount={paymentTokenBalance[account]}
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
          amount={paymentTokenBalance[account]}
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
            <div className="mt-6 mb-4 flex justify-center">
              <img src="/images/blo-moonbeans.png" width={100} height={100} />
            </div>
            <div className="mb-4 text-white flex justify-center border w-full border-lightBlueSecondary p-2 font-bold px-6">
              Beamswap Liquidity Offering / BLO
            </div>
            <div className="flex-col bg-inputBlue">
              <div className="flex justify-between px-6 py-4">
                <div className="text-white text-xl">
                  {bloData?.buyOpen == 'true' ? 'Sale is now OPEN until Mar 11th 8 PM UTC' : 'Sale is now CLOSED'}
                </div>
                <div className="text-aqua mt-1">
                  {/* <QuestionHelper
                    text={`You need to hold at least ${ethers.utils.formatEther(
                      bloData?.MIN_SHARE ? bloData?.MIN_SHARE : '0'
                    )} SHARE OR Stake at least ${ethers.utils.formatEther(
                      bloData?.MIN_LP ? bloData?.MIN_LP : '0'
                    )} LP in GLINT-GLMR Farm`}
                    />*/}
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
              <div className="flex justify-start px-3 py-4">
                <img src="/images/blo-moonbeans.png" width={48} height={48} style={{ maxHeight: 48 }} />
                <div className="flex flex-col justify-start ml-5">
                  <div className="text-sm text-aqua">Sold</div>
                  <div className="text-white text-xl">{formatNumber(totalBeansBought)} Beans</div>
                  {/* <div className="text-jordyBlue text-sm">30% of total sale</div>*/}
                </div>
              </div>
            </div>
            <div className="flex justify-center w-full px-6 py-6 bg-inputBlue">
              {bloData?.buyOpen == 'true' && (
                <>
                  <Button
                    color="gradient"
                    className="w-full bg-linear-gradient text-sm md:text-md text-white"
                    style={{ height: 48, color: 'white' }}
                    disabled={bloData?.buyOpen == 'false' || totalRaised >= 19607}
                    onClick={() => {
                      setShowModal(true)
                    }}
                  >
                    BUY
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-col pb-6 pt-6">
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">Total committed</div>
                <div className="text-aqua text-right">
                  {formatNumber(ethers.utils.formatUnits(bloData?.totalRaised ? bloData?.totalRaised : '0'))} GLMR (
                  {(
                    (parseFloat(ethers.utils.formatUnits(bloData?.totalRaised ? bloData?.totalRaised : '0')) / 19607) *
                    100
                  ).toFixed(2)}
                  %)
                </div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">GLMR to Raise</div>
                <div className="text-white text-right">19,607 GLMR</div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">Price per GLINT</div>
                <div className="text-white text-right">
                  $
                  {(
                    parseFloat(ethers.utils.formatUnits(bloData?.tokenPrice ? bloData?.tokenPrice : '0')) * glmrPrice
                  ).toFixed(6)}
                </div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">GLMR per GLINT</div>
                <div className="text-white text-right">
                  {parseFloat(ethers.utils.formatUnits(bloData?.tokenPrice ? bloData?.tokenPrice : '0'))} GLMR
                </div>
              </div>
              <div className="flex justify-between pb-3 pt-3" style={{ borderBottom: '2px solid #1F357D' }}>
                <div className="text-jordyBlue">Your contributed GLMR</div>
                <div className="text-white text-right">
                  {parseFloat(
                    ethers.utils.formatUnits(bloData?.userInfo ? bloData?.userInfo?.buyAmount : '0', 18)
                  ).toFixed(3)}{' '}
                  GLMR ($
                  {(
                    parseFloat(ethers.utils.formatUnits(bloData?.userInfo ? bloData?.userInfo?.buyAmount : '0', 18)) *
                    glmrPrice
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
                        <div>{formatNumber(ethers.utils.formatUnits(claimAmount ? claimAmount : '0'))} GLINT</div>
                        <div>
                          {formatNumber(ethers.utils.formatUnits(claimAmountBeans ? claimAmountBeans : '0'))} BEANS
                        </div>
                      </div>

                      <>
                        <Button
                          color="gradient"
                          className="w-full bg-linear-gradient text-sm md:text-md text-white"
                          style={{ height: 48, color: 'white' }}
                          disabled={
                            pendingTx ||
                            parseFloat(ethers.utils.formatUnits(claimAmount ? claimAmount : '0')) +
                              parseFloat(ethers.utils.formatUnits(claimAmountBeans ? claimAmountBeans : '0')) ==
                              0
                          }
                          onClick={async () => {
                            // setShowModal(true)
                            setPendingTx(true)
                            try {
                              if (parseFloat(ethers.utils.formatUnits(claimAmount ? claimAmount : '0')) > 0) {
                                const tx = await bloVestingContract.claim()
                                await tx.wait()
                              }

                              if (parseFloat(ethers.utils.formatUnits(claimAmountBeans ? claimAmountBeans : '0')) > 0) {
                                const tx = await bloBeansVestingContract.claim({ gasLimit: 900000 })
                                await tx.wait()
                              }
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
                  <div className="text-aqua">MOONBEANS BIO</div>
                </div>
                <div className="mb-4 text-white flex justify-center border w-full border-lightBlueSecondary p-2 font-bold px-6">
                  <p style={{ textAlignLast: 'center' }}>
                    MoonBeans powers an NFT trading platform called MoonBeans Galactic Trading Co., which provides the
                    highest profit-sharing rewards currently available on the market.
                  </p>
                </div>
                <div className="flex justify-center gap-3 bg-blue pb-7 pt-7">
                  <a href="https://twitter.com/moonbeansio" target={'_blank'}>
                    <img src="/images/blo-twitter.svg" width={36} height={36} />
                  </a>
                  <a href="https://moonbeans.io/#/" target={'_blank'}>
                    <img src="/images/blo-web.svg" width={36} height={36} />
                  </a>
                  <a href="https://t.me/moonbeansio" target={'_blank'}>
                    <img src="/images/blo-telegram.svg" width={36} height={36} />
                  </a>
                  <a href="https://docs.moonbeans.io/beanie-basics/introduction" target={'_blank'}>
                    <img src="/images/blo-docs.svg" width={36} height={36} />
                  </a>
                </div>
              </div>
              <div className="flex justify-center gap-3 bg-blue pb-4 pt-4">
                <div className="text-aqua">
                  <a
                    href="https://app.beamswap.io/exchange/swap?inputCurrency=0x65b09ef8c5a096c5fd3a80f1f7369e56eb932412&outputCurrency=0xacc15dc74880c9944775448304b263d191c6077f"
                    target="_blank"
                  >
                    Trade
                  </a>
                </div>
                <div className="text-aqua">
                  <a
                    href="https://app.beamswap.io/zap?poolAddress=0x32b710DBF797C1B16498B0fCd83929Bb19897529&currencyId=GLMR"
                    target="_blank"
                  >
                    Zap
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
