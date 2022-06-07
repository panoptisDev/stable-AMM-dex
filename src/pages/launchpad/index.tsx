import { useState } from 'react'
import Progress from 'react-progressbar'
import Container from '../../components/Container'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import Search from '../../components/Search'
import { AUTHTRAIL_IDO } from '../../constants/addresses'
import { IDOInfo, IDOS } from '../../constants/idos'
import { getIdoData, getIdoDataOptimized, useIdoData } from '../../features/launchpad/hooks'
import IdoModal from '../../features/launchpad/IdoModal'
import Menu from '../../features/launchpad/launchpadMenu'
import { formatNumber, formatPercent } from '../../functions/format'
import Web3Status from '../../components/Web3Status'
import Head from 'next/head'

const getIDOS = (IDOS) => {
  let array = []
  for (const [key, value] of Object.entries(IDOS)) {
    let chainId = key
    console.log(chainId)
    for (const [key2, value2] of Object.entries(value)) {
      let contractAddress = key2
      array.push({ ...value2, contractAddress })
    }
  }
  return array
}

const Launchpad = () => {
  const { account, chainId } = useActiveWeb3React()
  const [idoArray, setIDOS] = useState(getIDOS(IDOS))
  const [data, idoExists, idoChainId] = useIdoData(AUTHTRAIL_IDO[chainId])
  const idoData = data as IDOInfo
  const [showDetails, setShowDetails] = useState(false)
 /* const [totalRaised, saleOpen, claimOpen, canContribute, freeOpen, registrationOpen, raiseCap] = getIdoData(
    AUTHTRAIL_IDO[chainId],
    parseInt(chainId.toString()),
    idoData?.paymentToken?.decimals,
    idoData?.version
  )*/
  const [idoDataOptimized] = getIdoDataOptimized(
    AUTHTRAIL_IDO[chainId]
  )
  const totalRaised = idoDataOptimized?idoDataOptimized?.totalRaised:"0"
  const raiseCap = idoDataOptimized?idoDataOptimized?.raiseCap:"50000"
  const percCompleted = Number(totalRaised) / (Number(raiseCap) != 0 ? Number(raiseCap) : 50000) * 100


  return (
    // <div className="w-full lg:mx-8 mb-8">
    //   <div className="text-5xl text-white text-center w-1/2 mx-auto mt-4 mb-10">LAUNCHPAD</div>
    //   <div className="grid rid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 ">
    //     {' '}
    //     {/*   flex flex-wrap justify-around w-11/12 mx-auto gap-y-6 border-2*/}
    //     {idoArray.map((ido) => (
    //       // <KST_IDO props={ido} key={ido.name} />
    //       <>asd</>
    //     ))}
    //   </div>
    // </div>
    <>
      <Head>
        <title> Beamswap | Docks</title>
        <meta
          name="description"
          content="Beamswap Docks is an IDO launchpad that connects new exciting projects built on the Moonbeam network with a growing community of early crypto-backers to expand their funding reach."
        />
      </Head>


      <div className="staking-container">
        <Container maxWidth="5xl" className="space-y-6">
          <DoubleGlowShadow maxWidth={false} opacity={'0.6'}>
            <img className="swap-glow-overlay first" src="/images/landing-partners-overlay.svg" />
            <img className="swap-glow-overlay second" src="/images/landing-partners-overlay.svg" />

            {showDetails && (
              <IdoModal
                isOpen={showDetails}
                onDismiss={() => setShowDetails(false)}
                farm={'farm'}
                onClose={() => setShowDetails(false)}
              />
            )}

            <div className="flex md:flex md:flex-row flex-col items-left md:items-center mb-10 mt-10">
              <div className="flex-col mr-10 md:w-2/5 items-start justify-start gap-2">
                <div className="text-xl font-xl text-white font-bold" style={{ fontSize: 54 }}>Beamswap</div>
                <div className="text-aqua font-md text-aqua" style={{ fontSize: 20 }}>Click here to apply for Beamswap</div>
              </div>
              <div className="text-white text-sm md:w-3/5 mt-2 md:mt-0" style={{ fontSize: 20 }}>
                Be the first to join Beamswap, a launchpad built for cross-chain token pools and auctions,
                enabling projects to raise capital on a decentralized and interoperable environment based on Moonbeam.
              </div>
            </div>

            <div className="flex flex-row gap-3 items-center justify-center p-4 bg-darkBlue mb-5" style={{ border: '2px solid #1F357D' }}>
              <div className="w-1/2">
                <Menu
                  term={"term"}
                  onSearch={(value) => {
                    return true
                  }}
                  positionsLength={3}
                />
              </div>
              <div className="w-1/2">
                <div
                  className={'px-1 md:px-0 flex justify-center hidden md:flex'}
                  style={{ border: '2px solid #1F357D', height: 42 }}
                >
                  <div className="text-white mr-5 ml-5 hidden md:block" style={{ lineHeight: '38px' }}>
                    Search
                  </div>
                  <Search
                    className={'bg-transparent farm-search'}
                    placeholder={'Search by farm, name, symbol and address'}
                    term={"Search by name, symbol or address"}
                    search={(value: string): void => {

                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-col md:flex-row flex gap-4 staking-wrapper" style={{ justifyContent: 'center' }}>


              {idoArray.map((ido) => (
                // eslint-disable-next-line
                <div className="flex-col items-center bg-darkBlue w-full md:w-1/2 " style={{ border: '2px solid #1F357D' }}>
                  <img src="/images/authtrail-banner.png" />
                  <div className="flex flex-row justify-between items-center px-6 mb-5" style={{ zIndex: 9, marginTop: -40 }}>
                    <img src="/images/authtrail-logo.png" className="p-2 bg-blue" height={80} width={80} />
                    <img src="/images/tokens/glimmer.png" />
                  </div>
                  <div className="flex flex-row justify-between mx-6 items-center pb-4 mb-5" style={{ borderBottom: '2px solid #1F357D' }}>
                    <div className="text-white font-md font-bold text-bold" style={{ fontSize: 20 }}>{ido.name}</div>
                    <div className="text-white font-md bg-linear-gradient p-2 px-4" style={{ height: 26, lineHeight: '12px' }}>${ido.idoSymbol}</div>
                  </div>
                  <div className="flex-col mx-6 mt-5 pb-4 gap-5 mb-4" style={{ borderBottom: '2px solid #1F357D' }}>
                    <div className="flex justify-between text-white mb-3">
                      <div>Total Raise</div>
                      <div className="font-bold">{formatNumber(Number(raiseCap?.toString() != "0" ? raiseCap : 50000), true)}</div>
                    </div>
                    <div className="flex justify-between text-white mb-3">
                      <div>Price per token</div>
                      <div className="font-bold">$0.2</div>
                    </div>
                  </div>
                  <div className="flex mx-6 mb-3 ido" style={{ height: 30 }}>
                    <Progress completed={percCompleted} width={100} color={'#00FFFF'} />
                  </div>
                  <div className="flex justify-between text-white mb-3 mx-6">
                    <div className="text-jordyBlue text-xs">Total Committed</div>
                    <div className="font-bold text-aqua text-xs">{formatNumber(Number(totalRaised), true)} ({formatPercent(percCompleted)})</div>
                  </div>
                  <div className="flex justify-between text-white mb-3 mx-6 bg-deepCove p-4">
                    <div>Begins</div>
                    <div className="font-bold text-jordyBlue">April 12th 2022 - 15:00 UTC</div>
                  </div>
                  <div className="flex justify-center mx-6 gap-2 mb-5">
                    <div className="bg-lightBlueSecondary text-aqua w-1/2 p-2 text-center">
                      <a href="https://authtrail.com/" target="_blank" rel="noreferrer">Project Website</a>
                    </div>
                    <div className="bg-lightBlueSecondary text-aqua w-1/2 p-2 text-center">
                      <a href="https://t.me/Authtrail" target="_blank" rel="noreferrer">Announcement</a>
                    </div>
                  </div>

                  <div className="flex justify-center mx-6 gap-2 mb-5">
                    {account && (
                      <div className="bg-linear-gradient text-white w-full p-2 text-center" style={{ cursor: 'pointer', lineHeight: '30px' }} onClick={() => { setShowDetails(true) }}>
                        Participate
                      </div>
                    )}
                    {!account && (
                      <div className="bg-linear-gradient text-white w-full p-2 text-center" style={{ cursor: 'pointer', lineHeight: '30px' }}>
                        <Web3Status />
                      </div>

                    )}
                  </div>
                </div>
              ))}
              <div className="flex-col items-center bg-darkBlue w-full md:w-1/2 " style={{ border: '2px solid #1F357D' }}>
                <img src="/images/soon-banner.png" style={{ width: '-webkit-fill-available', height: 260 }} />
                <div className="flex flex-row justify-between items-center px-6 mb-5" style={{ zIndex: 9, marginTop: -40 }}>
                  <img src="/images/soon-logo.svg" className="p-7 bg-blue" height={80} width={80} />
                  <img src="/images/tokens/glimmer.png" />
                </div>
                <div className="relative" style={{ marginTop: -33 }}>
                  <img src="/images/soon-cover.png" className='absolute top-0' style={{ width: '-webkit-fill-available' }} />
                  <div className="flex flex-row justify-between mx-6 items-center pb-4 mb-5" style={{ borderBottom: '2px solid #1F357D' }}>
                    <div className="text-white font-md font-bold text-bold" style={{ fontSize: 20 }}>???</div>
                    <div className="text-white font-md bg-linear-gradient p-2 px-4" style={{ height: 26, lineHeight: '12px' }}>$???</div>
                  </div>
                  <div className="flex-col mx-6 mt-5 pb-4 gap-5 mb-4" style={{ borderBottom: '2px solid #1F357D' }}>
                    <div className="flex justify-between text-white mb-3">
                      <div>Total Raise</div>

                      <div className="font-bold">TBA</div>
                    </div>
                    <div className="flex justify-between text-white">
                      <div>Total Raise</div>

                      <div className="font-bold">TBA</div>
                    </div>
                    <div className="flex justify-between text-white mb-3">
                      <div>Personal Allocation</div>
                      <div className="font-bold">TBA</div>
                    </div>
                    <div className="flex justify-between text-white mb-3">
                      <div>Price per token</div>
                      <div className="font-bold">TBA</div>
                    </div>
                  </div>
                  <div className="flex mx-6 mb-3" style={{ height: 30 }}>
                    <Progress completed={0} width={100} color={'#00FFFF'} />
                  </div>
                  <div className="flex justify-between text-white mb-3 mx-6">
                    <div className="text-jordyBlue text-xs">Total Committed</div>
                    <div className="font-bold text-aqua text-xs">$0 (0%)</div>
                  </div>
                  <div className="flex justify-between text-white mb-3 mx-6 bg-deepCove p-4">
                    <div>Begins</div>
                    <div className="font-bold text-jordyBlue">TBA</div>
                  </div>
                  <div className="flex justify-center mx-6 gap-2 mb-5 hidden md:flex">
                    <div className="bg-lightBlueSecondary text-aqua w-1/2 p-2 text-center">
                      <a href="https://authtrail.com/" target="_blank" rel="noreferrer">Project Website</a>
                    </div>
                    <div className="bg-lightBlueSecondary text-aqua w-1/2 p-2 text-center">
                      Announcement
                    </div>
                  </div>

                  <div className="flex justify-center mx-6 gap-2 mb-5 hidden md:flex">
                    <div className="bg-linear-gradient text-white w-1/2 p-2 text-center" style={{ cursor: 'pointer', lineHeight: '30px' }} onClick={() => { setShowDetails(false) }}>
                      Participate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DoubleGlowShadow>
        </Container>
      </div>
    </>
  )
}

export default Launchpad
