import AWS from "aws-sdk";

// Importing env file
require('dotenv').config()
AWS.config.update({ region: 'eu-central-1' });

import { handler } from "../src/handlers/storeFees";
import { protocolAdapterData } from "../src/utils/adapters";

handler({
    protocolIndexes: [protocolAdapterData.findIndex(va => va.id==='1')], // 468
    timestamp: 1661547462
})