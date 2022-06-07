import Banner from '../../components/Banner'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import Main from '../../components/Main'
import Popups from '../../components/Popups'
import Clock from './Countdown'

const Layout = ({ children }) => {
  return (
    <div className="z-0 flex flex-col items-center w-full h-screen overflow-x-hidden overflow-y-auto page-container" style={{zIndex: 999}}>
      {/* <div
        className="w-full items-center flex justify-center p-1 text-aqua font-bold"
        style={{ background: '#8035b0', zIndex: 999 }}
      >
        Launchpad <Clock deadline={'Mar 28 2022 17:00:00 UTC'} />
      </div> */}
      <img className="glow" src="/images/landing-glow.png" />
      {/* <Banner /> */}
      <Header />
      <Main>{children}</Main>
      <Popups />
      <Footer />
    </div>
  )
}

export default Layout