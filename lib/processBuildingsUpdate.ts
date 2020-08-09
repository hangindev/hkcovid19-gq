import { PrismaClient } from "nexus-plugin-prisma/client";
import { isEqual } from "lodash";
import { BuildingWithCases, buildingWithCasesToInput } from "./resolveBuilding";
import { getAddress } from "./utils";
import { Version } from "./types.d";

async function processBuildingsUpdate(
  client: PrismaClient,
  { list: prevList }: Version<BuildingWithCases>,
  { list: currentList }: Version<BuildingWithCases>
) {
  let count = 0;
  for (const item of currentList) {
    const prevMatched = prevList.find(b => getAddress(b) === getAddress(item));
    if (!prevMatched || !isEqual(prevMatched, item)) {
      const input = buildingWithCasesToInput(item);
      await client.building
        .upsert({
          where: { address: { name: item.name, district: item.district } },
          create: input,
          update: input,
        })
        .then(() => count++)
        .catch(console.warn);
    }
  }
  console.log(`Upserted ${count} building(s).`);
}

export default processBuildingsUpdate;
