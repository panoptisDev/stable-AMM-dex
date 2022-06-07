/* eslint-disable @next/next/link-passhref */
import { useActiveWeb3React } from '../../hooks'
import Head from 'next/head'
import React, { useCallback, useEffect, useState } from 'react'
import Search from '../../components/Search'
import { classNames, isAddress } from '../../functions'
import Link from 'next/link'
import Card from '../../components/Card'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import { useTransactionAdder } from '../../state/transactions/hooks'
import useLocker from '../../features/locker/useLocker'
import { Disclosure } from '@headlessui/react'
import moment from 'moment'
import { useToken } from '../../hooks/Tokens'
import { CurrencyAmount } from '../../sdk'
import Button from '../../components/Button'
import { getAddress } from '@ethersproject/address'

export default function Locker(): JSX.Element {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const [tokenAddress, setTokenAddress] = useState(undefined)
  const token = useToken(isAddress(tokenAddress) ? tokenAddress : undefined)
  const [pendingTx, setPendingTx] = useState(false)
  const addTransaction = useTransactionAdder()

  const [lockers, setLockers] = useState([])

  const lockerContract = useLocker()

  useEffect(() => {
    if (isAddress(tokenAddress)) {
      lockerContract.getLockersByTokenAddress(tokenAddress).then((r) => {
        if (r.length > 0) {
          setLockers(r.filter((x) => x.withdrawn == false))
        }
      })
    }
  }, [tokenAddress, lockerContract])

  const handleWithdraw = useCallback(
    async (id) => {
      setPendingTx(true)

      try {
        const tx = await lockerContract.withdrawTokens(id)
        addTransaction(tx, {
          summary: `${i18n._(t`Withdraw from locker ${id}`)}`,
        })
      } catch (error) {
        console.error(error)
      }
      setPendingTx(false)
    },
    [addTransaction, i18n, lockerContract]
  )

  return (
    <>
      <Head>
        <title>Beamswap | Locker</title>
        <meta key="description" name="description" content="Beamswap locker offers newly launched projects to lock their initial liquidity tokens to provide good faith and extra security for the community." />
      </Head>

      <div className="container px-0 mx-auto pb-6 z-8 locker-container">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <div className={`grid grid-cols-12 gap-2 min-h-1/2`}>
            <div className={`col-span-12`} style={{ minHeight: '30rem' }}>
              <Card className="h-full bg-blue z-4">
                <div className="p-5 px-1 md:px-5 ml-3 mr-3 flex-col md:flex-row md:flex justify-between items-center">
                  <div className="flex items-center">
                    <img className="mb-4 md:mb-0" src="/images/locker-icon.svg" width={20} height={20} />
                    <div className="text-lg text-white font-lg font-bold ml-4 md:text-xl text-xl mb-4 md:mb-0">
                      Beamswap Locker
                    </div>
                  </div>
                  <div
                    className="bg-inputBlue p-3 cursor-pointer hover:text-aqua text-white rounded-sm"
                    style={{ width: 'fit-content' }}
                  >
                    <a href="/locker/create">Create</a>
                  </div>
                </div>
                <div className="p-4 md:p-5 pt-1">
                  <Search
                    placeholder={'Search by name, symbol or address'}
                    term={tokenAddress}
                    search={(value: string): void => {
                      setTokenAddress(value)
                    }}
                  />
                </div>
                {lockers.length == 0 && isAddress(tokenAddress) && (
                  <div className="flex justify-center items-center col-span-12 lg:justify mt-20">
                    <span>
                      No lockers found for this address,{' '}
                      <Link href="/locker/create">
                        <a className="hover:underline hover:text-yellow">click here</a>
                      </Link>{' '}
                      to create one.
                    </span>
                  </div>
                )}
                {lockers.length > 0 && (
                  <div className="grid grid-cols-5 text-white font-bold text-primary mt-10 mb-2">
                    <div className="flex items-center col-span-2 px-2">
                      <div className="hover:text-high-emphesis">{i18n._(t`Token`)}</div>
                    </div>
                    <div className="flex items-center ">{i18n._(t`Amount Locked`)}</div>
                    <div className="items-center justify-end px-2 flex ">{i18n._(t`Unlock date`)}</div>
                    <div className="items-center justify-end px-2 flex ">{i18n._(t``)}</div>
                  </div>
                )}
                <div className="flex-col">
                  {lockers.map((locker, index) => {
                    return (
                      <Disclosure key={index}>
                        {() => (
                          <div className="mb-4">
                            <Disclosure.Button
                              className={classNames(
                                'w-full px-4 py-6 text-left rounded-md select-none bg-deepCove  text-primary text-sm md:text-lg'
                              )}
                              style={{ border: '2px solid rgb(31, 53, 125)' }}
                            >
                              <div className="grid grid-cols-5">
                                <div className="flex col-span-2 items-center text-jordyBlue">
                                  {token?.name} ({token?.symbol})
                                </div>
                                <div className="flex flex-col justify-center text-aqua">
                                  {CurrencyAmount.fromRawAmount(token, locker?.amount).toSignificant(6)}
                                </div>
                                <div className="flex flex-col items-end justify-center">
                                  <div className="text-xs text-right md:text-white text-aqua">
                                    {moment.unix(locker?.unlockTimestamp.toString()).fromNow()}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end justify-center">
                                  <div className="text-xs text-right md:text-white text-secondary">
                                    <Button
                                      variant="link"
                                      style={{ width: '100%' }}
                                      onClick={() => handleWithdraw(locker?.id)}
                                      disabled={
                                        moment.unix(locker?.unlockTimestamp.toString()).isAfter(new Date()) ||
                                        !account ||
                                        (account && getAddress(account) != getAddress(locker?.withdrawer))
                                      }
                                    >
                                      Withdraw
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Disclosure.Button>
                          </div>
                        )}
                      </Disclosure>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>
        </DoubleGlowShadow>
      </div>
    </>
  )
}
