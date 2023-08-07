import workerpool from "workerpool";
import { syncBlock as syncBlockFn } from "./syncBlock";

async function syncBlock(height: number) {
  console.log("syncBlock");
  await syncBlockFn(height);
  workerpool.workerEmit({
    height,
    status: "complete",
  });
}

workerpool.worker({
  syncBlock,
});
