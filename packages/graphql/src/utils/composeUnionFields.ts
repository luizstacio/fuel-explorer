import cloneDeep from "lodash.clonedeep";

export function deepIterateArray<T extends any>(
  obj: T,
  callback: (path: string, value: any, parent: T) => void
) {
  Object.keys((obj || {}) as any).forEach((key) => {
    callback(key, obj[key], obj);
    if (Array.isArray(obj[key])) {
      deepIterateArray(obj[key], callback);
    } else if (typeof obj[key] === "object") {
      deepIterateArray(obj[key], callback);
    }
  });
}

export function composeUnionFields<T extends any>(data: T) {
  const retData = cloneDeep(data);

  deepIterateArray(retData, (key, value, parent) => {
    if (key.includes("__")) {
      const [fieldName, type] = key.split("__");
      if (Array.isArray(value)) {
        const newMap = value.map((i) => ({
          __typename: type,
          ...i,
        }));
        parent[fieldName] = (parent[fieldName] || []).concat(newMap);
        delete parent[key];
      } else {
        parent[fieldName] = {
          __typename: type,
          ...value,
        };
        delete parent[key];
      }
    }
  });

  return retData;
}
