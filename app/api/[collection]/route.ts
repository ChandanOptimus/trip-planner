import { NextRequest, NextResponse } from "next/server";
import { createRow, deleteRow, updateRow, updateTrip } from "@/lib/sheets";
import type { CollectionName } from "@/lib/types";

const collections: CollectionName[] = [
  "itinerary",
  "stops",
  "packing",
  "expenses",
  "ridePrep",
  "notes",
];

const fields: Record<CollectionName, string[]> = {
  itinerary: [
    "id",
    "day",
    "date",
    "from",
    "to",
    "distanceKm",
    "rideType",
    "notes",
    "sortOrder",
  ],

  stops: [
    "id",
    "day",
    "type",
    "location",
    "notes",
    "sortOrder",
  ],

  packing: [
    "id",
    "label",
    "category",
    "packed",
    "sortOrder",
  ],

  expenses: [
    "id",
    "date",
    "label",
    "amount",
    "category",
    "notes",
  ],

  ridePrep: [
    "id",
    "label",
    "checked",
    "category",
    "sortOrder",
  ],

  notes: [
    "id",
    "title",
    "body",
    "sortOrder",
  ],
};
function validCollection(value: string): value is CollectionName {
  return collections.includes(value as CollectionName);
}
function strings(body: unknown) {
  return Object.fromEntries(
    Object.entries((body ?? {}) as Record<string, unknown>).map(
      ([key, value]) => [key, String(value ?? "")],
    ),
  );
}
function validate(collection: CollectionName, body: Record<string, string>) {
  const required = fields[collection].filter(
    (field) => !["id", "notes", "date", "sortOrder"].includes(field),
  );
  if (required.some((field) => !body[field]?.trim()))
    throw new Error(
      `Please complete: ${required.filter((field) => !body[field]?.trim()).join(", ")}.`,
    );
  if (
    collection === "expenses" &&
    (!Number(body.amount) || Number(body.amount) < 0)
  )
    throw new Error("Expense amount must be a positive number.");
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const body = strings(await request.json());

    if (collection === "trip") {
      await updateTrip(body);
      return NextResponse.json({ ok: true });
    }

    if (!validCollection(collection)) {
      return NextResponse.json(
        { error: "Unknown collection." },
        { status: 404 }
      );
    }

    const payload = {
      ...body,
      id: body.id?.trim() || crypto.randomUUID(),
    };

    validate(collection, payload);

    await createRow(collection, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save.",
      },
      { status: 400 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  try {
    const { collection } = await params;
    if (!validCollection(collection))
      return NextResponse.json(
        { error: "Unknown collection." },
        { status: 404 },
      );
    const body = strings(await request.json());
    if (!body.id) throw new Error("Missing item ID.");
    validate(collection, body);
    await updateRow(collection, body.id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save." },
      { status: 400 },
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> },
) {
  try {
    const { collection } = await params;
    if (!validCollection(collection))
      return NextResponse.json(
        { error: "Unknown collection." },
        { status: 404 },
      );
    const { id } = strings(await request.json());
    if (!id) throw new Error("Missing item ID.");
    await deleteRow(collection, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete." },
      { status: 400 },
    );
  }
}
