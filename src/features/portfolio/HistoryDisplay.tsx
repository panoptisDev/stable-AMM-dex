import { ChevronDownIcon } from '@heroicons/react/outline'
import { useState } from 'react'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import Loader from '../../components/Loader'
import { formatNumber } from '../../functions'
import { useCurrency } from '../../hooks/Tokens'
import HistoryDetails from './HistoryDetails'

export default function HistoryDisplay({ balances, loading }): JSX.Element {
  const [showDetails, setShowDetails] = useState(false)
  console.log(balances)

  return (
    <>
      <div className="flex-col justify-between bg-blue p-6 mt-5 w-full">
        <div className="text-white">History (beta)</div>
        {loading && (
          <tr>
            <div className="flex justify-center mt-10 items-center">
              <span className="mr-1 text-white">Loading data</span>
              <Loader stroke="white" />
            </div>
          </tr>
        )}
        {balances?.map((token) => {
          return <HistoryDetails token={token} />
        })}
      </div>
    </>
  )
}
