import { FeeAdapter } from "../utils/adapters.type";
import { OPTIMISM } from "../helpers/chains";
import { chainAdapter } from "../helpers/getChainFees";

const feeAdapter = chainAdapter(OPTIMISM, "eth", 1386478800);

const adapter: FeeAdapter = {
  fees: feeAdapter,
  adapterType: "chain"
}

export default adapter;
