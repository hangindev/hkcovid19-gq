import { ClusterCreateInput } from "nexus-plugin-prisma/client";
import { lowerCase, trim } from "lodash";
import { trimKeys } from "./utils";

const resolveName = data => trim(lowerCase(data["Cluster"]));

const resolveCases = (data): number[] =>
  data["Involved case number"].split(",").map(Number);

export type ClusterWithCases = { name: string; cases: number[] };

const resolveCluster = (rawData): ClusterWithCases | null => {
  const data = trimKeys(rawData);
  console.log(rawData);
  console.log({
    name: resolveName(data),
    cases: resolveCases(data),
  });
  try {
    return {
      name: resolveName(data),
      cases: resolveCases(data),
    };
  } catch (error) {
    console.warn(`Error resolving raw cluster: ${error.message}`);
    console.warn(rawData);
    return null;
  }
};

export default resolveCluster;

export const clusterWithCasesToInput = (
  obj: ClusterWithCases
): ClusterCreateInput => ({
  name: obj.name,
  cases: { connect: obj.cases.map(caseNo => ({ id: caseNo })) },
});
