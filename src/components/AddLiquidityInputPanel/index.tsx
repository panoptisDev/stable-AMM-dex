import Image from '../Image'
import NumericalInput from '../NumericalInput'

interface AddLiquidityInputPanelProps {
  value?: string
  onUserInput?: (value: string) => void
  currencyType: 'usdt' | 'busd' | 'usdc' | 'dai'
}

export default function AddLiquidityInputPanel({ value, onUserInput, currencyType }: AddLiquidityInputPanelProps) {
  return (
    <div id="add-liquidity-input-tokenb" className="p-5 bg-blue">
      <div className="text-xs font-medium text-jordyBlue whitespace-nowrap currency-title">Input</div>
      <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row input-wrapper">
        <div className="order-2 ml-3 flex" style={{ padding: 2, alignItems: 'center', gap: '15px' }}>
          <div className="rounded" style={{ width: 46, height: 46 }}>
            <Image
              src={`/images/tokens/${currencyType.toUpperCase()}.png`}
              width={46}
              height={46}
              alt={`${currencyType} image`}
              layout="fixed"
              className="rounded"
              quality={50}
            />
          </div>
          <p>{currencyType.toUpperCase()}</p>
        </div>
        <div className="flex items-center w-full space-x-3 rounded input focus:bg-dark-700 p-3">
          <NumericalInput
            id="token-amount-input"
            value={value}
            onUserInput={(val) => {
              onUserInput(val)
            }}
          />
        </div>
      </div>
    </div>
  )
}
