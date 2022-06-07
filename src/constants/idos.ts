import { BigNumber } from 'ethers'
import { USDC } from '../hooks'
import { ChainId, Token } from '../sdk'

export type IDOInfo = {
  name: string
  regOpen?: boolean
  logo: string
  tokensRaiseCap?: BigNumber
  fundRaiseCap?: BigNumber
  saleStart: string
  saleClose: string
  guaranteedEnd?: string
  claimStart: string
  tokenPrice: string
  decimals: number
  idoSymbol: string
  paymentToken: Token
  fundsSwapped: BigNumber
  socials: IDOSocials
  type: IDOType
  showRegister: boolean
  version: number
  totalRaised?: number
  completed?: number
  saleFinished?: boolean
}
type IDOSocials = {
  telegram?: string
  twitter?: string
  medium?: string
}

type IDOType = {
  isHistory: boolean
  isUpcoming: boolean
  isFeatured: boolean
}

type AddressMap = {
  [chainId: number]: {
    [address: string]: IDOInfo
  }
}

export const IDOS: AddressMap = {
  [ChainId.MOONBEAM]: {
    // chain
    '0xC7D01554CD42F2269819e743A1514889635462E4': { 
      // ido sc address
      name: 'Authtrail',
      regOpen: false,
      logo: '/images/authtrail-logo.png',
      tokensRaiseCap: BigNumber.from('1800000'),
      fundRaiseCap: BigNumber.from('50000'),
      saleStart: 'asd',
      saleClose: 'asd',
      claimStart: 'asd',
      tokenPrice: '0.2',
      idoSymbol: 'AUT',
      paymentToken: USDC[ChainId.MOONBEAM],
      decimals: 6,
      fundsSwapped: BigNumber.from('0'), //0
      showRegister: false,
      totalRaised: 0,
      completed: 0,
      version: 0,
      socials: {
        telegram: 'telegram',
      },
      type: {
        isHistory: true,
        isUpcoming: false,
        isFeatured: false,
      },
    },
  },
  
 /* [ChainId.MOONBEAM_TESTNET]: {
    // chain
    '0xa04601162F4d3FCb1e89E2B9f86f3Ef9c3951E78': {
      // ido sc address
      name: 'Authtrail',
      regOpen: false,
      logo: '/images/authtrail-logo.png',
      tokensRaiseCap: BigNumber.from('1800000'),
      fundRaiseCap: BigNumber.from('50000'),
      saleStart: 'asd',
      saleClose: 'asd',
      claimStart: 'asd',
      tokenPrice: '0.2',
      idoSymbol: 'AUT',
      paymentToken: USDC[ChainId.MOONBEAM_TESTNET],
      decimals: 6,
      fundsSwapped: BigNumber.from('180000'), //1800000
      showRegister: false,
      totalRaised: 0,
      completed: 0,
      version: 0,
      socials: {
        telegram: 'telegram',
      },
      type: {
        isHistory: true,
        isUpcoming: false,
        isFeatured: false,
      },
    },
  }*/
}
