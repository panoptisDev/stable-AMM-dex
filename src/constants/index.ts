import { ChainId, JSBI, Percent } from '../sdk'
import { binance, fortmatic, injected, portis, torus, walletconnect, walletlink } from '../connectors'

import { AbstractConnector } from '@web3-react/abstract-connector'
import { BigNumber } from 'ethers'

export const RPC = {
  [ChainId.MAINNET]: 'https://eth-mainnet.alchemyapi.io/v2/q1gSNoSMEzJms47Qn93f9-9Xg5clkmEC',
  [ChainId.ROPSTEN]: 'https://eth-ropsten.alchemyapi.io/v2/cidKix2Xr-snU3f6f6Zjq_rYdalKKHmW',
  [ChainId.RINKEBY]: 'https://eth-rinkeby.alchemyapi.io/v2/XVLwDlhGP6ApBXFz_lfv0aZ6VmurWhYD',
  [ChainId.GÖRLI]: 'https://eth-goerli.alchemyapi.io/v2/Dkk5d02QjttYEoGmhZnJG37rKt8Yl3Im',
  [ChainId.KOVAN]: 'https://eth-kovan.alchemyapi.io/v2/6OVAa_B_rypWWl9HqtiYK26IRxXiYqER',
  [ChainId.FANTOM]: 'https://rpcapi.fantom.network',
  [ChainId.FANTOM_TESTNET]: 'https://rpc.testnet.fantom.network',
  [ChainId.MATIC]: 'https://rpc-mainnet.maticvigil.com',
  // [ChainId.MATIC]:
  //     'https://apis.ankr.com/e22bfa5f5a124b9aa1f911b742f6adfe/c06bb163c3c2a10a4028959f4d82836d/polygon/full/main',
  [ChainId.MATIC_TESTNET]: 'https://rpc-mumbai.matic.today',
  [ChainId.XDAI]: 'https://rpc.xdaichain.com',
  [ChainId.BSC]: 'https://bsc-dataseed.binance.org/',
  [ChainId.BSC_TESTNET]: 'https://data-seed-prebsc-2-s3.binance.org:8545',
  [ChainId.MOONBEAM_TESTNET]: 'https://rpc.api.moonbase.moonbeam.network',
  [ChainId.MOONRIVER]: 'https://moonriver-api.bwarelabs.com/0e63ad82-4f98-46f9-8496-f75657e3a8e', //'https://moonriver.api.onfinality.io/public',
  [ChainId.AVALANCHE]: 'https://api.avax.network/ext/bc/C/rpc',
  [ChainId.AVALANCHE_TESTNET]: 'https://api.avax-test.network/ext/bc/C/rpc',
  [ChainId.HECO]: 'https://http-mainnet.hecochain.com',
  [ChainId.HECO_TESTNET]: 'https://http-testnet.hecochain.com',
  [ChainId.HARMONY]: 'https://api.harmony.one',
  [ChainId.HARMONY_TESTNET]: 'https://api.s0.b.hmny.io',
  [ChainId.OKEX]: 'https://exchainrpc.okex.org',
  [ChainId.OKEX_TESTNET]: 'https://exchaintestrpc.okex.org',
  [ChainId.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
}

export const POOL_DENY = ['14', '29', '45', '30']

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS = 13

export const AVERAGE_BLOCK_TIME = {
  [ChainId.ROPSTEN]: AVERAGE_BLOCK_TIME_IN_SECS,
  [ChainId.MOONRIVER]: 12,
  [ChainId.MOONBEAM_TESTNET]: 13,
  [ChainId.MOONBEAM]: 13,
  [ChainId.BSC]: 3,
}

export const PORTFOLIO_PAIRS = [
  {
    pair: '0x99588867e817023162F4d4829995299054a5fC57',
    token0: '0xcd3B51D98478D53F4515A306bE565c6EebeF1D58',
    token1: '0xAcc15dC74880C9944775448304B263D191c6077F',
    token0Symbol: 'GLINT',
    token1Symbol: 'GLMR',
  },
  {
    pair: '0xb929914B89584b4081C7966AC6287636F7EfD053',
    token0: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
    token1: '0xAcc15dC74880C9944775448304B263D191c6077F',
    token0Symbol: 'USDC',
    token1Symbol: 'GLMR',
  },
  {
    pair: '0xa0799832FB2b9F18Acf44B92FbbEDCfD6442DD5e',
    token0: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
    token1: '0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F',
    token0Symbol: 'USDC',
    token1Symbol: 'BUSD',
  },
  {
    pair: '0x34A1F4AB3548A92C6B32cd778Eed310FcD9A340D',
    token0: '0xc9BAA8cfdDe8E328787E29b4B078abf2DaDc2055',
    token1: '0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F',
    token0Symbol: 'BNB',
    token1Symbol: 'BUSD',
  },
  {
    pair: '0x6BA3071760d46040FB4dc7B627C9f68efAca3000',
    token0: '0xfA9343C3897324496A05fC75abeD6bAC29f8A40f',
    token1: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
    token0Symbol: 'ETH',
    token1Symbol: 'USDC',
  },
  {
    pair: '0xfc422eb0a2c7a99bad330377497fd9798c9b1001',
    token0: '0xa649325aa7c5093d12d6f98eb4378deae68ce23f',
    token1: '0xAcc15dC74880C9944775448304B263D191c6077F',
    token0Symbol: 'BUSD',
    token1Symbol: 'GLMR',
  },
  {
    pair: '0xA35B2c07Cb123EA5E1B9c7530d0812e7e03eC3c1',
    token0: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
    token1: '0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73',
    token0Symbol: 'USDC',
    token1Symbol: 'USDT',
  },
  {
    pair: '0x7EF9491774a81f6dB7Bb759Fe2F645c334dCf5b1',
    token0: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
    token1: '0x765277EebeCA2e31912C9946eAe1021199B39C61',
    token0Symbol: 'USDC',
    token1Symbol: 'DAI',
  },
  {
    pair: '0xA135de8E019447DA28f15eb480AEa0a242af5335',
    token0: '0xC19281F22A075E0F10351cd5D6Ea9f0AC63d4327',
    token1: '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
    token0Symbol: 'FTM',
    token1Symbol: 'USDC',
  },
  {
    pair: '0x321e45B7134b5Ed52129027F1743c8E71DA0A339',
    token0: '0x595c8481c48894771CE8FaDE54ac6Bf59093F9E8',
    token1: '0xAcc15dC74880C9944775448304B263D191c6077F',
    token0Symbol: 'BIFI',
    token1Symbol: 'GLMR',
  },
  {
    pair: '0x2035de7417df16f64574950925cf4648216d8a2c',
    token0: '0xa649325aa7c5093d12d6f98eb4378deae68ce23f',
    token1: '0xcd3b51d98478d53f4515a306be565c6eebef1d58',
    token0Symbol: 'BUSD',
    token1Symbol: 'GLINT',
  },
  {
    pair: '0x61b4cec9925b1397b64dece8f898047eed0f7a07',
    token0: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b',
    token1: '0xcd3b51d98478d53f4515a306be565c6eebef1d58',
    token0Symbol: 'USDC',
    token1Symbol: 'GLINT',
  },
  {
    pair: '0x4b788802e910029d4f7cfb9f33c438f784b38344',
    token0: '0xacc15dc74880c9944775448304b263d191c6077f',
    token1: '0xefaeee334f0fd1712f9a8cc375f427d9cdd40d73',
    token0Symbol: 'GLMR',
    token1Symbol: 'USDT',
  },
  {
    pair: '0xb9df731dc101e4c1e69e45a857f9ff06d482cb26',
    token0: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b',
    token1: '0xc9baa8cfdde8e328787e29b4b078abf2dadc2055',
    token0Symbol: 'USDC',
    token1Symbol: 'BNB',
  },
  {
    pair: '0xc546117e5aee611dab1e8ee953852483e08d47f7',
    token0: '0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b',
    token1: '0x8f552a71efe5eefc207bf75485b356a0b3f01ec9',
    token0Symbol: 'USDC',
    token1Symbol: 'USDC',
  },
  {
    pair: '0x12e90d1629735c4d88ed9e569ad8bc1953bd8a81',
    token0: '0x4204cad97732282d261fbb7088e07557810a6408',
    token1: '0xcd3b51d98478d53f4515a306be565c6eebef1d58',
    token0Symbol: 'SHARE',
    token1Symbol: 'GLINT',
  },
  {
    pair: '0x564ab324acf9493c25943f0355b415cd4957fa41',
    token0: '0x595c8481c48894771ce8fade54ac6bf59093f9e8',
    token1: '0xcd3b51d98478d53f4515a306be565c6eebef1d58',
    token0Symbol: 'BIFI',
    token1Symbol: 'GLINT',
  },
  {
    pair: '0x2757984ee9d17f1bf3d41e9f6bf0e12761a5ed72',
    token0: '0xacc15dc74880c9944775448304b263d191c6077f',
    token1: '0xf2dc7653a5af3512dd64a7dfb36f7a7ff9c0540d',
    token0Symbol: 'GLMR',
    token1Symbol: 'DUSTY',
  },
  {
    pair: '0x5ff6fbc61c13a716cde858ae982855584df1c3a9',
    token0: '0x49f87f6c09b22cbc19e2d41258ca76e0bbe7aa72',
    token1: '0x6fef4e8b0ea76d0608c3ec868c0f040a5249826a',
    token0Symbol: 'fUSDT',
    token1Symbol: 'fBTC',
  },
  {
    pair: '0xd913e1d00b75c76345204ade4169e17d1e3770be',
    token0: '0xacc15dc74880c9944775448304b263d191c6077f',
    token1: '0xfa9343c3897324496a05fc75abed6bac29f8a40f',
    token0Symbol: 'GLMR',
    token1Symbol: 'ETH',
  },
  {
    pair: '0x35087c00c4cf750510acd2e4ee32b9e6d1a60655',
    token0: '0x4204cad97732282d261fbb7088e07557810a6408',
    token1: '0xacc15dc74880c9944775448304b263d191c6077f',
    token0Symbol: 'SHARE',
    token1Symbol: 'GLMR',
  },
  {
    pair: '0x676316597e8afa2f73498350dde59cdb9fcc1ba1',
    token0: '0x765277eebeca2e31912c9946eae1021199b39c61',
    token1: '0xacc15dc74880c9944775448304b263d191c6077f',
    token0Symbol: 'DAI',
    token1Symbol: 'GLMR',
  },
  {
    pair: '0x90131d7b42a8169c3256e1aa86a49e4a7a1e5610',
    token0: '0xacc15dc74880c9944775448304b263d191c6077f',
    token1: '0xc9baa8cfdde8e328787e29b4b078abf2dadc2055',
    token0Symbol: 'GLMR',
    token1Symbol: 'BNB',
  },
  {
    pair: '0x890f1a9a135ff58fe810a2fe6682c30af3bf3012',
    token0: '0x999df923d21379289623cefa12ac570e57cb2343',
    token1: '0xacc15dc74880c9944775448304b263d191c6077f',
    token0Symbol: 'SHBY',
    token1Symbol: 'GLMR',
  },
  {
    pair: '0xe6bc36c2f0c0883c2f7eacb1fe1ae53472201d99',
    token0: '0x765277eebeca2e31912c9946eae1021199b39c61',
    token1: '0x9d3307f43fbbaae5b5f3a858bb0a7008c84fef5c',
    token0Symbol: 'DAI',
    token1Symbol: 'ATOM',
  },
]

export const ARCHER_RELAY_URI: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'https://api.archerdao.io/v1/transaction',
}

export const ARCHER_GAS_URI: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'https://api.archerdao.io/v1/gas',
}

// export const COMMON_CONTRACT_NAMES: { [address: string]: string } = {
//     // [UNI_ADDRESS]: 'UNI',
//     [TIMELOCK_ADDRESS]: 'Timelock',
// }

// TODO: update weekly with new constant
export const MERKLE_ROOT =
  //'https://raw.githubusercontent.com/sushiswap/sushi-vesting/master/merkle/week-13/merkle-10959148-11550728.json'
  'https://raw.githubusercontent.com/sushiswap/sushi-vesting/master/merkle/week-14/merkle-10959148-11596364.json'

// /**
//  * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
//  * tokens.
//  */
// export const CUSTOM_BASES: {
//     [chainId in ChainId]?: { [tokenAddress: string]: Token[] }
// } = {
//     [ChainId.MAINNET]: {
//         [AMPL.address]: [DAI, WETH[ChainId.MAINNET]],
//         [DUCK.address]: [USDP, WETH[ChainId.MAINNET]],
//         [BAB.address]: [BAC, WETH[ChainId.MAINNET]],
//         [HBTC.address]: [CREAM, WETH[ChainId.MAINNET]],
//         [FRAX.address]: [FXS, WETH[ChainId.MAINNET]],
//         [IBETH.address]: [ALPHA, WETH[ChainId.MAINNET]],
//         [PONT.address]: [PWING, WETH[ChainId.MAINNET]],
//         [UMA_CALL.address]: [UMA, WETH[ChainId.MAINNET]],
//         [PLAY.address]: [DOUGH, WETH[ChainId.MAINNET]],
//         [XSUSHI_CALL.address]: [XSUSHI, WETH[ChainId.MAINNET]],
//     },
// }

export interface WalletInfo {
  connector?: (() => Promise<AbstractConnector>) | AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: boolean
  mobile?: boolean
  mobileOnly?: boolean
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'injected.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true,
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.svg',
    description: 'Easy-to-use browser extension.',
    href: null,
    mobile: true,
    color: '#E8831D',
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    iconName: 'wallet-connect.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true,
  },
  TRUST_WALLET: {
    connector: injected,
    name: 'Trust Wallet',
    iconName: 'trustwallet.svg',
    description: 'The most trusted & secure crypto wallet.',
    href: null,
    color: '#3688EB',
    mobile: true,
  },
  // LATTICE: {
  //   connector: async () => {
  //     const LatticeConnector = (await import('@web3-react/lattice-connector')).LatticeConnector
  //     return new LatticeConnector({
  //       chainId: 1,
  //       url: RPC[ChainId.MAINNET],
  //       appName: 'SushiSwap',
  //     })
  //   },
  //   name: 'Lattice',
  //   iconName: 'lattice.png',
  //   description: 'Connect to GridPlus Wallet.',
  //   href: null,
  //   color: '#40a9ff',
  //   mobile: true,
  // },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'coinbase.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5',
  },
  // COINBASE_LINK: {
  //   name: 'Open in Coinbase Wallet',
  //   iconName: 'coinbase.svg',
  //   description: 'Open in Coinbase Wallet app.',
  //   href: 'https://go.cb-w.com',
  //   color: '#315CF5',
  //   mobile: true,
  //   mobileOnly: true,
  // },
  // FORTMATIC: {
  //   connector: fortmatic,
  //   name: 'Fortmatic',
  //   iconName: 'fortmatic.png',
  //   description: 'Login using Fortmatic hosted wallet',
  //   href: null,
  //   color: '#6748FF',
  //   mobile: true,
  // },
  // Portis: {
  //   connector: portis,
  //   name: 'Portis',
  //   iconName: 'portis.png',
  //   description: 'Login using Portis hosted wallet',
  //   href: null,
  //   color: '#4A6C9B',
  //   mobile: true,
  // },
  // Torus: {
  //   connector: torus,
  //   name: 'Torus',
  //   iconName: 'torus.png',
  //   description: 'Login using Torus hosted wallet',
  //   href: null,
  //   color: '#315CF5',
  //   mobile: true,
  // },
}

export const NetworkContextName = 'NETWORK'
export const BridgeContextName = 'BRIDGE'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 30 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 30

// default archer gas estimate, 250k wei
export const DEFAULT_ARCHER_GAS_ESTIMATE: BigNumber = BigNumber.from(250000)
// default gas prices to use if all other sources unavailable
export const DEFAULT_ARCHER_GAS_PRICES: BigNumber[] = [
  BigNumber.from(60000000000),
  BigNumber.from(70000000000),
  BigNumber.from(100000000000),
  BigNumber.from(140000000000),
  BigNumber.from(300000000000),
  BigNumber.from(800000000000),
  BigNumber.from(2000000000000),
]
// default miner tip, equal to median gas price * default gas estimate
export const DEFAULT_ARCHER_ETH_TIP: JSBI = JSBI.BigInt(
  DEFAULT_ARCHER_GAS_ESTIMATE.mul(DEFAULT_ARCHER_GAS_PRICES[4]).toString()
)

// used for rewards deadlines
export const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)

export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')

// SDN OFAC addresses
export const BLOCKED_ADDRESSES: string[] = [
  '0x7F367cC41522cE07553e823bf3be79A889DEbe1B',
  '0xd882cFc20F52f2599D84b8e8D58C7FB62cfE344b',
  '0x901bb9583b24D97e995513C6778dc6888AB6870e',
  '0xA7e5d5A720f06526557c513402f2e6B5fA20b008',
]

// BentoBox Swappers
export const BASE_SWAPPER: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0x0',
  [ChainId.ROPSTEN]: '0xe4E2540D421e56b0B786d40c5F5268891288c6fb',
}

// Boring Helper
// export const BORING_HELPER_ADDRESS = '0x11Ca5375AdAfd6205E41131A4409f182677996E6'

export const ANALYTICS_URL: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'https://analytics.sushi.com',
  [ChainId.MATIC]: 'https://analytics-polygon.sushi.com',
  [ChainId.FANTOM]: 'https://analytics-ftm.sushi.com',
  [ChainId.BSC]: 'https://analytics-bsc.sushi.com',
  [ChainId.XDAI]: 'https://analytics-xdai.sushi.com',
  [ChainId.HARMONY]: 'https://analytics-harmony.sushi.com',
  [ChainId.ARBITRUM]: undefined,
}

export const EIP_1559_ACTIVATION_BLOCK: { [chainId in ChainId]?: number } = {
  [ChainId.ROPSTEN]: 10499401,
  [ChainId.GÖRLI]: 5062605,
  [ChainId.RINKEBY]: 8897988,
}

export * from './routing'
export * from './addresses'
export * from './tokens'
