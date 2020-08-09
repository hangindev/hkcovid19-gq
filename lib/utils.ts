import { mapKeys, isDate, isNull, isBoolean, isNumber } from "lodash";

import { timeParse } from "d3-time-format";

export const addDate = (d: Date, offset: number): Date => {
  const date = new Date(d);
  date.setDate(date.getDate() + offset);
  return date;
};

export const today = (offset = 0) => {
  const tdy = new Date();
  if (offset) tdy.setDate(tdy.getDate() + offset);
  return tdy;
};

export const yesterday = (offset = 0) => today(-1 + offset);

export const trimKeys = obj => mapKeys(obj, (_, key) => key.trim());

export const singleQuoted = (str: string) => `'${str}'`;

export const doubleQuote = (str: string) => `"${str}"`;

export function toQueryValue(val) {
  if (isNumber(val)) return val;
  if (isNull(val)) return "NULL";
  if (isDate(val)) return singleQuoted(val.toISOString());
  if (isBoolean(val)) return singleQuoted(val ? "t" : "f");
  return singleQuoted(val.replace(/'/g, `''`));
}

type InsertQueryInput = {
  table: string;
  schema?: string;
  columns?: string[];
  data: Object[];
  returning?: string[];
  onConflict?: string;
};
export function createInsertQuery({
  table,
  schema = "public",
  columns,
  data,
  onConflict,
  returning,
}: InsertQueryInput) {
  const cols = columns || Object.keys(data[0]);
  const tableName = `${doubleQuote(schema)}.${doubleQuote(table)}`;
  const columnList = cols.map(doubleQuote).join(", ");
  const toValue = item =>
    `(${cols.map(col => toQueryValue(item[col])).join(", ")})`;
  const query =
    `INSERT INTO ${tableName} (${columnList}) VALUES \n` +
    `${data.map(toValue).join(", \n")}` +
    (!!onConflict ? `ON CONFLICT ${onConflict} \n` : "") +
    (!!returning ? `RETURNING ${returning.map(doubleQuote).join(", ")}` : "");

  return query;
}

export const getAddress = ({
  name,
  district,
}: {
  name: string;
  district: string;
}) => `${name}, ${district}`;

export const parseVersionDate = (str: string): Date => {
  const date = timeParse("%Y%m%d-%H%M")(str);
  if (!date) {
    throw new Error(`Invalid date string. ${str}`);
  }
  return date;
};

export const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();
