import { getTimestampAtStartOfDayUTC } from "../utils/date";
import { successResponse, wrap, IResponse } from "../utils";
import sluggify from "../utils/sluggify";
import { getFees, Fee, FeeType } from "../utils/data/fees";
import { protocolAdapterData } from "../utils/adapters";
import { Protocol } from "../utils/protocols/types"
import { summAllFees } from "../utils/feeCalcs";
import { IRecordFeeData } from "./storeFees";

export interface FeeHistoryItem {
  dailyFees: IRecordFeeData;
  timestamp: number;
}

export interface RevenueHistoryItem {
  dailyRevenue: IRecordFeeData;
  timestamp: number;
}

export interface IHandlerBodyResponse extends Protocol {
    feesHistory: FeeHistoryItem[] | null
    revenueHistory: RevenueHistoryItem[] | null
    total1dFees: number | null
    total1dRevenue: number | null
}

export const handler = async (event: AWSLambda.APIGatewayEvent): Promise<IResponse> => {
  const protocolName = event.pathParameters?.protocol?.toLowerCase()
  if (!protocolName) throw new Error("Missing protocol name!")

  const feeData = protocolAdapterData.find(
      (prot) => sluggify(prot) === protocolName
  );
  if (!feeData) throw new Error("Fee data not found!")
  let feeDataResponse = {}
  try {
      const fee = await getFees(feeData.id, FeeType.dailyFees, "ALL")
      const rev = await getFees(feeData.id, FeeType.dailyRevenue, "ALL")

      if (fee instanceof Fee) throw new Error("Wrong fee queried")
      if (rev instanceof Fee) throw new Error("Wrong rev queried")

      const todaysTimestamp = getTimestampAtStartOfDayUTC((Date.now() - 1000 * 60 * 60 * 24) / 1000);
      console.log(todaysTimestamp)
      const todaysFees = fee.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === todaysTimestamp)?.data
      const todaysRevenue = rev.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === todaysTimestamp)?.data
      console.log(todaysFees)
      console.log(todaysRevenue)

      const ddr: IHandlerBodyResponse = {
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
      feeDataResponse = ddr
  } catch (error) {
      console.error(error)
      const ddr: IHandlerBodyResponse = {
          ...feeData,
          revenueHistory: [],
          feesHistory: [],
          total1dFees: null,
          total1dRevenue: null
      }
      feeDataResponse = ddr
  }

//   return successResponse(feeDataResponse as IHandlerBodyResponse, 10 * 60); // 10 mins cache
  return successResponse(feeDataResponse as IHandlerBodyResponse); // no cache for testing
};

export default wrap(handler);