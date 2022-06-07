import { ChainId } from '../../sdk'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import More from './More'
import NavLink from '../NavLink'
import { Popover } from '@headlessui/react'
import { Menu, Transition } from '@headlessui/react'
import Web3Status from '../Web3Status'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import TokenStats from '../TokenStats'
import LanguageSwitch from '../LanguageSwitch'
import { ChevronDownIcon } from '@heroicons/react/solid'

function AppBar(): JSX.Element {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()

  const [mobileView, setMobileView] = useState('')

  return (
    <header className="flex-shrink-0 w-full z-10">
      <Popover as="nav" className="w-full bg-transparent header-border">
        {({ open, close }) => (
          <>
            <div className="py-2 z-10">
              <div className="flex items-center header-container justify-between sm:justify-start px-3">
                <div className="flex flex-2 -ml-4 sm:hidden z-10" style={{ zIndex: 9999 }}>
                  {/* <div className="flex-1">
                    <Image src="/icon.svg" alt="Beamswap" height="40px" width="40px" className="sm:hidden" />
                  </div> */}
                  {/* <LanguageSwitch /> */}
                  <Popover.Button
                    className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-high-emphesis focus:outline-none"
                  >
                    <span className="sr-only">{i18n._(t`Open main menu`)}</span>
                    {open ? (
                      <svg
                        className="block w-6 h-6 text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg
                        className="block w-6 h-6 text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    )}
                  </Popover.Button>
                </div>
                <a href="/exchange/swap" className="header-logo-responsive md:mr-8 pt-1">
                  <Image
                    src={'/images/header-logo.svg'}
                    width="150px"
                    height="30px"
                    alt="transaction rejected"
                    className="header-logo"
                  />
                </a>
                <div className="sm:hidden">
                  <Image
                    src={'/images/tokens/glimmer.png'}
                    width="30px"
                    height="30px"
                    alt="transaction rejected"
                    className="header-logo"
                  />
                </div>
                <div className="flex items-center hidden sm:flex">
                  <div className="hidden sm:block sm:ml-4">
                    <div className="flex space-x-2 links">
                      {/* <a
                        id={`swap-nav-link`}
                        className="p-2 text-white text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        href="/exchange/swap"
                      >
                        {i18n._(t`Exchange`)}
                      </a> */}
                      <div className="p-4 text-white text-primary hover:text-aqua focus:text-high-emphesis whitespace-nowrap cursor-pointer header-dropdown">
                        <div className="flex items-center" onClick={() => { setMobileView("exchange") }}>
                          Exchange
                          <ChevronDownIcon width={20} height={20} />
                        </div>
                        <div className="bg-inputBlue dropdown-content items-center justify-center" style={{ border: '2px solid #1F357D' }}>
                          <a
                            href="/exchange/swap"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 ml-2 mr-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Swap</div>
                            <img src="/images/nav-swap.svg" width={20} height={20} />
                          </a>
                          <a
                            href="/exchange/pool"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Liquidity</div>
                            <img src="/images/nav-liq.svg" width={20} height={20} />
                          </a>
                          <a
                            href="/zap"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 mb-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Zap</div>
                            <img src="/images/nav-zap.svg" width={20} height={20} />
                          </a>
                        </div>
                      </div>
                      <NavLink href={'/farm'}>
                        <a
                          id={`farm-nav-link`}
                          className="p-4 text-white text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap relative"
                        >
                          {i18n._(t`Farm`)}
                        </a>
                      </NavLink>
                      <NavLink href={'/beamshare'}>
                        <a
                          id={`beamshare-nav-link`}
                          className="p-4 text-white text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap"
                        >
                          {i18n._(t`Beamshare`)}
                        </a>
                      </NavLink>
                      <div className="p-4 text-white text-primary hover:text-aqua focus:text-high-emphesis whitespace-nowrap cursor-pointer header-dropdown">
                        <div className="flex items-center">
                          Bridge
                          <ChevronDownIcon width={20} height={20} />
                        </div>
                        <div className="bg-inputBlue dropdown-content items-center justify-center" style={{ border: '2px solid #1F357D' }}>
                          <a
                            href="/bridge"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 ml-2 mr-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Bridge</div>
                          </a>
                          <a
                            href="/ftm"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 mb-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Bridge Fantom</div>
                          </a>
                        </div>
                      </div>
                      {
                        <a
                          className="p-4 text-white text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap relative"
                          href={'/launchpad'}
                        >
                          {i18n._(t`Launchpad`)}
                        </a>
                      }
                      {
                        <a
                          className="p-4 text-white text-primary hover:text-high-emphesis focus:text-high-emphesis whitespace-nowrap relative"
                          href={'/burn'}
                        >
                          {i18n._(t`Dashboard`)}
                          <span
                            className="w3-tag absolute p-1 rounded text-black bg-aqua text-xxs"
                            style={{ top: 0, right: -12, fontSize: 10, borderRadius: 20 }}
                          >
                            New
                          </span>
                        </a>
                      }
                      <div className="p-4 text-white text-primary hover:text-aqua focus:text-high-emphesis whitespace-nowrap cursor-pointer header-dropdown">
                        <div className="flex items-center">
                          More
                          <ChevronDownIcon width={20} height={20} />
                        </div>
                        <div className="bg-inputBlue dropdown-content items-center justify-center" style={{ border: '2px solid #1F357D' }}>
                          <a
                            href={'https://lending.beamswap.io/beamlend'}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 ml-2 mr-2 mt-2 focus:text-aqua flex items-center justify-center relative"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Lending</div>
                            <span
                              className="w3-tag absolute p-1 rounded text-black bg-aqua text-xxs"
                              style={{ top: 5, right: 10, fontSize: 10, borderRadius: 20 }}
                            >
                              New
                            </span>
                          </a>
                          <a
                            href="/blo"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">BLO</div>
                          </a>
                          <a
                            href="https://analytics.beamswap.io/"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Analytics</div>
                          </a>
                          <a
                            href="/locker/create"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Locker</div>
                          </a>
                          <a
                            href="/portfolio"
                            className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 mb-2 mt-2 focus:text-aqua flex items-center justify-center"
                            style={{ width: '150px' }}
                          >
                            <div className="text-white focus:text-aqua hover:text-aqua mr-1">Portfolio</div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="fixed bottom-0 left-0 z-10 flex flex-row items-center justify-center w-full p-4 lg:w-auto lg:relative lg:p-0 lg:bg-transparent sticky-header ml-auto"
                  style={{ zIndex: 999 }}
                >
                  <div className="flex items-center justify-between w-full space-x-2 sm:justify-end">
                    {chainId && [ChainId.MOONBEAM].includes(chainId) && (
                      <div className="w-auto flex items-center mr-1 shadow-sm text-primary text-xs whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto">
                        <TokenStats token="GLMR" decimals={2} />
                      </div>
                    )}
                    {chainId && [ChainId.MOONBEAM].includes(chainId) && (
                      <div className="w-auto flex items-center mr-1 shadow-sm text-primary text-xs whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto bg-darkBlue hover:bg-lightBlueSecondary rounded-sm">
                        <TokenStats token="GLINT" decimals={4} />
                      </div>
                    )}
                    <div className="w-auto flex items-center bg-linear-gradient shadow-sm text-primary text-xs hover:bg-dark-900 whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto">
                      <Web3Status />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Transition
              className="bg-deepCove flex flex-col px-2 pt-2 pb-3 space-y-1 header-links absolute bg-deepCove w-full pb-10"
              enter="transform transition duration-[400ms]"
              enterFrom="opacity-0 -translate-x-full"
              enterTo="opacity-100"
              leave="transform duration-200 transition ease-in-out"
              leaveFrom="opacity-100"
              leaveTo="opacity-0 -translate-x-full"
            >
              <Popover.Panel className="sm:hidden">
                {chainId && [ChainId.MOONBEAM].includes(chainId) && (
                  <div className="w-auto flex items-center mr-1 shadow-sm text-primary text-xs whitespace-nowrap text-xs font-bold cursor-pointer select-none pointer-events-auto rounded-sm" style={{ position: 'absolute', right: 10, top: 24 }}>
                    <TokenStats token="GLINT" decimals={4} />
                  </div>
                )}
                <div className={`flex flex-col mt-10 ml-6`}>
                  <div className="px-4 py-2 text-white text-primary focus:text-high-emphesis cursor-pointer relative mb-2">
                    <div className="flex items-center px-4 text-left" style={{ fontSize: 24 }} onClick={() => {
                      if (mobileView == "exchange") {
                        setMobileView("")
                      } else setMobileView("exchange")
                    }}>
                      Exchange
                      <ChevronDownIcon width={18} height={18} />
                    </div>
                    {mobileView === "exchange" && (<>
                      <div className="bg-blue dropdown-content more items-center mobile-dropdown justify-center mt-2 py-2 rounded">
                        <a
                          href="/exchange/swap"
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 pt-3 ml-2 mr-2 mt-2 focus:text-aqua flex items-center justify-between px-6"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Swap</div>
                          <img src="/images/nav-swap.svg" width={24} height={24} />
                        </a>
                        <a
                          href="/exchange/pool"
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 pt-3 ml-2 mr-2 mt-2 focus:text-aqua flex items-center justify-between px-6"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Liquidity</div>
                          <img src="/images/nav-liq.svg" width={24} height={24} />
                        </a>
                        <a
                          href="/zap"
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 pt-3 ml-2 mr-2 mt-2 focus:text-aqua flex items-center justify-between px-6 mb-3"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Zap</div>
                          <img src="/images/nav-zap.svg" width={24} height={24} />
                        </a>
                      </div>
                    </>)}
                  </div>
                  <Link href={'/farm'}>
                    <a
                      id={`farm-nav-link`}
                      className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap relative px-8 mb-2"
                      style={{ fontSize: 24 }}
                      onClick={() => { close() }}
                    >
                      {i18n._(t`Farm`)}
                    </a>
                  </Link>
                  <Link href={'/beamshare'}>
                    <a
                      id={`beamshare-nav-link`}
                      className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap px-8 mb-2"
                      style={{ fontSize: 24 }}
                      onClick={() => { close() }}
                    >
                      {i18n._(t`Beamshare`)}
                    </a>
                  </Link>
                  <div className="px-4 py-2 text-white text-primary focus:text-high-emphesis cursor-pointer relative mb-2">
                    <div className="flex items-center px-4 text-left" style={{ fontSize: 24 }} onClick={() => {
                      if (mobileView == "bridge") {
                        setMobileView("")
                      } else setMobileView("bridge")
                    }}>
                      Bridge
                      <ChevronDownIcon width={18} height={18} />
                    </div>
                    {mobileView === "bridge" && (<>
                      <div className="bg-blue dropdown-content more items-center mobile-dropdown justify-center mt-2 py-2 rounded">
                        <a
                          href="/bridge"
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white py-2 pt-3 mt-2 focus:text-aqua flex items-center justify-start px-8"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Bridge</div>
                        </a>
                        <a
                          href="/ftm"
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white py-2 pt-3 mt-2 focus:text-aqua flex items-center justify-start mb-3 px-8"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Bridge ftm</div>
                        </a>
                      </div>
                    </>)}
                  </div>
                  <a
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap px-8 relative mb-2"
                    href={'/launchpad'}
                    style={{ fontSize: 24 }}
                    onClick={() => { close() }}
                  >
                    {i18n._(t`Launchpad`)}
                    <span
                      className="w3-tag absolute p-1 rounded text-black bg-aqua text-xxs"
                      style={{ top: 0, left: 170, fontSize: 10, borderRadius: 20 }}
                    >
                      New
                    </span>
                  </a>
                  <a
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap px-8 relative mb-2"
                    href={'/burn'}
                    style={{ fontSize: 24 }}
                    onClick={() => { close() }}
                  >
                    {i18n._(t`Dashboard`)}
                    <span
                      className="w3-tag absolute p-1 rounded text-black bg-aqua text-xxs"
                      style={{ top: 0, left: 170, fontSize: 10, borderRadius: 20 }}
                    >
                      New
                    </span>
                  </a>
                  <a
                    className="p-2 text-baseline text-primary hover:text-high-emphesis focus:text-high-emphesis md:p-3 whitespace-nowrap px-8 relative mb-2"
                    href={'/portfolio'}
                    style={{ fontSize: 24 }}
                    onClick={() => { close() }}
                  >
                    {i18n._(t`Portfolio`)}
                  </a>
                  <div className="px-4 py-2 text-white text-primary focus:text-high-emphesis cursor-pointer relative mb-2">
                    <div className="flex items-center px-4 text-left" style={{ fontSize: 24 }} onClick={() => {
                      if (mobileView == "more") {
                        setMobileView("")
                      } else setMobileView("more")
                    }}>
                      More
                      <ChevronDownIcon width={18} height={18} />
                    </div>
                    {mobileView === "more" && (<>
                      <div className="bg-blue dropdown-content more items-center mobile-dropdown justify-center mt-2 py-2 rounded">
                        <a
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 pt-3 mt-2 focus:text-aqua flex items-center justify-start mb-3 px-8"
                          href={'https://lending.beamswap.io/beamlend'}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Lending</div>
                        </a>
                        <a
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 pt-3 mt-2 focus:text-aqua flex items-center justify-start mb-3 px-8"
                          href="https://analytics.beamswap.io/"
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Analytics</div>
                        </a>
                        <a
                          href="/blo"
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 pt-3 mt-2 focus:text-aqua flex items-center justify-start px-8"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>BLO</div>
                        </a>
                        <a
                          href="/locker"
                          className="hover:text-aqua hover:bg-lightBlueSecondary text-white p-2 pt-3 mt-2 focus:text-aqua flex items-center justify-start mb-3 px-8"
                          onClick={() => { close() }}
                        >
                          <div className="text-white focus:text-aqua hover:text-aqua" style={{ fontSize: 16 }}>Locker</div>
                        </a>
                      </div>
                    </>)}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </header>
  )
}

export default AppBar