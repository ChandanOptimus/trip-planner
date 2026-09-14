"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
type MapStopType = "start" | "end" | "fuel" | "food" | "sightseeing" | "stay";
type MapLeg = {
  id: string;
  day: string;
  from: string;
  to: string;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
};
type MapStop = {
  id: string;
  day: string;
  type: "fuel" | "food" | "sightseeing" | "stay";
  location: string;
  notes: string;
  latitude: number;
  longitude: number;
};
type RouteResult = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
};

type Props = {
  legs: MapLeg[];
  stops: MapStop[];
  activeDay: string | null;
};
function createMapIcon(type: MapStopType, number?: number) {
  const icons: Record<MapStopType, string> = {
    start: "START",
    end: "END",
    fuel: "F",
    food: "FOOD",
    sightseeing: "VIEW",
    stay: "STAY",
  };

  const label = icons[type];

  return L.divIcon({
    className: `roadbook-map-marker roadbook-map-marker-${type}`,
    html: `
      <div class="roadbook-map-marker-inner">
        ${number ? `<span class="roadbook-marker-number">${number}</span>` : ""}
        <span class="roadbook-marker-label">${label}</span>
      </div>
    `,
    iconSize: [48, 34],
    iconAnchor: [24, 17],
    popupAnchor: [0, -18],
  });
}

function MapController({
  legs,
  activeDay,
  route,
}: {
  legs: MapLeg[];
  activeDay: string | null;
  route: RouteResult | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!route?.coordinates?.length) return;

    const points = route.coordinates.map(
      ([longitude, latitude]) => [latitude, longitude] as [number, number],
    );
    map.fitBounds(L.latLngBounds(points), {
      padding: [40, 40],
      maxZoom: activeDay ? 11 : 9,
    });
  }, [map, route, activeDay]);

  useEffect(() => {
    if (!legs.length || route) return;

    const points = legs.flatMap((leg) => [
      [leg.fromLatitude, leg.fromLongitude] as [number, number],
      [leg.toLatitude, leg.toLongitude] as [number, number],
    ]);

    if (points.length) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [40, 40],
        maxZoom: 9,
      });
    }
  }, [map, legs, route]);

  return null;
}

async function fetchRoute(legs: MapLeg[]): Promise<RouteResult | null> {
  if (!legs.length) return null;

  const stops: { latitude: number; longitude: number }[] = [];

  legs.forEach((leg, index) => {
    if (index === 0) {
      stops.push({
        latitude: leg.fromLatitude,
        longitude: leg.fromLongitude,
      });
    }

    stops.push({
      latitude: leg.toLatitude,
      longitude: leg.toLongitude,
    });
  });

  const response = await fetch("/api/route", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stops }),
  });

  if (!response.ok) {
    throw new Error("Unable to calculate route");
  }

  return response.json();
}

export default function ItineraryMap({ legs, stops, activeDay }: Props) {
  const [fullRoute, setFullRoute] = useState<RouteResult | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedLegs = useMemo(() => {
    if (!activeDay) return legs;

    return legs.filter((leg) => leg.day === activeDay);
  }, [legs, activeDay]);

  /*
   * Full trip route
   */
  useEffect(() => {
    let cancelled = false;

    async function loadFullRoute() {
      if (!legs.length) {
        setFullRoute(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await fetchRoute(legs);

        if (!cancelled) {
          setFullRoute(result);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to calculate the road route.");
          setFullRoute(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFullRoute();

    return () => {
      cancelled = true;
    };
  }, [legs]);

  /*
   * Selected day route
   *
   * IMPORTANT:
   * This uses the exact From → To coordinates
   * belonging to that itinerary row.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadActiveRoute() {
      if (!activeDay) {
        setActiveRoute(null);
        return;
      }

      if (!selectedLegs.length) {
        setActiveRoute(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await fetchRoute(selectedLegs);

        if (!cancelled) {
          setActiveRoute(result);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to calculate the selected day's route.");
          setActiveRoute(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActiveRoute();

    return () => {
      cancelled = true;
    };
  }, [activeDay, selectedLegs]);

  const displayedRoute = activeDay ? activeRoute : fullRoute;

  const displayedLegs = activeDay ? selectedLegs : legs;
  const displayedStops = useMemo(() => {
    if (!activeDay) return stops;

    return stops.filter((stop) => stop.day === activeDay);
  }, [stops, activeDay]);
  const markerPoints = useMemo(() => {
    if (activeDay) {
      if (!selectedLegs.length) return [];

      const points: {
        id: string;
        label: string;
        latitude: number;
        longitude: number;
        number: number;
        type: MapStopType;
      }[] = [];

      selectedLegs.forEach((leg, index) => {
        if (index === 0) {
          points.push({
            id: `${leg.id}-from`,
            label: leg.from,
            latitude: leg.fromLatitude,
            longitude: leg.fromLongitude,
            number: 1,
            type: "start",
          });
        }

        points.push({
          id: `${leg.id}-to`,
          label: leg.to,
          latitude: leg.toLatitude,
          longitude: leg.toLongitude,
          number: index + 2,
          type: index === selectedLegs.length - 1 ? "end" : "sightseeing",
        });
      });

      return points;
    }

    const points: {
      id: string;
      label: string;
      latitude: number;
      longitude: number;
      number: number;
      type: MapStopType;
    }[] = [];

    legs.forEach((leg, index) => {
      if (index === 0) {
        points.push({
          id: `${leg.id}-from`,
          label: leg.from,
          latitude: leg.fromLatitude,
          longitude: leg.fromLongitude,
          number: index + 1,
          type: "start",
        });
      }

      points.push({
        id: `${leg.id}-to`,
        label: leg.to,
        latitude: leg.toLatitude,
        longitude: leg.toLongitude,
        number: index + 2,
        type: index === legs.length - 1 ? "end" : "sightseeing",
      });
    });

    return points;
  }, [legs, activeDay, selectedLegs]);

  const routeCoordinates =
    displayedRoute?.coordinates?.map(
      ([longitude, latitude]) => [latitude, longitude] as [number, number],
    ) ?? [];

  return (
    <div className="itinerary-map-shell">
      {activeDay && selectedLegs.length > 0 && (
        <div className="map-day-route-card">
          <div className="map-day-route-heading">
            <span className="map-day-route-label">{activeDay}</span>

            <span className="map-day-route-caption">SELECTED RIDE</span>
          </div>

          <div className="map-day-route-path">
            <div className="map-day-route-place">
              <span className="map-day-route-dot" />
              <strong>{selectedLegs[0].from}</strong>
            </div>

            <span className="map-day-route-arrow">→</span>

            <div className="map-day-route-place">
              <span className="map-day-route-dot destination" />
              <strong>{selectedLegs[selectedLegs.length - 1].to}</strong>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="itinerary-map-status">Calculating road route…</div>
      )}

      {error && (
        <div className="itinerary-map-status itinerary-map-error">{error}</div>
      )}

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom
        className="itinerary-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markerPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={createMapIcon(point.type, point.number)}
          >
            <Popup>
              <strong>{point.label}</strong>
            </Popup>
          </Marker>
        ))}
        {displayedStops.map((stop) => (
          <Marker
            key={`stop-${stop.id}`}
            position={[stop.latitude, stop.longitude]}
            icon={createMapIcon(stop.type)}
          >
            <Popup>
              <strong>{stop.location}</strong>
              {stop.notes ? (
                <div style={{ marginTop: 6 }}>{stop.notes}</div>
              ) : null}
            </Popup>
          </Marker>
        ))}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#f97316",
              weight: 5,
              opacity: 0.9,
            }}
          />
        )}

        <MapController
          legs={displayedLegs}
          activeDay={activeDay}
          route={displayedRoute}
        />
      </MapContainer>

      {displayedRoute && (
        <div className="itinerary-map-stats">
          <div className="itinerary-map-stat">
            <span>ROAD DISTANCE</span>
            <strong>{displayedRoute.distanceKm.toFixed(0)} km</strong>
          </div>

          <div className="itinerary-map-stat">
            <span>EST. RIDING TIME</span>
            <strong>
              {Math.floor(displayedRoute.durationMinutes / 60)}h{" "}
              {Math.round(displayedRoute.durationMinutes % 60)}m
            </strong>
          </div>

          <div className="itinerary-map-stat">
            <span>ROUTE</span>
            <strong>{activeDay || "FULL TRIP"}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
