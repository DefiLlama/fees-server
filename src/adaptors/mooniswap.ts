import { FeeAdapter } from "../utils/adapters.type";
import { getDexChainFees } from "../helpers/getUniSubgraphFees";
import volumeAdapter from "@defillama/adapters/volumes/adapters/mooniswap";

const TOTAL_FEES = 0.003;
const PROTOCOL_FEES = 0.00015;

const baseAdapter = getDexChainFees({
  totalFees: TOTAL_FEES,
  protocolFees: PROTOCOL_FEES,
  volumeAdapter
});

const adapter: FeeAdapter = {
  fees: baseAdapter
};

export default adapter;
