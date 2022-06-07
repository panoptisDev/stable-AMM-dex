import { ChainId } from '../../../sdk'
import { getAverageBlockTime, getBlock, getMassBlocks } from '../fetchers/blocks'
import { useActiveWeb3React } from '../../web3'
import {
  addSeconds,
  getUnixTime,
  startOfHour,
  startOfMinute,
  startOfSecond,
  subDays,
  subWeeks,
  subMinutes,
  subHours,
} from 'date-fns'
import stringify from 'fast-json-stable-stringify'
import useSWR, { SWRConfiguration } from 'swr'

import { GraphProps } from '../interfaces'

export function useOneDayBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(startOfHour(subDays(Date.now(), 1))))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 600))

  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useFiveMinBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(subMinutes(Date.now(), 5)))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 100))

  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useFifteenMinBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(subMinutes(Date.now(), 15)))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 150))

  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useOneHourMinBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(startOfHour(subHours(Date.now(), 1))))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 10))

  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useForHourMinBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(startOfHour(subHours(Date.now(), 4))))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 10))

  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useTwoDayBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(startOfHour(subDays(Date.now(), 2))))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 600))
  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useOneWeekBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(startOfHour(subWeeks(Date.now(), 1))))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 600))
  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useTwoWeekBlock({ chainId = ChainId.MOONBEAM, shouldFetch = true, swrConfig = undefined }) {
  const date = startOfSecond(startOfMinute(startOfHour(subWeeks(Date.now(), 2))))
  const start = getUnixTime(date)
  const end = getUnixTime(addSeconds(date, 600))
  return useBlock({
    chainId,
    variables: {
      where: {
        timestamp_gt: start,
        timestamp_lt: end,
      },
    },
    shouldFetch,
    swrConfig,
  })
}

export function useBlock({
  chainId = ChainId.MOONBEAM,
  variables,
  shouldFetch = true,
  swrConfig = undefined,
}: GraphProps): { number?: number } {
  const { data } = useSWR(
    shouldFetch ? ['block', chainId, stringify(variables)] : null,
    (_, chainId) => getBlock(chainId, variables),
    swrConfig
  )
  return data
}

interface useMassBlocksProps {
  timestamps: number[] | string[]
  swrConfig?: SWRConfiguration
}

export function useMassBlocks({ timestamps, swrConfig = undefined }: useMassBlocksProps) {
  const { chainId } = useActiveWeb3React()

  const { data } = useSWR(
    chainId ? ['massBlocks', chainId, stringify(timestamps)] : null,
    (_, chainId) => getMassBlocks(chainId, timestamps),
    swrConfig
  )

  return data
}

export function useAverageBlockTime({ chainId = ChainId.MOONBEAM, swrConfig = undefined }) {
  const { data } = useSWR(
    chainId ? ['averageBlockTime', chainId] : null,
    (_, chainId) => getAverageBlockTime(chainId),
    swrConfig
  )
  return data
}
