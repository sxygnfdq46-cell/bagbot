import { chartsApi } from "../lib/api/charts";

(async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  await chartsApi.getSnapshot("ETH-USD", "1H");
})();
