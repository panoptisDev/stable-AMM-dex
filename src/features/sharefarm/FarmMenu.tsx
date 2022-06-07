import Badge from '../../components/Badge'
import { ChainId } from '../../sdk'
import NavLink from '../../components/NavLink'
import React from 'react'
import { useActiveWeb3React } from '../../hooks'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import Search from '../../components/Search'

const MenuItem = ({ href, title }) => {
  const { i18n } = useLingui()
  return (
    <NavLink
      exact
      href={href}
      activeClassName="font-bold px-4 py-2 bg-transparent border text-high-emphesis bg-lightBlueSecondary text-aqua"
    >
      <a className="flex items-center justify-between px-4 py-2  text-white font-bold border border-transparent cursor-pointer bg-blue">
        {title}
      </a>
    </NavLink>
  )
}
const Menu = ({ positionsLength, onSearch, term }) => {
  const { account, chainId } = useActiveWeb3React()
  const { i18n } = useLingui()
  return (
    <div className={`grid grid-cols-12`}>
      <div className="col-span-12 flex">
        <MenuItem href="/farm" title={i18n._(t`All`)} />
        <MenuItem href="/farm?filter=stables" title={i18n._(t`Stablecoin`)} />
        {account && positionsLength > 0 && <MenuItem href={`/farm?filter=my`} title={i18n._(t`My Farms`)} />}
        <MenuItem href="/farm?filter=finished" title={i18n._(t`Finished`)} />

        {/* <a href="/farm">
          <div className='text-white p-'>
            All Farms
          </div>
        </a> */}

        {/* <MenuItem href="/farm?filter=glint" title="GLINT Farms" />
        <MenuItem href="/farm?filter=moonriver" title="MOVR Farms" />
        <MenuItem href="/farm?filter=stables" title="Stables Farms" />
        <MenuItem href="/farm?filter=single" title="Single Asset" /> */}
      </div>
    </div>
  )
}

export default Menu
