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

export interface IHandlerBodyResponse extends Protocol {
    feesHistory: FeeHistoryItem[] | null
    total1dFees: number | null
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

      if (fee instanceof Fee) throw new Error("Wrong fee queried")

      const todaysTimestamp = getTimestampAtStartOfDayUTC((Date.now() - 1000 * 60 * 60 * 24) / 1000);
      const todaysFees = fee.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === todaysTimestamp)?.data

      const ddr: IHandlerBodyResponse = {
          ...feeData,
          feesHistory: fee.map<FeeHistoryItem>(f => ({
              dailyFees: f.data,
              timestamp: f.sk
          })),
          total1dFees: todaysFees ? summAllFees(todaysFees) : 0,
      }
      feeDataResponse = ddr
  } catch (error) {
      console.error(error)
      const ddr: IHandlerBodyResponse = {
          ...feeData,
          feesHistory: null,
          total1dFees: null
      }
      feeDataResponse = ddr
  }

  // return successResponse(feeDataResponse as IHandlerBodyResponse, 10 * 60); // 10 mins cache
  return successResponse(feeDataResponse as IHandlerBodyResponse); // no cache for testing
};

export default wrap(handler);