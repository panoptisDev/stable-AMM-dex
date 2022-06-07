import { ApprovalState, useApproveCallbackFromTrade } from '../../../hooks/useApproveCallback'
import { BottomGrouping, SwapCallbackError } from '../../../features/swap/styleds'
import { AutoRow, RowBetween } from '../../../components/Row'
import { ButtonConfirmed, ButtonError } from '../../../components/Button'
import { Currency, CurrencyAmount, JSBI, Token, TradeType, Trade as V2Trade, WETH9 } from '../../../sdk'
import Column, { AutoColumn } from '../../../components/Column'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAllTokens, useCurrency } from '../../../hooks/Tokens'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../../state/swap/hooks'
import {
  useExpertModeManager,
  useUserSingleHopOnly,
  useUserSlippageTolerance,
  useUserTransactionTTL,
} from '../../../state/user/hooks'
import useWrapCallback, { WrapType } from '../../../hooks/useWrapCallback'

import AddressInputPanel from '../../../components/AddressInputPanel'
import Button from '../../../components/Button'
import ConfirmSwapModal from '../../../features/swap/ConfirmSwapModal'
import CurrencyInputPanel from '../../../components/CurrencyInputPanel'
import { Field } from '../../../state/swap/actions'
import Head from 'next/head'
import Loader from '../../../components/Loader'
import Lottie from 'lottie-react'
import ProgressSteps from '../../../components/ProgressSteps'
import ReactGA from 'react-ga'
import SwapHeader from '../../../components/ExchangeHeader'
import TokenWarningModal from '../../../modals/TokenWarningModal'
import TradePrice from '../../../features/swap/TradePrice'
import UnsupportedCurrencyFooter from '../../../features/swap/UnsupportedCurrencyFooter'
import Web3Connect from '../../../components/Web3Connect'
import { computeFiatValuePriceImpact } from '../../../functions/trade'
import confirmPriceImpactWithoutFee from '../../../features/swap/confirmPriceImpactWithoutFee'
import { maxAmountSpend } from '../../../functions/currency'
import swapArrowsAnimationData from '../../../animation/swap-arrows.json'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import useENSAddress from '../../../hooks/useENSAddress'
import useIsArgentWallet from '../../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../../hooks/useIsSwapUnsupported'
import { useSwapCallback } from '../../../hooks/useSwapCallback'
import { useUSDCValue } from '../../../hooks/useUSDCPrice'
import { warningSeverity } from '../../../functions/prices'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import Charts from '../../../components/Charts'
import { computePairAddress } from '../../../functions/computePairAddress'
import { FACTORY_ADDRESS } from '../../../constants'
import {
  useFifteenMinBlock,
  useFiveMinBlock,
  useForHourMinBlock,
  useOneDayBlock,
  useOneHourMinBlock,
  useSushiPairs,
} from '../../../services/graph'
import { formatNumber, formatPercent } from '../../../functions'
import { getAddress } from '@ethersproject/address'

export default function Swap() {
  const { i18n } = useLingui()

  const loadedUrlParams = useDefaultsFromURLSearch()
  const tokens = useAllTokens()
  const userSlippageTolerance = useUserSlippageTolerance()

  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const defaultTokens = useAllTokens()

  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const { account, chainId } = useActiveWeb3React()

  const [isExpertMode] = useExpertModeManager()

  const [ttl] = useUserTransactionTTL()

  const { independentField, typedValue, recipient } = useSwapState()
  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    allowedSlippage,
  } = useDerivedSwapInfo(false)

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, trade]
  )

  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT])
  const priceImpact = computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const initalToken0 = {
    address: '0xacc15dc74880c9944775448304b263d191c6077f',
    symbol: 'GLMR',
    decimals: 18,
  }

  const [janToken0, setJanToken0] = useState<any>()
  const [janToken1, setJanToken1] = useState<any>()

  const initalToken1 = { address: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b', symbol: 'USDC', decimals: 6 }
  const [inputCurrency, setInputCurrency] = useState<any>()
  const [outputCurrency, setOutputCurrency] = useState<any>()

  const block1d = useOneDayBlock({ chainId, shouldFetch: !!chainId })
  const block5m = useFiveMinBlock({ chainId, shouldFetch: !!chainId })
  const block15m = useFifteenMinBlock({ chainId, shouldFetch: !!chainId })
  const block1hr = useOneHourMinBlock({ chainId, shouldFetch: !!chainId })
  const block4hr = useForHourMinBlock({ chainId, shouldFetch: !!chainId })

  const [token0, setToken0] = useState('') //0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b
  const [token1, setToken1] = useState('')
  const [lpAddress, setLpAddress] = useState('0xb929914b89584b4081c7966ac6287636f7efd053')
  const [chartHistory, setchartHistory] = useState<any>()

  const swapPairs = useSushiPairs({
    chainId,
    variables: {
      where: {
        id_in: [lpAddress.toString().toLowerCase()],
      },
    },
    shouldFetch: !!lpAddress,
  })
  const swapPairs1d = useSushiPairs({
    chainId,
    variables: {
      block: chartHistory,
      where: {
        id_in: [lpAddress.toString().toLowerCase()],
      },
    },
    shouldFetch: !!chartHistory && !!lpAddress,
  })

  const swapPair = swapPairs?.find((pair) => pair.id === lpAddress.toString().toLowerCase())
  const swapPair1d = swapPairs1d?.find((pair) => pair.id === lpAddress.toString().toLowerCase())
  const diff = Number(swapPair?.token0Price) - Number(swapPair1d?.token0Price)
  const percDiff = (Number(swapPair?.token0Price) * 100) / Number(swapPair1d?.token0Price) - 100

  const date = new Date()
  const [chartTimeFrame, setChartTimeFrame] = useState(300)

  const isValid = !swapInputError

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: V2Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const routeNotFound = !trade?.route

  const [approvalState, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage, false)

  const signatureData = undefined

  const handleApprove = useCallback(async () => {
    await approveCallback()
  }, [approveCallback])

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  useEffect(() => {
    if (!chartHistory) {
      setchartHistory(block5m)
    }
  }, [block5m])

  useEffect(() => {
    if (currencies[Field.INPUT]?.isNative) {
      setToken0(WETH9[chainId].address.toLowerCase())
    } else {
      setToken0(currencies[Field.INPUT]?.wrapped?.address.toLowerCase())
    }
    if (currencies[Field.OUTPUT]?.isNative) {
      setToken1(WETH9[chainId].address.toLowerCase())
    } else {
      setToken1(currencies[Field.OUTPUT]?.wrapped?.address.toLowerCase())
    }
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }

    if (inputCurrency && outputCurrency) {
      if (inputCurrency?.address != outputCurrency?.address) {
        const tokenA = new Token(chainId, inputCurrency.address, inputCurrency.decimals)
        const tokenB = new Token(chainId, outputCurrency.address, outputCurrency.decimals)
        setLpAddress(
          computePairAddress({
            factoryAddress: FACTORY_ADDRESS[chainId],
            tokenA: tokenA,
            tokenB: tokenB,
          })
        )
      } else {
        //set inital pair

        const tokenAinit = new Token(chainId, initalToken0.address, 18)
        const tokenBinit = new Token(chainId, initalToken1.address, 6)
        setToken0(initalToken0.address)
        setToken1(initalToken1.address)
        setLpAddress(
          computePairAddress({
            factoryAddress: FACTORY_ADDRESS[chainId],
            tokenA: tokenAinit,
            tokenB: tokenBinit,
          })
        )
      }
    }
  }, [approvalState, approvalSubmitted, inputCurrency, outputCurrency, chartHistory])

  if (lpAddress == '' || lpAddress == undefined) {
    const tokenA = new Token(chainId, initalToken0.address, 18)
    const tokenB = new Token(chainId, initalToken1.address, 6)
    setLpAddress(
      computePairAddress({
        factoryAddress: FACTORY_ADDRESS[chainId],
        tokenA: tokenA,
        tokenB: tokenB,
      })
    )
  }

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    recipient,
    signatureData,
    false ? ttl : undefined
  )

  const [singleHopOnly] = useUserSingleHopOnly()

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return
    }
    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
    })
    swapCallback()
      .then((hash) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: undefined,
          txHash: hash,
        })

        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
          label: [
            trade?.inputAmount?.currency?.symbol,
            trade?.outputAmount?.currency?.symbol,
            singleHopOnly ? 'SH' : 'MH',
          ].join('/'),
        })

        ReactGA.event({
          category: 'Routing',
          action: singleHopOnly ? 'Swap with multihop disabled' : 'Swap with multihop enabled',
        })
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [
    swapCallback,
    priceImpact,
    tradeToConfirm,
    showConfirm,
    recipient,
    recipientAddress,
    account,
    trade?.inputAmount?.currency?.symbol,
    trade?.outputAmount?.currency?.symbol,
    singleHopOnly,
  ])

  const [showInverted, setShowInverted] = useState<boolean>(false)

  const priceImpactSeverity = useMemo(() => {
    const executionPriceImpact = trade?.priceImpact
    return warningSeverity(
      executionPriceImpact && priceImpact
        ? executionPriceImpact.greaterThan(priceImpact)
          ? executionPriceImpact
          : priceImpact
        : executionPriceImpact ?? priceImpact
    )
  }, [priceImpact, trade])

  const isArgentWallet = useIsArgentWallet()

  const showApproveFlow =
    !isArgentWallet &&
    !swapInputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({
      showConfirm: false,
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setJanToken0(inputCurrency)
      console.log('setting input')
      console.log(inputCurrency)

      const tokenB = tokens[getAddress(!token1 ? initalToken1.address : token1)]
      let currency
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
      if (inputCurrency.isNative) {
        currency = {
          address: WETH9[chainId].address,
          symbol: 'GLMR',
          decimals: 18,
        }
        setInputCurrency(currency)
        setToken0(WETH9[chainId].address)
      } else {
        currency = {
          address: inputCurrency?.wrapped.address,
          symbol: inputCurrency?.wrapped.symbol,
          decimals: inputCurrency?.wrapped.decimals,
        }
        setInputCurrency(inputCurrency?.wrapped)
        setToken0(inputCurrency?.wrapped.address.toString().toLowerCase())
      }
      const tokenA = tokens[getAddress(inputCurrency.wrapped.address)]
      if (tokenA.address != tokenB.address) {
        setLpAddress(
          computePairAddress({
            factoryAddress: FACTORY_ADDRESS[chainId],
            tokenA: tokenA,
            tokenB: tokenB,
          })
        )
      } else {
        //set inital pair
        const tokenAinit = new Token(chainId, initalToken0.address, 18)
        const tokenBinit = new Token(chainId, initalToken1.address, 6)
        setToken0(initalToken0.address)
        setToken1(initalToken1.address)
        setLpAddress(
          computePairAddress({
            factoryAddress: FACTORY_ADDRESS[chainId],
            tokenA: tokenAinit,
            tokenB: tokenBinit,
          })
        )
      }
    },
    [onCurrencySelection, token0]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      setJanToken1(outputCurrency)

      const tokenA = tokens[getAddress(!token0 ? initalToken0.address : token0)]
      let currency
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      if (outputCurrency.isNative) {
        currency = {
          address: WETH9[chainId].address,
          symbol: 'GLMR',
          decimals: 18,
        }
        setOutputCurrency(currency)
        setToken1(WETH9[chainId].address)
      } else {
        currency = {
          address: outputCurrency?.wrapped.address,
          symbol: outputCurrency?.wrapped.symbol,
          decimals: outputCurrency?.wrapped.decimals,
        }
        setOutputCurrency(outputCurrency?.wrapped)
        setToken1(outputCurrency?.wrapped.address.toString().toLowerCase())
      }

      const tokenB = tokens[getAddress(currency.address)]
      if (tokenA.address != tokenB.address) {
        setLpAddress(
          computePairAddress({
            factoryAddress: FACTORY_ADDRESS[chainId],
            tokenA: tokenA,
            tokenB: tokenB,
          })
        )
      } else {
        //set inital pair

        const tokenAinit = new Token(chainId, initalToken0.address, 18)
        const tokenBinit = new Token(chainId, initalToken1.address, 6)
        setToken0(initalToken0.address)
        setToken1(initalToken1.address)
        setLpAddress(
          computePairAddress({
            factoryAddress: FACTORY_ADDRESS[chainId],
            tokenA: tokenAinit,
            tokenB: tokenBinit,
          })
        )
      }
    },
    [onCurrencySelection, token1]
  )

  // if(defaultTokens) {
  //   onCurrencySelection(Field.INPUT, defaultTokens[0xAcc15dC74880C9944775448304B263D191c6077F])
  //   onCurrencySelection(Field.OUTPUT, defaultTokens[0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b])
  // }

  const swapIsUnsupported = useIsSwapUnsupported(currencies?.INPUT, currencies?.OUTPUT)

  const [animateSwapArrows, setAnimateSwapArrows] = useState<boolean>(false)
  //console.log(token0);
  //console.log(token1);

  return (
    <>
       <Head>
        <title> Beamswap | Exchange</title>
        <meta
          name="description"
          content="Beamswap Swap, earn, launch your projects and more. All in one place and simple to use."
        />
      </Head>

      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
      />

      <div className="swap-container flex justify-center" style={{ zIndex: 2 }}>
        <div className="mt-12 p-5 bg-blue hidden md:flex-col md:flex" style={{ zIndex: 10, minWidth: 600 }}>
          <div className="flex justify-between mt-6 mb-5 items-center">
            <div className="flex justify-center font-bold">
              <img
                className="flex items-center"
                src={
                  inputCurrency
                    ? '/images/tokens/' + inputCurrency?.symbol.toString().toLowerCase() + '.png'
                    : '/images/tokens/' + loadedInputCurrency?.symbol.toString().toLowerCase() + '.png'
                }
                width={36}
                height={36}
              />
              <span className="ml-2 text-lg text-white font-bold" style={{ fontSize: 22 }}>
                {inputCurrency && inputCurrency.symbol} {!inputCurrency && loadedInputCurrency?.symbol}
              </span>
              <span className="ml-2 mr-2 text-lg font-bold" style={{ fontSize: 22 }}>
                /
              </span>
              <img
                className="flex items-center"
                src={
                  outputCurrency
                    ? '/images/tokens/' + outputCurrency?.symbol.toString().toLowerCase() + '.png'
                    : '/images/tokens/' + loadedOutputCurrency?.symbol.toString().toLowerCase() + '.png'
                }
                width={36}
                height={36}
              />
              <span className="ml-2 text-lg text-white font-bold" style={{ fontSize: 22 }}>
                {outputCurrency && outputCurrency.symbol} {!outputCurrency && loadedOutputCurrency?.symbol}
              </span>
            </div>
            <div className="px-3 py-1 bg-darkBlue text-white text-sm" style={{ border: '2px solid #1F357D' }}>
              {date.toUTCString().split(',')[1].split(' GMT')[0]}
            </div>
          </div>
          <div className="font-bold">
            <span className="text-xl font-bold text-white" style={{ fontSize: 40 }}>
              {formatNumber(swapPair?.token0Price, false)}
            </span>
            <span className="text-xl font-bold ml-3" style={{ color: diff < 0 ? '#ef5350' : '#00FFFF' }}>
              {formatNumber(diff, false)}({formatPercent(percDiff)})
            </span>
          </div>
          <div className="flex justify-center mt-2 mb-5">
            <div
              onClick={() => {
                setchartHistory(block5m)
                setChartTimeFrame(300)
              }}
              className={
                chartTimeFrame == 300
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              5M
            </div>
            <div
              onClick={() => {
                setchartHistory(block15m)
                setChartTimeFrame(900)
              }}
              className={
                chartTimeFrame == 900
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              15M
            </div>
            <div
              onClick={() => {
                setchartHistory(block1hr)
                setChartTimeFrame(3600)
              }}
              className={
                chartTimeFrame == 3600
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              1H
            </div>
            <div
              onClick={() => {
                setchartHistory(block4hr)
                setChartTimeFrame(14400)
              }}
              className={
                chartTimeFrame == 14400
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              4H
            </div>
            <div
              onClick={() => {
                setchartHistory(block1d)
                setChartTimeFrame(86400)
              }}
              className={
                chartTimeFrame == 86400
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              1D
            </div>
            <div
              onClick={() => {
                setChartTimeFrame(604800)
              }}
              className={
                chartTimeFrame == 604800
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              1W
            </div>
            <div
              onClick={() => {
                setChartTimeFrame(2592000)
              }}
              className={
                chartTimeFrame == 2592000
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              1M
            </div>
            <div
              onClick={() => {
                setChartTimeFrame(31556926)
              }}
              className={
                chartTimeFrame == 31556926
                  ? 'bg-lightBlueSecondary text-aqua px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
                  : 'px-6 py-1 bg-deepCove text-jordyBlue w-1/8 cursor-pointer'
              }
            >
              1Y
            </div>
          </div>
          <div>
            <Charts
              chartTimeFrame={chartTimeFrame}
              //  token0={janToken0?.tokenInfo ? janToken0.tokenInfo.address.toLowerCase() : initalToken0.address}
              // token1={janToken1?.tokenInfo ? janToken1.tokenInfo.address.toLowerCase() : initalToken1.address}
              token0={token0 ? token0.toLowerCase() : initalToken0.address}
              token1={token1 ? token1.toLowerCase() : initalToken1.address}
            ></Charts>
          </div>
        </div>
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <img className="swap-glow" src="/images/landing-glow.png" />
          <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
          <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />
          <div id="swap-page" className="w-full max-w-2xl p-5 space-y-4 rounded bg-dark-900 z-1">
            <div className="swap-nav">
              <div className="primary">
                <a href="/exchange/swap">Exchange</a>
              </div>
              <div className="secondary">
                <a href="/exchange/pool">Liquidity</a>
              </div>
            </div>
            <SwapHeader
              input={currencies[Field.INPUT]}
              output={currencies[Field.OUTPUT]}
              allowedSlippage={allowedSlippage}
            />
            <ConfirmSwapModal
              isOpen={showConfirm}
              trade={trade}
              originalTrade={tradeToConfirm}
              onAcceptChanges={handleAcceptChanges}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              allowedSlippage={allowedSlippage}
              onConfirm={handleSwap}
              swapErrorMessage={swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              minerBribe={undefined}
            />
            <div className="input-container">
              <CurrencyInputPanel
                label={independentField === Field.OUTPUT && !showWrap ? i18n._(t`From`) : i18n._(t`From`)}
                value={formattedAmounts[Field.INPUT]}
                showMaxButton={showMaxButton}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                fiatValue={fiatValueInput ?? undefined}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                showCommonBases={true}
                id="swap-currency-input"
              />
              <AutoColumn justify="space-between" className="py-5">
                <AutoRow justify={isExpertMode ? 'center' : 'center'}>
                  <div className="swap-blue-border"></div>
                  <button
                    className="z-10 -mt-6 -mb-6 rounded-full"
                    onClick={() => {
                      setApprovalSubmitted(false) // reset 2 step UI for approvals
                      onSwitchTokens()
                    }}
                  >
                    <div className="rounded-full p-3px m-4" style={{ background: '#132562', borderRadius: 2 }}>
                      <div
                        className="p-1 rounded-full"
                        onMouseEnter={() => setAnimateSwapArrows(true)}
                        onMouseLeave={() => setAnimateSwapArrows(false)}
                      >
                        <Lottie
                          animationData={swapArrowsAnimationData}
                          autoplay={animateSwapArrows}
                          loop={false}
                          style={{ width: 26, height: 26 }}
                        />
                      </div>
                    </div>
                  </button>
                  <div className="swap-blue-border"></div>
                  {isExpertMode ? (
                    recipient === null && !showWrap ? (
                      <Button
                        variant="link"
                        size="none"
                        id="add-recipient-button"
                        className="text-aqua mt-4"
                        onClick={() => onChangeRecipient('')}
                      >
                        + Add recipient (optional)
                      </Button>
                    ) : (
                      <Button
                        variant="link"
                        size="none"
                        id="remove-recipient-button"
                        className="text-aqua mt-4"
                        onClick={() => onChangeRecipient(null)}
                      >
                        - {i18n._(t`Remove recipient`)}
                      </Button>
                    )
                  ) : null}
                </AutoRow>
              </AutoColumn>
              <div>
                <CurrencyInputPanel
                  value={formattedAmounts[Field.OUTPUT]}
                  onUserInput={handleTypeOutput}
                  label={independentField === Field.INPUT && !showWrap ? i18n._(t`To`) : i18n._(t`To`)}
                  showMaxButton={false}
                  hideBalance={false}
                  fiatValue={fiatValueOutput ?? undefined}
                  priceImpact={priceImpact}
                  currency={currencies[Field.OUTPUT]}
                  onCurrencySelect={handleOutputSelect}
                  otherCurrency={currencies[Field.INPUT]}
                  showCommonBases={true}
                  id="swap-currency-output"
                />
                {Boolean(trade) && (
                  <div className="-mt-2  rounded-b-md bg-darkBlue" style={{ padding: 20 }}>
                    <TradePrice
                      price={trade?.executionPrice}
                      showInverted={showInverted}
                      setShowInverted={setShowInverted}
                      className="bg-blue"
                      trade={trade}
                    />
                  </div>
                )}
              </div>
            </div>

            {recipient !== null && !showWrap && (
              <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
            )}
            <div className="text-white font-bold" style={{ padding: 2 }}>
              <BottomGrouping>
                {swapIsUnsupported ? (
                  <Button color="red" size="lg" disabled>
                    {i18n._(t`Unsupported Asset`)}
                  </Button>
                ) : !account ? (
                  <Web3Connect size="lg" className="w-full bg-linear-gradient" style={{ height: 56 }} />
                ) : showWrap ? (
                  <Button
                    size="lg"
                    className="font-bold text-light bg-linear-gradient"
                    disabled={Boolean(wrapInputError)}
                    onClick={onWrap}
                  >
                    {wrapInputError ??
                      (wrapType === WrapType.WRAP
                        ? i18n._(t`Wrap`)
                        : wrapType === WrapType.UNWRAP
                        ? i18n._(t`Unwrap`)
                        : null)}
                  </Button>
                ) : routeNotFound && userHasSpecifiedInputOutput ? (
                  <div style={{ textAlign: 'center' }}>
                    <div className="mb-1 p-3">{i18n._(t`Insufficient liquidity for this trade`)}</div>
                    {singleHopOnly && <div className="mb-1">{i18n._(t`Try enabling multi-hop trades`)}</div>}
                  </div>
                ) : showApproveFlow ? (
                  <RowBetween>
                    {approvalState !== ApprovalState.APPROVED && (
                      <ButtonConfirmed
                        onClick={handleApprove}
                        disabled={approvalState !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                      >
                        {approvalState === ApprovalState.PENDING ? (
                          <AutoRow gap="6px" justify="center">
                            Approving <Loader stroke="white" />
                          </AutoRow>
                        ) : (
                          i18n._(t`Approve ${currencies[Field.INPUT]?.symbol}`)
                        )}
                      </ButtonConfirmed>
                    )}
                    {approvalState === ApprovalState.APPROVED && (
                      <ButtonError
                        className="font-bold text-light"
                        onClick={() => {
                          if (isExpertMode) {
                            handleSwap()
                          } else {
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                          }
                        }}
                        style={{
                          width: '100%',
                        }}
                        id="swap-button"
                        disabled={
                          !isValid ||
                          approvalState !== ApprovalState.APPROVED ||
                          (priceImpactSeverity > 3 && !isExpertMode)
                        }
                        error={isValid && priceImpactSeverity > 2}
                      >
                        {priceImpactSeverity > 3 && !isExpertMode
                          ? i18n._(t`Price Impact High`)
                          : priceImpactSeverity > 2
                          ? i18n._(t`Swap Anyway`)
                          : i18n._(t`Swap`)}
                      </ButtonError>
                    )}
                  </RowBetween>
                ) : (
                  <ButtonError
                    onClick={() => {
                      if (isExpertMode) {
                        handleSwap()
                      } else {
                        setSwapState({
                          tradeToConfirm: trade,
                          attemptingTxn: false,
                          swapErrorMessage: undefined,
                          showConfirm: true,
                          txHash: undefined,
                        })
                      }
                    }}
                    id="swap-button"
                    className="bg-linear-gradient"
                    style={{ height: 56 }}
                    disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                    error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
                  >
                    {swapInputError
                      ? swapInputError
                      : priceImpactSeverity > 3 && !isExpertMode
                      ? i18n._(t`Price Impact Too High`)
                      : priceImpactSeverity > 2
                      ? i18n._(t`Swap Anyway`)
                      : i18n._(t`Swap`)}
                  </ButtonError>
                )}
                {showApproveFlow && (
                  <Column style={{ marginTop: '1rem' }}>
                    <ProgressSteps steps={[approvalState === ApprovalState.APPROVED]} />
                  </Column>
                )}
                {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
              </BottomGrouping>
            </div>
            {!swapIsUnsupported ? null : (
              <UnsupportedCurrencyFooter show={swapIsUnsupported} currencies={[currencies.INPUT, currencies.OUTPUT]} />
            )}
            <div className="bg-darkBlue flex text-center justify-center p-2" style={{ color: '#A589FF' }}>
              Slippage Tolerance: {userSlippageTolerance === 'auto' ? 'auto' : userSlippageTolerance.toFixed(2)}%
            </div>
          </div>
        </DoubleGlowShadow>
      </div>
    </>
  )
}
