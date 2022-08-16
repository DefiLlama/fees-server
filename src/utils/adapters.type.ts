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

export type BaseAdapter = {
  [x: string]: {
    start: number | any;
    fetch: Fetch;
    runAtCurrTime?: boolean;
    customBackfill?: any;
  };
};

export type DexFeeAdapter = {
  fees: BaseAdapter;
};

export type BreakdownAdapter = {
  [x: string]: BaseAdapter;
};

export type DexFeeBreakdownAdapter = {
  breakdown: BreakdownAdapter;
};

export type FeeAdapter = DexFeeAdapter | DexFeeBreakdownAdapter;
