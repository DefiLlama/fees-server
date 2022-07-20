export type ChainBlocks = {
  [x: string]: number;
};

export type FetchResult = {
  block?: number;
  dailyFees?: string;
  totalFees: string;
  dailyRevenue?: string;
  totalRevenue: string;
  timestamp: number;
};

export type Fetch = (
  timestamp: number,
  chainBlocks: ChainBlocks
) => Promise<FetchResult>;

export type FeeAdapter = {
  [x: string]: {
    start: number | any;
    fetch: Fetch;
    runAtCurrTime?: boolean;
    customBackfill?: any;
  };
};

export type DexFeeAdapter = {
  fees: FeeAdapter;
};

export type DexAdapter = DexFeeAdapter;
