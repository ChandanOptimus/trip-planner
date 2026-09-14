import { NextRequest, NextResponse } from "next/server";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type OsrmRoute = {
  geometry?: {
    coordinates?: [number, number][];
  };
  distance?: number;
  duration?: number;
};

type OsrmResponse = {
  code?: string;
  routes?: OsrmRoute[];
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      stops?: Coordinate[];
    };

    const stops = body.stops;

    if (!Array.isArray(stops) || stops.length < 2) {
      return NextResponse.json(
        {
          error: "At least two route stops are required.",
        },
        { status: 400 }
      );
    }

    const validStops = stops.every(
      (stop) =>
        Number.isFinite(stop.latitude) &&
        Number.isFinite(stop.longitude)
    );

    if (!validStops) {
      return NextResponse.json(
        {
          error: "Invalid route coordinates.",
        },
        { status: 400 }
      );
    }

    const coordinates = stops
      .map(
        (stop) =>
          `${stop.longitude},${stop.latitude}`
      )
      .join(";");

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${coordinates}?overview=full&geometries=geojson&steps=false`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "KeralaRoadbook/1.0 personal motorcycle trip planner",
      },
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Routing service unavailable.",
        },
        { status: 502 }
      );
    }

    const result =
      (await response.json()) as OsrmResponse;

    if (
      result.code !== "Ok" ||
      !result.routes?.length ||
      !result.routes[0].geometry?.coordinates?.length
    ) {
      return NextResponse.json(
        {
          error: "Unable to calculate this route.",
        },
        { status: 422 }
      );
    }

    const route = result.routes[0];

    return NextResponse.json({
      coordinates:
        route.geometry?.coordinates ?? [],
      distanceKm: Math.round(
        (route.distance ?? 0) / 1000
      ),
      durationMinutes: Math.round(
        (route.duration ?? 0) / 60
      ),
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to calculate route.",
      },
      { status: 500 }
    );
  }
}