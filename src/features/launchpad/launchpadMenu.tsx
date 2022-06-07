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
      <div className="col-span-12 flex gap-2">
        <MenuItem href="/launchpad" title={i18n._(t`Live`)} />
        <MenuItem href="/launchpad?filter=upcoming" title={i18n._(t`Upcoming`)} />
        <MenuItem href="/launchpad?filter=complete" title={i18n._(t`Complete`)} />
      </div>
    </div>
  )
}

export default Menu
