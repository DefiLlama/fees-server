import { FeeAdapter } from "../utils/adapters.type";
import volumeAdapter from "@defillama/adapters/volumes/adapters/mojitoswap";
import { getDexChainFees } from "../helpers/getUniSubgraphFees";

const TOTAL_FEES = 0.003;
const PROTOCOL_FEES = 0.0012;

const feeAdapter = getDexChainFees({
  totalFees: TOTAL_FEES,
  protocolFees: PROTOCOL_FEES,
  volumeAdapter
});

const adapter: FeeAdapter = {
  fees: feeAdapter
};


export default adapter;
