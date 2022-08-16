import { getDexChainFees } from "../helpers/getUniSubgraphFees";
import { DexFeeAdapter } from "../utils/adapters.type";
import { POLYGON } from "../helpers/chains";

const endpoints = {
  [POLYGON]: "https://polygon.furadao.org/subgraphs/name/quickswap",
};

const TOTAL_FEES = 0.003;
const PROTOCOL_FEES = 0.0005;

const graphs = getDexChainFees({
  graphUrls: {
    [POLYGON]: endpoints[POLYGON]
  },
  totalFees: TOTAL_FEES,
  protocolFees: PROTOCOL_FEES
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