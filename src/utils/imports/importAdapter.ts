import adapters from "./adaptors"
import { Adaptor } from "../adapters"

export async function importFeesAdapter(adaptor: Adaptor) {
    return import(`@defillama/fees-adapters/src/adapters/${adaptor.adapterKey}`)
}
