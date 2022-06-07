import styled from 'styled-components'
import { ApprovalState, useApproveCallback } from '../../../../hooks/useApproveCallback'
import { Plus } from 'react-feather'
import { AutoRow, RowBetween } from '../../../../components/Row'
import { ButtonConfirmed, ButtonError } from '../../../../components/Button'
import { Currency, NATIVE, Percent, WNATIVE } from '../../../../sdk'
import React, { useCallback, useMemo, useState } from 'react'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../../../modals/TransactionConfirmationModal'
import { calculateGasMargin, calculateSlippageAmount } from '../../../../functions/trade'
import { useBurnActionHandlers, useBurnState, useDerivedBurnInfo } from '../../../../state/burn/hooks'
import { usePairContract, useRouterContract } from '../../../../hooks/useContract'
import { ChevronDownIcon } from '@heroicons/react/solid'

import { ArrowDownIcon } from '@heroicons/react/solid'
import { AutoColumn } from '../../../../components/Column'
import { BigNumber } from '@ethersproject/bignumber'
import Button from '../../../../components/Button'
import Container from '../../../../components/Container'
import { Contract } from '@ethersproject/contracts'
import CurrencyLogo from '../../../../components/CurrencyLogo'
import Image from '../../../../components/Image'
import Dots from '../../../../components/Dots'
import { Field } from '../../../../state/burn/actions'
import Head from 'next/head'
import Header from '../../../../components/ExchangeHeader'
import Link from 'next/link'
import { MinimalPositionCard } from '../../../../components/PositionCard'
import NavLink from '../../../../components/NavLink'
import PercentInputPanel from '../../../../components/PercentInputPanel'
import ReactGA from 'react-ga'
import { TransactionResponse } from '@ethersproject/providers'
import Web3Connect from '../../../../components/Web3Connect'
import { currencyId } from '../../../../functions/currency'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../../hooks/useActiveWeb3React'
import { useCurrency } from '../../../../hooks/Tokens'
import useDebouncedChangeHandler from '../../../../hooks/useDebouncedChangeHandler'
import { useDerivedMintInfo } from '../../../../state/mint/hooks'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import { useTransactionAdder } from '../../../../state/transactions/hooks'
import useTransactionDeadline from '../../../../hooks/useTransactionDeadline'
import { useUserSlippageToleranceWithDefault } from '../../../../state/user/hooks'
import { useV2LiquidityTokenPermit } from '../../../../hooks/useERC20Permit'
import { useWalletModalToggle } from '../../../../state/application/hooks'
import DoubleGlowShadow from '../../../../components/DoubleGlowShadow'

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

const CurrencyInput = styled.input<{
  error?: boolean
  fontSize?: string
  align?: string
}>`
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text1)};
  width: 0;
  position: relative;
  font-weight: 500;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: transparent;
  font-size: ${({ fontSize }) => fontSize ?? '24px'};
  text-align: ${({ align }) => align && align};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

export default function Remove() {
  const { i18n } = useLingui()
  const router = useRouter()
  const [currencyValue, setCurrencyValue] = useState('')
  const tokens = router.query.tokens
  const [currencyIdA, currencyIdB] = tokens || [undefined, undefined]
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const [tokenA, tokenB] = useMemo(() => [currencyA?.wrapped, currencyB?.wrapped], [currencyA, currencyB])
  const decimalRegex = RegExp(`^\\d*\.?\\d*$`)

  // toggle wallet when disconnected

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
  const [selectedToken, setSelectedToken] = useState('All Tokens')
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // Will be updated with real values
  const currencyAPercent = 30
  const currencyBPercent = 20
  const currencyCPercent = 50

  const [currencyAValue, setCurrencyAValue] = useState<number>()
  const [currencyBValue, setCurrencyBValue] = useState<number>()
  const [currencyCValue, setCurrencyCValue] = useState<number>()

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE)

  // const formattedAmounts = {
  //   [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
  //     ? '0'
  //     : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
  //     ? '<1'
  //     : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
  //   [Field.LIQUIDITY]:
  //     independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
  //   [Field.CURRENCY_A]:
  //     independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
  //   [Field.CURRENCY_B]:
  //     independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  //   [Field.CURRENCY_C]:
  //     independentField === Field.CURRENCY_C ? typedValue : parsedAmounts[Field.CURRENCY_C]?.toSignificant(6) ?? '',
  // }

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // router contract
  const routerContract = useRouterContract()

  // allowance handling
  const { gatherPermitSignature, signatureData } = useV2LiquidityTokenPermit(
    parsedAmounts[Field.LIQUIDITY],
    routerContract?.address
  )

  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], routerContract?.address)

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code !== 4001) {
          await approveCallback()
        }
      }
    } else {
      await approveCallback()
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      return _onUserInput(field, typedValue)
    },
    [_onUserInput]
  )

  // tx sending
  const addTransaction = useTransactionAdder()

  async function onRemove() {
    if (!chainId || !library || !account || !deadline || !router) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB.isNative
    const oneCurrencyIsETH = currencyA.isNative || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString(),
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.quotient.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          deadline.toHexString(),
        ]
      }
    }
    // we have a signature, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.quotient.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName) =>
        routerContract.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch((error) => {
            console.error(`estimateGas failed`, methodName, args, error)
            return BigNumber.from('1000000')
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await routerContract[methodName](...args, {
        gasLimit: safeGasEstimate,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: t`Remove ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
              currencyA?.symbol
            } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencyB?.symbol}`,
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Remove',
            label: [currencyA?.symbol, currencyB?.symbol].join('/'),
          })
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error)
        })
    }
  }

  function getReceivingValue(tokenName, removingAmount, checkFunction) {
    if (checkFunction === 1) {
      setCurrencyValue(removingAmount)
    } else {
      setSelectedToken(tokenName)
    }

    if (tokenName == 'All Tokens') {
      setCurrencyAValue((removingAmount / 100) * currencyAPercent)
      setCurrencyBValue((removingAmount / 100) * currencyBPercent)
      setCurrencyCValue((removingAmount / 100) * currencyCPercent)
    } else if (tokenName == 'USDC') {
      setCurrencyAValue(removingAmount)
      setCurrencyBValue(0)
      setCurrencyCValue(0)
    } else if (tokenName == 'USDT') {
      setCurrencyAValue(0)
      setCurrencyBValue(removingAmount)
      setCurrencyCValue(0)
    } else if (tokenName == 'BUSD') {
      setCurrencyAValue(0)
      setCurrencyBValue(0)
      setCurrencyCValue(removingAmount)
    }
  }

  function modalHeader() {
    return (
      <div className="grid gap-4 pt-3 pb-4 pl-5 pr-5">
        <div className="grid gap-2 bg-deepCove p-3 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CurrencyLogo currency={currencyA} size={48} />
              <div className="text-2xl font-bold text-high-emphesis">
                {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
              </div>
            </div>
            <div className="ml-3 text-2xl font-medium text-high-emphesis">{currencyA?.symbol}</div>
          </div>
          <div className="ml-3 mr-3 min-w-[24px] flex justify-center">
            <Plus size={24} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CurrencyLogo currency={currencyB} size={48} />
              <div className="text-2xl font-bold text-high-emphesis">
                {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
              </div>
            </div>
            <div className="ml-3 text-2xl font-medium text-high-emphesis">{currencyB?.symbol}</div>
          </div>
        </div>
        <div className="justify-start text-sm text-jordyBlue">
          {t`Output is estimated. If the price changes by more than ${allowedSlippage.toSignificant(
            4
          )}% your transaction will revert.`}
        </div>
      </div>
    )
  }

  function modalBottom() {
    return (
      <div className="p-5">
        {pair && (
          <>
            <div className="grid gap-1 bg-deepCove p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div className="text-sm text-high-emphesis">{i18n._(t`Rates`)}</div>
                <div className="text-sm font-bold justify-center items-center flex right-align pl-1.5 text-high-emphesis">
                  {`1 ${currencyA?.symbol} = ${tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} ${
                    currencyB?.symbol
                  }`}
                </div>
              </div>
              <div className="flex items-center justify-end">
                <div className="text-sm font-bold justify-center items-center flex right-align pl-1.5 text-high-emphesis">
                  {`1 ${currencyB?.symbol} = ${tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} ${
                    currencyA?.symbol
                  }`}
                </div>
              </div>
            </div>
            <div className="h-px my-6 bg-darkBlue" />
          </>
        )}
        <div className="grid gap-1 pb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-jordyBlue">{i18n._(t`${currencyA?.symbol}/${currencyB?.symbol} Burned`)}</div>
            <div className="text-sm font-bold justify-center items-center flex right-align pl-1.5 text-aqua">
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </div>
          </div>
        </div>
        <Button
          color="gradient"
          size="lg"
          disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
          onClick={onRemove}
          className="bg-linear-gradient"
          style={{ height: 57 }}
        >
          {i18n._(t`Confirm`)}
        </Button>
      </div>
    )
  }

  const pendingText = i18n._(
    t`Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${currencyA?.symbol} and ${parsedAmounts[
      Field.CURRENCY_B
    ]?.toSignificant(6)} ${currencyB?.symbol}`
  )

  const liquidityPercentChangeCallback = useCallback(
    (value: string) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value)
    },
    [onUserInput]
  )

  const oneCurrencyIsETH = currencyA?.isNative || currencyB?.isNative

  const oneCurrencyIsWETH = Boolean(
    chainId && WNATIVE[chainId] && (currencyA?.equals(WNATIVE[chainId]) || currencyB?.equals(WNATIVE[chainId]))
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    liquidityPercentChangeCallback
  )

  return (
    <>
      <Head>
        <title>{i18n._(t`Remove Liquidity`)} | Beamswap </title>
        <meta key="description" name="description" content={i18n._(t`Remove liquidity of Beamswap`)} />
      </Head>

      <Container id="remove-liquidity-page" maxWidth="2xl" className="space-y-4">
        <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
          <div className="swap-nav remove">
            <div className="primary">
              <a href="/exchange/swap">Exchange</a>
            </div>
            <div className="secondary">
              <a href="/exchange/pool">Liquidity</a>
            </div>
          </div>
          <div className="p-4 space-y-4 bg-blue" style={{ zIndex: 1 }}>
            <Header allowedSlippage={allowedSlippage} />
            <div>
              <TransactionConfirmationModal
                isOpen={showConfirm}
                onDismiss={handleDismissConfirmation}
                attemptingTxn={attemptingTxn}
                hash={txHash ? txHash : ''}
                content={() => (
                  <ConfirmationModalContent
                    title={i18n._(t`You Will Receive`)}
                    onDismiss={handleDismissConfirmation}
                    topContent={modalHeader}
                    bottomContent={modalBottom}
                  />
                )}
                pendingText={pendingText}
              />
              <AutoColumn gap="md">
                <div>
                  <div id="liquidity-percent" className="p-5 rounded bg-darkBlue">
                    <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                      <div className="w-full text-white sm:w-2/5" style={{ margin: 'auto 0px' }}>
                        {i18n._(t`Amount to Remove`)}
                      </div>
                      <div className="flex items-center w-full p-3 space-x-3 text-xl font-bold rounded bg-inputBlue sm:w-3/5">
                        <CurrencyInput
                          className="token-amount-input"
                          align="right"
                          inputMode="decimal"
                          title="Token Amount"
                          autoComplete="off"
                          autoCorrect="off"
                          type="text"
                          spellCheck="false"
                          min={0}
                          max={100}
                          minLength={1}
                          pattern="/^\d*\.?\d*$/"
                          value={currencyValue}
                          onChange={(e) => {
                            if (decimalRegex.test(e.target.value)) {
                              getReceivingValue(selectedToken, e.target.value, 1)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <AutoColumn justify="space-between" className="py-2.5">
                    <AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
                      <div className="swap-blue-border"></div>
                      <button className="rounded-sm cursor-default bg-blue">
                        <div className="rounded-sm bg-darkBlue p-1 plus-icon" style={{ margin: '0 18px' }}>
                          <ArrowDownIcon width="20px" height="20px" />
                        </div>
                      </button>
                      <div className="swap-blue-border"></div>
                    </AutoRow>
                  </AutoColumn>

                  <div id="remove-liquidity-output" className="p-5 rounded bg-darkBlue">
                    <div className="flex flex-col justify-between space-y-3 sm:space-y-0">
                      <div className="w-full text-white sm:w-2/5" style={{ width: '100%' }}>
                        <AutoColumn>
                          <div className="flex justify-between">
                            {i18n._(t`You Will Receive`)}
                            <div className="p-4 text-white text-primary hover:text-aqua focus:text-high-emphesis whitespace-nowrap cursor-pointer header-dropdown">
                              <div className="flex items-center">
                                {selectedToken}
                                <ChevronDownIcon width={20} height={20} />
                              </div>
                              <div
                                className="bg-inputBlue dropdown-content items-center justify-center"
                                style={{ border: '2px solid #1F357D', zIndex: 100 }}
                              >
                                {['All Tokens', 'USDC', 'USDT', 'BUSD'].map((tokenName, i) => (
                                  <button
                                    key={i}
                                    className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 ml-2 mr-2 mt-2 focus:text-aqua flex items-center justify-center"
                                    style={{ width: '150px' }}
                                    onClick={() => {
                                      getReceivingValue(tokenName, currencyValue, 2)
                                    }}
                                  >
                                    <div className="text-white focus:text-aqua hover:text-aqua mr-1">{tokenName}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          {chainId && (oneCurrencyIsWETH || oneCurrencyIsETH) ? (
                            <RowBetween className="text-sm">
                              {oneCurrencyIsETH ? (
                                <Link
                                  href={`/exchange/remove/${
                                    currencyA?.isNative ? WNATIVE[chainId].address : currencyIdA
                                  }/${currencyB?.isNative ? WNATIVE[chainId].address : currencyIdB}`}
                                >
                                  <a className="text-baseline text-aqua opacity-80 hover:opacity-100 focus:opacity-100 whitespace-nowrap">
                                    Receive W{NATIVE[chainId].symbol}
                                  </a>
                                </Link>
                              ) : oneCurrencyIsWETH ? (
                                <Link
                                  href={`/exchange/remove/${
                                    currencyA?.equals(WNATIVE[chainId]) ? 'ETH' : currencyIdA
                                  }/${currencyB?.equals(WNATIVE[chainId]) ? 'ETH' : currencyIdB}`}
                                >
                                  <a className="text-baseline text-aqua opacity-80 hover:opacity-100 whitespace-nowrap">
                                    Receive {NATIVE[chainId].symbol}
                                  </a>
                                </Link>
                              ) : null}
                            </RowBetween>
                          ) : null}
                        </AutoColumn>
                      </div>

                      <div className="flex flex-col space-y-3 md:flex-row md:space-x-6 md:space-y-0">
                        <div className="flex flex-row items-center w-full p-3 pr-8 space-x-3 rounded bg-inputBlue">
                          <div className="rounded" style={{ width: 46, height: 46 }}>
                            <Image
                              src="/images/tokens/usdc.png"
                              width={46}
                              height={46}
                              alt="USDC image"
                              layout="fixed"
                              className="rounded"
                              quality={50}
                            />
                          </div>
                          <AutoColumn>
                            <div className="text-white">{currencyAValue}</div>
                            <div className="text-sm text-jordyBlue">{currencyA?.symbol}</div>
                          </AutoColumn>
                        </div>
                        <div className="flex flex-row items-center w-full p-3 pr-8 space-x-3 rounded bg-inputBlue">
                          <div className="rounded" style={{ width: 46, height: 46 }}>
                            <Image
                              src="/images/tokens/usdt.png"
                              width={46}
                              height={46}
                              alt="USDT image"
                              layout="fixed"
                              className="rounded"
                              quality={50}
                            />
                          </div>
                          <AutoColumn>
                            <div className="text-white">{currencyBValue}</div>
                            <div className="text-sm text-jordyBlue">{currencyB?.symbol}</div>
                          </AutoColumn>
                        </div>
                        <div className="flex flex-row items-center w-full p-3 pr-8 space-x-3 rounded bg-inputBlue">
                          <div className="rounded" style={{ width: 46, height: 46 }}>
                            <Image
                              src="/images/tokens/busd.png"
                              width={46}
                              height={46}
                              alt="BUSD image"
                              layout="fixed"
                              className="rounded"
                              quality={50}
                            />
                          </div>
                          <AutoColumn>
                            <div className="text-white">{currencyCValue}</div>
                            <div className="text-sm text-jordyBlue">{currencyB?.symbol}</div>
                          </AutoColumn>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  {!account ? (
                    <Web3Connect size="lg" color="gradient" className="w-full" />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <ButtonConfirmed
                        onClick={onAttemptToApprove}
                        confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                        disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                        style={{ height: 62, backgroundColor: 'transparent', border: '2px solid #142970' }}
                      >
                        {i18n._(t`Approve`)}
                      </ButtonConfirmed>
                      <ButtonError
                        onClick={() => {
                          setShowConfirm(true)
                        }}
                        disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                        error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                        className="bg-linear-gradient"
                        style={{ height: 62 }}
                      >
                        {error || i18n._(t`Confirm Withdrawal`)}
                      </ButtonError>
                    </div>
                  )}
                </div>
              </AutoColumn>
            </div>

            {pair ? <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} /> : null}
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
