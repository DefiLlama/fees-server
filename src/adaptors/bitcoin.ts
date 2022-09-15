import { FeeAdapter } from "../utils/adapters.type";
import { ETHEREUM } from "../helpers/chains";
import { getTimestampAtStartOfPreviousDayUTC, getTimestampAtStartOfDayUTC } from "../utils/date";
import { getOneDayFees } from "../helpers/getChainFees";


const graphs = () => {
  return () => {
    return async (timestamp: number) => {
      const today = new Date(getTimestampAtStartOfDayUTC(timestamp) * 1000).toISOString()
      const yesterday = new Date(getTimestampAtStartOfPreviousDayUTC(timestamp) * 1000).toISOString()

      const dailyFee = await getOneDayFees('btc', yesterday, today);
  
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
        fetch: graphs()(),
        start: 1230958800,
    },
  },
  adapterType: "chain"
}

export default adapter;
