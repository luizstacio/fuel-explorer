import workerpool from "workerpool";
import { indexBlock as indexBlockFn } from "./indexBlock";

async function indexBlock(height: number) {
  try {
    console.log("Index Block -->>>> ", height);
    await indexBlockFn(height);
    console.log("Indexed Block -->>>> ", height);
    workerpool.workerEmit({
      height,
      status: "complete",
    });
  } catch (err) {
    console.log(err);
  }
}

workerpool.worker({
  indexBlock,
});
