import adapters from "./adaptors"
import { Adaptor } from "../adapterData"

export function importFeesAdapter(adaptor: Adaptor) {
    return (adapters as any)[`${adaptor.adapterKey}`]
}
