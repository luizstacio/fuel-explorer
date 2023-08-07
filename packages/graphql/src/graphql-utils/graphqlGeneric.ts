const globalTypeDefs = `
  # Information about pagination in a connection
  type PageInfo {
    # When paginating backwards, are there more items?
    hasPreviousPage: Boolean!

    # When paginating forwards, are there more items?
    hasNextPage: Boolean!

    # When paginating backwards, the cursor to continue.
    startCursor: String

    # When paginating forwards, the cursor to continue.
    endCursor: String
  }
`;

const customGenericsTypeDefs = {
  PageResult: {
    typeName: (type: string) => `Page__${type.replaceAll("!", "")}`,
    createType: (resultType: string, type: string) => `
      type ${resultType}Edge {
        cursor: String!
        node: ${type.replaceAll("!", "")}!
      }

      type ${resultType} {
        pageInfo: PageInfo!
        edges: [${resultType}Edge!]!
        nodes: [${type}]!
      }
    `,
  },
};

export function replaceGenericTypes(schema: string) {
  const CACHE_PAGE_TYPES: Record<string, string> = {};

  const typeDefs = schema.replaceAll(/([A-z_]+<.*>)/g, (group) => {
    return group.replace(/(.*)<(.*)>/, (_, p1, p2) => {
      const genericTranformer = customGenericsTypeDefs[p1];

      if (!genericTranformer) {
        throw new Error(`Generic type ${p1} not found!`);
      }
      const typeName = genericTranformer.typeName(p2);
      CACHE_PAGE_TYPES[typeName] = genericTranformer.createType(typeName, p2);

      return typeName;
    });
  });

  return [
    globalTypeDefs,
    typeDefs,
    Object.values(CACHE_PAGE_TYPES).join("\n"),
  ].join("\n");
}
