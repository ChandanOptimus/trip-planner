import { NextResponse } from "next/server";
import { getTripData } from "@/lib/sheets";
export const dynamic = "force-dynamic";
export async function GET() { try { return NextResponse.json(await getTripData()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load trip data." }, { status: 500 }); } }
