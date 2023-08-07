import { prisma } from "~/prisma";
import { createTranasction } from "./transformers/createTranasction";

export async function indexBlock(height: number) {
  const block: any = await prisma.blockRequest.findFirst({
    where: {
      height,
    },
  });

  if (!block) {
    return;
  }

  return prisma.$transaction(async (tx) => {
    const blockCreated = await tx.block.upsert({
      create: {
        id: block.data.id,
        consensus: block.data.consensus,
        header: block.data.header,
      },
      update: {},
      where: {
        id: block.data.id,
      },
    });
    const results = await Promise.all(
      block.data.transactions.map((txData: any) =>
        tx.transaction.upsert({
          create: createTranasction(txData, blockCreated.db_id),
          update: {},
          where: {
            id: txData.id,
          },
        })
      )
    );

    if (results.length !== block.data.transactions.length) {
      throw new Error("Failed to insert all transactions");
    }

    await tx.blockRequest.update({
      where: {
        db_id: block.db_id,
      },
      data: {
        sync: true,
      },
    });

    console.log("Inserted", results.length, "transactions");

    return results.length;
  });
}
