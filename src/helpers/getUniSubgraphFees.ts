import { ChainBlocks } from "@defillama/adapters/dexVolumes/dexVolume.type";
import { Chain } from "@defillama/sdk/build/general";

import BigNumber from "bignumber.js";
import { request, gql } from "graphql-request";
import { getBlock } from "./getBlock";
import { 
  getUniqStartOfTodayTimestamp,
  DEFAULT_TOTAL_VOLUME_FACTORY,
  DEFAULT_TOTAL_VOLUME_FIELD,
  DEFAULT_DAILY_VOLUME_FACTORY,
  DEFAULT_DAILY_VOLUME_FIELD,
} from "@defillama/adapters/dexVolumes/helper/getUniSubgraphVolume";

// To get ID for daily data https://docs.uniswap.org/protocol/V2/reference/API/entities
const getUniswapDateId = (date?: Date) => getUniqStartOfTodayTimestamp(date) / 86400;

const DEFAULT_TOTAL_FEES_FACTORY = "factories";
const DEFAULT_TOTAL_FEES_FIELD = "totalFeesUSD";

const DEFAULT_DAILY_FEES_FACTORY = "uniswapDayData";
const DEFAULT_DAILY_FEES_FIELD = "feesUSD";

export interface IGraphUrls {
  [chains: string]: string
}

interface IGetChainFeeParams {
  graphUrls: IGraphUrls,
  totalFees?: number,
  protocolFees?: number,
  totalVolume?: {
    factory: string,
    field: string
  },
  dailyVolume?: {
    factory: string,
    field: string
  },
  customDailyVolume?: string,
  hasDailyVolume?: boolean
  hasTotalVolume?: boolean
  getCustomBlock?: (timestamp: number) => Promise<number>
}

const getUniswapV3Fees = (graphUrls: IGraphUrls) => {
  const graphQuery = gql`query fees($dateId: Int!) {
    ${DEFAULT_DAILY_FEES_FACTORY}(id: $dateId) {
      ${DEFAULT_DAILY_FEES_FIELD}
    },
    ${DEFAULT_TOTAL_FEES_FACTORY} {
      ${DEFAULT_TOTAL_FEES_FIELD}
    }
  }`;
  
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

// function getDexChainFees({
//   totalFees = 0,
//   protocolFees = 0,
//   dexChainVolumes
// }) {

//   return (chain) => {
//     return async (timestamp, chainBlocks) => {

//       const chainTotalVolume = graphRes[totalVolume.factory][0][totalVolume.field];
//       const chainDailyVolume = hasDailyVolume ? (graphRes?.[dailyVolume.factory]?.[dailyVolume.field] ?? "0") : undefined;

//       return {
//         timestamp,
//         block,
//         totalFees: BigNumber(chainTotalVolume).multipliedBy(totalFees).toString(),
//         dailyFees: (hasDailyVolume && chainDailyVolume) ? BigNumber(chainDailyVolume).multipliedBy(totalFees).toString() : undefined,
//         totalRevenue: BigNumber(chainTotalVolume).multipliedBy(protocolFees).toString(),
//         dailyRevenue: (hasDailyVolume && chainDailyVolume) ? BigNumber(chainDailyVolume).multipliedBy(protocolFees).toString() : undefined
//       };
//     };
//   };
// }

// Raw method if we do not want to rely on dexVolumes
function getDexChainFeesRaw({
  graphUrls,
  totalFees = 0,
  protocolFees = 0,
  totalVolume = {
    factory: DEFAULT_TOTAL_VOLUME_FACTORY,
    field: DEFAULT_TOTAL_VOLUME_FIELD,
  },
  dailyVolume = {
    factory: DEFAULT_DAILY_VOLUME_FACTORY,
    field: DEFAULT_DAILY_VOLUME_FIELD,
  },
  customDailyVolume = undefined,
  hasDailyVolume = true,
  hasTotalVolume = true,
  getCustomBlock = undefined,
}: IGetChainFeeParams) {
  const totalVolumeQuery = gql`
  ${totalVolume.factory}(
    block: { number: $block }
  ) {
    ${totalVolume.field}
  }
  `;

  const dailyVolumeQuery =
    customDailyVolume ||
    gql`
  ${dailyVolume.factory} (
    id: $id
  ) {
    ${dailyVolume.field}
  }
  `;

  const graphQuery = gql`
query get_volume($block: Int, $id: Int) {
  ${hasTotalVolume ? totalVolumeQuery : ""}
  ${hasDailyVolume ? dailyVolumeQuery : ""}
}
`;
  return (chain: Chain) => {
    return async (timestamp: number, chainBlocks: ChainBlocks) => {
      const block =
        (getCustomBlock && (await getCustomBlock(timestamp))) ||
        (await getBlock(timestamp, chain, chainBlocks));
      
      const id = getUniswapDateId(new Date(timestamp * 1000));

      const graphRes = await request(graphUrls[chain], graphQuery, {
        block,
        id,
      });

      const chainTotalVolume = graphRes[totalVolume.factory][0][totalVolume.field];
      const chainDailyVolume = hasDailyVolume ? (graphRes?.[dailyVolume.factory]?.[dailyVolume.field] ?? "0") : undefined;

      return {
        timestamp,
        block,
        totalFees: new BigNumber(chainTotalVolume).multipliedBy(totalFees).toString(),
        dailyFees: (hasDailyVolume && chainDailyVolume) ? new BigNumber(chainDailyVolume).multipliedBy(totalFees).toString() : undefined,
        totalRevenue: new BigNumber(chainTotalVolume).multipliedBy(protocolFees).toString(),
        dailyRevenue: (hasDailyVolume && chainDailyVolume) ? new BigNumber(chainDailyVolume).multipliedBy(protocolFees).toString() : undefined
      };
    };
  };
}

export {
  getUniqStartOfTodayTimestamp,
  getDexChainFeesRaw,
  getUniswapV3Fees,
  DEFAULT_DAILY_VOLUME_FACTORY,
  DEFAULT_DAILY_VOLUME_FIELD,
  DEFAULT_TOTAL_VOLUME_FACTORY,
  DEFAULT_TOTAL_VOLUME_FIELD,
  DEFAULT_TOTAL_FEES_FACTORY,
  DEFAULT_TOTAL_FEES_FIELD,
  DEFAULT_DAILY_FEES_FACTORY,
  DEFAULT_DAILY_FEES_FIELD,
};
