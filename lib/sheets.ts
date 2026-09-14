import "server-only";
import { google } from "googleapis";
import type { CollectionName, TripData, TripSettings } from "./types";

const sheetsByCollection: Record<CollectionName, { tab: string; headers: string[] }> = {
  itinerary: { tab: "Itinerary", headers: ["id", "day", "date", "from", "to", "distanceKm", "rideType", "notes", "sortOrder"] },
  packing: { tab: "Packing", headers: ["id", "label", "category", "packed", "sortOrder"] },
  expenses: { tab: "Expenses", headers: ["id", "date", "label", "amount", "category", "notes"] },
  ridePrep: { tab: "Ride Prep", headers: ["id", "label", "checked", "category", "sortOrder"] },
  notes: { tab: "Notes", headers: ["id", "title", "body", "sortOrder"] }
};

function configuration() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!spreadsheetId || !clientEmail || !privateKey) throw new Error("Google Sheets is not configured. Add GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY.");
  return { spreadsheetId, clientEmail, privateKey };
}

function client() {
  const { clientEmail, privateKey } = configuration();
  return google.sheets({ version: "v4", auth: new google.auth.JWT(clientEmail, undefined, privateKey, ["https://www.googleapis.com/auth/spreadsheets"]) });
}

function columnLetter(index: number) { return String.fromCharCode(64 + index); }
function valuesToRows(values: string[][] | null | undefined, headers: string[]) {
  return (values ?? []).slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "")]))).filter((row) => row.id);
}

export async function getTripData(): Promise<TripData> {
  const { spreadsheetId } = configuration(); const api = client();
  const ranges = ["Trip!A:B", ...Object.values(sheetsByCollection).map(({ tab }) => `'${tab}'!A:Z`)];
  const response = await api.spreadsheets.values.batchGet({ spreadsheetId, ranges });
  const results = response.data.valueRanges ?? [];
  const trip: TripSettings = Object.fromEntries((results[0]?.values ?? []).slice(1).filter((row) => row[0]).map((row) => [String(row[0]), String(row[1] ?? "")]));
  const collections = (Object.keys(sheetsByCollection) as CollectionName[]).reduce((all, key, index) => {
    all[key] = valuesToRows(results[index + 1]?.values as string[][], sheetsByCollection[key].headers).sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
    return all;
  }, {} as Record<CollectionName, Record<string, string>[]>);
  return { trip, itinerary: collections.itinerary as TripData["itinerary"], packing: collections.packing as TripData["packing"], expenses: collections.expenses as TripData["expenses"], ridePrep: collections.ridePrep as TripData["ridePrep"], notes: collections.notes as TripData["notes"] };
}

export async function createRow(collection: CollectionName, input: Record<string, string>) {
  const { spreadsheetId } = configuration(); const api = client(); const config = sheetsByCollection[collection];
  const row = config.headers.map((header) => input[header] ?? "");
  await api.spreadsheets.values.append({ spreadsheetId, range: `'${config.tab}'!A:Z`, valueInputOption: "USER_ENTERED", requestBody: { values: [row] } });
}

export async function updateRow(collection: CollectionName, id: string, input: Record<string, string>) {
  const { spreadsheetId } = configuration(); const api = client(); const config = sheetsByCollection[collection];
  const existing = await api.spreadsheets.values.get({ spreadsheetId, range: `'${config.tab}'!A:Z` });
  const rows = existing.data.values ?? []; const rowIndex = rows.findIndex((row, index) => index > 0 && String(row[0]) === id);
  if (rowIndex < 0) throw new Error("That item no longer exists in the sheet.");
  const row = config.headers.map((header, index) => input[header] ?? String(rows[rowIndex][index] ?? ""));
  const rowNumber = rowIndex + 1;
  await api.spreadsheets.values.update({ spreadsheetId, range: `'${config.tab}'!A${rowNumber}:${columnLetter(config.headers.length)}${rowNumber}`, valueInputOption: "USER_ENTERED", requestBody: { values: [row] } });
}

export async function deleteRow(collection: CollectionName, id: string) {
  const { spreadsheetId } = configuration(); const api = client(); const config = sheetsByCollection[collection];
  const existing = await api.spreadsheets.values.get({ spreadsheetId, range: `'${config.tab}'!A:A` });
  const rowIndex = (existing.data.values ?? []).findIndex((row, index) => index > 0 && String(row[0]) === id);
  if (rowIndex < 0) throw new Error("That item no longer exists in the sheet.");
  await api.spreadsheets.values.clear({ spreadsheetId, range: `'${config.tab}'!A${rowIndex + 1}:${columnLetter(config.headers.length)}${rowIndex + 1}` });
}

export async function updateTrip(values: TripSettings) {
  const { spreadsheetId } = configuration(); const api = client();
  const current = await api.spreadsheets.values.get({ spreadsheetId, range: "Trip!A:B" });
  const existing = current.data.values ?? []; const existingRows = new Map(existing.slice(1).map((row, index) => [String(row[0]), index + 2]));
  for (const [key, value] of Object.entries(values)) {
    const row = existingRows.get(key);
    if (row) await api.spreadsheets.values.update({ spreadsheetId, range: `Trip!A${row}:B${row}`, valueInputOption: "USER_ENTERED", requestBody: { values: [[key, value]] } });
    else await api.spreadsheets.values.append({ spreadsheetId, range: "Trip!A:B", valueInputOption: "USER_ENTERED", requestBody: { values: [[key, value]] } });
  }
}
