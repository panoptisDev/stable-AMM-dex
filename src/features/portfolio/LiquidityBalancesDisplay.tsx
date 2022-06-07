import { useRouter } from 'next/router'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { formatNumber } from '../../functions'
import { useCurrency } from '../../hooks/Tokens'

export default function LiquidityBalancesDisplay({ balances }): JSX.Element {
  const router = useRouter()
  return (
    <>
      {balances &&
        balances.map((bal) => {
          const currency = useCurrency(
            bal.currency == '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
              ? '0xAcc15dC74880C9944775448304B263D191c6077F'
              : bal.currency
          )
          let currency0, currency1
          if (bal.isPair) {
            currency0 = useCurrency(bal.token0)
            currency1 = useCurrency(bal.token1)
          }
          return (
            <tr className="mt-3">
              <td className="text-white mt-3">
                <div
                  className="flex items-center justify-start gap-3 mt-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    bal.isPair
                      ? router.push(`/exchange/add/${bal.token0}/${bal.token1}`)
                      : router.push(`/exchange/add/${'GLMR'}/${bal.currency}`)
                  }
                >
                  {bal.isPair && (
                    <DoubleCurrencyLogo
                      currency0={currency0}
                      currency1={currency1}
                      marginLeft={-10}
                      size={23}
                      margin={true}
                    />
                  )}
                  {!bal.isPair && <CurrencyLogo currency={currency} size={'26px'} />}
                  {bal.token0Symbol}/{bal.token1Symbol} LP
                </div>
              </td>
              {
                <td className="text-white mt-3">
                  <div className="text-white mt-3">{formatNumber(bal.balance.toNumber(), false)}</div>
                </td>
              }
              <td className="text-xs">
                <div className="flex-col items-center mt-3 text-white">
                  <div className="text-aqua">{formatNumber(bal.dollarValue.toNumber(), true)}</div>
                  {/* <div className="text-aqua">{formatNumber(bal.dollarValue.toNumber(), true)}</div>*/}
                </div>
              </td>
            </tr>
          )
        })}
    </>
  )
}
