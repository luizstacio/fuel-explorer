import { PrismaClient } from "@prisma/client";

type DataModel = {
  enums: {};
  models: {
    [key: string]: {
      fields: {
        kind: string;
        type: string;
        name: string;
        relationName: string;
      }[];
    };
  };
  types: {};
};

export function getIncludes(
  prisma: PrismaClient,
  table: string,
  maxDepth: number = 1,
  parent: string = "",
  deth: number = 0
) {
  const dataModel: DataModel = (prisma as any)._runtimeDataModel;
  const { fields } = dataModel.models[table];
  return fields
    .filter((f) => !!f.relationName)
    .reduce((acc, f) => {
      if (parent !== f.type && !/^[A-Z]/.test(f.name)) {
        if (deth < maxDepth) {
          acc[f.name] = {
            include: getIncludes(prisma, f.type, maxDepth, table, deth + 1),
          };
        } else {
          acc[f.name] = {};
        }
      }
      return acc;
    }, {});
}
