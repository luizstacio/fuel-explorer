import { GraphQLFieldConfig, getNamedType } from "graphql";
import { prisma, prismaClient } from "~/prisma";
import { getIncludes } from "~/utils";

type PageInfo = {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string;
  endCursor: string;
};

type PageInput = {
  first: number;
  after: string;
  last: number;
  before: string;
};

export class PageResults {
  static isPageResults(fieldConfig: GraphQLFieldConfig<any, any, any>) {
    return getNamedType(fieldConfig.type).name.startsWith("Page__");
  }

  static createResolver =
    (table: string) =>
    async (_: any, { first, after }: PageInput) => {
      const model = table.toLowerCase();

      if (!prismaClient.hasOwnProperty(model)) {
        throw new Error(`${model} not found!`);
      }

      const result = await prismaClient[model].findMany({
        include: getIncludes(prisma, table),
        take: (first || 1) + 1,
        cursor: after
          ? {
              db_id: 1,
            }
          : undefined,
        orderBy: {
          db_id: first ? "asc" : "desc",
        },
      });
      const nodesLength = result.length;
      const nodes = result.slice(0, first);

      const pageInfo: PageInfo = {
        hasNextPage: nodesLength > first,
        hasPreviousPage: false,
        startCursor: String(nodes[0].db_id),
        endCursor: String(nodes[nodes.length - 1].db_id),
      };
      const edges = nodes.map((node: any) => ({
        cursor: String(node.db_id),
        node,
      }));

      return {
        pageInfo,
        edges,
        nodes,
      };
    };
}
