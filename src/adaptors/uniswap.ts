import { DexFeeBreakdownAdapter } from "../utils/adapters.type";
import { ARBITRUM, ETHEREUM, OPTIMISM, POLYGON } from "../helpers/chains";
import { getStartTimestamp } from "../helpers/getStartTimestamp";
import { getUniswapV3Fees } from "../helpers/getUniSubgraphFees";
import volumeAdapter from "@defillama/adapters/dexVolumes/uniswap";

const v3Endpoints = {
  [ETHEREUM]: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
  [OPTIMISM]:
    "https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis",
  [ARBITRUM]:
    "https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-dev",
  [POLYGON]:
    "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon",
};


const VOLUME_USD = "volumeUSD";
const TOTAL_FEES = 0.003;

const v3Graphs = getUniswapV3Fees({
...v3Endpoints
});

const adapter: DexFeeBreakdownAdapter = {
  breakdown: {
    // v1: {
    //   [ETHEREUM]: {
    //     fetch: v1Graph(ETHEREUM),
    //     start: 1541203200,
    //   },
    // },
    // v2: {
    //   [ETHEREUM]: {
    //     fetch: v2Graph(ETHEREUM),
    //     start: getStartTimestamp({
    //       endpoints: v2Endpoints,
    //       chain: ETHEREUM,
    //     }),
    //   },
    // },
    v3: {
      [ETHEREUM]: {
        fetch: v3Graphs(ETHEREUM),
        start: getStartTimestamp({
          endpoints: v3Endpoints,
          chain: ETHEREUM,
          volumeField: VOLUME_USD,
        }),
      },
      [ARBITRUM]: {
        fetch: v3Graphs(ARBITRUM),
        start: getStartTimestamp({
          endpoints: v3Endpoints,
          chain: ARBITRUM,
          volumeField: VOLUME_USD,
        }),
      },
      [POLYGON]: {
        fetch: v3Graphs(POLYGON),
        start: getStartTimestamp({
          endpoints: v3Endpoints,
          chain: POLYGON,
          volumeField: VOLUME_USD,
        }),
      },
    },
  },
};

export default adapter;
