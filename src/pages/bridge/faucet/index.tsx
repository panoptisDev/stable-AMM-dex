/* eslint-disable @next/next/link-passhref */

import Head from 'next/head'
import React, { useCallback, useState } from 'react'
import { t } from '@lingui/macro'
import { formatNumberScale } from '../../../functions'
import { ButtonError } from '../../../components/Button'
import { AutoColumn } from '../../../components/Column'
import { AutoRow } from '../../../components/Row'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import Container from '../../../components/Container'
import Typography from '../../../components/Typography'
import { i18n } from '@lingui/core'
import { useActiveWeb3React } from '../../../hooks'
import Web3Connect from '../../../components/Web3Connect'
import { Loader } from 'react-feather'
import { useETHBalances } from '../../../state/wallet/hooks'
import axios from 'axios'
import ReCAPTCHA from 'react-google-recaptcha'
import { FAUCET_ADDRESS } from '../../../constants'

export default function Faucet(): JSX.Element {
  const { chainId, account, library } = useActiveWeb3React()
  const [token, setToken] = useState('')
  const tokenBalance = useETHBalances([FAUCET_ADDRESS])
  const [pendingTx, setPendingTx] = useState(false)
  const [requested, setRequested] = useState(false)
  const [faucetResult, setFaucetResult] = useState({ status: 200, message: null })
  const recaptchaRef: any = React.createRef()

  const onReCAPTCHAChange = async (captchaCode) => {
    if (!captchaCode) {
      return
    }

    setPendingTx(true)

    try {
      const faucetResponse = await axios.post('/api/faucet', { address: account, 'g-recaptcha-response': captchaCode })
      if (faucetResponse.data) {
        setFaucetResult(faucetResponse.data)
        if (faucetResponse.data.status == 200) {
          setRequested(true)
        } else if (faucetResponse.data.message.indexOf('daily limit') >= 0) {
          setRequested(true)
        }
      }
    } catch (err) {
      setFaucetResult({ status: 400, message: 'Failed to send the request to the server.' })
    } finally {
      setPendingTx(false)
    }
  }

  const handleRequest = useCallback(async () => {
    recaptchaRef.current.execute()
  }, [recaptchaRef])

  return (
    <>
      <Head>
        <title>Faucet | Beamswap</title>
        <meta key="description" name="description" content="Moonriver Faucet" />
      </Head>

      <ReCAPTCHA
        ref={recaptchaRef}
        size="invisible"
        sitekey={'6LdH7bYdAAAAALner3nvbrbk4eL6eN2MDU9HECUg'}
        onChange={onReCAPTCHAChange}
      />

      <Container maxWidth="2xl" className="space-y-6 faucet-container">
        <DoubleGlowShadow opacity="0.6">
          <div className="swap-nav">
            <div className="secondary">
              <a href="/bridge">Bridge</a>
            </div>
            <div className="third">
              <a href="/bridge/history">History</a>
            </div>
            <div className="primary">
              <a href="/bridge/faucet">Faucet</a>
            </div>
          </div>
          <div className="p-4 space-y-4 bg-blue" style={{ zIndex: 1, borderRadius: 2 }}>
            <div className="flex flex-col justify-center items-center">
              <div className="p-4 mb-3 space-y-3 text-center">
                <Typography component="h1" variant="base" className="text-aqua">
                  A Faucet is a tool that provides a small amount of GLMR for users that used the bridge to start using
                  Beamswap.io without having to buy GLMR somewhere else.
                </Typography>
              </div>
              <div className="p-4 mb-3 space-y-1 text-center flex justify-between" style={{ width: '100%' }}>
                <div>
                  <Typography component="h1" variant="base" className="text-jordyBlue">
                    Faucet Address
                  </Typography>
                </div>
                <div>
                  <Typography component="h1" variant="base" className="text-jordyBlue">
                    Faucet balance:{' '}
                    {formatNumberScale(tokenBalance[FAUCET_ADDRESS]?.toSignificant(4, undefined, 2) ?? 0, false, 4)}{' '}
                    GLMR
                  </Typography>
                </div>
              </div>
              <div
                className="bg-deepCove mb-5 pt-3 pb-3 pl-6 pr-6 text-center mr-5 ml-5"
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  borderRadius: 2,
                  width: '-webkit-fill-available',
                }}
              >
                {FAUCET_ADDRESS}
              </div>

              <AutoColumn gap={'md'}>
                <div className={'flex items-center w-full'}>
                  {!account ? (
                    <Web3Connect size="lg" color="gradient" className="w-full" />
                  ) : (
                    <ButtonError
                      className="font-bold text-light bg-linear-gradient"
                      onClick={handleRequest}
                      style={{
                        width: '100%',
                        height: 57,
                      }}
                      disabled={pendingTx || requested}
                    >
                      {pendingTx ? (
                        <div>
                          <AutoRow gap="6px" justify="center" align="center">
                            Requesting <Loader stroke="white" />
                          </AutoRow>
                        </div>
                      ) : (
                        i18n._(t`Get some of that GLMR`)
                      )}
                    </ButtonError>
                  )}
                </div>
              </AutoColumn>
              <div className="p-4 mb-3 space-y-3 text-center">
                {faucetResult?.message && (
                  <Typography
                    component="h1"
                    variant="base"
                    className={`${faucetResult?.status == 200 ? 'text-green' : 'text-red'}`}
                  >
                    {faucetResult?.message}
                  </Typography>
                )}
              </div>
            </div>
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
