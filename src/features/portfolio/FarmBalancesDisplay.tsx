import { ethers } from 'ethers'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { formatNumber } from '../../functions'
import { useCurrency } from '../../hooks/Tokens'

export default function FarmBalancesDisplay({ data }): JSX.Element {
  return (
    <>
      {data &&
        data.map((bal) => {
          let currency0, currency1
          if (bal?.pair?.token0) {
            currency0 = useCurrency(bal?.pair?.token0?.id)
            currency1 = useCurrency(bal?.pair?.token1?.id)
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
                  <DoubleCurrencyLogo
                    currency0={currency0}
                    currency1={currency1}
                    marginLeft={-10}
                    size={23}
                    margin={true}
                  />
                  {bal?.pair?.token0?.symbol}/{bal?.pair?.token1?.symbol} LP
                </div>
              </td>
              <td className="text-xs">
                <div className="flex-col items-center mt-3 text-white">
                  <div>{formatNumber(deposited)}</div>
                  <div className="text-aqua">{formatNumber(stakedValue, true)}</div>
                </div>
              </td>
              <td className="text-xs">
                <div className="flex-col items-center mt-3 text-white">
                  <div>{formatNumber(pendingGlint)}</div>
                  <div className="text-aqua">{formatNumber(pendingGlint * rewardPrice, true)}</div>
                </div>
              </td>
            </tr>
          )
        })}
    </>
  )
}
