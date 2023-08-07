const path = require("path");
const { workerData } = require("worker_threads");

require("ts-node").register({
  require: ["tsconfig-paths/register"],
});
require(path.resolve(__dirname, workerData.path));
