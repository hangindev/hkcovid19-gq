import { timeParse } from "d3-time-format";
import {
  Case,
  Gender,
  Classification,
  Status,
} from "nexus-plugin-prisma/client";
import { lowerCase, trim } from "lodash";
import { trimKeys } from "./utils";

const parseDateStr = (str: string): Date => {
  const date = timeParse("%d/%m/%Y")(str.replace(/[^0-9\/]/g, ""));
  if (!date) {
    throw new Error(`Invalid date string. ${str}`);
  }
  return date;
};

const resolveId = (data): number => {
  const id = Number(data["Case no."]);
  if (isNaN(id)) throw new Error("Unknown case no.");
  return id;
};

const resolveAge = (data): number => {
  const str = data["Age"];
  const age = Number(str);
  if (isNaN(age)) {
    // edge cases
    switch (str) {
      case "1 month":
      case "2 months":
        return 0;
      default:
        throw new Error(`Unknown age: ${str}`);
    }
  }
  return age;
};

const resolveReportDate = (data): Date => parseDateStr(data["Report date"]);

const resolveOnsetDate = (data): Date | null => {
  const str = data["Date of onset"];
  try {
    return parseDateStr(str);
  } catch (error) {
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const monthRegex = new RegExp(months.join("|"), "i");
    const [matched] = str.match(monthRegex) || [];
    if (matched) {
      const monthIndex = months.findIndex(m => m === lowerCase(matched));
      const date = new Date(2020, monthIndex, 15);
      return date;
    }
    return null;
  }
};

const resolveAsymptomatic = (data): boolean | null => {
  const str = data["Date of onset"];
  switch (trim(lowerCase(str))) {
    case "pending":
    case "unknown":
      return null;
    case "asymtomatic":
    case "asymptomatic":
      return true;
    default: {
      // if there is an onset date, it is not asymptomatic.
      if (!!resolveOnsetDate(data)) return false;
      if (
        !str.match(/asymptomatic|asymtomatic|pending|unknown|not applicable/gi)
      )
        console.warn(`Unknown date of onset: ${str} (Set to null)`);
      return null;
    }
  }
};

const resolveConfirmed = (data): boolean => {
  const confirmed = data["Confirmed/probable"];
  switch (trim(lowerCase(confirmed))) {
    case "confirmed":
      return true;
    case "probable":
      return false;
    default:
      throw new Error(`Unknown confirmed/probable.`);
  }
};

const resolveIsHkResident = (data): boolean | null => {
  switch (trim(lowerCase(data["HK/Non-HK resident"]))) {
    case "hk resident":
      return true;
    case "non hk resident":
    case "non-hk resident":
      return false;
    case "unknown":
      return null;
    default:
      throw new Error(`Unknown HK/Non-HK resident.`);
  }
};

const resolveGender = (data): Gender => {
  const gender = data["Gender"];
  switch (trim(lowerCase(gender))) {
    case "m":
      return "MALE";
    case "f":
      return "FEMALE";
    default:
      throw new Error(`Unknown gender.`);
  }
};

const resolveStatus = (data): Status => {
  const status = data["Hospitalised/Discharged/Deceased"];
  const str = trim(lowerCase(status));
  if (str.match(/hospitalised/i)) return "HOSPITALISED";
  if (str.match(/discharged/i)) return "DISCHARGED";
  if (str.match(/deceased/i)) return "DECEASED";
  if (str.match(/pending/i)) return "PENDING_ADMISSION";
  if (str.match(/no admission/i)) return "NO_ADMISSION";
  if (!str || str.match(/to be provided/i)) return "TO_BE_PROVIDED";
  throw new Error(`Unknown status: ${status}`);
};

const resolveClassification = (data): Classification => {
  switch (trim(lowerCase(data["Case classification*"]))) {
    case "imported":
    case "imported case":
      return "IMPORTED";
    case "close contact of imported case":
    case "epidemiologically linked with imported case":
      return "LINKED_WITH_IMPORTED";
    case "possibly local":
    case "possibly local case":
      return "POSSIBLY_LOCAL";
    case "close contact of possibly local case":
    case "epidemiologically linked with possibly local case":
      return "LINKED_WITH_POSSIBLY_LOCAL";
    case "local case":
      return "LOCAL";
    case "close contact of local case":
    case "epidemiologically linked with local case":
      return "LINKED_WITH_LOCAL";
    default:
      throw new Error(`Unknown classification`);
  }
};

const resolveCase = (rawData): Case | null => {
  const data = trimKeys(rawData);
  try {
    return {
      id: resolveId(data),
      age: resolveAge(data),
      reportDate: resolveReportDate(data),
      onsetDate: resolveOnsetDate(data),
      confirmed: resolveConfirmed(data),
      isHkResident: resolveIsHkResident(data),
      asymptomatic: resolveAsymptomatic(data),
      gender: resolveGender(data),
      status: resolveStatus(data),
      classification: resolveClassification(data),
      dischargeDate: null,
      deceaseDate: null,
      admissionDate: null,
    };
  } catch (error) {
    console.warn(`Error resolving raw case: ${error.message}`);
    console.warn(rawData);
    return null;
  }
};

export default resolveCase;
