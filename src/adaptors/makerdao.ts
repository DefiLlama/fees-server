import { FeeAdapter } from "../utils/adapters.type";
import { ETHEREUM } from "../helpers/chains";
import { getStartTimestamp } from "../helpers/getStartTimestamp";
import { request, gql } from "graphql-request";
import { IGraphUrls } from "../helpers/graphs.type";
import { Chain } from "../utils/constants";
import { getBlock } from "../helpers/getBlock";
import { ChainBlocks } from "@defillama/adapters/dexVolumes/dexVolume.type";
import BigNumber from "bignumber.js";
import { getTimestampAtStartOfPreviousDayUTC, getTimestampAtStartOfDayUTC } from "../utils/date";

const endpoints = {
  [ETHEREUM]:
    "https://api.thegraph.com/subgraphs/name/protofire/maker-protocol"
}


const graphs = (graphUrls: IGraphUrls) => {
  return (chain: Chain) => {
    return async (timestamp: number, chainBlocks: ChainBlocks) => {
      const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp)
      const yesterdaysTimestamp = getTimestampAtStartOfPreviousDayUTC(timestamp)

      const todaysBlock = (await getBlock(todaysTimestamp, chain, chainBlocks));
      const yesterdaysBlock = (await getBlock(yesterdaysTimestamp, chain, {}));

      const graphQuery = gql
      `query fees($yesterdaysBlock: Int!, $todaysBlock: Int!){
        yesterday: collateralTypes(block: {number: $yesterdaysBlock}) {
          id
          totalDebt
          stabilityFee
        }
        today: collateralTypes(block: {number: $todaysBlock}) {
          id
          totalDebt
          stabilityFee
        }
      }`;

      const graphRes = await request(graphUrls[chain], graphQuery, {
        yesterdaysBlock,
        todaysBlock
      });

      const secondsBetweenDates = todaysTimestamp - yesterdaysTimestamp;
      const avgDebt = (new BigNumber(graphRes["today"]["totalDebt"]).plus(new BigNumber(graphRes["yesterday"]["totalDebt"]))).div(2)
      const accFees = new BigNumber(graphRes["yesterday"]["stabilityFee"]).pow(secondsBetweenDates).minus(1)
      const dailyFee = avgDebt.multipliedBy(accFees)

      console.log(dailyFee.toString())
      return {
        timestamp,
        totalFees: "0",
        dailyFees: dailyFee.toString(),
        totalRevenue: "0",
        dailyRevenue: dailyFee.toString(),
      };
    };
  };
};


const adapter: FeeAdapter = {
  fees: {
    [ETHEREUM]: {
        fetch: graphs(endpoints)(ETHEREUM),
        start: 1573672933,
    },
  }
}

export default adapter;
