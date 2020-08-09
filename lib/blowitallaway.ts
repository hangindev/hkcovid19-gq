import { PrismaClient } from "nexus-plugin-prisma/client";

(async function blowitallaway() {
  console.time("🧹 Bye data");
  const client = new PrismaClient();
  try {
    await client.case.deleteMany({});
    await client.building.deleteMany({});
    await client.cluster.deleteMany({});
    await client.app.deleteMany({});
  } catch (err) {
    throw err;
  } finally {
    await client.$disconnect();
  }
  console.timeEnd("🧹 Bye data");
})();
