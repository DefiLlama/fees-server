import feeAdaptors from "../adaptors";
import { FeeAdapter } from "./adapters.type";
import data from "./protocols/data";
import { Protocol } from "./protocols/types";
import { Chain } from "./constants";

export interface IAdapterInfo {
  id: string
  chain: string
  timestamp: number
  version?: string
}
  
export async function handleAdapterError(e: Error, adapterInfo?: IAdapterInfo) {
  // TODO: handle error properly
  console.error(adapterInfo)
  console.error(e)
  throw new Error(`Couldn´t get data for ${JSON.stringify(adapterInfo)}`)
}

export interface Adaptor extends Protocol{
    id: string;
    name: string;
    adapterKey: string;
}

export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

const allFeeAdapters: Record<string, FeeAdapter> = feeAdaptors;

export const protocolFeeAdapters: FeeAdapter[] = Object.keys(allFeeAdapters).map(adapterKey => {
    const foundInProtocols = data.find(protocol =>
        protocol.name.toLowerCase()?.includes(adapterKey)
        || protocol.gecko_id?.includes(adapterKey)
        || protocol.module.split("/")[0]?.includes(adapterKey)
    )
    if (foundInProtocols) {
        return allFeeAdapters[adapterKey]
    }
    // TODO: Handle better errors
    console.error(`Missing info for ${adapterKey}!`)
    return undefined
}).filter(notUndefined);

export const protocolAdapterData: Adaptor[] = Object.keys(allFeeAdapters).map(adapterKey => {
    const foundInProtocols = data.find(protocol =>
        protocol.name.toLowerCase()?.includes(adapterKey)
        || protocol.gecko_id?.includes(adapterKey)
        || protocol.module.split("/")[0]?.includes(adapterKey)
    )
    if (foundInProtocols) {
        return {
            ...foundInProtocols,
            adapterKey
        }
    }
    // TODO: Handle better errors
    console.error(`Missing info for ${adapterKey}!`)
    return undefined
}).filter(notUndefined);

export const getAllChainsFromAdapters = () => Object.values(protocolFeeAdapters).reduce((acc, adapter) => {
    if ("fees" in adapter) {
        const chains = Object.keys(adapter.fees) as Chain[]
        for (const chain of chains)
            if (!acc.includes(chain)) acc.push(chain)
    } else if ("breakdown" in adapter) {
        for (const brokenDownDex of Object.values(adapter.breakdown)) {
            const chains = Object.keys(brokenDownDex) as Chain[]
            for (const chain of chains)
                if (!acc.includes(chain)) acc.push(chain)
        }
    } else console.error("Invalid adapter")
    return acc
}, [] as Chain[])
