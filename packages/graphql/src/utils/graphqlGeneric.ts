const customGenericsTypeDefs = {
  PageResult: {
    typeName: (type: string) => `Page__${type.replaceAll("!", "")}`,
    createType: (resultType: string, type: string) => `
      type ${resultType} {
        pageInfo: PageInfo!
        nodes: [${type}]!
      }
    `
  }
}

export function replaceGenericTypes(schema: string) {
  const CACHE_PAGE_TYPES: Record<string, string> = {};

  const typeDefs = schema.replaceAll(/([A-z_]+<.*>)/g, (group) => {
    return group
      .replace(/(.*)<(.*)>/, (_, p1, p2) => {
        const genericTranformer = customGenericsTypeDefs[p1];

        if (!genericTranformer) {
          throw new Error(`Generic type ${p1} not found!`);
        }
        const typeName = genericTranformer.typeName(p2);
        CACHE_PAGE_TYPES[typeName] = genericTranformer.createType(typeName, p2);

        return typeName;
      });
  });

  return [typeDefs, Object.values(CACHE_PAGE_TYPES).join("\n")].join("\n");
}
