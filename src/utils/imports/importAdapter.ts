import adapters from "./adaptors"
import { Adaptor } from "../adapters"

export function importFeesAdapter(adaptor: Adaptor) {
    return (adapters as any)[`${adaptor.adapterKey}`]
}
