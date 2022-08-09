import { getDexChainFees } from "../helpers/getUniSubgraphFees";
import { getStartTimestamp } from "../helpers/getStartTimestamp";
import { DexFeeAdapter } from "../utils/adapters.type";
import { POLYGON } from "../helpers/chains";

const endpoints = {
  [POLYGON]: "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap05",
};

// const graphs = getDexChainFees({
//   graphUrls: {
//     POLYGON: endpoints.POLYGON,
//   }
// });

// const adapter: DexFeeAdapter = {
//   fees: {
//     polygon: {
//       fetch: graphs("polygon"),
//       start: 1602115200,
//     },
//   },
// };

// export default adapter;

const VOLUME_FIELD = "volumeUSD";
const TOTAL_FEES = 0.003;

const graphs = getDexChainFees({
  graphUrls: {
    [POLYGON]: endpoints[POLYGON]
  },
  totalFees: TOTAL_FEES,
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
