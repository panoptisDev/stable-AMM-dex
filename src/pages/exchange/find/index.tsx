import { Currency, CurrencyAmount, JSBI, NATIVE, Token } from '../../../sdk'
import { PairState, useV2Pair } from '../../../hooks/useV2Pairs'
import React, { useCallback, useEffect, useState } from 'react'

import { AutoColumn } from '../../../components/Column'
import { AutoRow } from '../../../components/Row'
import Container from '../../../components/Container'
import CurrencySelectPanel from '../../../components/CurrencySelectPanel'
import Dots from '../../../components/Dots'
import Head from 'next/head'
import Link from 'next/link'
import { MinimalPositionCard } from '../../../components/PositionCard'
import { Plus } from 'react-feather'
import Typography from '../../../components/Typography'
import Web3Connect from '../../../components/Web3Connect'
import { currencyId } from '../../../functions/currency'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { usePairAdder } from '../../../state/user/hooks'
import { useTokenBalance } from '../../../state/wallet/hooks'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
}

export default function PoolFinder() {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()

  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(() => (chainId ? NATIVE[chainId] : null))
  const [currency1, setCurrency1] = useState<Currency | null>(null)

  const [pairState, pair] = useV2Pair(currency0 ?? undefined, currency1 ?? undefined)
  const addPair = usePairAdder()
  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const validPairNoLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve0.quotient, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve1.quotient, JSBI.BigInt(0))
    )

  const position: CurrencyAmount<Token> | undefined = useTokenBalance(account ?? undefined, pair?.liquidityToken)

  const hasPosition = Boolean(position && JSBI.greaterThan(position.quotient, JSBI.BigInt(0)))

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField]
  )

  const prerequisiteMessage = (
    <div className="p-5 text-center bg-deepCove rounded-md text-white">
      {i18n._(t`Select a token to find your liquidity`)}
    </div>
  )

  return (
    <>
      <Head>
        <title>Beamswap | Find Pool </title>
        <meta key="description" name="description" content="Find a liquidity pool that is not yet imported." />
      </Head>

      <Container maxWidth="2xl" className="space-y-6">
        <DoubleGlowShadow>
          <div className="p-4 space-y-4 rounded-sm bg-blue swap-container" style={{ zIndex: 1 }}>
            <div className="p-4 mb-3 space-y-3 text-center text-white">
              <Typography component="h1" variant="h2">
                {i18n._(t`Import Pool`)}
              </Typography>
            </div>

            <AutoColumn gap={'md'}>
              <CurrencySelectPanel
                currency={currency0}
                onClick={() => setActiveField(Fields.TOKEN0)}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={currency1}
                id="pool-currency-input"
              />
              <AutoColumn justify="space-between" className="py-2.5">
                <AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
                  <div className="swap-blue-border"></div>
                  <button className="rounded-sm cursor-default bg-blue">
                    <div className="rounded-sm bg-darkBlue p-1 plus-icon text-aqua" style={{ margin: '0 18px' }}>
                      <Plus size="20" />
                    </div>
                  </button>
                  <div className="swap-blue-border"></div>
                </AutoRow>
              </AutoColumn>
              <CurrencySelectPanel
                currency={currency1}
                onClick={() => setActiveField(Fields.TOKEN1)}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={currency0}
                id="pool-currency-output"
              />
            </AutoColumn>

            {hasPosition && (
              <AutoRow
                style={{
                  justifyItems: 'center',
                  backgroundColor: '',
                  padding: '12px 0px',
                  borderRadius: '12px',
                  color: 'white',
                }}
                justify={'center'}
                gap={'0 3px'}
              >
                {i18n._(t`Pool Found!`)}
                <Link href={`/exchange/pool`}>
                  <a className="text-center text-yellow text-bold">{i18n._(t`Manage this pool`)}</a>
                </Link>
              </AutoRow>
            )}

            {currency0 && currency1 ? (
              pairState === PairState.EXISTS ? (
                hasPosition && pair ? (
                  <MinimalPositionCard pair={pair} border="1px solid #CED0D9" />
                ) : (
                  <div className="p-5 rounded-sm bg-darkBlue">
                    <AutoColumn gap="sm" justify="center">
                      {i18n._(t`You don’t have liquidity in this pool yet`)}
                      <Link href={`/exchange/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                        <a className="text-center text-yellow text-opacity-80 hover:text-opacity-100">
                          {i18n._(t`Add liquidity`)}
                        </a>
                      </Link>
                    </AutoColumn>
                  </div>
                )
              ) : validPairNoLiquidity ? (
                <div className="p-5 rounded text-white bg-linear-gradient" style={{ height: 63 }}>
                  <AutoColumn gap="sm" justify="center">
                    <Link href={`/exchange/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                      <a className="text-center text-white">{i18n._(t`Create pool`)}</a>
                    </Link>
                  </AutoColumn>
                </div>
              ) : pairState === PairState.INVALID ? (
                <div className="p-5 text-center rounded bg-dark-800">{i18n._(t`Invalid pair`)}</div>
              ) : pairState === PairState.LOADING ? (
                <div className="p-5 text-center rounded bg-dark-800">
                  <Dots>{i18n._(t`Loading`)}</Dots>
                </div>
              ) : null
            ) : !account ? (
              <Web3Connect className="w-full" size="lg" color="blue" />
            ) : (
              prerequisiteMessage
            )}
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
