import { getChainBlocks } from "@defillama/sdk/build/computeTVL/blocks";

import { wrapScheduledLambda } from "../utils/wrap";
import { getTimestampAtStartOfDayUTC } from "../utils/date";
import { protocolAdapterData, getAllChainsFromAdapters } from "../utils/adapters";
import { BaseAdapter, FeeAdapter } from "../utils/adapters.type";
import { handleAdapterError } from "../utils";
import allSettled from 'promise.allsettled'
import { importFeesAdapter } from "../utils/imports/importAdapter";
import { storeFees, Fee, FeeType } from "../utils/data/fees";

interface IHandlerEvent {
  protocolIndexes: number[]
  timestamp?: number
}

export interface IRecordFeeData {
  [chain: string]: {
    [protocolVersion: string]: number | undefined,
  }
}

export const handler = async (event: IHandlerEvent) => {
  // Timestamp to query, defaults current timestamp
  const currentTimestamp = event.timestamp || Date.now() / 1000;
  // Get clean day
  const fetchCurrentDayTimestamp = getTimestampAtStartOfDayUTC(currentTimestamp);

  // Get closest block to clean day. Only for EVM compatible ones.
  const allChains = getAllChainsFromAdapters()
  const chainBlocks = await getChainBlocks(fetchCurrentDayTimestamp, allChains);

  async function runAdapter(feeAdapter: BaseAdapter, id: string, version?: string) {
    const chains = Object.keys(feeAdapter)

    return allSettled(chains.map((chain) => feeAdapter[chain].fetch(fetchCurrentDayTimestamp, chainBlocks).then(result => ({ chain, result })).catch((e) => handleAdapterError(e, {
      id,
      chain,
      version,
      timestamp: fetchCurrentDayTimestamp
    }))))
  }

  const feeResponses = await Promise.all(event.protocolIndexes.map(async protocolIndex => {
    const { id, adapterKey } = protocolAdapterData[protocolIndex];

    try {
      // Import adapter
      const adapter: FeeAdapter = (await importFeesAdapter(protocolAdapterData[protocolIndex])).default;

      let rawDailyFees: IRecordFeeData[] = []
      let rawDailyRevenue: IRecordFeeData[] = []
      if ("fees" in adapter) {
        const runAdapterRes = await runAdapter(adapter.fees, id)
        // TODO: process rejected promises
        const fees = runAdapterRes.filter(rar => rar.status === 'fulfilled').map(r => r.status === "fulfilled" && r.value)
        for (const fee of fees) {
          if (fee && fee.result.dailyFees)
            rawDailyFees.push({
              [fee.chain]: {
                [adapterKey]: +fee.result.dailyFees
              },
            })
          if (fee && fee.result.dailyRevenue)
            rawDailyRevenue.push({
              [fee.chain]: {
                [adapterKey]: +fee.result.dailyRevenue
              },
            })
        }
      } else if ("breakdown" in adapter) {
        const dexFeeBreakDownAdapter = adapter.breakdown
        for (const [version, feeAdapterObj] of Object.entries(dexFeeBreakDownAdapter)) {
          const runAdapterRes = await runAdapter(feeAdapterObj, id)

          const fees = runAdapterRes.filter(rar => rar.status === 'fulfilled').map(r => r.status === "fulfilled" && r.value)

          for (const fee of fees) {
            if (fee && fee.result.dailyFees) {
              rawDailyFees.push({
                [fee.chain]: {
                  [version]: +fee.result.dailyFees
                },
              })
            }
            if (fee && fee.result.dailyRevenue) {
              rawDailyRevenue.push({
                [fee.chain]: {
                  [version]: +fee.result.dailyRevenue
                },
              })
            }
          }
        }
      } else {
        console.error("Invalid adapter")
        throw new Error("Invalid adapter")
      }
      
      const dailyFees = rawDailyFees.reduce((acc, current: IRecordFeeData) => {
        const chain = Object.keys(current)[0]
        acc[chain] = {
          ...acc[chain],
          ...current[chain]
        }
        return acc
      }, {} as IRecordFeeData)

      const dailyRevenue = rawDailyRevenue.reduce((acc, current: IRecordFeeData) => {
        const chain = Object.keys(current)[0]
        acc[chain] = {
          ...acc[chain],
          ...current[chain]
        }
        return acc
      }, {} as IRecordFeeData)
      console.log("Retrieved", "fees", id, fetchCurrentDayTimestamp, dailyFees)
      console.log("Retrieved", "revenue", id, fetchCurrentDayTimestamp, dailyRevenue)
      // TODO: make this more comprehensive
      const adapterType = adapter.adapterType ? "protocol" : "chain"
      await storeFees(new Fee(FeeType.dailyFees, id, adapterType, fetchCurrentDayTimestamp, dailyFees))
      await storeFees(new Fee(FeeType.dailyRevenue, id, adapterType, fetchCurrentDayTimestamp, dailyRevenue))
    }
    catch (error) {
      const err = error as Error
      console.error(error)
      throw error
    }
  }))

  return
};

export default wrapScheduledLambda(handler);
