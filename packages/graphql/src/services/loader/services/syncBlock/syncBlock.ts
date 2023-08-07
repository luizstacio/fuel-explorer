import { readFileSync } from "fs";
import { join } from "path";
import { setTimeout } from "timers/promises";
import { prisma } from "~/prisma";
import { createGraphqlFetch } from "~/utils";
import workerpool from "workerpool";

type BlockReponse = {
  data: {
    block: {
      header: {
        height: string;
        id: string;
      };
    };
  };
};

const query = readFileSync(
  join(__dirname, "./query.graphql"),
  "utf8"
).toString();

export async function syncBlock(height?: number) {
  console.log("Syncing page", height);
  try {
    const graphqlFetch = createGraphqlFetch(
      "https://beta-3.fuel.network/graphql"
    );
    const resp: BlockReponse = await graphqlFetch({
      document: query,
      variables: {
        height: height ? String(height) : undefined,
      },
    });
    const blockNode = resp.data.block;

    // Insert all the block on the page
    const result = await prisma.blockRequest.createMany({
      data: [
        {
          sync: false,
          data: blockNode,
          height: Number(blockNode.header.height),
        },
      ],
      skipDuplicates: true,
    });
    console.log("Inserted", result.count, "blocks");

    workerpool.workerEmit({
      height,
      status: "complete",
    });
  } catch (err) {
    console.log(err);
    console.log("Try again in 10 seconds");
    await setTimeout(10000);
  }
}
