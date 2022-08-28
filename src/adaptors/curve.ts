import { BreakdownAdapter, DexFeeBreakdownAdapter } from "../utils/adapters.type";
import { ARBITRUM, ETHEREUM, OPTIMISM, POLYGON, AVAX, FANTOM } from "../helpers/chains";
import { getStartTimestamp } from "../helpers/getStartTimestamp";
import { request, gql } from "graphql-request";
import { IGraphUrls } from "../helpers/graphs.type";
import { Chain } from "../utils/constants";

const endpoints = {
  [ETHEREUM]:
    "https://api.thegraph.com/subgraphs/name/curvefi/curve",
  [OPTIMISM]:
    "https://api.thegraph.com/subgraphs/name/dmihal/curve-optimism",
  [ARBITRUM]:
    "https://api.thegraph.com/subgraphs/name/dmihal/curve-arbitrum",
  [POLYGON]:
    "https://api.thegraph.com/subgraphs/name/dmihal/curve-polygon",
  [AVAX]:
    "https://api.thegraph.com/subgraphs/name/dmihal/curve-avalanche",
  [FANTOM]:
    "https://api.thegraph.com/subgraphs/name/dmihal/curve-fantom",
};

const getCurveFees = (graphUrls: IGraphUrls) => {
  const graphQuery = gql`query fees($timestamp_gte: Int!, $timestamp_lte: Int!) 
  {
    dailyVolumes (
      orderBy: timestamp
      orderDirection: desc
      first: 1000
      where: {
        timestamp_gte: $timestamp_gte
        timestamp_lt: $timestamp_lte
      }
    ) {
      pool {
        fee
        adminFee
        assetType
        name
      }
      volume
      timestamp
    }
  }
  `;
  
  return (chain: Chain) => {
    return async (timestamp: number) => {
      const dateId = getUniswapDateId(new Date(timestamp * 1000));

      const graphRes = await request(graphUrls[chain], graphQuery, {
        dateId,
      });

      return {
        timestamp,
        totalFees: graphRes[DEFAULT_TOTAL_FEES_FACTORY][0][DEFAULT_TOTAL_FEES_FIELD],
        dailyFees: graphRes[DEFAULT_DAILY_FEES_FACTORY][DEFAULT_DAILY_FEES_FIELD],
        totalRevenue: "0", // uniswap has no rev yet
        dailyRevenue: "0", // uniswap has no rev yet
      };
    };
  };
};

const adapter: DexFeeBreakdownAdapter = {
  breakdown: {
    v3: {
      [ETHEREUM]: {
        fetch: v3Graphs(ETHEREUM),
        start: getStartTimestamp({
          endpoints: endpoints,
          chain: ETHEREUM,
          volumeField: VOLUME_USD,
        }),
      },
      // [ARBITRUM]: {
      //   fetch: v3Graphs(ARBITRUM),
      //   start: getStartTimestamp({
      //     endpoints: endpoints,
      //     chain: ARBITRUM,
      //     volumeField: VOLUME_USD,
      //   }),
      // },
      // [POLYGON]: {
      //   fetch: v3Graphs(POLYGON),
      //   start: getStartTimestamp({
      //     endpoints: endpoints,
      //     chain: POLYGON,
      //     volumeField: VOLUME_USD,
      //   }),
      },
    },
  }
}

export default adapter;
