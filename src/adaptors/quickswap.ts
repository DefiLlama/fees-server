import { getDexChainFees } from "../helpers/getUniSubgraphFees";
import { DexFeeAdapter } from "../utils/adapters.type";
import { POLYGON } from "../helpers/chains";

const endpoints = {
  [POLYGON]: "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap05",
};

const TOTAL_FEES = 0.003;

const graphs = getDexChainFees({
  graphUrls: {
    [POLYGON]: endpoints[POLYGON]
  },
  totalFees: TOTAL_FEES,
  hasDailyVolume: false,
});

const fees = Object.keys(endpoints).reduce(
  (acc, chain) => ({
    ...acc,
    [chain]: {
      fetch: graphs(chain),
      start: 1602115200,
    },
  }),
  {}
);

const adapter: DexFeeAdapter = {
    fees,
};

export default adapter;
