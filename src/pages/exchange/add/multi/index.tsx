import { AutoRow } from '../../../../components/Row'
import Button from '../../../../components/Button'
import { Percent } from '../../../../sdk'
import React from 'react'
import { useExpertModeManager, useUserSlippageToleranceWithDefault } from '../../../../state/user/hooks'

import { AutoColumn } from '../../../../components/Column'
import Container from '../../../../components/Container'
import ExchangeHeader from '../../../../components/ExchangeHeader'
import Head from 'next/head'
import NavLink from '../../../../components/NavLink'
import { Plus } from 'react-feather'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DoubleGlowShadow from '../../../../components/DoubleGlowShadow'
import AddLiquidityInputPanel from '../../../../components/AddLiquidityInputPanel'

const DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function Add() {
  const { i18n } = useLingui()

  const [isExpertMode] = useExpertModeManager()

  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE) // custom from users

  return (
    <>
      <Head>
        <title>Beamswap | Add Liquidity</title>
        <meta
          key="description"
          name="description"
          content="Add liquidity to the Beamswap AMM to enable gas optimised and low slippage trades across the Moonbeam network."
        />
      </Head>
      <Container id="remove-liquidity-page" maxWidth="2xl" className="space-y-4">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <div className="swap-nav">
            <div className="primary">
              <a href="/exchange/swap">Exchange</a>
            </div>
            <div className="secondary">
              <a href="/exchange/pool">Liquidity</a>
            </div>
          </div>
          <div className="p-4 space-y-4 rounded-sm bg-blue" style={{ zIndex: 1 }}>
            <ExchangeHeader allowedSlippage={allowedSlippage} />

            <div className="flex flex-col space-y-4">
              <div className="input-container">
                <AddLiquidityInputPanel currencyType="usdc" />

                <AutoColumn justify="space-between" className="py-2.5">
                  <AutoRow justify={isExpertMode ? 'center' : 'center'} style={{ padding: '0 1rem' }}>
                    <div className="swap-blue-border"></div>
                    <button className="rounded-sm cursor-default bg-blue">
                      <div className="rounded-sm bg-darkBlue p-1 plus-icon" style={{ margin: '0 18px' }}>
                        <Plus size="20" />
                      </div>
                    </button>
                    <div className="swap-blue-border"></div>
                  </AutoRow>
                </AutoColumn>

                <AddLiquidityInputPanel currencyType="usdt" />

                <AutoColumn justify="space-between" className="py-2.5">
                  <AutoRow justify={isExpertMode ? 'center' : 'center'} style={{ padding: '0 1rem' }}>
                    <div className="swap-blue-border"></div>
                    <button className="rounded-sm cursor-default bg-blue">
                      <div className="rounded-sm bg-darkBlue p-1 plus-icon" style={{ margin: '0 18px' }}>
                        <Plus size="20" />
                      </div>
                    </button>
                    <div className="swap-blue-border"></div>
                  </AutoRow>
                </AutoColumn>

                <AddLiquidityInputPanel currencyType="busd" />
              </div>
              <Button style={{ height: 55 }} size="lg" color="gray" className="w-full bg-linear-gradient" disabled>
                {i18n._(t`Enter an amount`)}
              </Button>
            </div>
          </div>
          <div className="flex items-center px-4 justify-center pb-4">
            <NavLink href="/exchange/pool">
              <a className="flex items-center space-x-2 font-medium text-center cursor-pointer text-jordyBlue hover:text-aqua">
                <span>{i18n._(t`View Liquidity Positions`)}</span>
              </a>
            </NavLink>
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
