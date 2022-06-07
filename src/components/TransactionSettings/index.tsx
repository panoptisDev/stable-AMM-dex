import React, { useRef, useState } from 'react'
import { useSetUserSlippageTolerance, useUserSlippageTolerance, useUserTransactionTTL } from '../../state/user/hooks'

import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants'
import { Percent } from '../../sdk'
import QuestionHelper from '../QuestionHelper'
import Typography from '../Typography'
import { classNames } from '../../functions'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import Button from '../Button'

enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

export interface TransactionSettingsProps {
  placeholderSlippage?: Percent // varies according to the context in which the settings dialog is placed
}

export default function TransactionSettings({ placeholderSlippage }: TransactionSettingsProps) {
  const { i18n } = useLingui()

  const inputRef = useRef<HTMLInputElement>()

  const userSlippageTolerance = useUserSlippageTolerance()

  const setUserSlippageTolerance = useSetUserSlippageTolerance()

  const [deadline, setDeadline] = useUserTransactionTTL()

  const [slippageDropdownOpen, setSlippageDropdownOpen] = useState(false)
  const [slippageAmount, setSlippageAmount] = useState('0.01')

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageError, setSlippageError] = useState<SlippageError | false>(false)

  const [deadlineInput, setDeadlineInput] = useState('')
  const [deadlineError, setDeadlineError] = useState<DeadlineError | false>(false)

  function parseSlippageInput(value: string) {
    // populate what the user typed and clear the error
    setSlippageInput(value)
    setSlippageError(false)

    if (value.length === 0) {
      setUserSlippageTolerance('auto')
    } else {
      const parsed = Math.floor(Number.parseFloat(value) * 100)

      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5000) {
        setUserSlippageTolerance('auto')
        if (value !== '.') {
          setSlippageError(SlippageError.InvalidInput)
        }
      } else {
        setUserSlippageTolerance(new Percent(parsed, 10_000))
      }
    }
  }

  const tooLow = userSlippageTolerance !== 'auto' && userSlippageTolerance.lessThan(new Percent(5, 10_000))
  const tooHigh = userSlippageTolerance !== 'auto' && userSlippageTolerance.greaterThan(new Percent(1, 100))

  function parseCustomDeadline(value: string) {
    // populate what the user typed and clear the error
    setDeadlineInput(value)
    setDeadlineError(false)

    if (value.length === 0) {
      setDeadline(DEFAULT_DEADLINE_FROM_NOW)
    } else {
      try {
        const parsed: number = Math.floor(Number.parseFloat(value) * 60)
        if (!Number.isInteger(parsed) || parsed < 60 || parsed > 180 * 60) {
          setDeadlineError(DeadlineError.InvalidInput)
        } else {
          setDeadline(parsed)
        }
      } catch (error) {
        console.error(error)
        setDeadlineError(DeadlineError.InvalidInput)
      }
    }
  }

  return (
    <div className="grid gap-4">
      <div className="gap-2 bg-blue justify-between p-3 rounded-md cursor-pointer">
        <div
          className="flex bg-blue justify-between rounded-md cursor-pointer w-full"
          onClick={() => setSlippageDropdownOpen(!slippageDropdownOpen)}
        >
          <div className="flex items-center">
            <div className="bg-lightBlueSecondary p-3 rounded-md mr-3">
              <img src="/images/settings-slippage.svg" width={25} height={25} />
            </div>
            <Typography variant="sm" className="text-high-emphesis">
              {i18n._(t`Slippage tolerance`)} <br />
              <span className="text-jordyBlue" style={{ fontSize: 14, color: '#81A1E1' }}>
                {placeholderSlippage?.toFixed(2).toString()}% Tolerance
              </span>
            </Typography>

            <div className="mb-auto">
              <QuestionHelper
                text={i18n._(
                  t`Your transaction will revert 23if the price changes unfavorably by more than this percentage.`
                )}
              />
            </div>
          </div>
          <div className="mb-auto mt-auto">
            <img
              src="/images/settings-chevron.svg"
              width={20}
              height={20}
              style={{
                transition: '0.3s all',
                transform: `${slippageDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
              }}
            />
          </div>
        </div>
        {slippageDropdownOpen && (
          <div className="w-full flex bg-lightBlueSecondary mt-5 rounded-md" style={{ height: 56 }}>
            <div
              className={classNames(
                placeholderSlippage?.toFixed(2).toString() == '1.00'
                  ? 'w-1/4 text-center p-3 bg-linear-gradient'
                  : 'w-1/4 text-center p-3'
              )}
              style={{ lineHeight: '30px', height: 56 }}
              onClick={() => {
                parseSlippageInput('1')
              }}
            >
              1%
            </div>
            <div
              className={classNames(
                placeholderSlippage?.toFixed(2).toString() == '5.00'
                  ? 'w-1/4 text-center p-3 bg-linear-gradient'
                  : 'w-1/4 text-center p-3'
              )}
              style={{ lineHeight: '30px', height: 56 }}
              onClick={() => {
                parseSlippageInput('5')
              }}
            >
              5%
            </div>
            <div
              className={classNames(
                placeholderSlippage?.toFixed(2).toString() == '10.00'
                  ? 'w-1/4 text-center p-3 bg-linear-gradient'
                  : 'w-1/4 text-center p-3'
              )}
              style={{ lineHeight: '30px', height: 56 }}
              onClick={() => {
                parseSlippageInput('10')
              }}
            >
              10%
            </div>
            <div className="flex items-center justify-center space-x-2 w-1/4">
              <div
                className={classNames(
                  !!slippageError
                    ? 'border-red'
                    : tooLow || tooHigh
                    ? 'border-darkBlue'
                    : userSlippageTolerance !== 'auto'
                    ? 'border-darkBlue'
                    : 'border-darkBlue',
                  'border p-2 rounded bg-blue'
                )}
                tabIndex={-1}
              >
                <div className="flex justify-between items-center gap-1">
                  {/* {tooLow || tooHigh ? (
                      <span className="hidden sm:inline text-yellow" role="img" aria-label="warning">
                        ⚠️
                      </span>
                    ) : null} */}
                  <input
                    className={classNames(slippageError ? 'text-red' : '', 'bg-transparent placeholder-low-emphesis')}
                    placeholder={placeholderSlippage?.toFixed(2)}
                    value={
                      slippageInput.length > 0
                        ? slippageInput
                        : userSlippageTolerance === 'auto'
                        ? ''
                        : userSlippageTolerance.toFixed(2)
                    }
                    onChange={(e) => parseSlippageInput(e.target.value)}
                    onBlur={() => {
                      setSlippageInput('')
                      setSlippageError(false)
                    }}
                    style={{ width: '40px' }}
                    color={slippageError ? 'red' : ''}
                  />
                  %
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 bg-blue justify-between p-3 rounded-md">
        <div className="flex items-center">
          <Typography variant="sm" className="text-high-emphesis">
            {i18n._(t`Transaction deadline`)}
          </Typography>

          <QuestionHelper text={i18n._(t`Your transaction will revert if it is pending for more than this long.`)} />
        </div>
        <div className="flex items-center">
          <div
            className="p-2 rounded bg-blue border border-darkBlue min-w-[40px] max-w-[40px] overflow-hidden"
            style={{ maxWidth: '50px', marginRight: '8px' }}
            tabIndex={-1}
          >
            <input
              className={classNames(deadlineError ? 'text-red pl-3' : '', 'bg-transparent pl-3')}
              placeholder={(DEFAULT_DEADLINE_FROM_NOW / 60).toString()}
              value={
                deadlineInput.length > 0
                  ? deadlineInput
                  : deadline === DEFAULT_DEADLINE_FROM_NOW
                  ? ''
                  : (deadline / 60).toString()
              }
              onChange={(e) => parseCustomDeadline(e.target.value)}
              onBlur={() => {
                setDeadlineInput('')
                setDeadlineError(false)
              }}
              color={deadlineError ? 'red' : ''}
            />
          </div>
          <Typography variant="sm">{i18n._(t`Mins`)}</Typography>
        </div>
      </div>
    </div>
  )
}
