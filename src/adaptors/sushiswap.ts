import { getDexChainFees } from "../helpers/getUniSubgraphFees";
import volumeAdapter from "@defillama/adapters/dexVolumes/sushiswap";
import { DexFeeAdapter, BaseAdapter } from "../utils/adapters.type";

const TOTAL_FEES = 0.003;
const PROTOCOL_FEES = 0.0005;

const feeAdapter: BaseAdapter = getDexChainFees({
  totalFees: TOTAL_FEES,
  protocolFees: PROTOCOL_FEES,
  volumeAdapter
});

const adapter: DexFeeAdapter = {
    fees: feeAdapter
};

export default adapter;
