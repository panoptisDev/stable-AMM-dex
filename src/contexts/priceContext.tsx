import React from 'react'
import { usePricesApi } from '../features/farm/hooks'

export const PriceContext = React.createContext({
  glmr: 0.12,
  glint: 0,
  rib: 0,
  usdc: 0,
  eth: 0,
  ftm: 0,
  beefy: 0,
  mock: 1,
  busd: 1,
  beans: 1,
  cgs:0.0055
})

export function PriceProvider({ children }) {
  const priceData = usePricesApi()
  return <PriceContext.Provider value={priceData}>{children}</PriceContext.Provider>
}

export default PriceProvider
