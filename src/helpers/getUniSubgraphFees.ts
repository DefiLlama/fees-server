import { ChainBlocks, VolumeAdapter, FetchResult as VolumeFetchResult, Adapter, BreakdownAdapter as VolumeBreakdownAdapter } from "@defillama/adapters/volumes/dexVolume.type";
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
} from "@defillama/adapters/volumes/helper/getUniSubgraphVolume";
import { BaseAdapter, BreakdownAdapter } from "../utils/adapters.type";
import { IGraphUrls } from "./graphs.type";

// To get ID for daily data https://docs.uniswap.org/protocol/V2/reference/API/entities
const getUniswapDateId = (date?: Date) => getUniqStartOfTodayTimestamp(date) / 86400;

const DEFAULT_TOTAL_FEES_FACTORY = "factories";
const DEFAULT_TOTAL_FEES_FIELD = "totalFeesUSD";

const DEFAULT_DAILY_FEES_FACTORY = "uniswapDayData";
const DEFAULT_DAILY_FEES_FIELD = "feesUSD";

interface IGetRawChainFeeParams {
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

interface IGetChainFeeParams {
  volumeAdapter: VolumeAdapter,
  totalFees?: number,
  protocolFees?: number,
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

const getDexChainBreakdownFees = ({ volumeAdapter, totalFees = 0, protocolFees = 0 }: IGetChainFeeParams) => {
  if ('breakdown' in volumeAdapter) {
    let breakdownAdapter: BreakdownAdapter = { }
    const volumeBreakdownAdapter: VolumeBreakdownAdapter = volumeAdapter.breakdown

    for (const [version, adapterObj] of Object.entries(volumeBreakdownAdapter)) {
      const volAdapter: Adapter = adapterObj
      
      const baseAdapters = Object.keys(volAdapter).map(chain => {
        const fetchFees = async (timestamp: number, chainBlocks: ChainBlocks) => {
          const fetchedResult: VolumeFetchResult = await volAdapter[chain].fetch(timestamp, chainBlocks)
          const chainDailyVolume = fetchedResult.dailyVolume ? fetchedResult.dailyVolume : "0";
          const chainTotalVolume = fetchedResult.totalVolume ? fetchedResult.totalVolume : "0";
    
          return {
            timestamp,
            totalFees: new BigNumber(chainTotalVolume).multipliedBy(totalFees).toString(),
            dailyFees: chainDailyVolume ? new BigNumber(chainDailyVolume).multipliedBy(totalFees).toString() : undefined,
            totalRevenue: new BigNumber(chainTotalVolume).multipliedBy(protocolFees).toString(),
            dailyRevenue: chainDailyVolume ? new BigNumber(chainDailyVolume).multipliedBy(protocolFees).toString() : undefined
          };
        }

        const baseAdapter: BaseAdapter = {
          [chain]: {
            ...volAdapter[chain],
            fetch: fetchFees,
            customBackfill: fetchFees,
          }
        }
        return baseAdapter
      });

      breakdownAdapter = { [version]: baseAdapters[0], ...breakdownAdapter }
    }

    return breakdownAdapter;
  } else {
    console.log(`Failed to grab dex volume data`)
    return {}
  }
}


const getDexChainFees = ({ volumeAdapter, totalFees = 0, protocolFees = 0 }: IGetChainFeeParams) => {
  if ('volume' in volumeAdapter) {
    let finalBaseAdapter: BaseAdapter = { }
    const adapterObj = volumeAdapter.volume
    
    const baseAdapters = Object.keys(adapterObj).map(chain => {
      const fetchFees = async (timestamp: number, chainBlocks: ChainBlocks) => {
        const fetchedResult = await adapterObj[chain].fetch(timestamp, chainBlocks)
        const chainDailyVolume = fetchedResult.dailyVolume ? fetchedResult.dailyVolume : "0";
        const chainTotalVolume = fetchedResult.totalVolume ? fetchedResult.totalVolume : "0";
  
        return {
          timestamp,
          totalFees: new BigNumber(chainTotalVolume).multipliedBy(totalFees).toString(),
          dailyFees: chainDailyVolume ? new BigNumber(chainDailyVolume).multipliedBy(totalFees).toString() : undefined,
          totalRevenue: new BigNumber(chainTotalVolume).multipliedBy(protocolFees).toString(),
          dailyRevenue: chainDailyVolume ? new BigNumber(chainDailyVolume).multipliedBy(protocolFees).toString() : undefined
        };
      }

      const baseAdapter: BaseAdapter = {
        [chain]: {
          ...adapterObj[chain],
          fetch: fetchFees,
          customBackfill: fetchFees,
        }
      }
      finalBaseAdapter = { ...baseAdapter, ...finalBaseAdapter }
      return baseAdapter
    });

    return finalBaseAdapter;
  } else {
    console.log(`Failed to grab dex volume data`)
    return {}
  }
}

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
}: IGetRawChainFeeParams) {
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
  getDexChainFees,
  getDexChainFeesRaw,
  getDexChainBreakdownFees,
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
