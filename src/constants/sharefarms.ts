import { Chain } from '@ethereumjs/common'
import { ChainId } from '../sdk'

export type TokenInfo = {
  id: string
  name: string
  symbol: string
  decimals?: number
}
export type RewardInfo = {
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
  reward: RewardInfo
  name?: string
  symbol?: string
  showReward?: boolean
}

type AddressMap = {
  [chainId: number]: {
    [address: string]: PairInfo
  }
}

export const SHARE_POOLS: AddressMap = {
  [ChainId.MOONBEAM_TESTNET]: {
    '0': {
      id: 0,
      lpToken: '0xF774C205a48ad0BEf7F62948FB69B31A8440e534',
      token0: {
        id: '0xF774C205a48ad0BEf7F62948FB69B31A8440e534',
        name: 'SHARE Token',
        symbol: 'SHARE',
        decimals: 18,
      },
      reward: {
        id: '0x4DAEBF58E2E67f96e73053355F21b360BE4BBF6D',
        name: 'Mock ERC',
        symbol: 'MOCK',
        decimals: 18,
      },
    },
    '1': {
      id: 0,
      lpToken: '0xF774C205a48ad0BEf7F62948FB69B31A8440e534',
      token0: {
        id: '0xF774C205a48ad0BEf7F62948FB69B31A8440e534',
        name: 'SHARE Token',
        symbol: 'SHARE',
        decimals: 18,
      },
      reward: {
        id: '0xe7b932a60E7d0CD08804fB8a3038bCa6218a7Fa2',
        name: 'BUSD Token',
        symbol: 'BUSD',
        decimals: 18,
      },
    },
  },
  [ChainId.MOONBEAM]: {
    '0': {
      id: 0,
      lpToken: '0x4204cAd97732282d261FbB7088e07557810A6408',
      token0: {
        id: '0x4204cAd97732282d261FbB7088e07557810A6408',
        name: 'SHARE Token',
        symbol: 'SHARE',
        decimals: 18,
      },
      reward: {
        id: '0x65b09ef8c5A096C5Fd3A80f1F7369E56eB932412',
        name: 'MoonBeans',
        symbol: 'BEANS',
        decimals: 18,
      },
      showReward: false
    },
    '1': {
      id: 1,
      lpToken: '0x4204cAd97732282d261FbB7088e07557810A6408',
      token0: {
        id: '0x4204cAd97732282d261FbB7088e07557810A6408',
        name: 'SHARE Token',
        symbol: 'SHARE',
        decimals: 18,
      },
      reward: {
        id: '0x2Dfc76901bB2ac2A5fA5fc479590A490BBB10a5F',
        name: 'CougarSwap',
        symbol: 'CGS',
        decimals: 18,
      },
      showReward: true
    },
  },
}
