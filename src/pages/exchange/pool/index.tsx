import { CurrencyAmount, NATIVE, Pair } from '../../../sdk'
import React, { useMemo, useState } from 'react'
import { classNames, currencyId } from '../../../functions'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../../state/user/hooks'

import Button from '../../../components/Button'
import Container from '../../../components/Container'
import Dots from '../../../components/Dots'
import Empty from '../../../components/Empty'
import FullPositionCard from '../../../components/PositionCard'
import MultiPositionCard from '../../../components/MultiPositionCard'
import Head from 'next/head'
import Link from 'next/link'
import { MigrationSupported } from '../../../features/migration'
import Web3Connect from '../../../components/Web3Connect'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import { useTokenBalancesWithLoadingIndicator } from '../../../state/wallet/hooks'
import { useV2Pairs } from '../../../hooks/useV2Pairs'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'

export default function Pool() {
  const [isStandard, setIsStandard] = useState(true)
  const { i18n } = useLingui()
  const router = useRouter()
  const { account, chainId } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()

  const tokenPairsWithLiquidityTokens = useMemo(() => {
    if (!chainId) {
      return []
    }
    return trackedTokenPairs.map((tokens) => ({
      liquidityToken: toV2LiquidityToken(tokens),
      tokens,
    }))
  }, [trackedTokenPairs, chainId])

  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  )

  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken?.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = useV2Pairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))

  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  // TODO: Replicate this!
  // show liquidity even if its deposited in rewards contract
  // const stakingInfo = useStakingInfo()
  // const stakingInfosWithBalance = stakingInfo?.filter((pool) =>
  //   JSBI.greaterThan(pool.stakedAmount.quotient, BIG_INT_ZERO)
  // )
  // const stakingPairs = useV2Pairs(stakingInfosWithBalance?.map((stakingInfo) => stakingInfo.tokens))

  // // remove any pairs that also are included in pairs with stake in mining pool
  // const v2PairsWithoutStakedAmount = allV2PairsWithLiquidity.filter((v2Pair) => {
  //   return (
  //     stakingPairs
  //       ?.map((stakingPair) => stakingPair[1])
  //       .filter((stakingPair) => stakingPair?.liquidityToken.address === v2Pair.liquidityToken.address).length === 0
  //   )
  // })
  const migrationSupported = chainId in MigrationSupported
  return (
    <>
      <Head>
        <title> Beamswap | Liquidity</title>
        <meta
          key="description"
          name="description"
          content="Beamswap liquidity pools are markets for trades between the two tokens, you can provide these tokens and become a liquidity provider to earn 0.17% of fees from trades or yield farm them in our farms."
        />
      </Head>
      <Container maxWidth="2xl" className="space-y-6 liquidity-container">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
          <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />
          {/* <Alert
          title={i18n._(t`Liquidity Provider Rewards`)}
          message={i18n._(t`Liquidity providers earn a 0.25% fee on all trades proportional to their share of
                        the pool. Fees are added to the pool, accrue in real time and can be claimed by
                        withdrawing your liquidity`)}
          type="information"
        /> */}

          <div className="swap-nav">
            <div className="secondary">
              <a href="/exchange/swap">Exchange</a>
            </div>
            <div className={isStandard ? 'primary' : 'secondary'}>
              <button onClick={() => setIsStandard(true)}>Standard AMM</button>
            </div>
            <div className={isStandard ? 'secondary' : 'primary'}>
              <button onClick={() => setIsStandard(false)}>Stable AMM</button>
            </div>
          </div>

          <div className="p-4 pt-0 space-y-4 bg-blue">
            <div className="p-4 mb-3 space-y-3"></div>

            {isStandard ? (
              <div className="grid grid-flow-row gap-3 text-white">
                {!account ? (
                  <Web3Connect size="lg" className="w-full bg-linear-gradient" style={{ height: 56 }} />
                ) : v2IsLoading ? (
                  <Empty>
                    <Dots>{i18n._(t`Loading`)}</Dots>
                  </Empty>
                ) : allV2PairsWithLiquidity?.length > 0 ? (
                  <>
                    {/* <div className="flex items-center justify-center">
                  <ExternalLink
                    href={"https://analytics.sushi.com/user/" + account}
                  >
                    Account analytics and accrued fees <span> ↗</span>
                  </ExternalLink>
                </div> */}
                    {allV2PairsWithLiquidity.map((v2Pair) => (
                      <FullPositionCard
                        key={v2Pair.liquidityToken.address}
                        pair={v2Pair}
                        stakedBalance={CurrencyAmount.fromRawAmount(v2Pair.liquidityToken, '0')}
                      />
                    ))}
                    <Link href={`/exchange/find`}>
                      <a className="text-center text-aqua text-opacity-80 hover:text-opacity-100">
                        {i18n._(t`Import pool`)}
                      </a>
                    </Link>
                  </>
                ) : (
                  <Empty
                    className="flex text-lg text-center text-low-emphesis bg-darkBlue rounded-md roster"
                    style={{ border: '2px solid #1F357D' }}
                  >
                    <div className="px-4 py-2 title">{i18n._(t`No liquidity was found. `)}</div>
                  </Empty>
                )}
                {account && (
                  <div className={classNames('', migrationSupported ? '' : '')}>
                    <Button
                      id="add-pool-button"
                      color="gradient"
                      className="justify-center whitespace-nowrap bg-linear-gradient add-liquidity"
                      onClick={() => router.push(`/exchange/add/${currencyId(NATIVE[chainId])}`)}
                    >
                      {i18n._(t`+ Add Liquidity`)}
                    </Button>
                    {/* <Button id="add-pool-button" color="gray" onClick={() => router.push(`/exchange/find`)}>
                    {i18n._(t`Import`)}
                  </Button> */}

                    {/* {migrationSupported && (
                    <Button id="create-pool-button bg-linear-gradient" color="gray" onClick={() => router.push(`/migrate`)}>
                      {i18n._(t`Migrate`)}
                    </Button>
                  )} */}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-flow-row gap-3 text-white">
                {!account ? (
                  <Web3Connect size="lg" className="w-full bg-linear-gradient" style={{ height: 56 }} />
                ) : v2IsLoading ? (
                  <Empty>
                    <Dots>{i18n._(t`Loading`)}</Dots>
                  </Empty>
                ) : (
                  <>
                    <MultiPositionCard currency1="usdc" currency2="usdt" currency3="busd" />
                    <MultiPositionCard currency1="usdc" currency2="usdt" currency3="dai" />
                  </>
                )}
              </div>
            )}
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
