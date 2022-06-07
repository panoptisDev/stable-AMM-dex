import React, { useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'

import Column from '../../components/Column'
import CurrencyModalView from './CurrencyModalView'
import ManageLists from './ManageLists'
import ManageTokens from './ManageTokens'
import ModalHeader from '../../components/ModalHeader'
import { Token } from '../../sdk'
import { TokenList } from '@uniswap/token-lists'
import styled from 'styled-components'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

const ContentWrapper = styled(Column)`
  height: 100%;
  width: 100%;
  flex: 1 1;
  position: relative;
  overflow-y: hidden;
`

function Manage({
  onDismiss,
  setModalView,
  setImportList,
  setImportToken,
  setListUrl,
}: {
  onDismiss: () => void
  setModalView: (view: CurrencyModalView) => void
  setImportToken: (token: Token) => void
  setImportList: (list: TokenList) => void
  setListUrl: (url: string) => void
}) {
  const { i18n } = useLingui()

  const [tabIndex, setTabIndex] = useState(0)

  return (
    <ContentWrapper>
      <ModalHeader
        onClose={() => setModalView(CurrencyModalView.search)}
        title={i18n._(t`Manage`)}
      />
      <Tabs
        forceRenderTabPanel
        selectedIndex={tabIndex}
        onSelect={(index: number) => setTabIndex(index)}
        className="flex flex-col flex-grow p-6 pt-2"
      >
        <TabList className="flex flex-shrink-0 bg-blue">
          <Tab
            className="flex items-center justify-center flex-1 px-1 py-2 text-lg cursor-pointer select-none text-white hover:text-aqua focus:outline-none focus:text-aqua"
            selectedClassName="bg-lightBlueSecondary text-high-emphesis"
          >
            {i18n._(t`Lists`)}
          </Tab>
          <Tab
            className="flex items-center justify-center flex-1 px-1 py-2 text-lg cursor-pointer select-none text-white hover:text-aqua focus:outline-none focus:text-aqua"
            selectedClassName="bg-lightBlueSecondary text-high-emphesis"
          >
            {i18n._(t`Tokens`)}
          </Tab>
        </TabList>
        <TabPanel style={{ flexGrow: 1 }}>
          <ManageLists setModalView={setModalView} setImportList={setImportList} setListUrl={setListUrl} />
        </TabPanel>
        <TabPanel style={{ flexGrow: 1 }}>
          <ManageTokens setModalView={setModalView} setImportToken={setImportToken} />
        </TabPanel>
      </Tabs>
    </ContentWrapper>
  )
}

export default Manage
