import { Currency, CurrencyAmount, Pair, Percent, Token } from '../../sdk'
import React, { ReactNode, useCallback, useState } from 'react'
import { classNames, formatCurrencyAmount, formatNumber, formatNumberScale } from '../../functions'

import Button from '../Button'
import { ChevronDownIcon } from '@heroicons/react/outline'
import CurrencyLogo from '../CurrencyLogo'
import CurrencySearchModal from '../../modals/SearchModal/CurrencySearchModal'
import DoubleCurrencyLogo from '../DoubleLogo'
import { FiatValue } from './FiatValue'
import Lottie from 'lottie-react'
import { Input as NumericalInput } from '../NumericalInput'
import selectCoinAnimation from '../../animation/select-coin.json'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { useLingui } from '@lingui/react'

interface CurrencyInputPanelProps {
  value?: string
  onUserInput?: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: CurrencyAmount<Token> | null
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  customBalanceText?: string
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  otherCurrency,
  id,
  showCommonBases,
  renderBalance,
  fiatValue,
  priceImpact,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  customBalanceText,
}: CurrencyInputPanelProps) {
  const { i18n } = useLingui()
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <div id={id} className={classNames(hideInput ? 'p-4' : 'p-5', 'bg-blue')}>
      {label && <div className="text-xs font-medium text-jordyBlue whitespace-nowrap currency-title">{label}</div>}
      <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row input-wrapper">
        <div
          className={classNames(
            'w-full sm:w-72 order-2 ml-3 bg-gradient-to-r from-light-purple via-dark-purple to-light-blue'
          )}
          style={{ padding: 2 }}
        >
          <button
            type="button"
            className={classNames(
              !!currency ? 'text-primary' : 'text-high-emphesis',
              'open-currency-select-button h-full w-full outline-none select-none cursor-pointer border-none text-xl font-medium items-center token-button'
            )}
            style={{ backgroundColor: '#132562', position: 'relative' }}
            onClick={() => {
              if (onCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <div className="flex justify-center">
              {pair ? (
                <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={23} margin={true} />
              ) : currency ? (
                <div className="flex items-center" style={{ marginRight: 8 }}>
                  <CurrencyLogo currency={currency} size={'26px'} />
                </div>
              ) : (
                <div></div>
              )}
              {pair ? (
                <span
                  className={classNames(
                    'pair-name-container',
                    Boolean(currency && currency.symbol) ? 'text-2xl' : 'text-xs'
                  )}
                >
                  {pair?.token0.symbol}:{pair?.token1.symbol}
                </span>
              ) : (
                <div className="">
                  <div className="flex items-center">
                    <div className="text-md font-bold token-symbol-container">
                      {(currency && currency.symbol && currency.symbol.length > 20
                        ? currency.symbol.slice(0, 4) +
                          '...' +
                          currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                        : currency?.symbol) || (
                        <div
                          className="px-2 mt-1 text-xs font-medium rounded-full select-token text-white whitespace-nowrap "
                          style={{ fontSize: 18 }}
                        >
                          <span style={{ fontSize: 18 }}>{i18n._(t`Select a token`)}</span>
                        </div>
                      )}
                    </div>

                    {!disableCurrencySelect && currency && (
                      <ChevronDownIcon width={16} height={16} className="ml-2 stroke-current" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
        {!hideInput && (
          <div
            className={classNames(
              'flex items-center w-full space-x-3 rounded input focus:bg-dark-700 p-3'
              // showMaxButton && selectedCurrencyBalance && 'px-3'
            )}
          >
            <>
              {/* {showMaxButton && selectedCurrencyBalance && (
                <Button
                  onClick={onMax}
                  size="xs"
                  className="text-xxs font-medium bg-transparent border rounded-full hover:bg-primary border-low-emphesis text-secondary whitespace-nowrap"
                >
                  {i18n._(t`Max`)}
                </Button>
              )} */}
              <NumericalInput
                id="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              {!hideBalance && currency && selectedCurrencyBalance ? (
                <div className="flex flex-col">
                  <div onClick={onMax} className="text-xxs font-medium text-right cursor-pointer text-aqua">
                    {renderBalance ? (
                      renderBalance(selectedCurrencyBalance)
                    ) : (
                      <>
                        {i18n._(t`Balance:`)} {formatNumberScale(selectedCurrencyBalance.toSignificant(4))}{' '}
                        {currency.symbol}
                      </>
                    )}
                  </div>
                  <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
                </div>
              ) : null}
            </>
          </div>
        )}
      </div>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
    </div>
  )
}
