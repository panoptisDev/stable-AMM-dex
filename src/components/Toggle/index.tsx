import React from 'react'
import { Switch } from '@headlessui/react'
import { classNames } from '../../functions'

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
}

export default function Toggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <Switch
      checked={isActive}
      onChange={toggle}
      className={classNames(
        isActive ? 'bg-royalBlue' : 'bg-inputBlue',
        'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none'
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        className={classNames(
          isActive ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-aqua shadow transform ring-0 transition ease-in-out duration-200'
        )}
      >
        <span
          className={classNames(
            isActive ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
          )}
          aria-hidden="true"
        ></span>
        <span
          className={classNames(
            isActive ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
          )}
          aria-hidden="true"
        ></span>
      </span>
    </Switch>
  )
}
