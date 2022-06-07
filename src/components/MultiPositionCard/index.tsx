import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'
import React, { useState } from 'react'
import Button from '../Button'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import { classNames } from '../../functions'
import { Transition } from '@headlessui/react'
import Image from '../../components/Image'

interface MultiPositionCardProps {
  currency1: 'usdt' | 'busd' | 'usdc' | 'dai'
  currency2: 'usdt' | 'busd' | 'usdc' | 'dai'
  currency3: 'usdt' | 'busd' | 'usdc' | 'dai'
}

export default function MultiPositionCard({ currency1, currency2, currency3 }: MultiPositionCardProps) {
  const { i18n } = useLingui()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)

  // Just FYI
  const currencyMulti3PoolUSDC = {
    numerator: [500000000],
    denominator: [1],
    currency: {
      isNative: false,
      isToken: true,
      chainId: 1287,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x65C281140d15184de571333387BfCC5e8Fc7c8dc',
    },
    decimalScale: [1000000],
  }

  const currencyMulti3PoolUSDT = {
    numerator: [500000000],
    denominator: [1],
    currency: {
      isNative: false,
      isToken: true,
      chainId: 1287,
      decimals: 6,
      symbol: 'USDT',
      name: 'USD Tether',
      address: '0x000359FA0c213B48C69B34996B56edacEc0Bb3ea',
    },
    decimalScale: [1000000],
  }

  const currencyMulti3PoolBUSD = {
    numerator: [793772032, 731077515, 433],
    denominator: [1],
    currency: {
      isNative: false,
      isToken: true,
      chainId: 1287,
      decimals: 18,
      symbol: 'BUSD',
      name: 'BUSD token',
      address: '0xe7b932a60E7d0CD08804fB8a3038bCa6218a7Fa2',
    },
    decimalScale: [660865024, 931322574],
  }

  const currencyNomad3PoolUSDC = {
    numerator: [500000000],
    denominator: [1],
    currency: {
      isNative: false,
      isToken: true,
      chainId: 1287,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x8f45b090BE2eeB91687E6EaBF7e4402392a370b8',
    },
    decimalScale: [1000000],
  }

  const currencyNomad3PoolUSDT = {
    numerator: [500000000],
    denominator: [1],
    currency: {
      isNative: false,
      isToken: true,
      chainId: 1287,
      decimals: 6,
      symbol: 'USDT',
      name: 'USD Tether',
      address: '0xC37b5518a30505e1199E8Fb49C64Dc1EB20A4D00',
    },
    decimalScale: [1000000],
  }

  const currencyNomad3PoolDAI = {
    numerator: [793772032, 731077515, 433],
    denominator: [1],
    currency: {
      isNative: false,
      isToken: true,
      chainId: 1287,
      decimals: 18,
      symbol: 'DAI',
      name: 'DAI Token',
      address: '0xf3dd94c1BC65E2359107523E647CFb98aa656B9d',
    },
    decimalScale: [660865024, 931322574],
  }

  return (
    <div className="bg-deepCove bg-linear-gradient-border" style={{ border: '2px solid #142970' }}>
      <Button
        variant="empty"
        className={classNames(
          'flex items-center justify-between w-full px-4 py-6 cursor-pointer hover:bg-darkBlue',
          showMore && '!bg-darkBlue'
        )}
        style={{ boxShadow: 'none', borderRadius: 0 }}
        onClick={() => setShowMore(!showMore)}
      >
        <div className="flex items-center space-x-4">
          <div className="rounded" style={{ width: 46, height: 46 }}>
            <Image
              src={`/images/tokens/${currency1.toUpperCase()}.png`}
              width={46}
              height={46}
              alt={`${currency1.toUpperCase()} image`}
              layout="fixed"
              className="rounded"
              quality={50}
            />
          </div>
          <div className="rounded" style={{ width: 46, height: 46 }}>
            <Image
              src={`/images/tokens/${currency2.toUpperCase()}.png`}
              width={46}
              height={46}
              alt={`${currency2.toUpperCase()} image`}
              layout="fixed"
              className="rounded"
              quality={50}
            />
          </div>
          <div className="rounded" style={{ width: 46, height: 46 }}>
            <Image
              src={`/images/tokens/${currency3.toUpperCase()}.png`}
              width={46}
              height={46}
              alt={`${currency3.toUpperCase()} image`}
              layout="fixed"
              className="rounded"
              quality={50}
            />
          </div>
          <p>
            {currency1.toUpperCase()} + {currency2.toUpperCase()} + {currency3.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center space-x-4 text-jordyBlue">
          {i18n._(t`Manage`)}
          {showMore ? (
            <ChevronUpIcon width="20px" height="20px" className="ml-4" />
          ) : (
            <ChevronDownIcon width="20px" height="20px" className="ml-4" />
          )}
        </div>
      </Button>

      <Transition
        show={showMore}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="p-4 space-y-4">
          <div className="px-4 py-4 space-y-1 text-sm text-high-emphesis bg-blue">
            <div className="flex items-center justify-between">
              <div>{currency1.toUpperCase()}:</div>
              <div className="font-semibold">$122,710 (35.74%)</div>
            </div>
            <div className="flex items-center justify-between">
              <div>{currency2.toUpperCase()}:</div>
              <div className="font-semibold">$113,055 (32.92%)</div>
            </div>
            <div className="flex items-center justify-between">
              <div>{currency3.toUpperCase()}:</div>
              <div className="flex items-center space-x-2">
                <div className="font-semibold">$107,612 (31.34%)</div>
                {/* <CurrencyLogo size="20px" currency={currency0} /> */}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>Virtual Price:</div>
              <div className="font-semibold">1.004216</div>
            </div>
            <div className="flex items-center justify-between">
              <div>Amplification coefficient:</div>
              <div className="font-semibold">200</div>
            </div>
            <div className="flex items-center justify-between">
              <div>Swap Fee:</div>
              <div className="font-semibold">0.04%</div>
            </div>
            <div className="flex items-center justify-between">
              <div>Admin Fee:</div>
              <div className="font-semibold">50% of 0.04%</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              color="light-green"
              variant="link"
              style={{ color: '#ffffff' }}
              className="bg-linear-gradient text-white"
              onClick={() => {
                router.push(`/exchange/add/multi`)
              }}
            >
              {i18n._(t`Add`)}
            </Button>
            <Button
              color="light-green"
              variant="link"
              style={{ border: '2px solid #142970', color: '#ffffff', borderRadius: 2 }}
              onClick={() => {
                router.push(`/exchange/remove/multi`)
              }}
            >
              {i18n._(t`Remove`)}
            </Button>
          </div>
        </div>
      </Transition>
    </div>
  )
}
