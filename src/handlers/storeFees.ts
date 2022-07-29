import { getChainBlocks } from "@defillama/sdk/build/computeTVL/blocks";

import { wrapScheduledLambda } from "../utils/wrap";
import { getTimestampAtStartOfDayUTC } from "../utils/date";
import feeAdapters from "../utils/adapterData";
import { BaseAdapter, FeeAdapter } from "../utils/adapters.type";
import { handleAdapterError } from "../utils";
import getAllChainsFromDexAdapters from "../utils/dexAdapters";
import allSettled from 'promise.allsettled'
import { importFeesAdapter } from "../utils/imports/importAdapter";

// TODO: modify these 
// import { storeVolume, Volume, VolumeType } from "../data/volume";

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
  const fetchCurrentHourTimestamp = getTimestampAtStartOfDayUTC(currentTimestamp);

  // Get closest block to clean day. Only for EVM compatible ones.
  const allChains = getAllChainsFromDexAdapters()
  const chainBlocks = await getChainBlocks(fetchCurrentHourTimestamp, allChains);

  async function runAdapter(feeAdapter: BaseAdapter, id: string, version?: string) {
    const chains = Object.keys(feeAdapter)
    console.log(fetchCurrentHourTimestamp)
    return allSettled(chains.map((chain) => feeAdapter[chain].fetch(fetchCurrentHourTimestamp, chainBlocks).then(result => ({ chain, result })).catch((e) => handleAdapterError(e, {
      id,
      chain,
      version,
      timestamp: fetchCurrentHourTimestamp
    }))))
  }

  // TODO: change for allSettled, also incorporate non DEX fees at some point
  const feeResponses = await Promise.all(event.protocolIndexes.map(async protocolIndex => {
    console.log(event)
    // Get info
    const { id, adapterKey } = feeAdapters[protocolIndex];
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
    const dailyFees = rawDailyFees.reduce((acc, current: IRecordFeeData) => {
      const chain = Object.keys(current)[0]
      acc[chain] = {
        ...acc[chain],
        ...current[chain]
      }
      return acc
    }, {} as IRecordFeeData)
    console.log("Retrieved", "fees", id, fetchCurrentHourTimestamp, dailyFees)

    // const v = new Volume(VolumeType.dailyVolume, id, fetchCurrentHourTimestamp, dailyVolumes)
    // console.log("Retrieved", v, v.keys())
    // await storeVolume(v)
    // console.log("Stored", v.keys())
  }))

  // TODO: check if all adapters were success
  console.log(feeResponses)
  return
};

export default wrapScheduledLambda(handler);