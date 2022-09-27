
export interface IGraphUrls {
  [chains: string]: string
}

export interface IGraphMultiUrls {
  [chains: string]: {
    [subgraphs: string]: string
  }
}