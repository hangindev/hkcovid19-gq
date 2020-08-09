import { Case, PrismaClient } from "nexus-plugin-prisma/client";
import {
  fetchCases,
  fetchCasesVersions,
  fetchBuildings,
  fetchBuildingsVersions,
  fetchClusters,
  fetchLatestHistorialClustersVersion,
} from "./scraper";
import { BuildingWithCases, buildingWithCasesToInput } from "./resolveBuilding";
import { clusterWithCasesToInput } from "./resolveCluster";
import processCasesUpdate from "./processCasesUpdate";
import processBuildingsUpdate from "./processBuildingsUpdate";
import { createInsertQuery, parseVersionDate, addDate } from "./utils";
import { Version } from "./types.d";

const startDate = new Date(2020, 2, 1);

(async function seed() {
  console.time("🌻 Complete seeding");
  const client = new PrismaClient();
  try {
    await initApp(client);
    await seedCases(client);
    await seedBuildings(client);
    await seedClusters(client);
  } catch (err) {
    console.error(err);
    console.warn("Something went wrong while seeding the database. 😢");
    console.warn(
      "Run 'npm run blowitallaway' to clear the database then try again."
    );
  } finally {
    client.$disconnect();
    console.timeEnd("🌻 Complete seeding");
  }
})();

function initApp(client: PrismaClient) {
  const input = { id: 0 };
  return client.app.upsert({ where: input, update: input, create: input });
}

async function seedCases(client: PrismaClient) {
  console.log("🌱 Start seeding cases.");
  const timestamps = await fetchCasesVersions({ startDate });
  const lastTimestamp = timestamps[timestamps.length - 1];
  let prevVersion: Version<Case> | null = null;
  console.log(
    `${timestamps.length} Case List from ${timestamps[0]} to ${lastTimestamp}.`
  );
  const lastDate = parseVersionDate(lastTimestamp);
  for (let i = 0; i < timestamps.length + 1 /* + latest */; i++) {
    const timestamp = timestamps[i];
    if (!timestamp) {
      console.log(`--- Processing Latest Case List ---`);
    } else {
      console.log(`--- Processing Historial Case List ${timestamp} ---`);
    }
    const date = timestamp ? parseVersionDate(timestamp) : addDate(lastDate, 1);
    const currentVersion = { date, list: await fetchCases(timestamp) };
    if (!prevVersion) {
      await client.$queryRaw(
        createInsertQuery({ table: "Case", data: currentVersion.list })
      );
      console.log(`Initialized with ${currentVersion.list.length} cases.`);
    } else {
      await processCasesUpdate(client, prevVersion, currentVersion);
    }
    prevVersion = currentVersion;
  }

  await client.app.update({
    where: { id: 0 },
    data: { lastHistoricalCasesVersion: lastTimestamp },
  });
}

async function seedBuildings(client: PrismaClient) {
  console.log("🌱 Start seeding buildings.");
  // retrieve a list of historical version of the building list file since Mar 1, 2020
  const timestamps = await fetchBuildingsVersions({ startDate });
  const lastTimestamp = timestamps[timestamps.length - 1];
  const lastDate = parseVersionDate(lastTimestamp);
  console.log(
    `${timestamps.length} Building List from ${timestamps[0]} to ${lastTimestamp}.`
  );

  let prevVersion: Version<BuildingWithCases> | null = null;
  for (let i = 0; i < timestamps.length + 1 /* + latest */; i++) {
    const timestamp = timestamps[i];
    const date = timestamp ? parseVersionDate(timestamp) : addDate(lastDate, 1);
    if (!timestamp) {
      console.log(`--- Processing Latest Building List ---`);
    } else {
      console.log(`--- Processing Historial Building List ${timestamp} ---`);
    }
    const currentVersion = { date, list: await fetchBuildings(timestamp) };
    if (!prevVersion) {
      // Initialize
      let count = 0;
      for (const item of currentVersion.list) {
        await client.building
          .create({ data: buildingWithCasesToInput(item) })
          .then(() => count++)
          .catch(error => {
            console.log(error);
            console.log(item);
          });
      }
      console.log(`Initialized with ${count} buildings.`);
    } else {
      await processBuildingsUpdate(client, prevVersion, currentVersion);
    }
    prevVersion = currentVersion;
  }

  await client.app.update({
    where: { id: 0 },
    data: { lastHistoricalBuildingsVersion: lastTimestamp },
  });
}

async function seedClusters(client: PrismaClient) {
  console.log("🌱 Start seeding clusters.");
  const latestClusters = await fetchClusters();
  let count = 0;
  for (const item of latestClusters) {
    const input = clusterWithCasesToInput(item);
    await client.cluster
      .create({ data: input })
      .then(() => count++)
      .catch(console.warn);
  }
  console.log(`Added ${count} clusters.`);
  await client.app.update({
    where: { id: 0 },
    data: {
      lastHistoricalClustersVersion: await fetchLatestHistorialClustersVersion(),
    },
  });
}
