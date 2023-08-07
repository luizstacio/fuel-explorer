import { join } from "path";
import workerpool from "workerpool";

const MAX_WORKERS = 10;

// create a worker pool using an external worker script
const pool = workerpool.pool(
  join(__dirname, "../../utils/worker-ts-loader.js"),
  {
    workerType: "thread",
    minWorkers: MAX_WORKERS,
    maxWorkers: MAX_WORKERS,
    workerThreadOpts: {
      workerData: {
        path: join(__dirname, "./syncBlockWorker.ts"),
      },
    },
  }
);

let height = 0;

function callNext() {
  ++height;
  console.log("callNext", height);
  pool.exec("syncBlock", [height], {
    on: (data) => {
      if (data.status === "complete") {
        console.log(data);
        callNext();
      }
    },
  });
}

let count = 0;
while (MAX_WORKERS > count) {
  callNext();
  count++;
}

setInterval(() => {
  console.log(pool.stats());
}, 1000);
