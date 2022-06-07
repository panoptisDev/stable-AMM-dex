import { BigNumber } from 'ethers'
import { ChainId } from '../sdk'

type IDOInfo = {
  name: string
  specialName: string
}

type AddressMap = {
  [chainId: number]: {
    [address: string]: IDOInfo
  }
}

export const VESTINGS: AddressMap = {
  [ChainId.MOONBEAM_TESTNET]: {
    // chain
    '0x9C02fb886150e83e817B89D253CcA27a33E81A9c': {
      // ido sc address
      name: 'IDO Vesting',
      specialName: 'IDO Community',
    },
  },
  [ChainId.MOONBEAM_TESTNET]: {
    // chain
    '0x89353bcc4A47d77cdba65BFbEBD89f3aC07b2810': {
      // ido sc address
      name: 'Private1 Vesting',
      specialName: 'Special Investors',
    },
  },
  [ChainId.MOONBEAM_TESTNET]: {
    // chain
    '0xb6480eaa468a55deEBDD50E125e329f9C0b37D07': {
      // ido sc address
      name: 'Private2 Vesting',
      specialName: 'Special Investors',
    },
  },
  [ChainId.MOONBEAM_TESTNET]: {
    // chain
    '0xF9A7b7b265AcB134427BA48Bcd4C9cA34023B637': {
      // ido sc address
      name: 'Seed Vesting',
      specialName: 'Initial Funding',
    },
  },
}
