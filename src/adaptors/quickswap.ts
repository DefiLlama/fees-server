import { getDexChainFeesRaw } from "../helpers/getUniSubgraphFees";
import { FeeAdapter } from "../utils/adapters.type";
import { POLYGON } from "../helpers/chains";
import { Chain } from "@defillama/sdk/build/general";

const endpoints = {
  [POLYGON]: "https://polygon.furadao.org/subgraphs/name/quickswap",
};

const TOTAL_FEES = 0.003;
const PROTOCOL_FEES = 0.0005;

const graphs = getDexChainFeesRaw({
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
      fetch: graphs(chain as Chain),
      start: 1602115200,
    },
  }),
  {}
);

const adapter: FeeAdapter = {
    fees,
};

export default adapter;
