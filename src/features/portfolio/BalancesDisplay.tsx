import { useRouter } from 'next/router'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import QuestionHelper from '../../components/QuestionHelper'
import { formatNumber } from '../../functions'
import { useCurrency } from '../../hooks/Tokens'

export default function BalancesDisplay({ balances }): JSX.Element {
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
                    router.push(`/exchange/swap?inputCurrency=${'GLMR'}&outputCurrency=${currency.wrapped.address}`)
                  }
                >
                  {bal.isPair && (
                    <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={23} margin={false} />
                  )}
                  {!bal.isPair && <CurrencyLogo currency={currency} size={'26px'} />}
                  {bal.name}
                  {bal?.currency == '0x65b09ef8c5a096c5fd3a80f1f7369e56eb932412' && bal?.beansDividends > 0 && (
                    <QuestionHelper text={`Dividends Earned: ${formatNumber(bal?.beansDividends)} WGLMR`} />
                  )}
                </div>
              </td>
              <td className="text-white mt-3">
                <div className="text-white mt-3">{formatNumber(bal.price.toNumber(), true)}</div>
              </td>
              <td className="text-xs">
                <div className="flex-col items-center mt-3 text-white">
                  <div>{formatNumber(bal.balance.toNumber(), false)}</div>
                  <div className="text-aqua">{formatNumber(bal.dollarValue.toNumber(), true)}</div>
                </div>
              </td>
            </tr>
          )
        })}
    </>
  )
}
