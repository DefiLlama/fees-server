import { FeeAdapter } from "../utils/adapters.type";
import { fetchURL } from "@defillama/adapters/projects/helper/utils";
import { getTimestampAtStartOfDay } from "../utils/date";
import BigNumber from "bignumber.js";

const TOTAL_FEES = 0.0025;
const PROTOCOL_FEES = 0.0003;

const dexVolumeUrl = "https://api.llama.fi/dex/raydium"

const fetch = async (timestamp: number) => {
  const dayTimestamp = getTimestampAtStartOfDay(timestamp)
  const historicalVolumes: any[] = (await fetchURL(dexVolumeUrl))?.data.volumeHistory
  const dailyVolume = historicalVolumes
    .find(dayItem => dayItem['timestamp'] === dayTimestamp)?.dailyVolume.solana.raydium || 0

  const dailyFee = (new BigNumber(dailyVolume)).multipliedBy(new BigNumber(TOTAL_FEES))
  const dailyRev = (new BigNumber(dailyVolume)).multipliedBy(new BigNumber(PROTOCOL_FEES))

  return {
    timestamp: dayTimestamp,
    totalFees: "0",
    dailyFees: dailyFee ? `${dailyFee}` : undefined,
    totalRevenue: "0",
    dailyRevenue: dailyRev ? `${dailyRev}` : undefined,
  };
};

const adapter: FeeAdapter = {
  fees: {
    solana: {
      fetch,
      runAtCurrTime: true,
      start: 1,
    },
  }
}

export default adapter;
