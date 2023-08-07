import { createHandler } from "graphql-http/lib/use/express";
import { Application } from "express";
import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "fs";
import { join } from "path";
import { replaceGenericTypes } from "./graphql-utils";
import { PageResults } from "./graphql-utils/resolvers/PageResults";

function databaseDirective() {
  const queryDirectiveName = "query";
  return {
    dbDirectiveTypeDefs: `
        directive @${queryDirectiveName}(table: String!, paginate: Boolean) on FIELD_DEFINITION
    `,
    dbDirectiveTransformer: (schema: GraphQLSchema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD](fieldConfig) {
          const [queryDirective] =
            getDirective(schema, fieldConfig, queryDirectiveName) || [];
          if (queryDirective) {
            const { table } = queryDirective;

            if (PageResults.isPageResults(fieldConfig)) {
              fieldConfig.resolve = PageResults.createResolver(table);
            }

            return fieldConfig;
          }
        },
      }),
  };
}

const { dbDirectiveTypeDefs, dbDirectiveTransformer } = databaseDirective();

const otherSchema = dbDirectiveTransformer(
  makeExecutableSchema({
    typeDefs: [
      dbDirectiveTypeDefs,
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
