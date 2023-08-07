import { prisma } from "~/prisma";

type TXCreate = Parameters<typeof prisma.transaction.create>[0]["data"];

export function createTranasction(
  transaction: any,
  blockDbId: number
): TXCreate {
  const tx: TXCreate = {
    id: transaction.id,
    txPointer: transaction.txPointer,
    isScript: transaction.isScript,
    isCreate: transaction.isCreate,
    isMint: transaction.isMint,
    receiptsRoot: transaction.receiptsRoot,
    script: transaction.script,
    scriptData: transaction.scriptData,
    bytecodeWitnessIndex: transaction.bytecodeWitnessIndex,
    bytecodeLength: transaction.bytecodeLength,
    salt: transaction.salt,
    rawPayload: transaction.rawPayload,
    inputAssetIds: transaction.inputAssetIds || [],
    inputContracts: {
      connectOrCreate: (transaction.inputContracts || []).map((ic: any) => ({
        where: { id: ic.id, salt: ic.id },
        create: ic,
      })),
    },
    gasPrice: transaction.gasPrice || "0",
    gasLimit: transaction.gasLimit || "0",
    maturity: transaction.maturity || "0",
    witnesses: transaction.witnesses || [],
    storageSlots: transaction.storageSlots || [],
  };

  (transaction.inputs || []).forEach((input: any) => {
    const inputsCreate = tx[`inputs__${input.type}`] || {
      create: [],
    };
    if (input.type === "InputContract" && input.contract) {
      input.contract = {
        connectOrCreate: {
          where: { id: input.contract.id, salt: input.contract.salt },
          create: input.contract,
        },
      } as any;
    }
    inputsCreate.create.push({
      ...input,
      type: undefined,
    });
    tx[`inputs__${input.type}`] = inputsCreate;
  });

  (transaction.outputs || []).map((output: any) => {
    const outputsCreate = tx[`outputs__${output.type}`] || {
      create: [],
    };
    outputsCreate.create.push({
      ...output,
      type: undefined,
    });
    tx[`outputs__${output.type}`] = outputsCreate;
  });

  tx["receipts"] = {
    create: (transaction.receipts || []).map((receipt: any) => {
      return {
        ...receipt,
        contract: receipt.contract
          ? {
              connectOrCreate: {
                where: { id: receipt.contract.id, salt: receipt.contract.salt },
                create: receipt.contract,
              },
            }
          : undefined,
        to: receipt.to
          ? {
              connectOrCreate: {
                where: { id: receipt.to.id, salt: receipt.to.salt },
                create: receipt.to,
              },
            }
          : undefined,
      };
    }),
  };

  tx[`status__${transaction.status.type}`] = {
    create: {
      ...transaction.status,
      block: transaction.status.block
        ? {
            connect: {
              db_id: blockDbId,
            },
          }
        : undefined,
      programState: transaction.status.programState
        ? {
            create: transaction.status.programState,
          }
        : undefined,
      type: undefined,
    },
  };

  tx.Block = {
    connect: {
      db_id: blockDbId,
    },
  };

  return tx;
}
