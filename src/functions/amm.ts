import { MULTICHAIN,  NOMAD3} from '../constants/stableAMMPairs'
import { Currency, Token } from '../sdk'

/**
 * check the amm type from two currencies.
 */
export function checkStableAMMCurrency(currency0: Currency, currency1: Currency): boolean {
  if ((currency0.symbol in MULTICHAIN && MULTICHAIN[currency0.symbol].address==currency0.address && currency1.symbol in MULTICHAIN && MULTICHAIN[currency1.symbol]?.address==currency1.address)) {
    return true
  }
  if ((currency0.symbol in NOMAD3 && NOMAD3[currency0.symbol]?.address==currency0.address && currency1.symbol in NOMAD3 && NOMAD3[currency1.symbol]?.address==currency1.address)) {
    return true
  }screen
  return false
}

export function checkStableAMMToken(token0: Token, token1: Token): boolean {
  if ((token0.symbol in MULTICHAIN && MULTICHAIN[token0.symbol].address==token0.address && token1.symbol in MULTICHAIN && MULTICHAIN[token1.symbol]?.address==token1.address)) {
    return true
  }
  if ((token0.symbol in NOMAD3 && NOMAD3[token0.symbol]?.address==token0.address && token1.symbol in NOMAD3 && NOMAD3[token1.symbol]?.address==currency1.address)) {
    return true
  }
  return false
}
