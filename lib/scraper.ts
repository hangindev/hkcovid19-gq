import got from "got";
import { csvParse } from "d3-dsv";
import { timeFormat } from "d3-time-format";
import resolveCase from "./resolveCase";
import resolveBuildingWithCases, { BuildingWithCases } from "./resolveBuilding";
import resolveCluster, { ClusterWithCases } from "./resolveCluster";
import { yesterday, isSameDay } from "./utils";
import { sortBy, last, uniq } from "lodash";
import { Case } from "nexus-plugin-prisma/client";

const LIST_FILE_VERSIONS_ENDPOINT =
  "https://api.data.gov.hk/v1/historical-archive/list-file-versions";
const GET_FILE_ENDPOINT =
  "https://api.data.gov.hk/v1/historical-archive/get-file";
const CASE_DETAILS_FILE_URL =
  "http://www.chp.gov.hk/files/misc/enhanced_sur_covid_19_eng.csv";
const BUILDING_LIST_FILE_URL =
  "http://www.chp.gov.hk/files/misc/building_list_eng.csv";
const CLUSTER_LIST_FILE_URL =
  "http://www.chp.gov.hk/files/misc/large_clusters_eng.csv";

const fetchFileListVersions = (url: string) => async ({
  startDate,
  endDate = yesterday(),
}: {
  startDate: Date;
  endDate?: Date;
}): Promise<string[]> => {
  const ytd = yesterday();
  if (startDate > endDate)
    throw new Error("End date must be larger than or equal to start date.");
  if (endDate > ytd)
    throw new Error("End date must be smaller than yesterday.");
  const formatDate = timeFormat("%Y%m%d");
  const res = await got(LIST_FILE_VERSIONS_ENDPOINT, {
    searchParams: {
      url,
      start: formatDate(startDate),
      end: formatDate(endDate),
    },
    responseType: "json",
  });
  const { timestamps } = res.body as { timestamps: string[] };

  // The end point will not return the latest historial version if
  // startDate and endDate aren't both yesterday.
  // To deal with the bug, we need to send an extra request
  if (isSameDay(endDate, ytd)) {
    const { body } = await got(LIST_FILE_VERSIONS_ENDPOINT, {
      searchParams: { url, start: formatDate(ytd), end: formatDate(ytd) },
      responseType: "json",
    });
    const latest = last((body as { timestamps: string[] }).timestamps);
    if (latest) timestamps.push(latest);
  }
  // in cases it will be fixed one day
  const uniqTimestamps = uniq(timestamps);

  return sortBy(uniqTimestamps, str => Number(str.split("-")[0]));
};

const fetchLatestHistorialFileVersion = (url: string) => () =>
  fetchFileListVersions(url)({
    startDate: yesterday(),
  }).then(list => list[list.length - 1]);

const fetchFile = (url: string) => (timestamp?: string): Promise<any[]> => {
  if (timestamp) {
    return got(GET_FILE_ENDPOINT, {
      searchParams: { url, time: timestamp },
    }).then(res => csvParse(res.body));
  }
  return got(url).then(res => csvParse(res.body));
};

export const fetchBuildingsVersions = fetchFileListVersions(
  BUILDING_LIST_FILE_URL
);

export const fetchCasesVersions = fetchFileListVersions(CASE_DETAILS_FILE_URL);

export const fetchLatestHistorialCasesVersion = fetchLatestHistorialFileVersion(
  CASE_DETAILS_FILE_URL
);

export const fetchLatestHistorialBuildingsVersion = fetchLatestHistorialFileVersion(
  BUILDING_LIST_FILE_URL
);

export const fetchLatestHistorialClustersVersion = fetchLatestHistorialFileVersion(
  CLUSTER_LIST_FILE_URL
);

export const fetchRawCases = fetchFile(CASE_DETAILS_FILE_URL);

export const fetchRawBuildings = fetchFile(BUILDING_LIST_FILE_URL);

export const fetchRawClusters = fetchFile(CLUSTER_LIST_FILE_URL);

export const fetchCases = (timestamp?: string) =>
  fetchRawCases(timestamp).then(
    rawCase =>
      rawCase.map(resolveCase).filter(resolved => resolved !== null) as Case[]
  );

export const fetchBuildings = (timestamp?: string) =>
  fetchRawBuildings(timestamp).then(
    rawBuildings =>
      rawBuildings
        .map(resolveBuildingWithCases)
        .filter(resolved => resolved !== null) as BuildingWithCases[]
  );

export const fetchClusters = (timestamp?: string) =>
  fetchRawClusters(timestamp).then(
    rawClusters =>
      rawClusters
        .map(resolveCluster)
        .filter(resolved => resolved !== null) as ClusterWithCases[]
  );
