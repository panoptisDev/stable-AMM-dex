const Web3 = require('web3')
const { default: axios } = require('axios')
import IUniswapV2PairABI from '../../constants/abis/uniswap-v2-pair.json'
const NETWORK_URL = 'https://rpc.api.moonbase.moonbeam.network'
const API_URL = 'https://api.beamswap.io/priceusd/'
const web3 = new Web3(NETWORK_URL)
const ethers = require('ethers')
const BN = require('bn.js')

import { GLINT, MOONBEAM_TESTNET } from '../../constants/tokens/index'
import { WNATIVE } from '../../sdk/entities/Token'

export default async function handler(req, res) {
  /*
  let movrUSDCContract = new web3.eth.Contract(IUniswapV2PairABI, '0xe537f70a8b62204832B8Ba91940B77d3f79AEb81')
  const movrUSDCReserves = await movrUSDCContract.methods.getReserves().call()

  const movrUSDCPrice = (Number(movrUSDCReserves.reserve1) / Number(movrUSDCReserves.reserve0)) * 1e12

  let glintGlimmerContract = new web3.eth.Contract(IUniswapV2PairABI, '0x7eDA899b3522683636746a2f3a7814e6fFca75e1')
  const glintGlimmerReserves = await glintGlimmerContract.methods.getReserves().call()

  const glintGlimmerPrice = Number(glintGlimmerReserves.reserve1) / Number(glintGlimmerReserves.reserve0)

  let ribMovrContract = new web3.eth.Contract(IUniswapV2PairABI, '0x0acDB54E610dAbC82b8FA454b21AD425ae460DF9')
  const ribMovrReserves = await ribMovrContract.methods.getReserves().call()

  const ribMovrPrice = Number(ribMovrReserves.reserve0) / Number(ribMovrReserves.reserve1)*/

  const gmlrResponse = await axios.get(API_URL + WNATIVE[1287].address)
  const glmrPrice = ethers.utils.formatEther(new BN(gmlrResponse.data.toString()).toString())

  const glintResponse = await axios.get(API_URL + MOONBEAM_TESTNET.GLINT.address)
  const glintPrice = ethers.utils.formatEther(new BN(glintResponse.data.toString()).toString())

  const ethResponse = await axios.get(API_URL + MOONBEAM_TESTNET.ETH.address)
  const ethPrice = ethers.utils.formatEther(new BN(ethResponse.data.toString()).toString())

  let ret = {}
  ret['glmr'] = glmrPrice
  ret['glint'] = glintPrice
  ret['eth'] = ethPrice
  ret['usdc'] = 1
  ret['busd'] = 1
  ret['usdt'] = 1
  ret['dai'] = 1

  res.status(200).json(ret)
}
