import { join } from "path";
import workerpool from "workerpool";
import { prisma } from "~/prisma";

class BlockRequestPool {
  blockRequests: Array<{ height: number }> = [];

  async load() {
    const blockRequests = await prisma.blockRequest.findMany({
      take: 5,
      select: {
        height: true,
      },
      where: {
        sync: false,
      },
      orderBy: {
        height: "asc",
      },
    });
    this.blockRequests = this.blockRequests.concat(blockRequests);
  }

  async getOne() {
    if (!this.blockRequests.length) {
      await this.load();
    }
    const blockRequest = this.blockRequests.shift();

    return blockRequest;
  }
}

const MAX_WORKERS = 2;

// create a worker pool using an external worker script
const pool = workerpool.pool(
  join(__dirname, "../../../../utils/worker-ts-loader.js"),
  {
    workerType: "thread",
    minWorkers: MAX_WORKERS,
    maxWorkers: MAX_WORKERS,
    workerThreadOpts: {
      workerData: {
        path: join(__dirname, "./indexBlockWorker.ts"),
      },
    },
  }
);

const blockRequestPool = new BlockRequestPool();

async function callNext() {
  const blockRequest = await blockRequestPool.getOne();

  if (!blockRequest) {
    console.log("No more block requests");
    return;
  }

  console.log("callNext", blockRequest.height);
  pool.exec("indexBlock", [blockRequest.height], {
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
