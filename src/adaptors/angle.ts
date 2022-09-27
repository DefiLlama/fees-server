import { ARBITRUM, ETHEREUM, OPTIMISM, POLYGON } from "../helpers/chains";
import { IGraphMultiUrls } from "../helpers/graphs.type";
import { FeeAdapter } from "../utils/adapters.type";
import { Chain } from "../utils/constants";
import { getTimestampAtStartOfDayUTC, getTimestampAtStartOfPreviousDayUTC } from "../utils/date";
import { request, gql } from "graphql-request";


const endpoints = {
    [ETHEREUM]:
    {
        "CORE": "https://api.thegraph.com/subgraphs/name/picodes/transaction",
        "VEANGLE": "https://api.thegraph.com/subgraphs/name/picodes/periphery",
        "BORROW": "https://api.thegraph.com/subgraphs/name/picodes/borrow",
    },
    [OPTIMISM]:
    {
        "BORROW": "https://api.thegraph.com/subgraphs/name/picodes/optimism-borrow",
    },
    [ARBITRUM]:
    {
        "BORROW": "https://api.thegraph.com/subgraphs/name/picodes/arbitrum-borrow",
    },
    [POLYGON]:
    {
        "BORROW": "https://api.thegraph.com/subgraphs/name/picodes/polygon-borrow",
    },
};

const BASE_TOKENS = 1e18;
const DAY = 3600 * 24;
const BORROW_FEE_NAMES = ['surplusFromBorrowFees', 'surplusFromInterests', 'surplusFromLiquidationSurcharges', 'surplusFromRepayFees'];
const CORE_FEE_NAMES = ['totalProtocolFees', 'totalProtocolInterests', 'totalSLPFees', 'totalSLPInterests', 'totalKeeperFees'];
const CORE_PROTOCOL_FEE_NAMES = ['totalProtocolFees', 'totalProtocolInterests'];

type BorrowFee = {
    surplusFromInterests: number;
    surplusFromBorrowFees: number;
    surplusFromRepayFees: number;
    surplusFromLiquidationSurcharges: number;
    blockNumber: number;
    timestamp: number;
}

type CoreFee = {
    totalProtocolFees: number;
    totalKeeperFees: number;
    totalProtocolInterests: number;
    totalSLPInterests: number;
    totalSLPFees: number;
    blockNumber: number;
    timestamp: number;
}

type BorrowFeeQuery = {
    today: BorrowFee,
    yesterday: BorrowFee
};

type CoreFeeQuery = {
    today: CoreFee,
    yesterday: CoreFee
};

type BorrowResult = { totalFees: BorrowFee, deltaFees: BorrowFee };
type CoreResult = { totalFees: CoreFee, deltaFees: CoreFee };


export type RewardWeekFee = {
    week: number;
    distributed: number;
};

export type FeeDistribution = {
    token: string;
    tokenName: string;
    tokenDecimals: number;
    tokensPerWeek: RewardWeekFee[];
};

type veANGLEQuery = {
    feeDistributions: FeeDistribution[];
};

const CORE_QUERY = gql
    `
  query Query ($today: BigInt!, $yesterday: BigInt!) {
    todayFees : feeHistoricalDatas (where: {timestamp_lt: $today }, first: 1)  {
        totalProtocolFees
        totalSLPFees
        totalKeeperFees
        totalProtocolInterests
        totalSLPInterests
        blockNumber
        timestamp
    }
    yesterdayFees : feeHistoricalDatas (where: {timestamp_lt: $yesterday }, first: 1)  {
        totalProtocolFees
        totalSLPFees
        totalKeeperFees
        totalProtocolInterests
        totalSLPInterests
        blockNumber
        timestamp
    }
  }
`;

const BORROW_QUERY = gql
    `
  query Query ($today: BigInt!, $yesterday: BigInt!) {
    todayFees : feeHistoricalDatas (where: {timestamp_lt: $today }, first: 1)  {
      surplusFromInterests
      surplusFromBorrowFees
      surplusFromRepayFees
      surplusFromLiquidationSurcharges
      blockNumber
      timestamp
    }
    yesterdayFees : feeHistoricalDatas (where: {timestamp_lt: $yesterday }, first: 1)  {
      surplusFromInterests
      surplusFromBorrowFees
      surplusFromRepayFees
      surplusFromLiquidationSurcharges
      blockNumber
      timestamp
    }
  }
`;

const VEANGLE_QUERY = gql
    `
  query Query {
    feeDistributions {
      tokenDecimals
      tokenName
      token
      tokensPerWeek {
        week
        distributed
      }
    }
  }
`;

const getCoreFees = async (graphUrl: string, todayTimestamp: number, yesterdayTimestamp: number): Promise<CoreResult> => {
    const queryCoreFees = await request(graphUrl, CORE_QUERY, {
        today: todayTimestamp,
        yesterday: yesterdayTimestamp
    }) as CoreFeeQuery;

    for (const [key] of Object.entries(queryCoreFees.today)) {
        queryCoreFees.today[key as keyof CoreFee] = queryCoreFees.today[key as keyof CoreFee] / BASE_TOKENS
        queryCoreFees.yesterday[key as keyof CoreFee] = queryCoreFees.yesterday[key as keyof CoreFee] / BASE_TOKENS
    }

    const normalizer = (queryCoreFees.today.timestamp - queryCoreFees.today.timestamp) / DAY;
    const deltaCoreFees = {
        totalProtocolFees: (queryCoreFees.today.totalProtocolFees - queryCoreFees.today.totalProtocolFees) / normalizer,
        totalKeeperFees: (queryCoreFees.today.totalKeeperFees - queryCoreFees.today.totalKeeperFees) / normalizer,
        totalSLPFees: (queryCoreFees.today.totalSLPFees - queryCoreFees.today.totalSLPFees) / normalizer,
        totalProtocolInterests: (queryCoreFees.today.totalProtocolInterests - queryCoreFees.today.totalProtocolInterests) / normalizer,
        totalSLPInterests: (queryCoreFees.today.totalSLPInterests - queryCoreFees.today.totalSLPInterests) / normalizer,
        timestamp: queryCoreFees.today.timestamp,
        blockNumber: queryCoreFees.today.blockNumber,
    }
    return { totalFees: queryCoreFees.today, deltaFees: deltaCoreFees };
};

const getBorrowFees = async (graphUrl: string, todayTimestamp: number, yesterdayTimestamp: number): Promise<BorrowResult> => {
    const queryBorrowFees = await request(graphUrl, BORROW_QUERY, {
        today: todayTimestamp,
        yesterday: yesterdayTimestamp
    }) as BorrowFeeQuery;

    for (const [key] of Object.entries(queryBorrowFees.today)) {
        queryBorrowFees.today[key as keyof BorrowFee] = queryBorrowFees.today[key as keyof BorrowFee] / BASE_TOKENS
        queryBorrowFees.yesterday[key as keyof BorrowFee] = queryBorrowFees.yesterday[key as keyof BorrowFee] / BASE_TOKENS
    }

    const normalizer = (queryBorrowFees.today.timestamp - queryBorrowFees.today.timestamp) / DAY;
    const deltaBorrowFees = {
        surplusFromInterests: (queryBorrowFees.today.surplusFromInterests - queryBorrowFees.today.surplusFromInterests) / normalizer,
        surplusFromBorrowFees: (queryBorrowFees.today.surplusFromBorrowFees - queryBorrowFees.today.surplusFromBorrowFees) / normalizer,
        surplusFromRepayFees: (queryBorrowFees.today.surplusFromRepayFees - queryBorrowFees.today.surplusFromRepayFees) / normalizer,
        surplusFromLiquidationSurcharges: (queryBorrowFees.today.surplusFromLiquidationSurcharges - queryBorrowFees.today.surplusFromLiquidationSurcharges) / normalizer,
        timestamp: queryBorrowFees.today.timestamp,
        blockNumber: queryBorrowFees.today.blockNumber,
    }
    return { totalFees: queryBorrowFees.today, deltaFees: deltaBorrowFees };
};

// They are only distributed each week so doesn't make sense to log a window period of 1 day, instead normalize the amount by 7
const getVEANGLERevenues = async (graphUrl: string, todayTimestamp: number): Promise<{ totalInterest: number, deltaInterest: number }> => {
    const getFeeDistribution = await request(graphUrl, VEANGLE_QUERY, {}) as veANGLEQuery;

    let deltaDistributedInterest = getFeeDistribution.feeDistributions.reduce<number>((acc, feeDistributor) => {
        return (
            acc +
            feeDistributor.tokensPerWeek
                .filter((weeklyReward) => (weeklyReward.week <= todayTimestamp && weeklyReward.week > todayTimestamp - DAY * 7))
                .reduce<number>((acc, weeklyReward) => {
                    return acc + weeklyReward.distributed / 10 ** getFeeDistribution.feeDistributions[0].tokenDecimals;
                }, 0)
        );
    }, 0);
    deltaDistributedInterest /= 7;

    const totalDistributedInterest = getFeeDistribution.feeDistributions.reduce<number>((acc, feeDistributor) => {
        return (
            acc +
            feeDistributor.tokensPerWeek
                .filter((weeklyReward) => weeklyReward.week <= todayTimestamp)
                .reduce<number>((acc, weeklyReward) => {
                    return acc + weeklyReward.distributed / 10 ** getFeeDistribution.feeDistributions[0].tokenDecimals;
                }, 0)
        );
    }, 0);

    return { totalInterest: totalDistributedInterest, deltaInterest: deltaDistributedInterest };
};

function aggregateFee(
    key: string,
    coreFees: { totalFees: CoreFee, deltaFees: CoreFee },
    borrowFees: {
        totalFees: BorrowFee;
        deltaFees: BorrowFee;
    }
): { totalRevenue: number, totalFees: number } {
    const borrowTotalRevenue = BORROW_FEE_NAMES.reduce((acc, name) => {
        return acc + borrowFees[key as keyof BorrowResult][name as keyof BorrowFee];
    }, 0);
    const coreTotalRevenue = CORE_PROTOCOL_FEE_NAMES.reduce((acc, name) => {
        return acc + coreFees[key as keyof CoreResult][name as keyof CoreFee];
    }, 0);
    const coreTotalFees = CORE_FEE_NAMES.reduce((acc, name) => {
        return acc + coreFees[key as keyof CoreResult][name as keyof CoreFee];
    }, 0);
    let totalRevenue = borrowTotalRevenue + coreTotalRevenue;
    let totalFees = borrowTotalRevenue + coreTotalFees;

    return { totalRevenue: totalRevenue, totalFees: totalFees };
}


const graph = (graphUrls: IGraphMultiUrls) => {
    return (chain: Chain) => {
        return async (timestamp: number) => {

            const todayTimestamp = getTimestampAtStartOfDayUTC(timestamp)
            const yesterdayTimestamp = getTimestampAtStartOfPreviousDayUTC(timestamp)

            let coreFees: CoreResult = { totalFees: {} as CoreFee, deltaFees: {} as CoreFee };
            let veANGLEInterest = { totalInterest: 0, deltaInterest: 0 };
            const borrowFees = await getBorrowFees(graphUrls[chain].BORROW, todayTimestamp, yesterdayTimestamp);
            if (chain == "ethereum") {
                coreFees = await getCoreFees(graphUrls[chain].CORE, todayTimestamp, yesterdayTimestamp);
                veANGLEInterest = await getVEANGLERevenues(graphUrls[chain].VEANGLE, todayTimestamp);
            }

            const total = aggregateFee("totalFees", coreFees, borrowFees)
            const daily = aggregateFee("totalFees", coreFees, borrowFees)

            return {
                timestamp,
                totalFees: total.totalFees.toString(),
                dailyFees: daily.totalFees.toString(),
                totalRevenue: total.totalRevenue.toString(),
                dailyRevenue: daily.totalRevenue.toString(),
            };
        }
    }
};

const adapter: FeeAdapter = {
    fees: {
        [ETHEREUM]: {
            fetch: graph(endpoints)(ETHEREUM),
            start: 1577854800,
        },
        [OPTIMISM]: {
            fetch: graph(endpoints)(OPTIMISM),
            start: 1620532800,
        },
        [ARBITRUM]: {
            fetch: graph(endpoints)(ARBITRUM),
            start: 1632110400,
        },
        [POLYGON]: {
            fetch: graph(endpoints)(POLYGON),
            start: 1620014400,
        },
    }
}

export default adapter;
