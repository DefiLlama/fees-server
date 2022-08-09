import { DexFeeAdapter } from "../utils/adapters.type";
import { 
  getDexChainFees, 
  DEFAULT_DAILY_VOLUME_FIELD, 
  DEFAULT_TOTAL_VOLUME_FIELD
} from "../helpers/getUniSubgraphFees";
import { getStartTimestamp } from "../helpers/getStartTimestamp";
import { ETHEREUM } from "../helpers/chains";

const endpoints = {
  [ETHEREUM]:
    "https://api.thegraph.com/subgraphs/name/1inch-exchange/oneinch-liquidity-protocol-v2",
};

const dailyDataFactory = "mooniswapDayData";

const graphs = getDexChainFees({
  graphUrls: {
    [ETHEREUM]: endpoints[ETHEREUM],
  },
  totalVolume: {
    factory: "mooniswapFactories",
    field: DEFAULT_TOTAL_VOLUME_FIELD,
  },
  dailyVolume: {
    factory: dailyDataFactory,
    field: DEFAULT_DAILY_VOLUME_FIELD,
  },
});

const adapter: DexFeeAdapter = {
  fees: {
    [ETHEREUM]: {
      fetch: graphs(ETHEREUM),
      start: getStartTimestamp({
        endpoints,
        chain: ETHEREUM,
        dailyDataField: `${dailyDataFactory}s`,
      }),
    },
  },
};

export default adapter;
