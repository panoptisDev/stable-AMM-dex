import { ChainId, Token, } from '../sdk'

export const MULTICHAIN: { [key: string]: Token } = {
  USDC: new Token(ChainId.MOONBEAM_TESTNET, '0x65C281140d15184de571333387BfCC5e8Fc7c8dc', 6, 'USDC', 'USD Coin'),
  USDT: new Token(ChainId.MOONBEAM_TESTNET, '0x000359FA0c213B48C69B34996B56edacEc0Bb3ea', 6, 'USDT', 'Tether USD'),
  BUSD: new Token(ChainId.MOONBEAM_TESTNET, '0xe7b932a60E7d0CD08804fB8a3038bCa6218a7Fa2', 18, 'BUSD', 'Binance USD'),
}

export const NOMAD3: { [key: string]: Token } = {
  USDC: new Token(ChainId.MOONBEAM_TESTNET, '0x8f45b090BE2eeB91687E6EaBF7e4402392a370b8', 6, 'USDC', 'USD Coin'),
  USDT: new Token(ChainId.MOONBEAM_TESTNET, '0xC37b5518a30505e1199E8Fb49C64Dc1EB20A4D00', 6, 'USDT', 'Tether USD'),
  DAI: new Token(ChainId.MOONBEAM_TESTNET, '0xf3dd94c1BC65E2359107523E647CFb98aa656B9d', 18, 'DAI', 'Dai Stablecoin'),
}