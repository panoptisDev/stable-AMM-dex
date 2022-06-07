import React, { useCallback, useEffect, useState } from 'react'
import { BigNumber } from 'bignumber.js'
import useVesting from '../../features/vesting/hooks'
import { useActiveWeb3React } from '../../hooks'
import Container from '../../components/Container'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import { ethers } from 'ethers'
import { formatNumber, formatNumberScale } from '../../functions'
import Button from '../../components/Button'
import { useVestingContract } from '../../hooks/'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { SEED_VESTING, P1_VESTING, P2_VESTING, IDO_VESTING } from '../../constants/addresses'
import Head from 'next/head'

interface ClaimData {
  seedClaimAmount: number
  p1ClaimAmount: number
  p2ClaimAmount: number
  idoClaimAmount: number
}

export default function Vesting() {
  const { account } = useActiveWeb3React()

  const [pendingTx, setPendingTx] = useState(false)

  const seedContract = useVestingContract(SEED_VESTING, true)
  const p1Contract = useVestingContract(P1_VESTING, true)
  const p2Contract = useVestingContract(P2_VESTING, true)
  const idoContract = useVestingContract(IDO_VESTING, true)

  const addTransaction = useTransactionAdder()

  const amounts: ClaimData = useVesting(account)
  let parsedAmounts = {
    seedClaimAmount: '',
    p1ClaimAmount: '',
    p2ClaimAmount: '',
    idoClaimAmount: '',
  }

  if (amounts.seedClaimAmount) {
    parsedAmounts.seedClaimAmount = ethers.utils.formatUnits(amounts.seedClaimAmount, 18)
    parsedAmounts.p1ClaimAmount = ethers.utils.formatUnits(amounts.p1ClaimAmount, 18)
    parsedAmounts.p2ClaimAmount = ethers.utils.formatUnits(amounts.p2ClaimAmount, 18)
    parsedAmounts.idoClaimAmount = ethers.utils.formatUnits(amounts.idoClaimAmount, 18)
  }

  let unlockedAmounts = {
    seedClaimAmount: '',
    p1ClaimAmount: '',
    p2ClaimAmount: '',
    idoClaimAmount: '',
  }

  let TGE = new Date(2022, 0, 1)
  let TODAY = new Date()
  var DAYS_SINCE_TGE = (TODAY.valueOf() - TGE.valueOf()) / (1000 * 3600 * 24)

  /*seedUnlockedAmount()
  p1UnlockedAmount()
  p2UnlockedAmount()
  idoUnlockedAmount()*/

  function seedUnlockedAmount() {
    // 5% TGE UNLOCK
    if (DAYS_SINCE_TGE > 0 && DAYS_SINCE_TGE < 30) {
      unlockedAmounts.seedClaimAmount = formatNumber(6000000) // 5% of SEED on TGE
    } else if (DAYS_SINCE_TGE >= 30 && DAYS_SINCE_TGE <= 365) {
      // during vesting time
      let unlockedAmount = 6000000 + (DAYS_SINCE_TGE - 29) * 312328.77
      unlockedAmounts.seedClaimAmount = formatNumber(unlockedAmount)
    } else if (DAYS_SINCE_TGE > 365) {
      unlockedAmounts.seedClaimAmount = formatNumber(120000000) // full amount
    }
  }

  function p1UnlockedAmount() {
    // 7.5% TGE UNLOCK
    if (DAYS_SINCE_TGE > 0 && DAYS_SINCE_TGE < 30) {
      unlockedAmounts.p1ClaimAmount = formatNumber(12375000) // 7.5% of P1 on TGE
    } else if (DAYS_SINCE_TGE >= 30 && DAYS_SINCE_TGE <= 365) {
      // during vesting time
      let unlockedAmount = 12375000 + (DAYS_SINCE_TGE - 29) * 418150.68
      unlockedAmounts.p1ClaimAmount = formatNumber(unlockedAmount)
    } else if (DAYS_SINCE_TGE > 365) {
      unlockedAmounts.p1ClaimAmount = formatNumber(165000000) // full amount
    }
  }

  function p2UnlockedAmount() {
    // 10% TGE UNLOCK
    if (DAYS_SINCE_TGE > 0 && DAYS_SINCE_TGE < 30) {
      unlockedAmounts.p2ClaimAmount = formatNumber(14750000) //10% of P2 on TGE
    } else if (DAYS_SINCE_TGE >= 30 && DAYS_SINCE_TGE <= 365) {
      // during vesting time
      let unlockedAmount = 14750000 + (DAYS_SINCE_TGE - 29) * 363698.63
      unlockedAmounts.p2ClaimAmount = formatNumber(unlockedAmount)
    } else if (DAYS_SINCE_TGE > 60) {
      unlockedAmounts.p2ClaimAmount = formatNumber(147500000) // full unlock
    }
  }

  function idoUnlockedAmount() {
    // 50% TGE UNLOCK
    if (DAYS_SINCE_TGE > 0 && DAYS_SINCE_TGE < 30) {
      unlockedAmounts.idoClaimAmount = formatNumber(5250000) // 50% of IDO allocation on TGE
    } else if (DAYS_SINCE_TGE >= 30 && DAYS_SINCE_TGE <= 90) {
      // during vesting time
      let unlockedAmount = 5250000 + (DAYS_SINCE_TGE - 29) * 204166.67
      unlockedAmounts.idoClaimAmount = formatNumber(unlockedAmount)
    } else if (DAYS_SINCE_TGE > 90) {
      // after vesting finished, all is unlocked
      unlockedAmounts.idoClaimAmount = formatNumber(17500000)
    }
  }

  return (
    <>
      <Head>
        <title>Beamswap | Vesting</title>
        <meta key="description" name="description" content="Claim your $GLINT tokens from our sale." />
      </Head>
      <Container className="space-y-6 vesting-container">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <div className="flex-col md:flex-row md:flex justify-center gap-8 mt-10 md:mt-0">
            <div
              className="flex-col md:w-1/4 bg-darkBlue mb-8 pb-2 md:mb-0 md:pb-0 mr-3 ml-3 md:mr-0 md:ml-0 border border-aqua md:border-none bg-linear-gradient-border"
              style={{ borderWidth: 5 }}
            >
              <div className="text-center p-6 text-lg text-white">Seed Vesting</div>
              <div className="flex justify-between bg-deepCove p-6">
                <div className="text-sm text-white">0x7618..8d40</div>
                <div className="flex text-aqua">
                  <img className="mr-1" src="/images/vesting-verified.svg" width="20px" height="20px" />
                  <div>Verified</div>
                </div>
              </div>
              {/* <div className="m-6 p-3 flex justify-between mb-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Allocated Token
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">120,000,000</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>
              <div className="m-6 p-3 flex justify-between mb-2 mt-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Unlocked now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{unlockedAmounts.seedClaimAmount}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div> */}
              <div
                className="m-6 p-3 flex justify-between mb-2 mt-2 bg-deepCove"
                style={{ border: '2px solid #00FFFF' }}
              >
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Claimable Now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{parsedAmounts ? parsedAmounts.seedClaimAmount : 0}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>

              <Button
                className="button bg-linear-gradient text-center mt-6 mb-6 opacity-80 hover:opacity-100 cursor-pointer mr-6 ml-6 text-white"
                size="sm"
                variant="outlined"
                color="white"
                style={{ width: '-webkit-fill-available' }}
                //  disabled={amounts.seedClaimAmount > 0 ? false : true}
                onClick={async () => {
                  setPendingTx(true)
                  try {
                    const tx = await seedContract.claim({ from: account })

                    addTransaction(tx, {
                      summary: `Vesting claimed`,
                    })
                  } catch (error) {
                    console.error(error)
                  }

                  setPendingTx(false)
                }}
              >
                {amounts.seedClaimAmount == 0 ? "Force Claim" : "Claim"}
              </Button>
            </div>

            <div
              className="flex-col md:w-1/4 bg-darkBlue mb-8 pb-2 md:mb-0 md:pb-0 mr-3 ml-3 md:mr-0 md:ml-0 border border-aqua md:border-none bg-linear-gradient-border"
              style={{ borderWidth: 5 }}
            >
              <div className="text-center p-6 text-lg text-white">Private 1 Vesting</div>
              <div className="flex justify-between bg-deepCove p-6">
                <div className="text-sm text-white">0x1726..60dc</div>
                <div className="flex text-aqua">
                  <img className="mr-1" src="/images/vesting-verified.svg" width="20px" height="20px" />
                  <div>Verified</div>
                </div>
              </div>
              {/* <div className="m-6 p-3 flex justify-between mb-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Allocated Token
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">165,000,000</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>
              <div className="m-6 p-3 flex justify-between mb-2 mt-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Unlocked now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{unlockedAmounts.p1ClaimAmount}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div> */}
              <div
                className="m-6 p-3 flex justify-between mb-2 mt-2 bg-deepCove"
                style={{ border: '2px solid #00FFFF' }}
              >
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Claimable Now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{parsedAmounts ? parsedAmounts.p1ClaimAmount : 0}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>

              <Button
                className="button bg-linear-gradient text-center mt-6 mb-6 opacity-80 hover:opacity-100 cursor-pointer mr-6 ml-6 text-white"
                size="sm"
                variant="outlined"
                color="white"
                style={{ width: '-webkit-fill-available' }}
                //  disabled={amounts.p1ClaimAmount > 0 ? false : true}
                onClick={async () => {
                  setPendingTx(true)
                  try {
                    const tx = await p1Contract.claim({ from: account })

                    addTransaction(tx, {
                      summary: `Vesting claimed`,
                    })
                  } catch (error) {
                    console.error(error)
                  }

                  setPendingTx(false)
                }}
              >
                {amounts.p1ClaimAmount == 0 ? "Force Claim" : "Claim"}
              </Button>
            </div>

            <div
              className="flex-col md:w-1/4 bg-darkBlue mb-8 pb-2 md:mb-0 md:pb-0 mr-3 ml-3 md:mr-0 md:ml-0 border border-aqua md:border-none bg-linear-gradient-border"
              style={{ borderWidth: 5 }}
            >
              <div className="text-center p-6 text-lg text-white">Private 2 Vesting</div>
              <div className="flex justify-between bg-deepCove p-6">
                <div className="text-sm text-white">0x0BD8..4c98</div>
                <div className="flex text-aqua">
                  <img className="mr-1" src="/images/vesting-verified.svg" width="20px" height="20px" />
                  <div>Verified</div>
                </div>
              </div>
              {/* <div className="m-6 p-3 flex justify-between mb-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Allocated Token
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">156,000,000</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>
              <div className="m-6 p-3 flex justify-between mb-2 mt-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Unlocked now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{unlockedAmounts.p2ClaimAmount}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div> */}
              <div
                className="m-6 p-3 flex justify-between mb-2 mt-2 bg-deepCove"
                style={{ border: '2px solid #00FFFF' }}
              >
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Claimable Now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{parsedAmounts ? parsedAmounts.p2ClaimAmount : 0}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>

              <Button
                className="button bg-linear-gradient text-center mt-6 mb-6 opacity-80 hover:opacity-100 cursor-pointer mr-6 ml-6 text-white"
                size="sm"
                variant="outlined"
                color="white"
                style={{ width: '-webkit-fill-available' }}
                // disabled={amounts.p2ClaimAmount > 0 ? false : true}
                onClick={async () => {
                  setPendingTx(true)
                  try {
                    const tx = await p2Contract.claim({ from: account })

                    addTransaction(tx, {
                      summary: `Vesting claimed`,
                    })
                  } catch (error) {
                    console.error(error)
                  }

                  setPendingTx(false)
                }}
              >
                {amounts.p2ClaimAmount == 0 ? "Force Claim" : "Claim"}
              </Button>
            </div>

            <div
              className="flex-col md:w-1/4 bg-darkBlue mb-8 pb-2 md:mb-0 md:pb-0 mr-3 ml-3 md:mr-0 md:ml-0 border border-aqua md:border-none bg-linear-gradient-border"
              style={{ borderWidth: 5 }}
            >
              <div className="text-center p-6 text-lg text-white">IDO</div>
              <div className="flex justify-between bg-deepCove p-6">
                <div className="text-sm text-white">0x154e..9b4c</div>
                <div className="flex text-aqua">
                  <img className="mr-1" src="/images/vesting-verified.svg" width="20px" height="20px" />
                  <div>Verified</div>
                </div>
              </div>
              {/* <div className="m-6 p-3 flex justify-between mb-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Allocated Token
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">9,000,000</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>
              <div className="m-6 p-3 flex justify-between mb-2 mt-2" style={{ border: '2px solid #142970' }}>
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Unlocked now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{unlockedAmounts.idoClaimAmount}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div> */}
              <div
                className="m-6 p-3 flex justify-between mb-2 mt-2 bg-deepCove"
                style={{ border: '2px solid #00FFFF' }}
              >
                <div className="text-aqua text-sm" style={{ fontSize: 12, lineHeight: '23px' }}>
                  Claimable Now
                </div>
                <div className="flex">
                  <div className="text-white text-sm mr-1">{parsedAmounts ? parsedAmounts.idoClaimAmount : 0}</div>
                  <img src="/images/tokens/glint.png" style={{ maxHeight: '18px', maxWidth: '18px', marginTop: 2 }} />
                </div>
              </div>

              <Button
                className="button bg-linear-gradient text-center mt-6 mb-6 opacity-80 hover:opacity-100 cursor-pointer mr-6 ml-6 text-white"
                size="sm"
                variant="outlined"
                color="white"
                style={{ width: '-webkit-fill-available' }}
                // disabled={amounts.idoClaimAmount > 0 ? false : true}
                onClick={async () => {
                  setPendingTx(true)
                  try {
                    const tx = await idoContract.claim({ from: account })

                    addTransaction(tx, {
                      summary: `Vesting claimed`,
                    })
                  } catch (error) {
                    console.error(error)
                  }

                  setPendingTx(false)
                }}
              >
                {amounts.idoClaimAmount == 0 ? "Force Claim" : "Claim"}
              </Button>
            </div>
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
