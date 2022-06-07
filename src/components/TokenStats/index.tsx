import React, { useContext } from 'react'
import Image from 'next/image'
import { formatNumberScale } from '../../functions/format'
import { useTokenStatsModalToggle } from '../../state/application/hooks'
import { useWeb3React } from '@web3-react/core'
import TokenStatsModal from '../../modals/TokenStatsModal'
import { ChainId } from '../../sdk'
import { PriceContext } from '../../contexts/priceContext'

const supportedTokens = {
  GLMR: {
    name: 'Glimmer',
    symbol: 'GLMR',
    icon: '/images/tokens/glimmer.png',
  },
  GLINT: {
    name: 'Beamswap Token',
    symbol: 'GLINT',
    icon: '/images/tokens/glint.png',
    address: {
      [ChainId.MOONBEAM_TESTNET]: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
    },
  },
}

interface TokenStatsProps {
  token: string
  decimals?: number
}

function TokenStatusInner({ token, decimals }) {
  const toggleModal = useTokenStatsModalToggle(token)

  const priceData = useContext(PriceContext)

  return (
    <div className="flex pl-2" onClick={toggleModal}>
      {token.icon && (
        <Image
          src={token['icon']}
          alt={token['symbol']}
          width="24px"
          height="24px"
          objectFit="contain"
          className="rounded-md"
        />
      )}
      <div className="px-3 py-2 text-primary text-bold">
        {formatNumberScale(priceData?.[token.symbol.toLowerCase()], true, decimals)}
      </div>
    </div>
  )
}

export default function TokenStats({ token, decimals, ...rest }: TokenStatsProps) {
  const selectedToken = supportedTokens[token]

  return (
    <>
      <TokenStatusInner token={selectedToken} decimals={decimals ? decimals : 4} />
      <TokenStatsModal token={selectedToken} />
    </>
  )
}
