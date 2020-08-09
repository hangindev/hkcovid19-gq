import { Case, PrismaClient } from "nexus-plugin-prisma/client";
import { isEqual, clone } from "lodash";
import { Version } from "./types.d";

async function processCasesUpdate(
  client: PrismaClient,
  prevVersion: Version<Case>,
  currentVersion: Version<Case>
) {
  let newCount = 0;
  let updateCount = 0;
  for (const item of currentVersion.list) {
    const prevMatched = prevVersion.list.find(({ id }) => id === item.id);
    if (!prevMatched) {
      await client.case
        .create({ data: item })
        .then(() => newCount++)
        .catch(error => {
          if (item.id === 1882) return; // data exisits in 20200720, 20200721 but not in 20200722
          console.warn(error.message, item);
        });
    } else if (!isEqual(prevMatched, item)) {
      const updated = clone(item);
      if (prevMatched.status !== item.status) {
        if (item.status === "HOSPITALISED") {
          updated.admissionDate = currentVersion.date;
        } else if (item.status === "DISCHARGED") {
          updated.dischargeDate = currentVersion.date;
        } else if (item.status === "DECEASED") {
          updated.deceaseDate = currentVersion.date;
        }
      }
      await client.case
        .update({ where: { id: item.id }, data: updated })
        .then(() => updateCount++)
        .catch(error => {
          if (item.id === 1882) return; // data exisits in 20200720, 20200721 but not in 20200722
          console.warn(error.message, item);
        });
    }
  }
  console.log(`Added ${newCount} case(s).`);
  console.log(`Updated ${updateCount} case(s).`);
}

export default processCasesUpdate;
