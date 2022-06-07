import { createAction } from '@reduxjs/toolkit'

export enum Field {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
  CURRENCY_C = 'CURRENCY_C',
}

export const typeInput = createAction<{ field: Field; typedValue: string }>('burn/typeInputBurn')
