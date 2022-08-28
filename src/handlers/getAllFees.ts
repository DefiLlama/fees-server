import { getTimestampAtStartOfDayUTC } from "../utils/date";
import { successResponse, wrap, IResponse } from "../utils";
import { getFees, Fee, FeeType } from "../utils/data/fees";
import { protocolAdapterData } from "../utils/adapters";
import { summAllFees } from "../utils/feeCalcs";
import { FeeHistoryItem, RevenueHistoryItem, IHandlerBodyResponse as FeeItem } from "./getFees";

export interface IHandlerBodyResponse {
  fees: FeeItem[],
}

export const handler = async (): Promise<IResponse> => {
  let feeItems: FeeItem[] = []

  try {
    protocolAdapterData.forEach(async (feeData) => {
      const fee = await getFees(feeData.id, FeeType.dailyFees, "ALL")
      const rev = await getFees(feeData.id, FeeType.dailyRevenue, "ALL")

      if (fee instanceof Fee) throw new Error("Wrong fee queried")
      if (rev instanceof Fee) throw new Error("Wrong rev queried")

      const todaysTimestamp = getTimestampAtStartOfDayUTC((Date.now() - 1000 * 60 * 60 * 24) / 1000);
      const todaysFees = fee.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === todaysTimestamp)?.data
      const todaysRevenue = rev.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === todaysTimestamp)?.data

      const feeItem: FeeItem = {
        ...feeData,
        feesHistory: fee.map<FeeHistoryItem>(f => ({
            dailyFees: f.data,
            timestamp: f.sk
        })),
        revenueHistory: rev.map<RevenueHistoryItem>(f => ({
            dailyRevenue: f.data,
            timestamp: f.sk
        })),
        cumulativeFees: todaysFees ? summAllFees(todaysFees) : 0,
        cumulativeRevenue: todaysRevenue ? summAllFees(todaysRevenue) : 0,
      }

      feeItems.push(feeItem)
    })
  } catch (error) {
    console.error(error)
  }

  const feeDataResponse = {
    fees: feeItems
  }
  // return successResponse(feeDataResponse as IHandlerBodyResponse, 10 * 60); // 10 mins cache
  return successResponse(feeDataResponse as IHandlerBodyResponse); // no cache for testing
};

export default wrap(handler);