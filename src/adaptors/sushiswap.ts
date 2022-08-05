import { getDexChainFees } from "../helpers/getUniSubgraphFees";
import { getStartTimestamp } from "../helpers/getStartTimestamp";
import {
  ARBITRUM,
  AVAX,
  BSC,
  ETHEREUM,
  FANTOM,
  HARMONY,
  POLYGON,
  XDAI,
} from "../helpers/chains";
import { DexFeeAdapter } from "../utils/adapters.type";


const endpoints = {
  [ARBITRUM]:
    "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange",
  [AVAX]:
    "https://api.thegraph.com/subgraphs/name/sushiswap/avalanche-exchange",
  [BSC]: "https://api.thegraph.com/subgraphs/name/sushiswap/bsc-exchange",
  [ETHEREUM]: "https://api.thegraph.com/subgraphs/name/sushiswap/exchange",
  [FANTOM]: "https://api.thegraph.com/subgraphs/name/sushiswap/fantom-exchange",
  [HARMONY]:
    "https://sushi.graph.t.hmny.io/subgraphs/name/sushiswap/harmony-exchange",
  [POLYGON]: "https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange",
  [XDAI]: "https://api.thegraph.com/subgraphs/name/sushiswap/xdai-exchange",
};

const VOLUME_FIELD = "volumeUSD";
const TOTAL_FEES = 0.003;
const PROTOCOL_FEES = 0.0005;

const graphs = getDexChainFees({
  graphUrls: {
    [ARBITRUM]: endpoints[ARBITRUM],
    [AVAX]: endpoints[AVAX],
    [BSC]: endpoints[BSC],
    [ETHEREUM]: endpoints[ETHEREUM],
    [FANTOM]: endpoints[FANTOM],
    [HARMONY]: endpoints[HARMONY],
    [POLYGON]: endpoints[POLYGON],
    [XDAI]: endpoints[XDAI],
  },
  totalFees: TOTAL_FEES,
  protocolFees: PROTOCOL_FEES,
  totalVolume: {
    factory: "factories",
    field: VOLUME_FIELD,
  },
  dailyVolume: {
    factory: "dayData",
    field: VOLUME_FIELD,
  },
});

const startTimeQuery = {
  endpoints,
  dailyDataField: "dayDatas",
  volumeField: VOLUME_FIELD,
};

const fees = Object.keys(endpoints).reduce(
  (acc, chain) => ({
    ...acc,
    [chain]: {
      fetch: graphs(chain),
      start: getStartTimestamp({ ...startTimeQuery, chain }),
    },
  }),
  {}
);

const adapter: DexFeeAdapter = {
    fees,
};

export default adapter;
