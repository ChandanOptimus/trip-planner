import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Missing location query." },
      { status: 400 }
    );
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "in");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "KeralaRoadbook/1.0 (personal motorcycle trip planner)",
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24 * 30,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable." },
        { status: 502 }
      );
    }

    const results = (await response.json()) as NominatimResult[];

    if (!results.length) {
      return NextResponse.json(
        { error: `Location not found: ${query}` },
        { status: 404 }
      );
    }

    const result = results[0];

    return NextResponse.json({
      query,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      displayName: result.display_name,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to geocode this location." },
      { status: 500 }
    );
  }
}

