import { PrismaClient } from "@prisma/client";
import { composeUnionFields } from "./utils/composeUnionFields";

export const prisma = new PrismaClient();
export const prismaClient = prisma.$extends({
  query: {
    $allOperations: async ({ args, query }) => {
      const result = await query(args);
      return composeUnionFields(result);
    },
  },
});
