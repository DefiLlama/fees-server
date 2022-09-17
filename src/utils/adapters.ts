import feeAdaptors from "../adaptors";
import { FeeAdapter } from "./adapters.type";
import data from "./protocols/data";
import chains from "./protocols/chains";
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

export interface Adaptor {
    id: string;
    name: string;
    adapterKey: string;
    adapterType: string;
}

export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

const allFeeAdapters: Record<string, FeeAdapter> = feeAdaptors;

export const protocolFeeAdapters: FeeAdapter[] = Object.entries(allFeeAdapters).map(adapterObj => {
    const [adapterKey, adapter] = adapterObj
    const adapterType = adapter.adapterType
    
    const foundInProtocols = !adapterType ? data.find(protocol =>
        protocol.name.toLowerCase()?.includes(adapterKey)
        || protocol.gecko_id?.includes(adapterKey)
        || protocol.module.split("/")[0]?.includes(adapterKey)
    ) : chains.find(chain => chain.gecko_id?.toLowerCase().includes(adapterKey) || chain.name.toLowerCase().includes(adapterKey))
    if (foundInProtocols) {
        return allFeeAdapters[adapterKey]
    }
    // TODO: Handle better errors
    console.error(`Missing info for ${adapterKey}!`)
    return undefined
}).filter(notUndefined);

export const protocolAdapterData: Adaptor[] = Object.entries(allFeeAdapters).map(adapterObj => {
    const [adapterKey, adapter] = adapterObj
    const adapterType = adapter.adapterType

    if (!adapterType) {
        const foundInProtocols = data.find(protocol =>
            protocol.name.toLowerCase()?.includes(adapterKey)
            || protocol.gecko_id?.includes(adapterKey)
            || protocol.module.split("/")[0]?.includes(adapterKey)
        )
        if (foundInProtocols) {
            return {
                ...foundInProtocols,
                adapterType: "protocol",
                adapterKey
            }
        }
    } else if (adapterType === "chain") {
        const foundInChains = chains.find(chain => chain.gecko_id?.toLowerCase().includes(adapterKey) || chain.name.toLowerCase().includes(adapterKey))
        if (foundInChains)  {
            return {
                id: foundInChains.chainId ? foundInChains.chainId.toString() : foundInChains.tokenSymbol?.toLowerCase(),
                name: foundInChains.name,
                category: "Chain",
                symbol: foundInChains.tokenSymbol,
                gecko_id: foundInChains.gecko_id,
                cmcId: foundInChains.cmcId,
                adapterType,
                adapterKey
            }
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
