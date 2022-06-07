import { ChevronDownIcon } from '@heroicons/react/outline'
import { useState } from 'react'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { formatNumber, formatNumberScale, formatPercent } from '../../functions'
import { useCurrency } from '../../hooks/Tokens'

export default function HistoryDetails({ token }): JSX.Element {
  const [showDetails, setShowDetails] = useState(false)

  const currency = useCurrency(
    token.currency == '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      ? '0xAcc15dC74880C9944775448304B263D191c6077F'
      : token.currency
  )
  let currency0, currency1
  if (token.isPair) {
    currency0 = useCurrency(token.token0)
    currency1 = useCurrency(token.token1)
  }
  return (
    <>
      <div className="flex-col">
        <div
          className="flex justify-between mt-4 p-3 bg-lightBlueSecondary rounded-md cursor-pointer items-center"
          onClick={() => {
            setShowDetails(!showDetails)
          }}
        >
          <div className="flex items-center gap-2 justify-center text-white">
            {token.isPair && (
              <>
                <DoubleCurrencyLogo
                  currency0={currency0}
                  currency1={currency1}
                  marginLeft={-10}
                  size={23}
                  margin={true}
                />
                {token.token0Symbol}/{token.token1Symbol} LP
              </>
            )}
            {!token.isPair && (
              <>
                <CurrencyLogo currency={currency} size={'26px'} />
                {token.name}
              </>
            )}
          </div>
          <ChevronDownIcon
            style={{
              transition: '0.3s all',
              transform: `${showDetails ? 'rotate(180deg)' : 'rotate(0deg)'}`,
              color: 'aqua',
            }}
            width={20}
            height={20}
          />
        </div>
        {showDetails && (
          <div className="md:px-10 p-2 bg-deepCove pt-3 pb-3">
            <table className="w-full text-left mt-3 mb-3">
              <th className="text-aqua">Date</th>
              <th className="text-aqua">Open</th>
              <th className="text-aqua">Close</th>
              <th className="text-aqua">Change</th>
              {token?.holdings?.map((hold) => {
                let openBalance = hold.open.balance.toNumber()
                let closeBalance = hold.close.balance.toNumber()

                const difference = closeBalance - openBalance
                const isNegativ = closeBalance < openBalance
                let diffPerc
                if (openBalance < 0 && closeBalance < 0) {
                  openBalance = hold.close.balance.toNumber() * -1
                  closeBalance = hold.open.balance.toNumber() * -1
                  diffPerc = !isNegativ
                    ? 100 - (openBalance / closeBalance) * 100
                    : ((openBalance + closeBalance * -1) / openBalance) * 100 * -1
                } else {
                  diffPerc = !isNegativ
                    ? 100 - (openBalance / closeBalance) * 100
                    : ((openBalance + closeBalance * -1) / openBalance) * 100 * -1
                }

                const diffValue = difference * hold?.rate

                if (token.name == 'GLINT' && hold.date == '15/02/2022') {
                  console.log(difference)
                  console.log(formatNumberScale(difference, false))
                  console.log(formatNumber(difference * -1, false))
                  console.log(diffPerc)
                }
                return (
                  <>
                    <tr>
                      <td className="text-white">{hold.date}</td>
                      <td className="text-white">
                        <div className="flex-col items-center mt-3 text-white">
                          <div>{formatNumber(hold.open.balance.toNumber())}</div>
                          <div className="text-aqua">
                            {formatNumber(hold.open.balance.toNumber() * hold?.rate, true)}
                          </div>
                        </div>
                      </td>
                      <td className="text-white">
                        <div className="flex-col items-center mt-3 text-white">
                          <div>{formatNumber(hold.close.balance.toNumber())}</div>
                          <div className="text-aqua">
                            {formatNumber(hold.close.balance.toNumber() * hold?.rate, true)}
                          </div>
                        </div>
                      </td>
                      <td className="text-white">
                        <div className="flex-col items-center mt-3 text-white">
                          <div>
                            {difference >= 0 ? formatNumber(difference) : '-' + formatNumber(difference * -1)}
                            <span style={{ color: diffPerc < 0 ? '#ef5350' : '#00FFFF' }}>
                              {' '}
                              {diffPerc.toString() != '-Infinity' && (
                                <>({formatPercent(diffPerc == 100 ? 0 : diffPerc)})</>
                              )}
                              {diffPerc.toString() == '-Infinity' && <>({formatPercent(-100)})</>}
                            </span>
                          </div>
                          <div style={{ color: diffValue < 0 ? '#ef5350' : '#00FFFF' }}>
                            {diffValue < 0 ? '-' + formatNumber(diffValue * -1, true) : formatNumber(diffValue, true)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                )
              })}
            </table>
          </div>
        )}
      </div>
    </>
  )
}
