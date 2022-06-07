import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import Dots from '../../components/Dots'
import useSortableData from '../../hooks/useSortableData'
import FarmListItem2 from './FarmListItem2'
import FarmListItem3 from './FarmListItem3'

const FarmList = ({ farms, boosted, term, filter, view, sortBy }) => {
  const { query } = useRouter()
  const { items, requestSort, sortConfig } = useSortableData(farms)
  const [currentSort, setCurrentSort] = useState('apy')
  const { i18n } = useLingui()

  const isBeefy = query['filter'] == 'beefy'

  useEffect(() => {
    requestSort(sortBy)
  }, [sortBy])

  return isBeefy ? (
    <div className="w-full py-6 text-center">{i18n._(t`Soon`)}</div>
  ) : items ? (
    <>          
      {view === 'cards' && (
        <div className="flex-col md:flex-row md:flex mt-2 gap-5 flex-wrap farm-card">
          {items.map((farm, index) => (
            <FarmListItem2 key={index} farm={farm} />
          ))}
        </div>
      )}
      {view === 'rows' && (
        <div className="flex-col mt-2 gap-5 farm-card">
          {boosted.map((farm, index) => (
            <>                           
              {index == 0 && (
              <>
                <div className="text-lg flex justify-start text-white mb-5">Boosted</div>
              </>
              )} 
              <FarmListItem3 key={index} farm={farm} />
              {index == 2 && (
                <>
                  <div className="flex mb-12"></div>
                </>
              )}              
            </>
          ))}
          {view === 'rows' && (
        <div
          className="hidden md:grid grid grid-cols-4 text-base font-bold text-primary dark:text-d-text-primary mb-6 pt-8"
          style={{ borderTop: '2px solid #1F357D' }}
        >
          <div className="flex items-center justify-start px-2">
            <div
              className="px-3 py-1 border border-lightBlueSecondary hover:text-aqua cursor-pointer flex justify-center items-center"
              onClick={() => requestSort('symbol')}
              style={{ borderWidth: 2 }}
            >
              {i18n._(t`Featured`)}
              {sortConfig &&
                sortConfig.key === 'symbol' &&
                ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={20} height={20} />) ||
                  (sortConfig.direction === 'descending' && <ChevronDownIcon width={20} height={20} />))}
            </div>
          </div>
          <div className="flex items-center justify-start px-2 ml-8">
            <div
              className="px-3 py-1 border border-lightBlueSecondary hover:text-aqua cursor-pointer flex justify-center items-center"
              onClick={() => requestSort('roiPerYear')}
              style={{ borderWidth: 2 }}
            >
              {i18n._(t`APR`)}
              {sortConfig &&
                sortConfig.key === 'roiPerYear' &&
                ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={20} height={20} />) ||
                  (sortConfig.direction === 'descending' && <ChevronDownIcon width={20} height={20} />))}
            </div>
          </div>
          <div className="flex items-center justify-start px-2" style={{ marginLeft: -40 }}>
            <div
              className="px-3 py-1 border border-lightBlueSecondary hover:text-aqua cursor-pointer flex justify-center items-center"
              onClick={() => requestSort('tvl')}
              style={{ borderWidth: 2 }}
            >
              {i18n._(t`Liquidity`)}
              {sortConfig &&
                sortConfig.key === 'tvl' &&
                ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={20} height={20} />) ||
                  (sortConfig.direction === 'descending' && <ChevronDownIcon width={20} height={20} />))}
            </div>
          </div>
          <div
            style={{ marginLeft: -20 }}
            className="items-center justify-start hidden px-2 md:flex hover:text-high-emphesis"
          >
            <div
              className="px-3 py-1 border border-lightBlueSecondary hover:text-aqua cursor-pointer flex justify-center items-center"
              onClick={() => requestSort('pendingGlint')}
              style={{ borderWidth: 2 }}
            >
              {i18n._(t`Earnings`)}
              {sortConfig &&
                sortConfig.key === 'pendingGlint' &&
                ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={20} height={20} />) ||
                  (sortConfig.direction === 'descending' && <ChevronDownIcon width={20} height={20} />))}
            </div>
          </div>
        </div>
      )}
          {items.map((farm, index) => (
            <>              
              <FarmListItem3 key={index} farm={farm} />
            </>
          ))}
        </div>
      )}
    </>
  ) : (
    <div className="w-full py-6 text-center">
      {term ? <span>{i18n._(t`No Results`)}</span> : <Dots>{i18n._(t`Loading`)}</Dots>}
    </div>
  )
}

export default FarmList
