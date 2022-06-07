import {
  Binance,
  ChainId,
  Currency,
  Ether,
  Glimmer,
  Token,
  WNATIVE,
  Fantom,
} from '../../sdk'
import React, { useCallback, useEffect, useState } from 'react'

import { AutoRow } from '../../components/Row'
import Container from '../../components/Container'
import Head from 'next/head'
import { ArrowRight } from 'react-feather'
import Typography from '../../components/Typography'
import Web3Connect from '../../components/Web3Connect'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import {
  useMultichainCurrencyBalanceFTM,
} from '../../state/wallet/hooks'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import { BottomGrouping } from '../../features/swap/styleds'
import Button from '../../components/Button'
import DualChainCurrencyInputPanel from '../../components/DualChainCurrencyInputPanel'
import ChainSelect from '../../components/ChainSelect'
import { Chain, DEFAULT_CHAIN_FROM, DEFAULT_CHAIN_TO, FTM_CHAIN } from '../../sdk/entities/Chain'
import useSWR, { SWRResponse } from 'swr'
import { getAddress } from 'ethers/lib/utils'
import { formatNumber, tryParseAmount } from '../../functions'
import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { ethers } from 'ethers'
import {
  ApprovalState,
  useAnyswapTokenContractV3,
  useApproveCallback,
  useTokenContract,
} from '../../hooks'
import Loader from '../../components/Loader'
import { useWeb3React } from '@web3-react/core'
import { BridgeContextName } from '../../constants'
import { bridgeInjected } from '../../connectors'
import { useTransactionAdder } from '../../state/bridgeTransactions/hooks'
import { useRouter } from 'next/router'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'

type AnyswapTokenInfo = {
  ID: string
  Name: string
  Symbol: string
  Decimals: number
  Description: string
  BaseFeePercent: number
  BigValueThreshold: number
  DepositAddress: string
  ContractAddress: string
  DcrmAddress: string
  DisableSwap: boolean
  IsDelegateContract: boolean
  MaximumSwap: number
  MaximumSwapFee: number
  MinimumSwap: number
  MinimumSwapFee: number
  PlusGasPricePercentage: number
  SwapFeeRate: number
  anyToken: any
}

type AnyswapResultPairInfo = {
  DestToken: AnyswapTokenInfo
  PairID: string
  SrcToken: AnyswapTokenInfo
  destChainID: string
  logoUrl: string
  name: string
  srcChainID: string
  symbol: string
}

type AvailableChainsInfo = {
  id: string
  token: AnyswapTokenInfo
  other: AnyswapTokenInfo
  logoUrl: string
  name: string
  symbol: string
  destChainID: string
  anyToken: any
  destChains: any
  tokenId: any
  router: any
  underlying: any
  address: any
}

export type AnyswapTokensMap = { [chainId: number]: { [contract: string]: AvailableChainsInfo } }

export default function Bridge() {
  const { i18n } = useLingui()

  const { account: activeAccount, chainId: activeChainId } = useActiveWeb3React()
  const { account, chainId, library, activate } = useWeb3React(BridgeContextName)
  const { push } = useRouter()

  const addTransaction = useTransactionAdder()


  useEffect(() => {
    activate(bridgeInjected)
    if (chainId) {
      if (chainId == chainTo.id) {
        setChainTo(chainFrom)
      }
      setChainFrom({ id: chainId, icon: NETWORK_ICON[chainId], name: NETWORK_LABEL[chainId] })
    }
  }, [activate, chainId, activeAccount, activeChainId])

  const [chainFrom, setChainFrom] = useState<Chain | null>(DEFAULT_CHAIN_TO)

  const [chainTo, setChainTo] = useState<Chain | null>(FTM_CHAIN)

  const [tokenList, setTokenList] = useState<Currency[] | null>([])
  const [currency0, setCurrency0] = useState<Currency | null>(null)
  const [currencyAmount, setCurrencyAmount] = useState<string | null>('')
  const [tokenToBridge, setTokenToBridge] = useState<AvailableChainsInfo | null>(null)
  const currencyContract = useTokenContract(currency0?.isToken && currency0?.address, true)
  const anyswapCurrencyContract = useAnyswapTokenContractV3(currency0 && tokenToBridge.router, true)
  const [pendingTx, setPendingTx] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const selectedCurrencyBalance = useMultichainCurrencyBalanceFTM(
    chainFrom?.id,
    account ?? undefined,
    currency0 ?? undefined
  )
  const tokenToApprove = tryParseAmount('99999', currency0)
  const [approvalState, approve] = useApproveCallback(tokenToApprove, tokenToBridge?.router)

  const { data: anyswapInfo }: SWRResponse<AnyswapTokensMap, Error> = useSWR(
    'https://bridgeapi.anyswap.exchange/v3/serverinfoV3?chainId=all',
    (url) =>
      fetch(url)
        .then((result) => result.json())
        .then((data) => {
          let result: AnyswapTokensMap = {}
          data = data.NATIVE

          Object.keys(data || {}).map((key) => {
            result[key] = data[key]
          })

          return result
        })
  )

  useEffect(() => {
    let tokens: Currency[] = Object.keys((anyswapInfo && anyswapInfo[chainFrom.id]) || {})
      .filter(() => true)
      .map((r) => {
        const info: AvailableChainsInfo = anyswapInfo[chainFrom.id][r]

        if (r.toLowerCase() == WNATIVE[chainFrom.id].address.toLowerCase()) {
          if (chainFrom.id == ChainId.MOONBEAM) {
            return Glimmer.onChain(chainFrom.id)
          }
          if (chainFrom.id == ChainId.BSC) {
            return Binance.onChain(chainFrom.id)
          }
          if (chainFrom.id == ChainId.MAINNET) {
            return Ether.onChain(chainFrom.id)
          }
          if (chainFrom.id == ChainId.FANTOM) {
            return Fantom.onChain(chainFrom.id)
          }
        }
        console.log(info)

        return new Token(
          chainFrom.id,
          getAddress(r),
          info.anyToken.decimals,
          info.anyToken.symbol == 'anyFTM' ? 'FTM' : info.anyToken.symbol,
          info.anyToken.name
        )
      })

    setTokenList(tokens)
    setCurrency0(null)
    setCurrencyAmount('')
  }, [chainFrom, anyswapInfo, chainTo.id])

  const handleChainFrom = useCallback(
    (chain: Chain) => {
      let changeTo = chainTo
      if (chainTo.id == chain.id) {
        changeTo = chainFrom
      }
      if (changeTo.id !== ChainId.MOONBEAM && chain.id !== ChainId.MOONBEAM) {
        setChainTo(DEFAULT_CHAIN_TO)
      } else {
        setChainTo(changeTo)
      }
      setChainFrom(chain)
    },
    [chainFrom, chainTo]
  )

  const handleChainTo = useCallback(
    (chain: Chain) => {
      let changeFrom = chainFrom
      if (chainFrom.id == chain.id) {
        changeFrom = chainTo
      }
      if (changeFrom.id !== ChainId.MOONBEAM && chain.id !== ChainId.MOONBEAM) {
        setChainFrom(DEFAULT_CHAIN_FROM)
      } else {
        setChainFrom(changeFrom)
      }
      setChainTo(chain)
    },
    [chainFrom, chainTo]
  )

  const handleTypeInput = useCallback(
    (value: string) => {
      setCurrencyAmount(value)
    },
    [setCurrencyAmount]
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      setCurrency0(currency)
      console.log('set currency')
      console.log(currency)
      handleTypeInput('')
      if (currency) {
        const tokenTo =
          anyswapInfo[chainFrom.id][
            currency.isToken ? currency?.address?.toLowerCase() : currency?.wrapped?.address?.toLowerCase()
          ]
        setTokenToBridge(tokenTo)
      }
    },
    [anyswapInfo, chainFrom.id, handleTypeInput]
  )

  const insufficientBalance = () => {
    if (currencyAmount && selectedCurrencyBalance) {
      try {
        const balance = parseFloat(selectedCurrencyBalance.toFixed(currency0.decimals))
        const amount = parseFloat(currencyAmount)
        return amount > balance
      } catch (ex) {
        return false
      }
    }
    return false
  }

  const aboveMin = () => {
    if (currencyAmount && tokenToBridge) {
      const amount = parseFloat(currencyAmount)
      const minAmount = parseFloat(tokenToBridge?.destChains[chainTo.id]?.MinimumSwap.toString())
      return amount >= minAmount
    }
    return false
  }

  const belowMax = () => {
    if (currencyAmount && tokenToBridge) {
      const amount = parseFloat(currencyAmount)
      const maxAmount = parseFloat(tokenToBridge?.destChains[chainTo.id]?.MaximumSwap.toString())
      return amount <= maxAmount
    }
    return false
  }

  const getAmountToReceive = () => {
    if (!tokenToBridge) return 0
    console.log(tokenToBridge?.destChains[chainTo.id])

    let fee = (parseFloat(currencyAmount) * tokenToBridge?.destChains[chainTo.id]?.SwapFeeRatePerMillion) / 100
    if (fee < parseFloat(tokenToBridge?.destChains[chainTo.id]?.MinimumSwapFee)) {
      fee = tokenToBridge?.destChains[chainTo.id]?.MinimumSwapFee
    } else if (fee > parseFloat(tokenToBridge?.destChains[chainTo.id]?.MaximumSwapFee)) {
      fee = tokenToBridge?.destChains[chainTo.id]?.MinimumSwapFee
    }

    console.log(fee)

    return (parseFloat(currencyAmount) - fee).toFixed(6)
  }

  console.log(anyswapInfo)

  const buttonDisabled =
    (chainFrom && chainFrom.id !== chainId) ||
    !currency0 ||
    !currencyAmount ||
    currencyAmount == '' ||
    !aboveMin() ||
    !belowMax() ||
    insufficientBalance() ||
    pendingTx

  const buttonText =
    chainFrom && chainFrom.id !== chainId
      ? `Switch to ${chainFrom.name} Network`
      : !currency0
      ? `Select a Token`
      : !currencyAmount || currencyAmount == ''
      ? 'Enter an Amount'
      : !aboveMin()
      ? `Below Minimum Amount`
      : !belowMax()
      ? `Above Maximum Amount`
      : insufficientBalance()
      ? `Insufficient Balance`
      : pendingTx
      ? `Confirming Transaction`
      : `Bridge ${currency0?.name}`

  const bridgeToken = async () => {
    const token = tokenToBridge.destChains[chainTo.id]
    const depositAddress = currency0.chainId == ChainId.MOONBEAM ? token.router : token.router
    const amountToBridge = ethers.utils.parseUnits(currencyAmount, token.anyToken.decimals)

    setPendingTx(true)

    try {
      if (currency0.chainId == ChainId.MOONBEAM) {
        if (currency0.isNative) {
        } else if (currency0.isToken) {
          console.log('if')
          // approve
          if (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.UNKNOWN) {
            await approve()
          } else {
            // bridge
            console.log('else')

            const fn = anyswapCurrencyContract?.interface?.getFunction('anySwapOut(address,address,uint256,uint256)')

            const data = anyswapCurrencyContract.interface.encodeFunctionData(fn, [
              tokenToBridge.anyToken.address,
              account,
              amountToBridge.toString(),
              chainTo.id.toString(),
            ])
            const tx = await library.getSigner().sendTransaction({
              value: 0x0,
              from: account,
              to: anyswapCurrencyContract.address,
              data,
            })
            console.log(tx)
            addTransaction(tx, {
              summary: `${i18n._(t`Bridge `)} ${tokenToBridge.anyToken.symbol}`,
              destChainId: chainTo.id.toString(),
              srcChaindId: chainFrom.id.toString(),
              pairId: tokenToBridge.id,
            })
          }
          push('/bridge/history')
        }
      } else {
        console.log(currency0)

        if (currency0.name == 'Fantom') {
          console.log('yes name')
          console.log(anyswapCurrencyContract)

          const fn = anyswapCurrencyContract?.interface?.getFunction('anySwapOutNative(address,address,uint256)')
          const data = anyswapCurrencyContract.interface.encodeFunctionData(fn, [
            tokenToBridge.anyToken.address,
            account,
            chainTo.id.toString(),
          ])
          const tx = await library.getSigner().sendTransaction({
            from: account,
            to: anyswapCurrencyContract.address,
            value: amountToBridge,
            data,
          })
          addTransaction(tx, {
            summary: `${i18n._(t`Bridge `)} ${tokenToBridge.anyToken.symbol}`,
            destChainId: chainTo.id.toString(),
            srcChaindId: chainFrom.id.toString(),
            pairId: tokenToBridge.tokenId,
          })
          push('/bridge/history')
        } else if (currency0.isToken) {
          const fn = currencyContract?.interface?.getFunction('transfer')
          const data = currencyContract.interface.encodeFunctionData(fn, [depositAddress, amountToBridge.toString()])
          const tx = await library.getSigner().sendTransaction({
            value: 0x0,
            from: account,
            to: currency0.address,
            data,
          })
          addTransaction(tx, {
            summary: `${i18n._(t`Bridge `)} ${tokenToBridge.anyToken.symbol}`,
            destChainId: chainTo.id.toString(),
            srcChaindId: chainFrom.id.toString(),
            pairId: tokenToBridge.tokenId,
          })
          push('/bridge/history')
        }
      }
    } catch (ex) {
    } finally {
      setPendingTx(false)
    }
  }

  const anyswapChains = [ChainId.MOONBEAM, ChainId.FANTOM]
  const availableChains = Object.keys(anyswapInfo || {})
    .map((r) => parseInt(r))
    .filter((r) => anyswapChains.includes(r))

  return (
    <>
      <Modal isOpen={showConfirmation} onDismiss={() => setShowConfirmation(false)}>
        <div className="space-y-4 mb-6">
          <ModalHeader title={i18n._(t`Bridge ${currency0?.symbol}`)} onClose={() => setShowConfirmation(false)} />
          <Typography variant="sm" className="font-medium text-center text-white">
            {i18n._(t`You are sending ${formatNumber(currencyAmount)} ${currency0?.symbol} from ${chainFrom?.name}`)}
          </Typography>
          <Typography variant="sm" className="font-medium text-center text-white">
            {i18n._(t`You will receive ${formatNumber(getAmountToReceive())} ${currency0?.symbol} on ${chainTo?.name}`)}
          </Typography>

          <Button
            className="bg-linear-gradient block ml-auto mr-auto"
            size="lg"
            disabled={pendingTx}
            onClick={() => bridgeToken()}
            style={{ lineHeight: '16px' }}
          >
            <Typography variant="lg">
              {pendingTx ? (
                <div className={'p-2'}>
                  <AutoRow gap="6px" justify="center">
                    {buttonText} <Loader stroke="white" />
                  </AutoRow>
                </div>
              ) : (
                i18n._(t`Bridge ${currency0?.symbol}`)
              )}
            </Typography>
          </Button>
        </div>
      </Modal>

      <Head>
        <title>{i18n._(t`Bridge`)} | Beamswap</title>
        <meta key="description" name="description" content="Bridge" />
      </Head>

      <Container maxWidth="2xl" className="space-y-6">
        <DoubleGlowShadow opacity="0.6">
          <div className="p-4 space-y-4 bg-blue z-11 bridge-container" style={{ zIndex: 11, borderRadius: 2 }}>
            <div className="p-4 text-center">
              <div className="justify-between space-x-3 items-center">
                <Typography component="h3" variant="base" className="text-aqua">
                  {i18n._(t`Bridge FTM to Moonbeam`)}
                </Typography>
              </div>
            </div>

            <div className="flex flex-row justify-between items-center text-center chain-select">
              <ChainSelect
                availableChains={availableChains}
                label="From Network"
                chain={chainFrom}
                otherChain={chainTo}
                onChainSelect={(chain) => handleChainFrom(chain)}
                switchOnSelect={true}
              />
              <div className="sm:m-3">
                <ArrowRight width={20} height={20} style={{ color: '#00FFFF' }} />
              </div>
              <ChainSelect
                availableChains={availableChains}
                label="To Network"
                chain={chainTo}
                otherChain={chainFrom}
                onChainSelect={(chain) => handleChainTo(chain)}
                switchOnSelect={false}
              />
            </div>

            <DualChainCurrencyInputPanel
              label={i18n._(t`Token to bridge:`)}
              value={currencyAmount}
              currency={currency0}
              onUserInput={handleTypeInput}
              onMax={(amount) => handleTypeInput(amount)}
              onCurrencySelect={(currency) => {
                handleCurrencySelect(currency)
              }}
              chainFrom={chainFrom}
              chainTo={chainTo}
              tokenList={tokenList}
              chainList={anyswapInfo}
            />

            <BottomGrouping>
              {!account ? (
                <Web3Connect size="lg" color="gradient" className="w-full" />
              ) : (
                <Button
                  onClick={() => setShowConfirmation(true)}
                  color={buttonDisabled ? 'gray' : 'gradient'}
                  size="lg"
                  style={{ height: 56 }}
                  disabled={buttonDisabled}
                >
                  {pendingTx ? (
                    <div className={'p-2'}>
                      <AutoRow gap="6px" justify="center">
                        {buttonText} <Loader stroke="white" />
                      </AutoRow>
                    </div>
                  ) : (
                    buttonText
                  )}
                </Button>
              )}
            </BottomGrouping>

            {currency0 && (
              <div className={'p-2 sm:p-5 rounded bg-deepCove'}>
                {tokenToBridge?.destChains[chainTo.id]?.MinimumSwapFee > 0 && (
                  <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                    <div className="text-sm font-medium text-jordyBlue">
                      Minimum Bridge Fee: {formatNumber(tokenToBridge?.destChains[chainTo.id]?.MinimumSwapFee)}{' '}
                      {tokenToBridge?.destChains[chainTo.id]?.Symbol}
                    </div>
                  </div>
                )}
                {tokenToBridge?.destChains[chainTo.id]?.MaximumSwapFee > 0 && (
                  <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                    <div className="text-sm font-medium text-jordyBlue">
                      Maximum Bridge Fee: {formatNumber(tokenToBridge?.destChains[chainTo.id]?.MaximumSwapFee)}{' '}
                      {tokenToBridge?.destChains[chainTo.id]?.Symbol}
                    </div>
                  </div>
                )}
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-jordyBlue">
                    Minimum Bridge Amount: {formatNumber(tokenToBridge?.destChains[chainTo.id]?.MinimumSwap)}{' '}
                    {tokenToBridge?.destChains[chainTo.id]?.Symbol}
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-jordyBlue">
                    Maximum Bridge Amount: {formatNumber(tokenToBridge?.destChains[chainTo.id]?.MaximumSwap)}{' '}
                    {tokenToBridge?.destChains[chainTo.id]?.Symbol}
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-jordyBlue">
                    Fee: {formatNumber(tokenToBridge?.destChains[chainTo.id]?.SwapFeeRate * 100)} %
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-jordyBlue">
                    Amounts greater than {formatNumber(tokenToBridge?.destChains[chainTo.id]?.BigValueThreshold)}{' '}
                    {tokenToBridge?.destChains[chainTo.id]?.Symbol} could take up to 12 hours.
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex text-white mt-4 justify-center" style={{ zIndex: 99 }}>
            Powered by Multichain
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
