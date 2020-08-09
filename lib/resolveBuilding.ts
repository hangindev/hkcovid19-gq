import { timeParse } from "d3-time-format";
import {
  District,
  Building,
  BuildingCreateInput,
} from "nexus-plugin-prisma/client";
import { toNumber, snakeCase, isEmpty, trim, replace, pick } from "lodash";
import { trimKeys } from "./utils";

const resolveDistrict = (data): District => {
  const district = trim(snakeCase(data["District"])).toUpperCase();
  switch (district) {
    case "CENTRAL_AND_WESTERN":
    case "EASTERN":
    case "ISLANDS":
    case "KOWLOON_CITY":
    case "KWAI_TSING":
    case "KWUN_TONG":
    case "NORTH":
    case "SAI_KUNG":
    case "SHA_TIN":
    case "SHAM_SHUI_PO":
    case "SOUTHERN":
    case "TAI_PO":
    case "TSUEN_WAN":
    case "TUEN_MUN":
    case "WAN_CHAI":
    case "WONG_TAI_SIN":
    case "YAU_TSIM_MONG":
    case "YUEN_LONG":
      return district;
    case "YAU_TSIM_MON":
      return "YAU_TSIM_MONG";
    case "YUEN_LONG_DISTRICT":
      return "YUEN_LONG";
    case "CENTRAL_WESTERN":
      return "CENTRAL_AND_WESTERN";
    case "KOWLOON_C_ITY":
      return "KOWLOON_CITY";
    case "SHATIN":
      return "SHA_TIN";
    case "ISLAND":
      return "ISLANDS";
    case "SHUM_SHUI_PO":
      return "SHAM_SHUI_PO";
    case "WONG_TAI_S_IN":
      return "WONG_TAI_SIN";
    case "8_HYSAN_AVENUE":
    case "TAI_HANG":
      return "WAN_CHAI";
    default:
      return "NA";
  }
};

const resolveName = (data): string => {
  const name = data["Building name"];
  // edge case
  if (name.match(/maylun apartments, 1-25 shu kuk street \(non/gi)) {
    return "Maylun Apartments(Fook Wai Ching She), 1-25 Shu Kuk Street";
  }
  return trim(
    replace(name, /\(non residential building\)|\(non-residential\)/gi, "")
  );
};

const resolveLastDateOfResidenceOfCases = (data): Date | null =>
  timeParse("%d/%m/%Y")(data["Last date of residence of the case(s)"]);

const resolveIsResidential = (data): boolean =>
  !!data["Building name"].match(
    /\(non residential building\)|\(non-residential\)/gi
  );

const resolveCases = (data): number[] => {
  return data["Related probable/confirmed cases"]
    .replace(/case/gi, "") // e.g. "Case 56"
    .split(/[,/and/]/) // e.g. "56, 47", "28, 34 and 53"
    .reduce((cases, str) => {
      const number = toNumber(str);
      if (
        number !== 0 && // e.g. " "
        !isNaN(number) && // e.g. "Returning from Japan (Diamond Princess cruise)"
        !cases.includes(number) // repeated
      ) {
        cases.push(number);
      }
      return cases;
    }, [] as number[]);
};

const resolveNote = (data): string | null =>
  resolveCases(data).length === 0
    ? data["Related probable/confirmed cases"]
    : null;

export type BuildingWithCases = Omit<Building, "id" | "createdOn"> & {
  cases: number[];
};

const resolveBuildingWithCases = (rawData): BuildingWithCases | null => {
  const data = trimKeys(rawData);
  if (isEmpty(data["Building name"]) || isEmpty(data["District"])) return null;
  try {
    return {
      name: resolveName(data),
      district: resolveDistrict(data),
      lastDateOfResidenceOfCases: resolveLastDateOfResidenceOfCases(data),
      isResidential: resolveIsResidential(data),
      cases: resolveCases(data),
      note: resolveNote(data),
    };
  } catch (error) {
    console.warn("Error resolving raw building:");
    console.warn(rawData);
    console.warn(`Error: ${error.message}`);
    return null;
  }
};

export default resolveBuildingWithCases;

const buildingColumns: Array<keyof Building> = [
  "name",
  "district",
  "lastDateOfResidenceOfCases",
  "isResidential",
  "note",
];

export const buildingWithCasesToInput = (
  obj: BuildingWithCases
): BuildingCreateInput => ({
  ...(pick(obj, buildingColumns) as Omit<Building, "id" | "cases">),
  cases: {
    connect: obj.cases.map(caseNo => ({ id: caseNo })),
  },
});
