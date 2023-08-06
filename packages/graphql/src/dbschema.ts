import { createHandler } from "graphql-http/lib/use/express";
import { Application } from "express";
import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { GraphQLSchema, getNamedType } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import {
  composeUnionFields,
  getIncludes,
  replaceGenericTypes
} from "./utils";

const prisma = new PrismaClient({
  log: ["query"],
});

const xprisma = prisma.$extends({
  query: {
    $allOperations: async ({ args, query, ...others }) => {
      const result = await query(args);
      return composeUnionFields(result);
    },
  },
});

function restDirective() {
  const queryDirectiveName = "query";
  const tableArgumentMap = "table";

  return {
    restDirectiveTypeDefs: `
        directive @${queryDirectiveName}(table: String!, paginate: Boolean) on FIELD_DEFINITION
        directive @${tableArgumentMap}(name: String!) on FIELD_DEFINITION
    `,
    restDirectiveTransformer: (schema: GraphQLSchema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD](fieldConfig) {
          const restDirective = getDirective(
            schema,
            fieldConfig,
            queryDirectiveName
          )?.[0];

          if (restDirective) {
            // Get non null type to get the type inside the return
            // const nonNullType = getNullableType(fieldConfig.type);

            if (getNamedType(fieldConfig.type).name.startsWith("Page__")) {
              const { table } = restDirective;
              fieldConfig.resolve = async () => {
                const model = table.toLowerCase();

                if (!xprisma.hasOwnProperty(model)) {
                  throw new Error(`${model} not found!`);
                }

                const transactions = await xprisma[model].findMany({
                  include: getIncludes(prisma, table),
                });
                return {
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: "",
                    endCursor: "",
                  },
                  nodes: transactions,
                };
              };
            }
            return fieldConfig;
          }
        },
      }),
  };
}

const { restDirectiveTypeDefs, restDirectiveTransformer } = restDirective();

const otherSchema = restDirectiveTransformer(
  makeExecutableSchema({
    typeDefs: [
      restDirectiveTypeDefs,
      replaceGenericTypes(
        readFileSync(join(__dirname, "./db.graphql"), "utf-8")
      ),
    ],
  })
);

export async function startGraphql(fuelCoreGraphql: string, app: Application) {
  app.post(
    "/graphql",
    createHandler({
      schema: otherSchema,
    })
  );
}
