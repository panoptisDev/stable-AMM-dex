import { ChainId } from '../sdk'

export type TokenInfo = {
  id: string
  name: string
  symbol: string
  decimals?: number
}

type PairInfo = {
  id: number
  lpToken: string
  token0: TokenInfo
  token1?: TokenInfo
  name?: string
  symbol?: string
}

type AddressMap = {
  [chainId: number]: {
    [id: string]: PairInfo
  }
}

export const VAULTS: AddressMap = {
  [ChainId.MOONRIVER]: {
    '0': {
      id: 0,
      lpToken: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
      token0: {
        id: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
        name: 'Beamswap',
        symbol: 'GLINT',
        decimals: 18,
      },
    },
    '1': {
      id: 1,
      lpToken: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
      token0: {
        id: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
        name: 'Beamswap',
        symbol: 'GLINT',
        decimals: 18,
      },
    },
    '2': {
      id: 2,
      lpToken: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
      token0: {
        id: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
        name: 'Beamswap',
        symbol: 'GLINT',
        decimals: 18,
      },
    },
  },
}
