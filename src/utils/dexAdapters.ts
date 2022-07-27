import feeAdapters from "../adaptors";
import { notUndefined } from "./adapterData"
import { Chain } from "./constants";
import { DexFeeAdapter } from "./dexAdapters.type";
import data from "./protocols/data";

const allFeeAdapters: Record<string, DexFeeAdapter> = feeAdapters;

const dexes = data.filter(d => d.category === "Dexes")

const dexFeeAdapters: DexFeeAdapter[] = Object.keys(allFeeAdapters).map(adapterKey => {
    const foundInProtocols = dexes.find(protocol =>
        protocol.name.toLowerCase()?.includes(adapterKey)
        || protocol.gecko_id?.includes(adapterKey)
        || protocol.module.split("/")[0]?.includes(adapterKey)
    )
    if (foundInProtocols) return allFeeAdapters[adapterKey]
    // TODO: Handle better errors
    console.error(`Missing info for ${adapterKey}!`)
    return undefined
}).filter(notUndefined);

const getAllChainsFromDexAdapters = Object.values(dexFeeAdapters).reduce((acc, dexAdapter) => {
    if ("fees" in dexAdapter) {
        const chains = Object.keys(dexAdapter.fees) as Chain[]
        for (const chain of chains)
            if (!acc.includes(chain)) acc.push(chain)
    } else console.error("Invalid adapter")
    return acc
}, [] as Chain[])

export default () => getAllChainsFromDexAdapters