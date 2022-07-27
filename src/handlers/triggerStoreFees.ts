import { wrapScheduledLambda } from "../utils/wrap";
// TODO pull fees from db
import feeAdapters from "../utils/adapterData";
import invokeLambda from "../utils/invokeLambda";

function shuffleArray(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const step = 10;
const handler = async () => {
  const protocolIndexes = Array.from(Array(feeAdapters.length).keys());
  shuffleArray(protocolIndexes);
  for (let i = 0; i < feeAdapters.length; i += step) {
    const event = {
      protocolIndexes: protocolIndexes.slice(i, i + step),
    };
    await invokeLambda(`llama-fees-${process.env.stage}-storeFees`, event);
  }
};

export default wrapScheduledLambda(handler);
