import { Chain } from '@ethereumjs/common'
import { ChainId } from '../sdk'

export type TokenInfo = {
  id: string
  name: string
  symbol: string
  decimals?: number
}

type PairInfo = {
  id: number
  token0: TokenInfo
  token1?: TokenInfo
  name?: string
  symbol?: string
  featured?: boolean
}

type AddressMap = {
  [chainId: number]: {
    [address: string]: PairInfo
  }
}

export const POOLS: AddressMap = {
  [ChainId.MOONBEAM]: {
    '0x99588867e817023162F4d4829995299054a5fC57': {
      id: 0,
      token1: {
        id: '0xcd3B51D98478D53F4515A306bE565c6EebeF1D58',
        name: 'Beamswap',
        symbol: 'GLINT',
        decimals: 18,
      },
      token0: {
        id: '0xAcc15dC74880C9944775448304B263D191c6077F',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
      featured: true,
    },
    '0xb929914B89584b4081C7966AC6287636F7EfD053': {
      id: 1,
      token1: {
        id: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      token0: {
        id: '0xAcc15dC74880C9944775448304B263D191c6077F',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
      featured: true,
    },
    '0xa0799832FB2b9F18Acf44B92FbbEDCfD6442DD5e': {
      id: 2,
      token0: {
        id: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      token1: {
        id: '0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F',
        name: 'Binance USD',
        symbol: 'BUSD',
        decimals: 18,
      },
      featured: false,
    },
    '0x34A1F4AB3548A92C6B32cd778Eed310FcD9A340D': {
      id: 3,
      token0: {
        id: '0xc9BAA8cfdDe8E328787E29b4B078abf2DaDc2055',
        name: 'BNB Coin',
        symbol: 'BNB',
        decimals: 18,
      },
      token1: {
        id: '0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F',
        name: 'Binance USD',
        symbol: 'BUSD',
        decimals: 18,
      },
      featured: false,
    },
    '0x6BA3071760d46040FB4dc7B627C9f68efAca3000': {
      id: 4,
      token0: {
        id: '0xfA9343C3897324496A05fC75abeD6bAC29f8A40f',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      token1: {
        id: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      featured: false,
    },
    '0xAcc15dC74880C9944775448304B263D191c6077F': {
      id: 5,
      token0: {
        id: '0xAcc15dC74880C9944775448304B263D191c6077F',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
      featured: true,
    },
    '0xfC422EB0A2C7a99bAd330377497FD9798c9B1001': {
      id: 6,
      token1: {
        id: '0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F',
        name: 'Binance USD',
        symbol: 'BUSD',
        decimals: 18,
      },
      token0: {
        id: '0xAcc15dC74880C9944775448304B263D191c6077F',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
      featured: false,
    },
    '0xA35B2c07Cb123EA5E1B9c7530d0812e7e03eC3c1': {
      id: 7,
      token0: {
        id: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      token1: {
        id: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
      },
      featured: false,
    },
    '0x7EF9491774a81f6dB7Bb759Fe2F645c334dCf5b1': {
      id: 8,
      token0: {
        id: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      token1: {
        id: '0x765277EebeCA2e31912C9946eAe1021199B39C61',
        name: 'DAI Coin',
        symbol: 'DAI',
        decimals: 18,
      },
      featured: false,
    },
    '0xA135de8E019447DA28f15eb480AEa0a242af5335': {
      id: 9,
      token0: {
        id: '0xC19281F22A075E0F10351cd5D6Ea9f0AC63d4327',
        name: 'Fantom',
        symbol: 'FTM',
        decimals: 18,
      },
      token1: {
        id: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      featured: false,
    },
    '0x321e45B7134b5Ed52129027F1743c8E71DA0A339': {
      id: 10,
      token0: {
        id: '0x595c8481c48894771CE8FaDE54ac6Bf59093F9E8',
        name: 'Beefy Finance',
        symbol: 'BIFI',
        decimals: 18,
      },
      token1: {
        id: '0xAcc15dC74880C9944775448304B263D191c6077F',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
      featured: false,
    },
    '0x32b710DBF797C1B16498B0fCd83929Bb19897529': {
      id: 11,
      token0: {
        id: '0x65b09ef8c5A096C5Fd3A80f1F7369E56eB932412',
        name: 'MoonBeans',
        symbol: 'BEANS',
        decimals: 18,
      },
      token1: {
        id: '0xAcc15dC74880C9944775448304B263D191c6077F',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
      featured: false,
    },
    '0xd4d0622ac66786d1bdf3fEE0a36810e64148809c': {
      id: 12,
      token0: {
        id: '0x2Dfc76901bB2ac2A5fA5fc479590A490BBB10a5F',
        name: 'CougarSwap',
        symbol: 'CGS',
        decimals: 18,
      },
      token1: {
        id: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      featured: false,
    },
  },
  [ChainId.MOONBEAM_TESTNET]: {
    '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef': {
      id: 0,
      token0: {
        id: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
        name: 'Beamswap',
        symbol: 'GLINT',
        decimals: 18,
      },
    },
    '0xF774C205a48ad0BEf7F62948FB69B31A8440e534': {
      id: 1,
      token0: {
        id: '0xF774C205a48ad0BEf7F62948FB69B31A8440e534',
        name: 'Beamshare token',
        symbol: 'SHARE',
        decimals: 18,
      },
    },
    '0x9dCca533798Aae4EC78cFEb057cb7745DcDe3048': {
      id: 2,
      token0: {
        id: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
        name: 'Beamshare token',
        symbol: 'GLINT',
        decimals: 18,
      },
      token1: {
        id: '0x9dCca533798Aae4EC78cFEb057cb7745DcDe3048',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
    },
    '0xa35f96330f06209eAf9261CE55Fd542Df9a7a871': {
      id: 3,
      token0: {
        id: '0xaBf3Cb26780a1882215621E4d9CEbCb6ca9fc9ef',
        name: 'Beamshare token',
        symbol: 'GLINT',
        decimals: 18,
      },
      token1: {
        id: '0x9dCca533798Aae4EC78cFEb057cb7745DcDe3048',
        name: 'Glimmer',
        symbol: 'GLMR',
        decimals: 18,
      },
    },
  },
}
