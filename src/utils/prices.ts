import axios from 'axios'

export const getPrices = async (tokens: string[]) => {
    return (await axios.post("https://coins.llama.fi/prices", {
        "coins": Array.from(tokens)
    })).data.coins as {
        [address:string]: { decimals: number, price: number, symbol: string, timestamp: number }
    }
}