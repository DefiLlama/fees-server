import { getTimestampAtStartOfDayUTC } from "../utils/date";
import { successResponse, wrap, IResponse } from "../utils";
import { getFees, Fee, FeeType } from "../utils/data/fees";
import { protocolAdapterData } from "../utils/adapters";
import { summAllFees } from "../utils/feeCalcs";
import { FeeHistoryItem, RevenueHistoryItem, IHandlerBodyResponse as FeeItem } from "./getFees";

export interface IHandlerBodyResponse {
  fees: FeeItem[],
}

const getAllFees = () => {
  let feeItems: FeeItem[] = []

  protocolAdapterData.forEach(async (feeData) => {
    const fee = await getFees(feeData.id, FeeType.dailyFees, "ALL")
    const rev = await getFees(feeData.id, FeeType.dailyRevenue, "ALL")

    if (fee instanceof Fee) {
      console.log(`Wrong fee queried for ${feeData}`)
      return
    }
    if (rev instanceof Fee) {
      console.log(`Wrong rev queried for ${feeData}`)
      return
    }

    const todaysTimestamp = getTimestampAtStartOfDayUTC((Date.now() - 1000 * 60 * 60 * 24) / 1000);
    const todaysFees = fee.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === todaysTimestamp)?.data
    const todaysRevenue = rev.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === todaysTimestamp)?.data

    console.log(todaysFees)
    console.log(todaysRevenue)
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
      total1dFees: todaysFees ? summAllFees(todaysFees) : 0,
      total1dRevenue: todaysRevenue ? summAllFees(todaysRevenue) : 0,
    }

    feeItems.push(feeItem)
  })

  return feeItems
}

export const handler = async (): Promise<IResponse> => {
  const feeDataResponse = {
    fees: getAllFees()
  }
  // return successResponse(feeDataResponse as IHandlerBodyResponse, 10 * 60); // 10 mins cache
  return successResponse(feeDataResponse as IHandlerBodyResponse); // no cache for testing
};

export default wrap(handler);
