import { PrismaClient, Transaction } from "@prisma/client";
import { deepIterateObject } from "./utils";
import { composeUnionFields } from "./utils/composeUnionFields";
import JSONData from "./data.json";

const prisma = new PrismaClient();

const xprisma = prisma.$extends({
  query: {
    $allOperations: async ({ args, query }) => {
      const result = await query(args);
      return composeUnionFields(result);
    },
  },
});

// @graphql-tools/schema

async function main() {
  console.time("prisma");
  // type TXCreate = Parameters<typeof prisma.transaction.create>[0]["data"];
  // const txs = [JSONData.data.transactions.nodes[0]].map((item) => {
  //   // const tx: TXCreate = {
  //   //   id: item.id,
  //   //   inputAssetIds: item.inputAssetIds || [],
  //   //   inputContracts: {
  //   //     connectOrCreate: (item.inputContracts || []).map((ic) => ({
  //   //       where: { id: ic.id, salt: ic.id },
  //   //       create: ic,
  //   //     })),
  //   //   },
  //   //   gasPrice: item.gasPrice || "0",
  //   //   gasLimit: item.gasLimit || "0",
  //   //   maturity: item.maturity || "0",
  //   //   txPointer: item.txPointer,
  //   //   isScript: item.isScript,
  //   //   isCreate: item.isCreate,
  //   //   isMint: item.isMint,
  //   //   witnesses: item.witnesses || [],
  //   //   receiptsRoot: item.receiptsRoot,
  //   //   script: item.script,
  //   //   scriptData: item.scriptData,
  //   //   bytecodeWitnessIndex: item.bytecodeWitnessIndex,
  //   //   bytecodeLength: item.bytecodeLength,
  //   //   salt: item.salt,
  //   //   rawPayload: item.rawPayload,
  //   // };
  //   const tx: TXCreate = {
  //     id: item.id,
  //     inputAssetIds: item.inputAssetIds || [],
  //     inputContracts: {
  //       connectOrCreate: (item.inputContracts || []).map((ic) => ({
  //         where: { id: ic.id, salt: ic.id },
  //         create: ic,
  //       })),
  //     },
  //     gasPrice: item.gasPrice || "0",
  //     gasLimit: item.gasLimit || "0",
  //     maturity: item.maturity || "0",
  //     txPointer: item.txPointer,
  //     isScript: item.isScript,
  //     isCreate: item.isCreate,
  //     isMint: item.isMint,
  //     witnesses: item.witnesses || [],
  //     receiptsRoot: item.receiptsRoot,
  //     script: item.script,
  //     scriptData: item.scriptData,
  //     bytecodeWitnessIndex: item.bytecodeWitnessIndex,
  //     bytecodeLength: item.bytecodeLength,
  //     salt: item.salt,
  //     rawPayload: item.rawPayload,
  //   };
  //   (item.inputs || []).map((input) => {
  //     const inputsCreate = tx[`inputs__${input.type}`] || {
  //       create: [],
  //     };

  //     if (input.type === "InputContract" && input.contract) {
  //       input.contract = {
  //         connectOrCreate: {
  //           where: { id: input.contract.id, salt: input.contract.salt },
  //           create: input.contract,
  //         },
  //       } as any;
  //     }

  //     inputsCreate.create.push({
  //       ...input,
  //       type: undefined,
  //     });
  //     tx[`inputs__${input.type}`] = inputsCreate;
  //   });
  //   (item.outputs || []).map((output) => {
  //     const outputsCreate = tx[`outputs__${output.type}`] || {
  //       create: [],
  //     };
  //     outputsCreate.create.push({
  //       ...output,
  //       type: undefined,
  //     });
  //     tx[`outputs__${output.type}`] = outputsCreate;
  //   });
  //   tx[`status__${item.status.type}`] = {
  //     create: {
  //       ...item.status,
  //       block: item.status.block
  //         ? ({
  //             connectOrCreate: {
  //               where: { id: item.status.block.id },
  //               create: item.status.block,
  //             },
  //           } as any)
  //         : undefined,
  //       programState: item.status.programState
  //         ? {
  //             create: item.status.programState,
  //           }
  //         : undefined,
  //       type: undefined,
  //     },
  //   };

  //   // console.dir(tx, { depth: null });

  //   return tx;
  // });

  // const root = await prisma.transaction.create({
  //   data: txs[0] as any,
  // });
  // console.log(root);
  const transactions = await xprisma.transaction.findMany({
    include: {
      inputContracts: true,
      inputs__InputCoin: true,
      inputs__InputContract: {
        include: {
          contract: true,
        },
      },
      inputs__InputMessage: true,
      outputs__ChangeOutput: true,
      outputs__CoinOutput: true,
      outputs__ContractCreated: true,
      outputs__ContractOutput: true,
      outputs__VariableOutput: true,
      status__SqueezedOutStatus: true,
      status__SubmittedStatus: true,
      status__FailureStatus: true,
      status__SuccessStatus: true,
    },
  });
  console.timeEnd("prisma");
  console.dir(transactions, { depth: null });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
