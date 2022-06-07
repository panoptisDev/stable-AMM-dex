import React, { useContext, useEffect, useState } from 'react'
import { BigNumber } from 'bignumber.js'
import {
  ApprovalState,
  useActiveWeb3React,
  useApproveCallback,
  useBeamShareContract,
  useBloContract,
  useGlintContract,
  useVestingContract,
} from '../../hooks'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import Container from '../../components/Container'
import BloModal from '../../components/Blo'
import { useLingui } from '@lingui/react'
import QuestionHelper from '../../components/QuestionHelper'
import Button from '../../components/Button'
import { useWeb3React } from '@web3-react/core'
import { BLO_ADDRESS, BLO_VESTING, BEANS_BLO_ADDRESS } from '../../constants/addresses'
import { Token } from '../../sdk'
import { useBeansBloData, useBloData } from '../../features/blo/hooks'
import useBlo from '../../features/blo/useBlo'
import { tryParseAmount } from '../../functions/parse'
import { useToken } from '../../hooks/Tokens'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ethers } from 'ethers'
import { getBeansPrice, getFtmPrice, usePricesApi } from '../../features/farm/hooks'
import { formatNumber } from '../../functions'
import { PriceContext } from '../../contexts/priceContext'
import Head from 'next/head'

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
  const beansBloContract = useBloContract(BEANS_BLO_ADDRESS[chainId])
  const bloVestingContract = useVestingContract(BLO_VESTING[chainId])
  const [bloData] = useBloData(bloContract)
  const [beansBloData] = useBeansBloData(beansBloContract)
  const [claimAmount, setClaimAmount] = useState('0')
  const { buy } = useBlo()
  const [claimOpen, setClaimOpen] = useState(true)

  const [ftmPrice, setFtmPrice] = useState(null)
  useEffect(() => {
    getFtmPrice().then((result) => setFtmPrice(result))
    getBeansPrice().then((result) => setBeansPrice(result))
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
  const priceData = useContext(PriceContext)
  const glmrPrice = priceData?.['glmr']
  const [beansPrice, setBeansPrice] = useState(1)
  const [showClaimModal, setShowClaimModal] = useState(false)

  const [approvalState, approve] = useApproveCallback(typedDepositValue, BLO_ADDRESS[chainId]) // tu maš approval state
  const [hasStarted, setHasStarted] = useState(true)

  const glintPrice = parseFloat(ethers.utils.formatEther(bloData?.tokenPrice ? bloData?.tokenPrice : '0').toString())
  const totalRaised = parseFloat(ethers.utils.formatEther(bloData?.totalRaised ? bloData?.totalRaised : '0').toString())
  const totalGlintBought = totalRaised > 0 ? totalRaised / glintPrice : 0

  const glintPricebeans = parseFloat(
    ethers.utils.formatEther(beansBloData?.tokenPrice ? beansBloData?.tokenPrice : '0').toString()
  )
  const totalRaisedbeans = parseFloat(
    ethers.utils.formatEther(beansBloData?.totalRaised ? beansBloData?.totalRaised : '0').toString()
  )

  const totalGlintBoughtBeans = totalRaisedbeans > 0 ? totalRaisedbeans / glintPricebeans : 0
  const totalBeansBought = totalRaisedbeans > 0 ? (totalRaisedbeans * glmrPrice * 0.15) / 1.6 : 0

  return (
    <>
      <Head>
        <title>Beamswap | BLO</title>
        <meta
          key="description"
          name="description"
          content="Beamswap BLO aims to solve liquidity issues of bridged assets on the Moonbeam Network. This means more traffic, better buying conditions, and ultimately better price for everyone."
        />
      </Head>
      <div className="space-y-6 container">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <div className="flex mt-8 mb-12 items-center mr-auto ml-auto justify-center bg-deepCove py-6 px-6 w-full text-white text-xl">
            Beamswap Liquidity Offerings
          </div>
          <div className="flex-col">
            <div
              className="flex-col p-7 mt-8 w-full md:w-2/5 bg-deepCove mr-auto ml-auto"
              style={{ border: '2px solid #00FFFF' }}
            >
              <div className="flex justify-between mt-5">
                <div className="flex justify-center gap-3 items-center">
                  <img className="rounded" src="/images/blo-moonbeans.png" width={45} height={45} />
                  <span className="text-xl text-white">Moonbeans</span>
                </div>
                <Button
                  color="gradient"
                  className="bg-linear-gradient text-sm md:text-md text-white"
                  style={{ height: 40, lineHeight: '13px', color: 'white', width: 120 }}
                  disabled={false}
                  onClick={() => {
                    window.location.href = '/blo/beans'
                  }}
                >
                  Claim
                </Button>
              </div>

              <div className="mt-10 bg-lightBlueSecondary flex justify-between p-3 rounded-md">
                <div className="text-white">Total committed</div>
                <div className="text-aqua text-right">
                  {formatNumber(ethers.utils.formatUnits(beansBloData?.totalRaised ? beansBloData?.totalRaised : '0'))}{' '}
                  GLMR (
                  {(
                    (parseFloat(ethers.utils.formatUnits(beansBloData?.totalRaised ? beansBloData?.totalRaised : '0')) /
                      19607) *
                    100
                  ).toFixed(2)}
                  %)
                </div>
              </div>

              <div className="mt-3 bg-lightBlueSecondary flex justify-between p-3 rounded-md">
                <div className="text-white">GLMR to Raise</div>
                <div className="text-white">19,607 GLMR</div>
              </div>

              <div className="flex-col md:flex md:flex-row justify-between mt-4 items-center mb-6">
                <div className="mt-3 bg-lightBlueSecondary flex justify-between items-center p-3 rounded-md">
                  <div className="text-white mr-2">Sold:</div>
                  <div className="text-white flex-col gap-1">
                    <div className="text-white flex gap-1">
                      <span className="text-aqua">{formatNumber(totalBeansBought)}</span>{' '}
                      <img src="/images/blo-moonbeans.png" width={25} height={25} style={{ maxHeight: 25 }} /> Beans{' '}
                    </div>
                    <div className="text-white flex gap-1 mt-2">
                      <span className="text-aqua">{formatNumber(totalGlintBoughtBeans)}</span>{' '}
                      <img src="/images/tokens/glint.png" width={25} height={25} style={{ maxHeight: 25 }} /> GLINT{' '}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-3 mt-4 mb:mt-0">
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
            </div>
            <div className="flex-col p-7 mt-8 w-full md:w-2/5 bg-deepCove mr-auto ml-auto">
              <div className="flex justify-between mt-5 items-center">
                <div className="flex justify-center gap-3 items-center">
                  <img className="rounded" src="/images/tokens/ftm.png" width={45} height={45} />
                  <span className="text-xl text-white">Fantom</span>
                </div>
                <Button
                  color="gradient"
                  className="bg-linear-gradient text-sm md:text-md text-white"
                  style={{ height: 40, lineHeight: '13px', color: 'white', width: 120 }}
                  disabled={false}
                  onClick={() => {
                    window.location.href = '/blo/ftm'
                  }}
                >
                  Claim
                </Button>
              </div>

              <div className="mt-10 bg-lightBlueSecondary flex justify-between p-3 rounded-md">
                <div className="text-white">Total committed</div>
                <div className="text-aqua text-right">
                  {ethers.utils.formatUnits(bloData?.totalRaised ? bloData?.totalRaised : '0')} FTM (
                  {(
                    (parseFloat(ethers.utils.formatUnits(bloData?.totalRaised ? bloData?.totalRaised : '0')) / 46728) *
                    100
                  ).toFixed(2)}
                  %)
                </div>
              </div>

              <div className="mt-3 bg-lightBlueSecondary flex justify-between p-3 rounded-md">
                <div className="text-white">FTM to Raise</div>
                <div className="text-white">46,728 FTM</div>
              </div>

              <div className="flex-col md:flex md:flex-row justify-between mt-4 items-center mb-6">
                <div className="mt-3 bg-lightBlueSecondary flex justify-between p-3 rounded-md">
                  <div className="text-white mr-2">Sold:</div>
                  <div className="text-white flex gap-1">
                    <span className="text-aqua">{formatNumber(totalGlintBought)}</span>{' '}
                    <img src="/images/tokens/glint.png" width={25} height={25} style={{ maxHeight: 25 }} /> GLINT{' '}
                  </div>
                </div>
                <div className="flex justify-center gap-3 mt-4 mb:mt-0">
                  <a href="https://twitter.com/FantomFDN" target={'_blank'}>
                    <img src="/images/blo-twitter.svg" width={25} height={25} />
                  </a>
                  <a href="https://fantom.foundation/" target={'_blank'}>
                    <img src="/images/blo-web.svg" width={25} height={25} />
                  </a>
                  <a href="https://t.me/fantom_english" target={'_blank'}>
                    <img src="/images/blo-telegram.svg" width={25} height={25} />
                  </a>
                  <a href="https://docs.fantom.foundation/" target={'_blank'}>
                    <img src="/images/blo-docs.svg" width={25} height={25} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </DoubleGlowShadow>
      </div>
    </>
  )
}

export default Staking
