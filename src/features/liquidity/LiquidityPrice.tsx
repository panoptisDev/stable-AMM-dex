import { Currency, Percent, Price } from '../../sdk'

import { Field } from '../../state/mint/actions'
import { ONE_BIPS } from '../../constants'
import React from 'react'
import Typography from '../../components/Typography'
import { classNames } from '../../functions'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export default function LiquidityPrice({
  currencies,
  price,
  noLiquidity,
  poolTokenPercentage,
  className,
}: {
  currencies: { [field in Field]?: Currency }
  price?: Price<Currency, Currency>
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  className?: string
}): JSX.Element {
  const { i18n } = useLingui()
  return (
    <div>
    <div className="liquidity-price-header d-flex flex-start text-jordyBlue w-100 my-2 mx-4 pb-2" style={{borderBottom: '2px solid #1F357D'}}>
        Price and pool share
    </div>
    <div className={classNames('flex justify-between items-center rounded py-2 px-4 bg-deepCove', className)}>      
      <div className="flex flex-row w-full text-jordyBlue justify-between">
        <div className="flex flex-col justify-center text-center">
          <div className="price-a">{price?.toSignificant(6) ?? '-'}</div>
          <div className="text-a">{currencies[Field.CURRENCY_B]?.symbol} per {currencies[Field.CURRENCY_A]?.symbol}</div>
        </div>
        <div className="flex flex-col justify-center text-center">
          <div className="price-a">{price?.invert()?.toSignificant(6) ?? '-'}</div>
          <div className="text-a">{currencies[Field.CURRENCY_A]?.symbol} per {currencies[Field.CURRENCY_B]?.symbol}</div>
        </div>
        <div className="flex flex-col justify-center text-center">
          <div className="price-a">
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </div>
          <div className="text-a">{i18n._(t`Share of Pool`)}</div>
        </div>
      </div>
    </div>
    </div>
  )
}
