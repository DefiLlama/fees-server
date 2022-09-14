import axios from 'axios';

export const getOneDayFees = async (assetID: string, startDate: string, endDate: string) => {
    const result = await axios.get(`https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?page_size=10000&metrics=FeeTotUSD&assets=${assetID}&start_time=${startDate}&end_time=${endDate}`);
    if (!result.data.data[0]) {
        throw new Error(`Failed to fetch CoinMetrics data for ${assetID} on ${endDate}`);
    }

    return parseFloat(result.data.data[0]['FeeTotUSD']);
}