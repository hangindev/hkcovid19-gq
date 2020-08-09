import cron from "node-cron";
import { PrismaClient } from "nexus-plugin-prisma/client";
import { log } from "nexus";
import {
  fetchLatestHistorialCasesVersion,
  fetchLatestHistorialBuildingsVersion,
  fetchLatestHistorialClustersVersion,
  fetchCases,
  fetchBuildings,
  fetchClusters,
} from "./scraper";
import processCasesUpdate from "./processCasesUpdate";
import processBuildingsUpdate from "./processBuildingsUpdate";
import { clusterWithCasesToInput } from "./resolveCluster";
import { parseVersionDate } from "./utils";

export default function setup(client: PrismaClient) {
  // “At minute 30 past every hour.”
  cron.schedule("30 */1 * * *", () => start(client), {
    scheduled: process.env.NODE_ENV === "production",
    timezone: "Asia/Hong_Kong",
  });
}

async function start(client: PrismaClient) {
  log.info("Start cron job");
  try {
    const app = await client.app.findOne({ where: { id: 0 } });
    if (!app) throw new Error("App is not initialized.");

    const [
      latestHistorialCasesVersion,
      latestHistorialBuildingsVersion,
      latestHistorialClustersVersion,
    ] = await Promise.all([
      fetchLatestHistorialCasesVersion(),
      fetchLatestHistorialBuildingsVersion(),
      fetchLatestHistorialClustersVersion(),
    ]);
    if (app.lastHistoricalCasesVersion !== latestHistorialCasesVersion) {
      const prevVList = await fetchCases(latestHistorialCasesVersion);
      const currentList = await fetchCases();
      await processCasesUpdate(
        client,
        {
          date: parseVersionDate(latestHistorialCasesVersion),
          list: prevVList,
        },
        {
          date: new Date(),
          list: currentList,
        }
      );
      await client.app.update({
        where: { id: 0 },
        data: { lastHistoricalCasesVersion: latestHistorialCasesVersion },
      });
    }
    if (
      app.lastHistoricalBuildingsVersion !== latestHistorialBuildingsVersion
    ) {
      const prevVList = await fetchBuildings(latestHistorialBuildingsVersion);
      const currentList = await fetchBuildings();
      await processBuildingsUpdate(
        client,
        {
          date: parseVersionDate(latestHistorialCasesVersion),
          list: prevVList,
        },
        {
          date: new Date(),
          list: currentList,
        }
      );
      await client.app.update({
        where: { id: 0 },
        data: {
          lastHistoricalBuildingsVersion: latestHistorialBuildingsVersion,
        },
      });
    }
    if (app.lastHistoricalClustersVersion !== latestHistorialClustersVersion) {
      const latestClusters = await fetchClusters();
      for (const item of latestClusters) {
        const input = clusterWithCasesToInput(item);
        await client.cluster
          .upsert({
            where: { name: item.name },
            create: input,
            update: input,
          })
          .catch(console.warn);
      }
      await client.app.update({
        where: { id: 0 },
        data: {
          lastHistoricalClustersVersion: await fetchLatestHistorialClustersVersion(),
        },
      });
    }
  } catch (error) {
    log.warn(error);
  } finally {
    log.info("Completed cron job.");
  }
}
