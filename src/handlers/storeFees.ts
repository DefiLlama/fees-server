import { getChainBlocks } from "@defillama/sdk/build/computeTVL/blocks";

import { wrapScheduledLambda } from "../utils/wrap";
import { getTimestampAtStartOfDayUTC } from "../utils/date";
import feeAdapters from "../utils/adapterData";
import { BaseAdapter, FeeAdapter } from "../utils/adapters.type";
import { handleAdapterError } from "../utils";
import getAllChainsFromDexAdapters from "../utils/dexAdapters";
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
  const allChains = getAllChainsFromDexAdapters()
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

  // TODO: change for allSettled, also incorporate non DEX fees at some point
  const feeResponses = await Promise.all(event.protocolIndexes.map(async protocolIndex => {
    // Get info
    const { id, adapterKey } = feeAdapters[protocolIndex];

    try {
      // Import adapter
      const adapter: FeeAdapter = (await importFeesAdapter(feeAdapters[protocolIndex])).default;

      // Retrieve daily volumes
      let rawDailyFees: IRecordFeeData[] = []
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
        }
      } else {
        console.error("Invalid adapter")
        throw new Error("Invalid adapter")
      }
      console.log("raw daily fees " + rawDailyFees)
      const dailyFees = rawDailyFees.reduce((acc, current: IRecordFeeData) => {
        const chain = Object.keys(current)[0]
        acc[chain] = {
          ...acc[chain],
          ...current[chain]
        }
        return acc
      }, {} as IRecordFeeData)
      console.log("Retrieved", "fees", id, fetchCurrentDayTimestamp, dailyFees)

      await storeFees(new Fee(FeeType.dailyFees, id, fetchCurrentDayTimestamp, dailyFees))
    }
    catch (error) {
      const err = error as Error
      console.error(error)
      throw error
    }
  }))

  // TODO: check if all adapters were success
  console.log(feeResponses)
  return
};

export default wrapScheduledLambda(handler);
