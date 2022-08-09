import AWS from "aws-sdk";

// Importing env file
require('dotenv').config()
AWS.config.update({ region: 'eu-central-1' });

import { handler } from "../src/handlers/storeFees";
import feeAdapters from "../src/utils/adapterData";

handler({
    protocolIndexes: [feeAdapters.findIndex(va => va.id==='119')],
    timestamp: 1640991600000/1000
})