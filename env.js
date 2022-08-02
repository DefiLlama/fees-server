try{
    require('dotenv').config()
}catch(e){}
module.exports = {
    ETHEREUM_RPC: process.env.ETHEREUM_RPC,
    BSC_RPC: process.env.BSC_RPC,
    POLYGON_RPC: process.env.POLYGON_RPC,
    FANTOM_RPC: process.env.FANTOM_RPC,
    ARBITRUM_RPC: process.env.ARBITRUM_RPC,
    OPTIMISM_RPC: process.env.OPTIMISM_RPC,
    HARMONY_RPC: process.env.HARMONY_RPC,
    CRONOS_RPC: process.env.CRONOS_RPC,
    MOONRIVER_RPC: process.env.MOONRIVER_RPC,
    AVAX_RPC: process.env.AVAX_RPC,
    XDAI_RPC: process.env.XDAI_RPC,
}
