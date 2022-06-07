import { classNames, formatNumber, formatNumberScale } from '../../functions'
import { Disclosure } from '@headlessui/react'
import React, { useContext, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/outline'
type BurnElements = {
  date: string
  glintAmount: number
  txHash: string
}

const BurnItem = ({ element, ...rest }) => {
  const [showDetails, setShowDetails] = useState(false);

  console.log(showDetails)

  return (
    <React.Fragment>
      <Disclosure {...rest}>
        {({ open }) => (
          <div className="mb-4 w-full cursor-default">
            <Disclosure.Button
              className={classNames(
                open && '',
                'bg-blue p-5 pb-0 w-full'
              )}
              style={{ border: '2px solid #1F357D', cursor: 'default' }}
            >
              <div className="flex justify-between text-white">
                <div className="text-white" style={{ fontSize: 16 }}>Tokens Burned</div>
                <div className="text-white font-bold">{formatNumberScale(element.glintAmount)} GLINT</div>
              </div>
              <div className="flex justify-between text-jordyBlue mt-2">
                <div className="text-jordyBlue">{element.date.toUTCString().split(',')[1].split(' GMT')[0]}</div>
                <div className="text-jordyBlue">{element.dollarValue}</div>
              </div>
              <div className="p-2 text-aqua bg-darkBlue text-center text-xs cursor-pointer mt-2 flex justify-center items-center gap-1" style={{ marginLeft: -20, marginRight: -20 }}
                onClick={() => { setShowDetails(!showDetails) }}>
                <div>Details</div>
                <ChevronDownIcon
                  style={{
                    transition: '0.3s all',
                    transform: `${showDetails ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                  }}
                  width={16}
                  height={16}
                />
              </div>
              {showDetails && (<>
                <div className="flex justify-between text-jordyBlue pt-2 bg-darkBlue px-5 items-center" style={{ marginLeft: -20, marginRight: -20 }}>
                  <div className="text-white text-xs">Transaction Hash</div>
                  <div className="bg-lightBlueSecondary text-aqua text-center p-2 py-1 cursor-pointer text-xs" onClick={() => { window.location.href = 'https://moonscan.io/tx/' + element.txHash }}>Moonscan</div>
                </div>
                <div className="flex justify-between text-jordyBlue pt-2 bg-darkBlue px-5 items-center pb-5" style={{ marginLeft: -20, marginRight: -20 }}>
                  <div className="text-white text-xs">Burn Address</div>
                  <div className="text-jordyBlue text-xxs">{element.burnAddress}</div>
                </div>
              </>)}
            </Disclosure.Button>
          </div>
        )}
      </Disclosure>
    </React.Fragment>
  )
}

export default BurnItem