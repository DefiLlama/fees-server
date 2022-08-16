import feeAdapters from "../adaptors";
import { notUndefined } from "./adapterData"
import { Chain } from "./constants";
import { FeeAdapter } from "./adapters.type";
import data from "./protocols/data";

const allFeeAdapters: Record<string, FeeAdapter> = feeAdapters;

const dexes = data.filter(d => d.category === "Dexes")

const dexFeeAdapters: FeeAdapter[] = Object.keys(allFeeAdapters).map(adapterKey => {
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
    } else if ("breakdown" in dexAdapter) {
        for (const brokenDownDex of Object.values(dexAdapter.breakdown)) {
            const chains = Object.keys(brokenDownDex) as Chain[]
            for (const chain of chains)
                if (!acc.includes(chain)) acc.push(chain)
        }
    } else console.error("Invalid adapter")
    return acc
}, [] as Chain[])

export default () => getAllChainsFromDexAdapters