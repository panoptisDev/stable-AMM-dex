import { AbstractCurrency, Binance, ChainId, Currency, CurrencyAmount, Ether, Token } from '../../sdk'
import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { classNames, formatNumber, formatNumberScale } from '../../functions'
import Button from '../Button'
import { ChevronDownIcon } from '@heroicons/react/outline'
import CurrencyLogo from '../CurrencyLogo'
import CurrencySearchModal from '../../modals/SearchModal/CurrencySearchModal'
import { FiatValue } from './FiatValue'
import Lottie from 'lottie-react'
import { Input as NumericalInput } from '../NumericalInput'
import selectCoinAnimation from '../../animation/select-coin.json'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import {
  useCurrencyBalance,
  useMultichainCurrencyBalance,
  useMultichainCurrencyBalanceFTM,
} from '../../state/wallet/hooks'
import { useLingui } from '@lingui/react'
import { Chain, DEFAULT_CHAIN_FROM, DEFAULT_CHAIN_TO } from '../../sdk/entities/Chain'
import SelectTokenModal from '../../modals/SelectTokenModal/SelectTokenModal'
import { AnyswapTokensMap } from '../../pages/bridge'
import { useWeb3React } from '@web3-react/core'
import { BridgeContextName } from '../../constants'

interface CurrencyInputPanelProps {
  value?: string
  onUserInput?: (value: string) => void
  onMax?: (amount: string) => void
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  fiatValue?: CurrencyAmount<Token> | null
  chainFrom?: Chain | null
  chainTo?: Chain | null
  tokenList?: Currency[] | []
  chainList: AnyswapTokensMap | null
}

export default function DualChainCurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  label = 'Input',
  onCurrencySelect,
  currency,
  fiatValue,
  chainFrom,
  chainTo,
  tokenList,
  chainList,
}: CurrencyInputPanelProps) {
  const { i18n } = useLingui()
  const [modalOpen, setModalOpen] = useState(false)
  const [toCurrency, setToCurrency] = useState<Currency | null>(null)
  const { account } = useWeb3React(BridgeContextName)
  /* eslint-disable */
  const selectedCurrencyBalance =
    chainFrom.id == 250
      ? useMultichainCurrencyBalanceFTM(chainFrom?.id, account ?? undefined, currency ?? undefined)
      : useMultichainCurrencyBalance(chainFrom?.id, account ?? undefined, currency ?? undefined)

  const selectedCurrencyBalanceDest = useMultichainCurrencyBalance(
    chainTo?.id,
    account ?? undefined,
    toCurrency ?? undefined
  )

  useEffect(() => {
    setToCurrency(null)
    if (!currency) return
    if (!chainFrom) return
    if (!chainTo) return
    if (!chainList) return

    let contractAddr
    if (currency.isNative) {
      const anyInfo = chainList[chainFrom.id][currency.wrapped.address.toLowerCase()]
      if (!anyInfo || !anyInfo.token) return
      contractAddr = chainList[chainFrom.id][currency.wrapped.address.toLowerCase()].token.ContractAddress
    } else if (currency.isToken) {
      const anyInfo = chainList[chainFrom.id][currency.address.toLowerCase()]
      if (!anyInfo || !anyInfo.token) return
      contractAddr = chainList[chainFrom.id][currency.address.toLowerCase()].token.ContractAddress
      if (!contractAddr) {
        if (chainTo.id == ChainId.BSC && currency.symbol == 'BNB') {
          setToCurrency(Binance.onChain(chainTo.id))
        } else if (chainTo.id == ChainId.MAINNET && currency.symbol == 'ETH') {
          setToCurrency(Ether.onChain(chainTo.id))
        }
      }
    }
    if (!contractAddr) return
    const info = chainList[chainTo.id][contractAddr.toLowerCase()]
    if (!info || !info.token) return
    setToCurrency(new Token(chainTo.id, contractAddr, info.token.Decimals, info.token.Symbol, info.token.Name))
  }, [chainFrom, chainList, chainTo, currency])

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <>
      <div className="bg-darkBlue" style={{ border: '2px solid rgb(20 41 112)' }}>
        <div className={classNames('p-5 rounded rounded-b-none bg-darkBlue')}>
          {label && (
            <div className="font-medium text-jordyBlue whitespace-nowrap" style={{ fontSize: 20 }}>
              {label}
            </div>
          )}
          <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
            <div className={classNames('w-full sm:w-72')}>
              <button
                type="button"
                className={classNames(
                  !!currency ? 'text-primary' : 'text-high-emphesis',
                  'open-currency-select-button h-full outline-none select-none cursor-pointer border-none text-xl font-medium items-center bg-darkBlue'
                )}
                style={{ margin: 2 }}
                onClick={() => {
                  if (onCurrencySelect) {
                    setModalOpen(true)
                  }
                }}
              >
                <div className="flex">
                  {currency ? (
                    <div className="flex items-center mr-3">
                      <CurrencyLogo currency={currency} size={'54px'} />
                    </div>
                  ) : (
                    // <div className="rounded bg-dark-700" style={{ maxWidth: 54, maxHeight: 54 }}>
                    //   <div style={{ width: 54, height: 54 }}>
                    //     <Lottie animationData={selectCoinAnimation} autoplay loop />
                    //   </div>
                    // </div>
                    <div></div>
                  )}
                  <div className="flex flex-1 flex-col items-start justify-center">
                    <div className="flex items-center">
                      <div className="text-lg font-bold token-symbol-container md:text-2xl text-white">
                        {(currency && currency.symbol && currency.symbol.length > 20
                          ? currency.symbol.slice(0, 4) +
                            '...' +
                            currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                          : currency?.symbol) || (
                          <div
                            className="px-2 py-1 text-xs font-medium bg-darkBlue text-white whitespace-nowrap bg-gradient-to-r from-light-purple via-dark-purple to-light-blue ml-auto mr-auto"
                            style={{
                              height: 44,
                              width: 150,
                              lineHeight: '37px',
                              fontSize: 16,
                              fontWeight: 'bold',
                              borderRadius: 3,
                            }}
                          >
                            {i18n._(t`Select a token`)}
                          </div>
                        )}
                      </div>
                      {currency && <ChevronDownIcon width={16} height={16} className="ml-2 stroke-current" />}
                    </div>
                  </div>
                </div>
              </button>
            </div>
            <div
              className={classNames('flex items-center w-full space-x-3 rounded-md bg-inputBlue focus:bg-dark-700 p-3')}
            >
              <>
                {selectedCurrencyBalance && (
                  <Button
                    onClick={() => {
                      onMax(selectedCurrencyBalance?.toSignificant(4))
                    }}
                    size="xs"
                    style={{ height: 26 }}
                    className="hidden sm:block text-xxs font-medium bg-royalBlue rounded-sm text-white whitespace-nowrap"
                  >
                    {i18n._(t`Max`)}
                  </Button>
                )}
                <NumericalInput
                  id="token-amount-input"
                  value={value}
                  onUserInput={(val) => {
                    onUserInput(val)
                  }}
                />
                {currency && selectedCurrencyBalance ? (
                  <div className="flex flex-col">
                    <div
                      onClick={() => {
                        onMax(selectedCurrencyBalance?.toSignificant(4))
                      }}
                      className="text-xxs font-medium text-right cursor-pointer text-aqua"
                    >
                      <>
                        {i18n._(t`Balance:`)} {formatNumberScale(selectedCurrencyBalance.toSignificant(4))}{' '}
                        {currency.symbol}
                      </>
                    </div>
                    <FiatValue fiatValue={fiatValue} />
                  </div>
                ) : null}
              </>
            </div>
          </div>
        </div>
      </div>
      <div
        className={classNames('flex items-center w-full px-0 bg-deepCove py-2 mt-5 text-center justify-center')}
        style={{ borderRadius: 2 }}
      >
        <div className="flex flex-row justify-center">
          <div className={classNames('text-right px-3')}>
            <div className="text-xs font-medium text-aqua whitespace-nowrap" style={{ color: '#A589FF' }}>
              Balance on {chainTo?.name}:
            </div>
          </div>
          <div className={classNames('flex items-center px-0')}>
            <div
              className="text-xs font-medium text-secondary whitespace-nowrap"
              style={{ color: '#A589FF', fontWeight: 'bold' }}
            >
              {formatNumber(selectedCurrencyBalanceDest?.toSignificant(4))} {currency?.symbol}
            </div>
          </div>
        </div>
      </div>
      {onCurrencySelect && (
        <SelectTokenModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          tokenList={tokenList}
        />
      )}
    </>
  )
}
