import React, { FC, useCallback } from 'react'
import useENS from '../../hooks/useENS'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

interface AddressInputPanelProps {
  id?: string
  value: string
  onChange: (value: string) => void
}

const AddressInputPanel: FC<AddressInputPanelProps> = ({ id, value, onChange }) => {
  const { i18n } = useLingui()
  const { address, loading } = useENS(value)

  const handleInput = useCallback(
    (event) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange]
  )

  const error = Boolean(value.length > 0 && !loading && !address)

  return (
    <div
      className={`flex flex-row bg-inputBlue rounded items-center h-[68px] ${
        error ? 'border border-red border-opacity-50' : ''
      }`}
      id={id}
      style={{ border: '2px solid #00FFFF' }}
    >
      <div className="flex justify-between w-full sm:w-2/5 px-5">
        <span className="text-[18px] text-white">{i18n._(t`Send to:`)}</span>
        <span className="text-aqua text-sm underline cursor-pointer" onClick={() => onChange(null)}>
          {i18n._(t`Remove`)}
        </span>
      </div>
      <div className="flex w-full h-full sm:w-3/5 rounded-r">
        <input
          className="p-3 w-full flex overflow-ellipsis font-bold recipient-address-input bg-inputBlue h-full w-full rounded placeholder-jordyBlue text-jordyBlue"
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="Wallet Address or ENS name"
          pattern="^(0x[a-fA-F0-9]{40})$"
          onChange={handleInput}
          value={value}
        />
      </div>
    </div>
  )
}

export default AddressInputPanel
