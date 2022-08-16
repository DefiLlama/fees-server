import { 
  ChainBlocks,
  VolumeAdapter,
  DexBreakdownAdapter,
} from "../../DefiLlama-Adapters/dexVolumes/dexVolume.type"

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

export type BaseAdapter = VolumeAdapter;

export type DexFeeAdapter = {
  fees: BaseAdapter;
};

export type DexFeeBreakdownAdapter = DexBreakdownAdapter;

export type FeeAdapter = DexFeeAdapter | DexFeeBreakdownAdapter;
