import feeAdaptors from "../adaptors";
import data from "./protocols/data";
import { Protocol } from "./protocols/types";

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

// Getting list of all fee adapters
const feeAdaptersKeys = Object.keys(feeAdaptors).map(k => k.toLowerCase())
// Adding data to objects
const adaptorData: Adaptor[] = feeAdaptersKeys.map(adapterKey => {
    const foundInProtocols = data.find(protocol =>
        protocol.name.toLowerCase()?.includes(adapterKey)
        || protocol.gecko_id?.includes(adapterKey)
        || protocol.module.split("/")[0]?.includes(adapterKey)
    )
    if (foundInProtocols) return {
        ...foundInProtocols,
        adapterKey: adapterKey
    }
    // TODO: Handle better errors
    console.error(`Missing info for ${adapterKey}!`)
    return undefined
}).filter(notUndefined);

export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

export default adaptorData;