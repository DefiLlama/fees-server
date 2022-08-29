import { FeeAdapter } from "../utils/adapters.type";
import { getDexChainFees } from "../helpers/getUniSubgraphFees";
import volumeAdapter from "@defillama/adapters/dexVolumes/mooniswap";

const TOTAL_FEES = 0.003;
const baseAdapter = getDexChainFees({
  volumeAdapter,
  totalFees: TOTAL_FEES
});

const adapter: FeeAdapter = {
  fees: baseAdapter
};

export default adapter;
