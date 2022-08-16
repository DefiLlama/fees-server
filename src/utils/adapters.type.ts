import { ChainBlocks } from "@defillama/adapters/dexVolumes/dexVolume.type"

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
    start: number | (() => Promise<number>)
    fetch: Fetch;
    runAtCurrTime?: boolean;
    customBackfill?: Fetch;
  };
};

export type BreakdownAdapter = {
  [x: string]: BaseAdapter;
};

export type DexFeeAdapter = {
  fees: BaseAdapter;
};

export type DexFeeBreakdownAdapter = {
  breakdown: BreakdownAdapter;
};

export type FeeAdapter = DexFeeAdapter | DexFeeBreakdownAdapter;
