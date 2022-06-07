import { ethers } from 'ethers'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { formatNumber } from '../../functions'
import { useCurrency } from '../../hooks/Tokens'
import Clock from '../../layouts/Default/ShareCountdown'

export default function SharefarmBalancesDisplay({ data }): JSX.Element {
  return (
    <>
      {data &&
        data.map((bal) => {
          console.log(bal)

          let currency0, currency1
          if (bal?.pair?.token0) {
            currency0 = useCurrency(bal?.pair?.token0?.id)
            currency1 = useCurrency(bal?.rewardToken)
          }
          const rewardPrice = parseFloat(bal?.rewards[0].rewardPrice)
          const deposited = ethers.utils.formatEther(bal.amount)
          const pendingGlint = parseFloat(ethers.utils.formatEther(bal?.pendingGlint.toString()))
          const lpPrice = bal?.lpPrice
          const stakedValue = parseFloat(deposited) * parseFloat(lpPrice)
          return (
            <tr className="mt-3">
              <td className="text-white mt-3">
                <div className="flex items-center justify-start gap-3 mt-3">
                  <CurrencyLogo currency={currency0} />
                  {bal?.pair?.token0?.symbol}
                </div>
              </td>
              <td className="text-xs">
                <div className="flex-col items-center mt-3 text-white">
                  <div>{formatNumber(deposited)}</div>
                  <div className="text-aqua">{formatNumber(stakedValue, true)}</div>
                </div>
              </td>
              <td className="text-white mt-3">
                <div className="flex-col items-center mt-3 text-white">
                  <div className="flex items-center justify-start gap-1">
                    {formatNumber(pendingGlint)} <CurrencyLogo currency={currency1} />
                  </div>
                  <div className="text-aqua">{formatNumber(pendingGlint * rewardPrice, true)}</div>
                </div>
              </td>
              <td className="text-xs">
                <div className="flex-col items-center text-white">
                  <div>
                    <Clock deadline={bal?.endTimestamp} />{' '}
                  </div>
                </div>
              </td>
            </tr>
          )
        })}
    </>
  )
}
