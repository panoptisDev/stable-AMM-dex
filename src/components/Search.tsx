import React from 'react'
import { Search as SearchIcon } from 'react-feather'
import { classNames } from '../functions'

export default function Search({
  term,
  search,
  placeholder,
  className = 'bg-inputBlue',
  inputProps = {
    className:
      'text-jordyBlue bg-transparent w-full py-3 pl-4 pr-14 w-full bg-transparent focus:outline-none bg-dark-700 rounded-md',
  },
  ...rest
}: {
  term: string
  search: (value: string) => void
  placeholder?: string
  inputProps?: any
  className?: string
}) {
  return (
    <div className={classNames('relative w-full', className)} {...rest} style={{ borderRadius: 2 }}>
      <input
        className={classNames(
          inputProps.className || 'text-baseline py-3 pl-4 pr-14 rounded-md w-full bg-transparent focus:outline-none'
        )}
        onChange={(e) => search(e.target.value)}
        value={term}
        placeholder={placeholder}
        {...inputProps}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
        <SearchIcon size={16} />
      </div>
    </div>
  )
}
