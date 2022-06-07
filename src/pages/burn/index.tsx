
import React, { useEffect, useState } from 'react'
import Container from '../../components/Container'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import Head from 'next/head'
import axios from 'axios'
import BurnItem from '../../components/Burn/BurnElement'
import DashboardChart from '../../components/DashboardChart'
import { formatNumber, formatNumberScale } from '../../functions'
import { JSBI } from '../../sdk'
import { NEVER_RELOAD, useSingleCallResult } from '../../state/multicall/hooks'
import { useActiveWeb3React, useGlintContract } from '../../hooks'
import { ethers } from 'ethers'
import { useCountUp } from 'use-count-up'
import Dots from '../../components/Dots'
//0x000000000000000000000000000000000000dead
type BurnElements = {
  date: any
  glintAmount: number
  txHash: string
  burnAddress: string
}

const Burn = () => {
  const { chainId } = useActiveWeb3React()
  axios.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8'
  axios.defaults.headers.get['Access-Control-Allow-Origin'] = '*'
  const [burnElements, setBurnElements] = useState<BurnElements[]>()
  const [chartData, setChartData] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const glintContract = useGlintContract()
  const _burnt = useSingleCallResult(
    glintContract ? glintContract : null,
    'balanceOf',
    ['0x000000000000000000000000000000000000dEaD'],
    NEVER_RELOAD
  )?.result?.[0]
  const burnt = _burnt ? ethers.utils.formatEther(JSBI.BigInt(_burnt.toString()).toString()) : JSBI.BigInt(0)

  const { value, reset } = useCountUp({
    isCounting: true,
    start: 0,
    end: Number(burnt) ? Number(burnt) : 0,
    duration: 2,
    easing: 'easeInCubic',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    updateInterval: 0,

  })


  async function GetApiData() {
    setLoading(true)
    const response = await axios.get("/api/dapplooker")
    const data = response?.data?.data
    const tempData = []
    const tempChartData = []
    let index = 0
    const temp = await Promise.all(data?.rows?.map(async (d) => {
      index++
      const obj = {
        date: new Date(d[8]),
        glintAmount: d[11],
        txHash: d[2],
        burnAddress: '0xdead'
      }
      if (index < 10) {
        const chartObj = {
          name: 'Burn ' + index,
          uv: Number(d[11]).toFixed(1),
          pv: new Date(d[8]).toLocaleString('en-us', { month: 'short', day: 'numeric' }),
          amt: Number(formatNumber(d[11])).toFixed(1)
        }
        tempChartData.push(chartObj)
      }

      tempData.push(obj)
    }))

    setBurnElements(tempData)
    setChartData(tempChartData.reverse())
    setLoading(false)
  }

  useEffect(() => {
    GetApiData()
  }, [])

  return (
    <>
      <Head>
        <title> Beamswap | Burn Dashboard</title>
        <meta
          name="description"
          content="See the latest $GLINT token burns!"
        />
      </Head>


      <div className="staking-container burn">
        <Container maxWidth="6xl" className="space-y-6">
          <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
            <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
            <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />
            <div className="text-white font-bold mt-5 burn-title">GLINT Burn Dashboard</div>
            {loading && (

              <div className="flex justify-center mt-10 items-center">
                <span className="text-aqua">Loading data</span>
                <Dots></Dots>
              </div>

            )}

            {!loading && (
              <div className="flex flex-col md:flex-row justify-center gap-6">
                <div className="flex-col mt-10 gap-3 w-full md:w-2/5 md:order-1 order-2">
                  <div className="text-jordyBlue text-start mb-3">
                    Burns
                  </div>
                  <div style={{ maxHeight: 750, overflowY: 'scroll' }}>
                    {burnElements && burnElements.map((element) => {
                      return (<>
                        <BurnItem element={element} />
                      </>)
                    })}
                  </div>
                </div>
                <div className="flex-col items-start justify-start bg-darkBlue p-6 md:w-3/5 pb-0 md:order-2 order-1" style={{ marginTop: 75 }}>
                  <div className="text-aqua">Total burned</div>
                  <div className="text-white font-bold flex justify-between items-center flex-col md:flex md:flex-row" style={{ fontSize: 42 }}>
                    <div>
                      {value} <span className="text-aqua">{' GLINT'}</span>

                    </div>
                    <div className="relative mt-2 md:mt-0" style={{ width: 200, height: 100 }}>
                      <img src="/images/animation-tokens.svg" width={180} style={{ position: 'absolute', left: 23, top: 10, zIndex: 2 }} />
                      <img className="animate-top first-fire" src="/images/fire-1.svg" width={41} height={61} style={{ position: 'absolute', zIndex: 2 }} />
                      <img className="animate-top second-fire" src="/images/fire-1.svg" width={41} height={61} style={{ position: 'absolute', zIndex: 2 }} />
                      <img className="animate-top-top third-fire" src="/images/fire-1.svg" width={41} height={61} style={{ position: 'absolute', zIndex: 1 }} />
                    </div>
                  </div>
                  {/* <div className="text-jordyBlue">{totalBurned.dollarValue}</div> */}
                  <DashboardChart chartData={chartData} />
                </div>
              </div>
            )}

            {burnElements !== undefined && (<>
              <div className="p-5 rounded bg-deepCove mt-10 scroll-table">
                <div className="glint-burn-title text-white">
                  GLINT Burn
                </div>
                <table className="w-full text-left mt-8 mb-3 burn-table">
                  <th className="text-jordyBlue hidden pb-6">Transaction Hash</th>
                  <th className="text-jordyBlue pb-6 md:hidden">Tx Hash</th>
                  <th className="text-jordyBlue text-center md:text-left hidden md:table-cell">Time</th>
                  <th className="text-jordyBlue hidden md:table-cell">Burn Address</th>
                  <th className="text-jordyBlue">Token Burnt</th>

                  {burnElements.map((element) => {
                    return (<>
                      <tr className="text-white mb-3">
                        <td><div className="bg-lightBlueSecondary text-aqua text-center p-2 py-1 cursor-pointer text-xs w-auto mb-3" style={{ width: 120 }} onClick={() => { window.location.href = 'https://moonscan.io/tx/' + element.txHash }}>Moonscan</div></td>
                        <td className="text-white hidden md:table-cell">{element.date.toUTCString().split(',')[1].split(' GMT')[0]}</td>
                        <td className="text-white hidden md:table-cell">{element.burnAddress}</td>
                        <td className="text-white font-bold text-center md:text-left">{formatNumberScale(element.glintAmount)}</td>
                      </tr>
                    </>)
                  })}
                </table>
              </div>
            </>)}


          </DoubleGlowShadow>
        </Container>
      </div>
    </>
  )
}

export default Burn