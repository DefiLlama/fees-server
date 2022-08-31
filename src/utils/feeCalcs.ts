import { getTimestampAtStartOfDayUTC } from "./date";
import { Fee } from "./data/fees";
// import { VolumeSummaryDex } from "../handlers/getDexs";
import { IRecordFeeData } from "../handlers/storeFees";

const summAllFees = (breakdownFees: IRecordFeeData) =>
Object.values(breakdownFees).reduce((acc, fee) =>
    // @ts-ignore
    acc + (Object.values(fee).pop() ? Object.values(fee).pop() : 0)
    , 0)

// const calcNdChange = (fees: Fee[], nDaysChange: number) => {
//     let totalFee = 0
//     let totalFeeNd = 0
//     const todaysTimestamp = getTimestampAtStartOfDayUTC((Date.now() - 1000 * 60 * 60 * 24) / 1000);
//     const timestamp1d = (new Date(todaysTimestamp * 1000)).setDate((new Date(todaysTimestamp * 1000).getDate() - nDaysChange)) / 1000
//     const todaysFee = fees.find(f => getTimestampAtStartOfDayUTC(f.timestamp) === todaysTimestamp)?.data
//     const feeNd = fees.find(f => getTimestampAtStartOfDayUTC(f.timestamp) === timestamp1d)?.data
//     totalFee += todaysFee ? summAllFees(todaysFee) : 0
//     totalFeeNd += feeNd ? summAllFees(feeNd) : 0
//     return formatNdChangeNumber((todaysFee - feeNd) / feeNd * 100)
// }

const formatNdChangeNumber = (number: number) => {
    if (number === Number.POSITIVE_INFINITY)
        number = 100
    if (number === Number.NEGATIVE_INFINITY)
        number = -100
    return Math.round((number + Number.EPSILON) * 100) / 100
}


export {
    summAllFees,
    // calcNdChange
}