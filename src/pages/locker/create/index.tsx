/* eslint-disable @next/next/link-passhref */
import { ApprovalState, useActiveWeb3React, useApproveCallback } from '../../../hooks'

import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'
import { classNames, formatNumberScale, tryParseAmount } from '../../../functions'
import { useRouter } from 'next/router'
import Card from '../../../components/Card'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import { LOCKER_ADDRESS } from '../../../constants'
import { useTransactionAdder } from '../../../state/transactions/hooks'
import Button, { ButtonConfirmed, ButtonError } from '../../../components/Button'
import NumericalInput from '../../../components/NumericalInput'
import { AutoRow, RowBetween } from '../../../components/Row'
import { isAddress } from '@ethersproject/address'
import { useCurrency } from '../../../hooks/Tokens'
import { useCurrencyBalance } from '../../../state/wallet/hooks'
import Loader from '../../../components/Loader'
import Web3Connect from '../../../components/Web3Connect'
import Datetime from 'react-datetime'
import * as moment from 'moment'
import useLocker from '../../../features/locker/useLocker'
import { ethers } from 'ethers'
import { useAddPopup } from '../../../state/application/hooks'

export default function CreateLocker(): JSX.Element {
  const { i18n } = useLingui()
  const { chainId, account } = useActiveWeb3React()
  const [tokenAddress, setTokenAddress] = useState('')
  const [withdrawer, setWithdrawer] = useState('')
  const [value, setValue] = useState('')
  const [unlockDate, setUnlockDate] = useState(moment.default())
  const [pendingTx, setPendingTx] = useState(false)

  const assetToken = useCurrency(tokenAddress) || undefined

  const typedDepositValue = tryParseAmount(value, assetToken)

  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, assetToken ?? undefined)

  const [approvalState, approve] = useApproveCallback(typedDepositValue, LOCKER_ADDRESS[chainId])

  const lockerContract = useLocker()
  const addPopup = useAddPopup()

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const errorMessage = !isAddress(tokenAddress)
    ? 'Invalid token'
    : !isAddress(withdrawer)
    ? 'Invalid withdrawer'
    : isNaN(parseFloat(value)) || parseFloat(value) == 0
    ? 'Invalid amount'
    : moment.isDate(unlockDate) || moment.default(unlockDate).isBefore(new Date())
    ? 'Invalid unlock date'
    : ''

  const allInfoSubmitted = errorMessage == ''

  const handleApprove = useCallback(async () => {
    await approve()
  }, [approve])

  const handleLock = useCallback(async () => {
    if (allInfoSubmitted) {
      setPendingTx(true)

      try {
        const tx = await lockerContract.lockTokens(
          tokenAddress,
          withdrawer,
          value.toBigNumber(assetToken?.decimals),
          moment.default(unlockDate).unix().toString()
        )

        if (tx.wait) {
          const result = await tx.wait()

          const [_withdrawer, _amount, _id] = ethers.utils.defaultAbiCoder.decode(
            ['address', 'uint256', 'uint256'],
            result.events[2].data
          )

          addPopup({
            txn: { hash: result.transactionHash, summary: `Successfully created lock [${_id}]`, success: true },
          })

          setTokenAddress('')
          setWithdrawer('')
          setValue('')
          setUnlockDate(moment.default())
        } else {
          throw 'User denied transaction signature.'
        }
      } catch (err) {
        addPopup({
          txn: { hash: undefined, summary: `Failed to create lock: ${err}`, success: false },
        })
      } finally {
        setPendingTx(false)
      }
    }
  }, [allInfoSubmitted, addPopup, assetToken, tokenAddress, withdrawer, value, unlockDate, lockerContract])

  var valid = function (current) {
    return current.isAfter(moment.default(unlockDate).subtract(1, 'day'))
  }

  return (
    <>
      <Head>
        <title>Locker | Beamswap</title>
        <meta key="description" name="description" content="Beamswap Locker" />
      </Head>

      <div className="container px-0 mx-auto pb-6 z-8 locker-container max-w-6xl mb-8">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <div className={`grid grid-cols-12 gap-2 min-h-1/2`}>
            {/* <div className="locker-nav create">
              <div className="primary">
                <a href="/locker">Search lockers</a>
              </div>
              <div className="secondary">
                <a href="/locker/create">Create lock</a>
              </div>
            </div> */}
            <div className={`col-span-12`} style={{ minHeight: '30rem' }}>
              <Card className="pb-6 bg-blue z-4" style={{ borderRadius: 2 }}>
                <div className="p-5 px-1 md:px-5 ml-3 mr-3 flex-col md:flex-row md:flex justify-between items-center">
                  <div className="flex items-center">
                    <img className="mb-4 md:mb-0" src="/images/locker-icon.svg" width={20} height={20} />
                    <div className="text-lg text-white font-lg font-bold ml-4 md:text-xl text-xl mb-4 md:mb-0">
                      Beamswap Locker
                    </div>
                  </div>
                  <div
                    className="bg-inputBlue p-3 cursor-pointer hover:text-aqua text-white rounded-sm w-auto"
                    style={{ width: 'fit-content' }}
                  >
                    <a href="/locker">Search</a>
                  </div>
                </div>
                <div className={`grid grid-cols-12 gap-4 m-1 md:m-8`}>
                  <div
                    className={`col-span-12 md:col-span-8 bg-blue px-0 md:px-6 py-4 rounded-md-md bg-darkBlue`}
                    style={{ border: '2px solid rgb(31, 53, 125)' }}
                  >
                    <div className={'px-4 py-2 rounded-md '}>
                      <div className="flex flex-col justify-between space-y-3 sm:space-y-0 ">
                        <div
                          className={'flex items-center w-full space-x-3 rounded-sm bg-inputBlue focus:bg-dark-700'}
                          style={{ border: '2px solid #1F357D' }}
                        >
                          <div className="bg-lightBlueSecondary w-1/3 p-3 text-white text-center text-xxs md:text-sm">
                            Token Address
                          </div>
                          <input
                            className="p-3 w-2/3 flex text-xxs md:text-sm overflow-ellipsis font-bold text-white text-right recipient-address-input bg-inputBlue h-full w-full rounded-md placeholder-low-emphesis"
                            type="text"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            pattern="^(0x[a-fA-F0-9]{40})$"
                            onChange={(e) => setTokenAddress(e.target.value)}
                            value={tokenAddress}
                          />
                        </div>
                      </div>
                    </div>
                    <div className={'px-4 py-2 rounded-md '}>
                      <div className="flex flex-col justify-between space-y-3 sm:space-y-0 ">
                        <div
                          className={'flex items-center w-full space-x-3 rounded-sm bg-inputBlue focus:bg-dark-700'}
                          style={{ border: '2px solid #1F357D' }}
                        >
                          <div className="bg-lightBlueSecondary w-1/3 p-3 text-white text-center text-xxs md:text-sm">
                            Amount
                          </div>
                          <NumericalInput
                            className={'p-3 text-white bg-transparent w-2/3 text-right text-xxs md:text-sm'}
                            id="token-amount-input"
                            value={value}
                            onUserInput={(val) => {
                              setValue(val)
                            }}
                          />
                          {assetToken && selectedCurrencyBalance ? (
                            <div className="flex flex-col">
                              <div
                                onClick={() => setValue(selectedCurrencyBalance.toFixed())}
                                className="text-xxs font-medium text-right cursor-pointer text-aqua"
                              >
                                {i18n._(t`Balance:`)} {formatNumberScale(selectedCurrencyBalance.toSignificant(4))}{' '}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className={'px-4 py-2 rounded-md '}>
                      <div className="flex flex-col justify-between space-y-3 sm:space-y-0 ">
                        <div
                          className={
                            'flex items-center w-full space-x-3 rounded-sm bg-inputBlue focus:bg-dark-700 relative'
                          }
                        >
                          <>
                            <div className="bg-lightBlueSecondary w-1/3 p-3 text-white text-center text-xxs md:text-sm">
                              Withdrawer
                            </div>
                            <input
                              className="p-3 w-2/3 flex overflow-ellipsis text-xxs md:text-sm text-right font-bold recipient-address-input bg-inputBlue h-full text-white rounded-md placeholder-low-emphesis"
                              type="text"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              pattern="^(0x[a-fA-F0-9]{40})$"
                              onChange={(e) => setWithdrawer(e.target.value)}
                              value={withdrawer}
                            />
                            {account && (
                              <Button
                                onClick={() => setWithdrawer(account)}
                                size="xs"
                                className="text-xxs font-medium bg-transparent border rounded-md hover:bg-blue border-blue text-jordyBlue whitespace-nowrap"
                                style={{ position: 'absolute', left: '23%' }}
                              >
                                {i18n._(t`Me`)}
                              </Button>
                            )}
                          </>
                        </div>
                      </div>
                    </div>
                    <div className={'px-4 py-2 rounded-md '}>
                      <div className="flex flex-col justify-between space-y-3 sm:space-y-0 ">
                        <div
                          className={
                            'flex items-center w-full space-x-3 rounded-md bg-inputBlue justify-between focus:bg-dark-700'
                          }
                        >
                          <>
                            <div
                              className="bg-lightBlueSecondary p-3 text-white text-center text-xxs md:text-sm"
                              style={{ width: '33%' }}
                            >
                              Unlock Date
                            </div>
                            <Datetime
                              value={unlockDate}
                              utc={true}
                              closeOnSelect={true}
                              isValidDate={valid}
                              onChange={(e) => setUnlockDate(moment.default(e))}
                              inputProps={{
                                className:
                                  'p-3 w-full text-xxs md:text-sm flex overflow-ellipsis text-right text-white font-bold recipient-address-input bg-inputBlue h-full rounded-sm placeholder-low-emphesis',
                              }}
                            />
                          </>
                        </div>
                      </div>
                    </div>

                    <div className={'px-4 py-2'}>
                      <div className="flex flex-col justify-between space-y-3 sm:space-y-0 ">
                        <div className={classNames('w-full flex  justify-center')}>
                          <div className="flex flex-1 flex-col items-start  justify-center mx-3.5"></div>
                        </div>
                        <div className={'flex items-center w-full pt-5 rounded-md'}>
                          {!account ? (
                            <Web3Connect size="lg" color="gradient" className="w-full bg-grey" />
                          ) : !allInfoSubmitted ? (
                            <ButtonError
                              className="font-bold bg-linear-gradient rounded-md"
                              style={{ width: '100%', height: 57 }}
                              disabled={!allInfoSubmitted}
                            >
                              {errorMessage}
                            </ButtonError>
                          ) : (
                            <RowBetween>
                              {approvalState !== ApprovalState.APPROVED && (
                                <ButtonConfirmed
                                  onClick={handleApprove}
                                  disabled={
                                    approvalState !== ApprovalState.NOT_APPROVED ||
                                    approvalSubmitted ||
                                    !allInfoSubmitted
                                  }
                                >
                                  {approvalState === ApprovalState.PENDING ? (
                                    <div className={'p-2'}>
                                      <AutoRow gap="6px" justify="center">
                                        Approving <Loader stroke="white" />
                                      </AutoRow>
                                    </div>
                                  ) : (
                                    i18n._(t`Approve`)
                                  )}
                                </ButtonConfirmed>
                              )}
                              {approvalState === ApprovalState.APPROVED && (
                                <ButtonError
                                  className="font-bold text-light"
                                  onClick={handleLock}
                                  style={{
                                    width: '100%',
                                  }}
                                  disabled={approvalState !== ApprovalState.APPROVED || !allInfoSubmitted || pendingTx}
                                >
                                  {pendingTx ? (
                                    <div className={'p-2'}>
                                      <AutoRow gap="6px" justify="center">
                                        Locking <Loader stroke="white" />
                                      </AutoRow>
                                    </div>
                                  ) : (
                                    i18n._(t`Lock`)
                                  )}
                                </ButtonError>
                              )}
                            </RowBetween>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`col-span-12 md:col-span-4  px-6 py-4 rounded-md-md bg-darkBlue flex flex-col items-center`}
                    style={{ border: '2px solid rgb(31, 53, 125)' }}
                  >
                    {/* <div className="mb-2 text-2xl text-aqua" style={{ borderBottom: '2px solid rgb(31 53 125)' }}>
                      {i18n._(t`Introduction`)}
                    </div>
                    <div className="mb-4 text-white text-jordyBlue" style={{ fontSize: 14 }}>
                      <p>
                        {i18n._(
                          t`- Input your token or liquidity pair address, amount of tokens to lock, withdrawer address and when tokens will become unlocked`
                        )}
                      </p>
                      <p>{i18n._(t`- Click on "Approve" to allow the contract to transfer your tokens`)}</p>
                      <p>{i18n._(t`- Click on "Deposit" to lock your tokens into locker contract`)}</p>
                    </div>
                    <div className="mb-2 text-2xl text-aqua" style={{ borderBottom: '2px solid rgb(31 53 125)' }}>
                      {i18n._(t`Fees`)}
                    </div>{' '}
                    <div className="mb-4 text-white text-jordyBlue" style={{ fontSize: 14 }}>
                      <p>{i18n._(t`- 2 GLMR Lock Fee`)}</p>
                    </div>
                    <div className="mb-2 text-2xl text-aqua" style={{ borderBottom: '2px solid rgb(31 53 125)' }}>
                      {i18n._(t`Considerations`)}
                    </div>{' '}
                    <div className="mb-4 text-white text-jordyBlue" style={{ fontSize: 14 }}>
                      <p>{i18n._(t`- You will not be able to withdraw your tokens before the unlock time`)}</p>
                      <p>{i18n._(t`- Locker contract address: 0xe31A3b6c62Ebe9Db3b991661530fA9871584CC85`)}</p>
                      <p>{i18n._(t`- Always DYOR`)}</p>
                    </div> */}
                    <img className="flex flex-col m-auto" src="/images/locker-bg.svg" />
                  </div>
                </div>
              </Card>
              <Card className="bg-blue z-4" style={{ borderRadius: 2 }}>
                <div className="md:flex-row flex flex-col m-8 pt-5 pb-5 text-center md:text-left">
                  <div className="md:w-1/2 flex-col items-center text-left text-white mr-6 mb-4 md:mb-0">
                    <div className="text-white" style={{ fontSize: 20, fontWeight: 'bold' }}>
                      Introduction
                    </div>
                    <div className="flex-col" style={{ fontSize: 12 }}>
                      <p>
                        {i18n._(
                          t`- Input your token or liquidity pair address, amount of tokens to lock, withdrawer address and when tokens will become unlocked`
                        )}
                      </p>
                      <p>{i18n._(t`- Click on "Approve" to allow the contract to transfer your tokens`)}</p>
                      <p>{i18n._(t`- Click on "Deposit" to lock your tokens into locker contract`)}</p>
                    </div>
                    <div className="text-white mt-3" style={{ fontSize: 20, fontWeight: 'bold' }}>
                      Fees
                    </div>
                    <div className="flex-col" style={{ fontSize: 12 }}>
                      <p>{i18n._(t`- 2 GLMR Lock Fee`)}</p>
                    </div>
                  </div>
                  <div className="md:w-1/2 flex-col items-center text-left text-white">
                    <div className="text-white" style={{ fontSize: 20, fontWeight: 'bold' }}>
                      Considerations
                    </div>
                    <div className="flex-col" style={{ fontSize: 12 }}>
                      <p>{i18n._(t`- You will not be able to withdraw your tokens before the unlock time`)}</p>
                      <p>{i18n._(t`- Locker contract address: 0xe31A3b6c62Ebe9Db3b991661530fA9871584CC85`)}</p>
                      <p>{i18n._(t`- Always DYOR`)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </DoubleGlowShadow>
      </div>
    </>
  )
}
