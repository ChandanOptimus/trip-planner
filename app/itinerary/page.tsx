"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageState } from "@/components/page-state";
import { useTrip } from "@/components/trip-provider";
import type { ItineraryItem, RoadbookStop } from "@/lib/types";
import dynamic from "next/dynamic";

const ItineraryMap = dynamic(() => import("../../components/itinerary-map"), {
  ssr: false,
  loading: () => <div className="itinerary-map-loading">Loading map…</div>,
});
type ModalMode = "view" | "edit" | "add" | null;
type ViewMode = "calendar" | "map";
type GeocodedLocation = {
  latitude: number;
  longitude: number;
  displayName: string;
};
type GeocodeCache = Record<string, GeocodedLocation>;
type MapStop = {
  id: string;
  day: string;
  type: RoadbookStop["type"];
  location: string;
  notes: string;
  latitude: number;
  longitude: number;
};
const blank = {
  day: "",
  date: "",
  from: "",
  to: "",
  distanceKm: "",
  rideType: "Ride day",
  notes: "",
  sortOrder: "",
};
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const isoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function Itinerary() {
  const { data, save } = useTrip();
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>("calendar");
  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<ItineraryItem | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>(blank);
  const [busy, setBusy] = useState(false);
  const [stopBusy, setStopBusy] = useState(false);

  const [selectedStop, setSelectedStop] = useState<RoadbookStop | null>(null);

  const [stopDraft, setStopDraft] = useState({
    type: "fuel" as RoadbookStop["type"],
    location: "",
    notes: "",
  });
  const [geocodedStops, setGeocodedStops] = useState<GeocodeCache>({});
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [activeMapDay, setActiveMapDay] = useState<string | null>(null);
  const [geocodedRoadbookStops, setGeocodedRoadbookStops] = useState<MapStop[]>(
    [],
  );
  useEffect(() => {
    const date =
      data?.itinerary.find((item) => item.date)?.date || data?.trip.startDate;
    if (date) setMonth(new Date(`${date}T00:00:00`));
  }, [data?.trip.startDate]);

  const calendar = useMemo(() => {
    const year = month.getFullYear();
    const currentMonth = month.getMonth();
    const firstWeekday = new Date(year, currentMonth, 1).getDay();
    const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 && day <= daysInMonth
        ? { day, date: isoDate(year, currentMonth, day) }
        : null;
    });
  }, [month]);

  if (!data) return null;

  const byDate = new Map(
    data.itinerary.filter((item) => item.date).map((item) => [item.date, item]),
  );
  const route = [...data.itinerary].sort(
    (a, b) => Number(a.sortOrder || a.day) - Number(b.sortOrder || b.day),
  );
  const mapLegs = route
    .map((item) => {
      const from = geocodedStops[item.from.trim().toLowerCase()];
      const to = geocodedStops[item.to.trim().toLowerCase()];

      if (!from || !to) {
        return null;
      }

      return {
        id: item.id,
        day: item.day,
        from: item.from,
        to: item.to,
        fromLatitude: from.latitude,
        fromLongitude: from.longitude,
        toLatitude: to.latitude,
        toLongitude: to.longitude,
      };
    })
    .filter(
      (
        leg,
      ): leg is {
        id: string;
        day: string;
        from: string;
        to: string;
        fromLatitude: number;
        fromLongitude: number;
        toLatitude: number;
        toLongitude: number;
      } => Boolean(leg),
    );
  const monthLabel = month.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const totalDistance = route.reduce(
    (sum, item) => sum + (Number(item.distanceKm) || 0),
    0,
  );
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const close = () => {
    setMode(null);
    setSelected(null);
    setSelectedStop(null);
    setDraft(blank);

    setStopDraft({
      type: "fuel",
      location: "",
      notes: "",
    });
  };
  const openDate = (date: string, day: number) => {
    const item = byDate.get(date) ?? null;
    setSelected(item);
    setDraft(
      item ?? {
        ...blank,
        date,
        day: String(day),
        sortOrder: String(data.itinerary.length + 1),
      },
    );
    setMode(item ? "view" : "add");
  };
  const openItem = (item: ItineraryItem) => {
    setSelected(item);
    setDraft(item);
    setMode("view");
  };
  const submitStop = async (event: FormEvent) => {
    event.preventDefault();

    if (!selected || !stopDraft.location.trim()) {
      return;
    }

    setStopBusy(true);

    const dayStops = data.stops.filter((stop) => stop.day === selected.day);

    const ok = await save("stops", "POST", {
      id: `stop-${Date.now()}`,
      day: selected.day,
      type: stopDraft.type,
      location: stopDraft.location.trim(),
      notes: stopDraft.notes.trim(),
      sortOrder: String(dayStops.length + 1),
    });

    setStopBusy(false);

    if (ok) {
      setStopDraft({
        type: "fuel",
        location: "",
        notes: "",
      });
    }
  };
  const editStop = (stop: RoadbookStop) => {
    setSelectedStop(stop);

    setStopDraft({
      type: stop.type,
      location: stop.location,
      notes: stop.notes,
    });
  };

  const submitStopEdit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedStop || !stopDraft.location.trim()) {
      return;
    }

    setStopBusy(true);

    const ok = await save("stops", "PATCH", {
      id: selectedStop.id,
      day: selectedStop.day,
      type: stopDraft.type,
      location: stopDraft.location.trim(),
      notes: stopDraft.notes.trim(),
      sortOrder: selectedStop.sortOrder,
    });

    setStopBusy(false);

    if (ok) {
      setSelectedStop(null);

      setStopDraft({
        type: "fuel",
        location: "",
        notes: "",
      });
    }
  };

  const deleteStop = async (stop: RoadbookStop) => {
    const confirmed = window.confirm(
      `Delete the ${stop.type} stop at ${stop.location}?`,
    );

    if (!confirmed) {
      return;
    }

    setStopBusy(true);

    const ok = await save("stops", "DELETE", {
      id: stop.id,
    });

    setStopBusy(false);

    if (ok && selectedStop?.id === stop.id) {
      setSelectedStop(null);

      setStopDraft({
        type: "fuel",
        location: "",
        notes: "",
      });
    }
  };
  const stops = route
    .flatMap((item, index) => (index === 0 ? [item.from, item.to] : [item.to]))
    .filter(Boolean);

  const uniqueStops = stops.filter(
    (stop, index) => stops.indexOf(stop) === index,
  );
  const origin = uniqueStops[0] || "Pune, Maharashtra";
  const destination = uniqueStops[uniqueStops.length - 1] || "Goa, India";
  const waypoints = uniqueStops.slice(1, -1);
  const mapsQuery = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
    ...(waypoints.length ? { waypoints: waypoints.join("|") } : {}),
  });
  const directionsUrl = `https://www.google.com/maps/dir/?${mapsQuery.toString()}`;
  const embedUrl = mapsKey
    ? `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(mapsKey)}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.join("|"))}` : ""}`
    : "";

  const geocodeStop = async (
    stop: string,
  ): Promise<GeocodedLocation | null> => {
    const key = stop.trim().toLowerCase();

    if (!key) return null;

    const cached = geocodedStops[key];

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(stop)}`,
      );

      if (!response.ok) {
        return null;
      }

      const result = (await response.json()) as GeocodedLocation;

      setGeocodedStops((current) => ({
        ...current,
        [key]: result,
      }));

      return result;
    } catch {
      return null;
    }
  };
  useEffect(() => {
    if (!data?.itinerary.length) return;

    const stops = data.itinerary
      .flatMap((item) => [item.from, item.to])
      .map((stop) => stop.trim())
      .filter(Boolean)
      .filter(
        (stop, index, all) =>
          all.findIndex(
            (candidate) => candidate.toLowerCase() === stop.toLowerCase(),
          ) === index,
      );

    if (!stops.length) return;

    let cancelled = false;

    const loadCoordinates = async () => {
      setGeocoding(true);
      setGeocodeError("");

      const results: GeocodeCache = {};

      for (const stop of stops) {
        if (cancelled) return;

        const key = stop.toLowerCase();

        if (geocodedStops[key]) {
          results[key] = geocodedStops[key];
          continue;
        }

        const result = await geocodeStop(stop);

        if (result) {
          results[key] = result;
        }

        /*
         * Nominatim asks clients to stay at or below
         * one request per second.
         */
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }

      if (!cancelled) {
        setGeocodedStops((current) => ({
          ...current,
          ...results,
        }));
        setGeocoding(false);

        if (Object.keys(results).length < stops.length) {
          setGeocodeError(
            "Some itinerary locations could not be found on the map.",
          );
        }
      }
    };

    loadCoordinates();

    return () => {
      cancelled = true;
    };
  }, [data?.itinerary]);

  const mapDays = Array.from(
    new Map(
      route.map((item) => [
        item.day,
        {
          day: item.day,
          from: item.from,
          to: item.to,
        },
      ]),
    ).values(),
  ).map((dayInfo) => {
    const dayItems = route.filter((item) => item.day === dayInfo.day);

    return {
      day: dayInfo.day,
      from: dayItems[0]?.from ?? "",
      to: dayItems[dayItems.length - 1]?.to ?? "",
    };
  });
  useEffect(() => {
    if (!data?.stops?.length) {
      setGeocodedRoadbookStops([]);
      return;
    }

    let cancelled = false;

    const loadRoadbookStops = async () => {
      const results: MapStop[] = [];

      for (const stop of data.stops) {
        if (cancelled) return;

        const key = stop.location.trim().toLowerCase();

        if (!key) continue;

        let coordinates: GeocodedLocation | null = geocodedStops[key] ?? null;

        if (!coordinates) {
          coordinates = await geocodeStop(stop.location);

          await new Promise((resolve) => setTimeout(resolve, 1100));
        }

        if (coordinates) {
          results.push({
            id: stop.id,
            day: stop.day,
            type: stop.type,
            location: stop.location,
            notes: stop.notes,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          });
        }
      }

      if (!cancelled) {
        setGeocodedRoadbookStops(results);
      }
    };

    loadRoadbookStops();

    return () => {
      cancelled = true;
    };
  }, [data?.stops, geocodedStops]);
  return (
    <div className="itinerary-page">
      <style jsx global>{`
        .itinerary-page {
          --rb-bg: #090b0d;
          --rb-panel: #101316;
          --rb-panel-2: #15191d;
          --rb-line: rgba(255, 255, 255, 0.09);
          --rb-muted: #8f989f;
          --rb-text: #f3f4f5;
          --rb-accent: #ff6a1a;
          --rb-accent-soft: rgba(255, 106, 26, 0.13);
          color: var(--rb-text);
          min-width: 0;
        }
        .itinerary-hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-end;
          margin-bottom: 22px;
        }
        .itinerary-hero h1 {
          margin: 4px 0 6px;
          font-size: clamp(32px, 4vw, 54px);
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .itinerary-hero .lead {
          color: var(--rb-muted);
          margin: 0;
          max-width: 680px;
        }
        .eyebrow,
        .month-label {
          color: var(--rb-accent);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .itinerary-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(100px, 1fr));
          gap: 8px;
          min-width: 330px;
        }
        .itinerary-stat {
          background: var(--rb-panel);
          border: 1px solid var(--rb-line);
          padding: 13px 15px;
          border-radius: 12px;
        }
        .itinerary-stat b {
          display: block;
          font-size: 19px;
        }
        .itinerary-stat span {
          color: var(--rb-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .itinerary-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .view-switch {
          display: flex;
          padding: 4px;
          background: var(--rb-panel);
          border: 1px solid var(--rb-line);
          border-radius: 11px;
        }
        .view-switch button {
          border: 0;
          background: transparent;
          color: var(--rb-muted);
          padding: 9px 14px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .view-switch button.active {
          background: var(--rb-accent);
          color: #111;
        }
        .button {
          border: 0;
          border-radius: 9px;
          background: var(--rb-accent);
          color: #111;
          padding: 11px 15px;
          font-weight: 850;
          cursor: pointer;
        }
        .calendar-card,
        .route-map-card {
          background: var(--rb-panel);
          border: 1px solid var(--rb-line);
          border-radius: 16px;
          overflow: hidden;
        }
        .calendar-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid var(--rb-line);
        }
        .calendar-toolbar h2,
        .map-heading h2 {
          margin: 4px 0 0;
          font-size: 24px;
          letter-spacing: -0.03em;
        }
        .month-controls {
          display: flex;
          gap: 6px;
        }
        .month-controls button {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          border: 1px solid var(--rb-line);
          background: var(--rb-panel-2);
          color: var(--rb-text);
          cursor: pointer;
          font-size: 18px;
        }
        .weekday-row,
        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }
        .weekday-row {
          border-bottom: 1px solid var(--rb-line);
        }
        .weekday-row span {
          padding: 10px 12px;
          color: #737c83;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .month-grid {
          gap: 1px;
          background: var(--rb-line);
        }
        .calendar-day,
        .calendar-blank {
          min-width: 0;
          min-height: 118px;
          background: var(--rb-panel);
        }
        .calendar-day {
          border: 0;
          color: var(--rb-text);
          text-align: left;
          padding: 12px;
          cursor: pointer;
          position: relative;
          transition: 0.16s ease;
        }
        .calendar-day:hover {
          background: #171b1f;
        }
        .calendar-day.has-ride {
          background: linear-gradient(145deg, #171b1f, #111416);
          box-shadow: inset 3px 0 0 var(--rb-accent);
        }
        .calendar-day > b {
          display: block;
          color: #8d969c;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .calendar-day.has-ride > b {
          color: #fff;
        }
        .calendar-day span {
          display: block;
          overflow: hidden;
        }
        .calendar-day span i {
          display: block;
          color: var(--rb-accent);
          font-style: normal;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.11em;
          margin-bottom: 5px;
        }
        .calendar-day span {
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }
        .calendar-day span em {
          color: var(--rb-accent);
          font-style: normal;
          margin: 0 3px;
        }
        .calendar-day small {
          color: #555e64;
          font-size: 11px;
        }
        .route-map-card {
          padding: 0;
        }
        .map-heading {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-end;
          padding: 20px;
          border-bottom: 1px solid var(--rb-line);
        }
        .map-heading p {
          color: var(--rb-muted);
          margin: 0;
          text-align: right;
          font-size: 13px;
        }
        .google-map-wrap {
          position: relative;
          background: #0b0d0f;
          min-height: 520px;
        }
        .google-map {
          display: block;
          width: 100%;
          height: 520px;
          border: 0;
          filter: saturate(0.85) contrast(1.03);
        }
        .map-empty {
          min-height: 520px;
          display: grid;
          place-items: center;
          padding: 32px;
          text-align: center;
        }
        .map-empty-inner {
          max-width: 520px;
        }
        .map-empty h3 {
          margin: 8px 0;
          font-size: 24px;
        }
        .map-empty p {
          color: var(--rb-muted);
          line-height: 1.6;
        }
        .map-key-note {
          position: absolute;
          left: 14px;
          bottom: 14px;
          max-width: 420px;
          background: rgba(9, 11, 13, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 10px 12px;
          color: #aab1b6;
          font-size: 11px;
          line-height: 1.45;
          backdrop-filter: blur(8px);
        }
        .map-key-note b {
          color: #fff;
        }
        .open-maps {
          margin: 14px 20px 0;
          display: inline-flex;
        }
        .map-leg-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1px;
          background: var(--rb-line);
          border-top: 1px solid var(--rb-line);
        }
        .map-leg-list button {
          min-width: 0;
          border: 0;
          background: var(--rb-panel);
          color: var(--rb-text);
          padding: 15px 18px;
          text-align: left;
          cursor: pointer;
        }
        .map-leg-list button:hover {
          background: #171b1f;
        }
        .map-leg-list span {
          color: var(--rb-accent);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }
        .map-leg-list b {
          display: block;
          margin: 5px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .map-leg-list small {
          color: var(--rb-muted);
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.72);
          display: grid;
          place-items: center;
          padding: 18px;
          backdrop-filter: blur(7px);
        }
        .ride-modal {
          width: min(650px, 100%);
          max-height: calc(100vh - 36px);
          overflow: auto;
          background: #111416;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 26px;
          position: relative;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
        }
        .modal-close {
          position: absolute;
          right: 14px;
          top: 12px;
          border: 0;
          background: transparent;
          color: #92999e;
          font-size: 28px;
          cursor: pointer;
        }
        .ride-view h2 {
          margin: 8px 0 14px;
          font-size: clamp(25px, 4vw, 38px);
          letter-spacing: -0.035em;
        }
        .ride-view h2 span {
          color: var(--rb-accent);
        }
        .ride-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ride-meta span {
          border: 1px solid var(--rb-line);
          background: var(--rb-panel-2);
          border-radius: 999px;
          padding: 7px 10px;
          color: #cbd0d4;
          font-size: 12px;
        }
        .ride-notes {
          color: #aeb5ba;
          line-height: 1.65;
          white-space: pre-wrap;
        }
        .data-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .data-form label {
          color: #aeb5ba;
          font-size: 12px;
          font-weight: 700;
        }
        .data-form input,
        .data-form textarea {
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          border: 1px solid var(--rb-line);
          background: #0b0d0f;
          color: #fff;
          border-radius: 9px;
          padding: 11px 12px;
          outline: none;
          font: inherit;
        }
        .data-form input:focus,
        .data-form textarea:focus {
          border-color: rgba(255, 106, 26, 0.65);
        }
        .data-form textarea {
          min-height: 110px;
          resize: vertical;
        }
        .data-form .wide {
          grid-column: 1/-1;
        }
        .modal-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }
        .text-button,
        .danger {
          border: 0;
          background: transparent;
          color: #aab1b5;
          cursor: pointer;
          font-weight: 700;
        }
        .danger {
          color: #ff8d67;
        }
        @media (max-width: 900px) {
          .itinerary-hero {
            align-items: flex-start;
            flex-direction: column;
          }
          .itinerary-stats {
            width: 100%;
            min-width: 0;
          }
          .calendar-day,
          .calendar-blank {
            min-height: 100px;
          }
        }
        @media (max-width: 680px) {
          .stop-form-grid {
            grid-template-columns: 1fr;
          }

          .stop-form .wide {
            grid-column: auto;
          }

          .ride-stop-item {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .ride-stop-type {
            width: fit-content;
          }
          .itinerary-page {
            margin: 0 -4px;
          }
          .itinerary-hero {
            margin-bottom: 16px;
          }
          .itinerary-hero h1 {
            font-size: 34px;
          }
          .itinerary-hero .lead {
            font-size: 13px;
          }
          .itinerary-stats {
            grid-template-columns: repeat(3, 1fr);
          }
          .itinerary-stat {
            padding: 10px;
          }
          .itinerary-stat b {
            font-size: 16px;
          }
          .itinerary-stat span {
            font-size: 8px;
            letter-spacing: 0.06em;
          }
          .itinerary-toolbar {
            flex-wrap: wrap;
          }
          .view-switch {
            flex: 1;
          }
          .view-switch button {
            flex: 1;
          }
          .itinerary-toolbar > .button {
            width: auto;
          }
          .calendar-toolbar {
            padding: 14px;
          }
          .calendar-toolbar h2 {
            font-size: 19px;
          }
          .weekday-row span {
            text-align: center;
            padding: 8px 2px;
            font-size: 8px;
          }
          .month-grid {
            gap: 0;
          }
          .calendar-day,
          .calendar-blank {
            min-height: 84px;
          }
          .calendar-day {
            padding: 8px 6px;
          }
          .calendar-day > b {
            font-size: 11px;
            margin-bottom: 7px;
          }
          .calendar-day span {
            font-size: 10px;
            line-height: 1.2;
          }
          .calendar-day span i {
            font-size: 7px;
            margin-bottom: 3px;
          }
          .calendar-day small {
            font-size: 8px;
          }
          .google-map-wrap,
          .google-map,
          .map-empty {
            min-height: 430px;
            height: 430px;
          }
          .google-map {
            height: 430px;
          }
          .map-heading {
            padding: 14px;
            align-items: flex-start;
          }
          .map-heading h2 {
            font-size: 20px;
          }
          .map-heading p {
            font-size: 11px;
          }
          .open-maps {
            margin: 12px 14px 0;
          }
          .data-form {
            grid-template-columns: 1fr;
          }
          .data-form .wide {
            grid-column: auto;
          }
          .ride-modal {
            padding: 22px 18px;
          }
        }
        @media (max-width: 420px) {
          .calendar-day,
          .calendar-blank {
            min-height: 72px;
          }
          .calendar-day {
            padding: 7px 4px;
          }
          .calendar-day span em {
            display: none;
          }
          .calendar-day.has-ride {
            box-shadow: inset 2px 0 0 var(--rb-accent);
          }
          .month-controls button {
            width: 34px;
            height: 34px;
          }
        }
        .ride-stops {
          margin-top: 26px;
          padding-top: 20px;
          border-top: 1px solid var(--rb-line);
        }

        .ride-stops-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }

        .ride-stops-heading h3 {
          margin: 5px 0 0;
          color: var(--rb-text);
          font-size: 16px;
        }

        .ride-stop-count {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          border: 1px solid var(--rb-line);
          border-radius: 50%;
          color: var(--rb-accent);
          font-size: 10px;
          font-weight: 850;
        }

        .ride-stop-item {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: start;
          gap: 11px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
        }

        .ride-stop-item strong {
          display: block;
          color: var(--rb-text);
          font-size: 12px;
        }

        .ride-stop-item small {
          display: block;
          margin-top: 3px;
          color: var(--rb-muted);
          font-size: 10px;
          line-height: 1.4;
        }

        .ride-stop-type {
          min-width: 82px;
          padding: 5px 7px;
          border: 1px solid var(--rb-line);
          border-radius: 999px;
          color: var(--rb-muted);
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-align: center;
          text-transform: uppercase;
        }

        .ride-stop-type.fuel {
          color: #facc15;
          border-color: rgba(250, 204, 21, 0.25);
        }

        .ride-stop-type.food {
          color: #fb923c;
          border-color: rgba(251, 146, 60, 0.25);
        }

        .ride-stop-type.sightseeing {
          color: #60a5fa;
          border-color: rgba(96, 165, 250, 0.25);
        }

        .ride-stop-type.stay {
          color: #c084fc;
          border-color: rgba(192, 132, 252, 0.25);
        }

        .stop-form {
          margin-top: 16px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid var(--rb-line);
          border-radius: 10px;
        }

        .stop-form-grid {
          display: grid;
          grid-template-columns: 0.7fr 1.3fr;
          gap: 10px;
        }

        .stop-form label {
          display: block;
          color: #aeb5ba;
          font-size: 10px;
          font-weight: 700;
        }

        .stop-form input,
        .stop-form select {
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          border: 1px solid var(--rb-line);
          background: #0b0d0f;
          color: #fff;
          border-radius: 8px;
          padding: 9px 10px;
          outline: none;
          font: inherit;
        }

        .stop-form input:focus,
        .stop-form select:focus {
          border-color: rgba(255, 106, 26, 0.65);
        }

        .stop-form select option {
          background: #111416;
          color: #fff;
        }

        .stop-form .wide {
          grid-column: 1 / -1;
        }

        .stop-submit {
          margin-top: 10px;
        }
        .ride-stop-content {
          min-width: 0;
        }

        .ride-stop-actions {
          display: flex;
          gap: 10px;
          margin-top: 7px;
        }

        .ride-stop-actions button,
        .stop-cancel-edit {
          border: 0;
          background: transparent;
          padding: 0;
          color: var(--rb-muted);
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
        }

        .ride-stop-actions button:hover,
        .stop-cancel-edit:hover {
          color: var(--rb-accent);
          text-decoration: underline;
        }

        .ride-stop-actions .stop-delete {
          color: #d87970;
        }

        .ride-stop-actions .stop-delete:hover {
          color: #ff8d67;
        }

        .ride-stop-actions button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .stop-form-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .stop-cancel-edit {
          color: var(--rb-accent);
        }
      `}</style>

      <section className="itinerary-hero">
        <div>
          <p className="eyebrow">THE PLAN</p>
          <h1>Every mile has a story.</h1>
          <p className="lead">
            Plan the ride by date, then switch to Google Maps when you want the
            real road.
          </p>
        </div>
        <div className="itinerary-stats">
          <div className="itinerary-stat">
            <b>{route.length}</b>
            <span>Ride days</span>
          </div>
          <div className="itinerary-stat">
            <b>
              {totalDistance
                ? `${totalDistance.toLocaleString("en-IN")} km`
                : "—"}
            </b>
            <span>Distance</span>
          </div>
          <div className="itinerary-stat">
            <b>{view === "calendar" ? "Calendar" : "Maps"}</b>
            <span>Current view</span>
          </div>
        </div>
      </section>

      <div className="itinerary-toolbar">
        <div className="view-switch" aria-label="Itinerary view">
          <button
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            Calendar
          </button>
          <button
            className={view === "map" ? "active" : ""}
            onClick={() => setView("map")}
          >
            Map
          </button>
        </div>
        <button
          className="button"
          onClick={() => {
            setSelected(null);
            setDraft({
              ...blank,
              day: String(data.itinerary.length + 1),
              sortOrder: String(data.itinerary.length + 1),
            });
            setMode("add");
          }}
        >
          + Add ride day
        </button>
      </div>

      {view === "calendar" ? (
        <section className="calendar-card">
          <div className="calendar-toolbar">
            <div>
              <span className="month-label">YOUR ROADBOOK</span>
              <h2>{monthLabel}</h2>
            </div>
            <div className="month-controls">
              <button
                aria-label="Previous month"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                ←
              </button>
              <button
                aria-label="Next month"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                →
              </button>
            </div>
          </div>
          <div className="weekday-row">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="month-grid">
            {calendar.map((cell, index) =>
              !cell ? (
                <div className="calendar-blank" key={index} />
              ) : (
                <button
                  key={cell.date}
                  className={`calendar-day ${byDate.has(cell.date) ? "has-ride" : ""}`}
                  onClick={() => openDate(cell.date, cell.day)}
                >
                  <b>{cell.day}</b>
                  {byDate.has(cell.date) ? (
                    <span>
                      <i>DAY {byDate.get(cell.date)?.day}</i>
                      {byDate.get(cell.date)?.from || "Start"} <em>→</em>{" "}
                      {byDate.get(cell.date)?.to || "Destination"}
                    </span>
                  ) : (
                    <small>+ Add ride</small>
                  )}
                </button>
              ),
            )}
          </div>
        </section>
      ) : (
        <section className="route-map-card">
          <div className="map-heading">
            <div>
              <span className="month-label">RIDE DAY BY DAY</span>
              <h2>Kerala route</h2>
            </div>

            <p>
              {route.length
                ? `${route.length} ride ${
                    route.length === 1 ? "day" : "days"
                  } planned`
                : "Add your first ride from the calendar"}
            </p>
          </div>

          {route.length ? (
            <>
              <div className="map-route-toolbar">
                <button
                  type="button"
                  className={!activeMapDay ? "active" : ""}
                  onClick={() => setActiveMapDay(null)}
                >
                  <span className="map-day-button-title">FULL TRIP</span>
                  <span className="map-day-button-route">
                    {route[0]?.from} → {route[route.length - 1]?.to}
                  </span>
                </button>
                {mapDays.map((dayInfo) => (
                  <button
                    key={dayInfo.day}
                    type="button"
                    className={activeMapDay === dayInfo.day ? "active" : ""}
                    onClick={() => setActiveMapDay(dayInfo.day)}
                  >
                    <span className="map-day-button-title">{dayInfo.day}</span>

                    <span className="map-day-button-route">
                      {dayInfo.from} → {dayInfo.to}
                    </span>
                  </button>
                ))}
              </div>

              {mapLegs.length ? (
                <ItineraryMap
                  legs={mapLegs}
                  stops={geocodedRoadbookStops}
                  activeDay={activeMapDay}
                />
              ) : (
                <div className="itinerary-map-empty">
                  <span>MAP</span>
                  <h3>Mapping your route…</h3>
                  <p>
                    We're finding the coordinates for your itinerary locations.
                  </p>
                </div>
              )}

              <div className="map-leg-list">
                {route.map((item, index) => (
                  <button
                    key={item.id}
                    className={activeMapDay === item.day ? "active" : ""}
                    onClick={() => {
                      setActiveMapDay(item.day);
                      openItem(item);
                    }}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>

                    <div>
                      <b>
                        {item.from} → {item.to}
                      </b>

                      <small>
                        {item.distanceKm || "—"} km · {item.rideType}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-map">
              <span>✦</span>
              <h3>Your route starts here</h3>
              <p>
                Add dated ride days in Calendar view and they will appear as
                connected destinations here.
              </p>

              <button className="button" onClick={() => setView("calendar")}>
                Open calendar
              </button>
            </div>
          )}
        </section>
      )}

      {mode && (
        <div className="modal-backdrop" onMouseDown={close}>
          <section
            className="ride-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              mode === "add"
                ? "Add ride day"
                : mode === "edit"
                  ? "Edit ride day"
                  : "Ride details"
            }
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" aria-label="Close" onClick={close}>
              ×
            </button>
            {mode === "view" && selected ? (
              <div className="ride-view">
                <p className="eyebrow">
                  DAY {selected.day} ·{" "}
                  {selected.date
                    ? new Date(`${selected.date}T00:00:00`).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "long" },
                      )
                    : "DATE TBD"}
                </p>
                <h2>
                  {selected.from} <span>→</span> {selected.to}
                </h2>
                <div className="ride-meta">
                  <span>{selected.distanceKm || "—"} km</span>
                  <span>{selected.rideType || "Ride day"}</span>
                </div>
                <p className="ride-notes">
                  {selected.notes || "No notes added for this route yet."}
                </p>
                <div className="ride-stops">
                  <div className="ride-stops-heading">
                    <div>
                      <span className="eyebrow">ROAD STOPS</span>
                      <h3>
                        {data.stops.filter((stop) => stop.day === selected.day)
                          .length
                          ? "Stops on this day"
                          : "No stops yet"}
                      </h3>
                    </div>

                    <span className="ride-stop-count">
                      {
                        data.stops.filter((stop) => stop.day === selected.day)
                          .length
                      }
                    </span>
                  </div>

                  {data.stops
                    .filter((stop) => stop.day === selected.day)
                    .sort(
                      (a, b) =>
                        Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
                    )
                    .map((stop) => (
                      <div className="ride-stop-item" key={stop.id}>
                        <span className={`ride-stop-type ${stop.type}`}>
                          {stop.type}
                        </span>

                        <div className="ride-stop-content">
                          <strong>{stop.location}</strong>

                          {stop.notes && <small>{stop.notes}</small>}

                          <div className="ride-stop-actions">
                            <button
                              type="button"
                              onClick={() => editStop(stop)}
                              disabled={stopBusy}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="stop-delete"
                              onClick={() => deleteStop(stop)}
                              disabled={stopBusy}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  <form
                    className="stop-form"
                    onSubmit={selectedStop ? submitStopEdit : submitStop}
                  >
                    <div className="stop-form-heading">
                      <span className="eyebrow">
                        {selectedStop ? "EDIT STOP" : "ADD ROAD STOP"}
                      </span>

                      {selectedStop && (
                        <button
                          type="button"
                          className="stop-cancel-edit"
                          onClick={() => {
                            setSelectedStop(null);

                            setStopDraft({
                              type: "fuel",
                              location: "",
                              notes: "",
                            });
                          }}
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>

                    <div className="stop-form-grid">
                      <label>
                        Stop type
                        <select
                          value={stopDraft.type}
                          onChange={(event) =>
                            setStopDraft({
                              ...stopDraft,
                              type: event.target.value as RoadbookStop["type"],
                            })
                          }
                        >
                          <option value="fuel">Fuel</option>
                          <option value="food">Food</option>
                          <option value="sightseeing">Sightseeing</option>
                          <option value="stay">Stay</option>
                        </select>
                      </label>

                      <label>
                        Location
                        <input
                          required
                          placeholder="e.g. Amboli"
                          value={stopDraft.location}
                          onChange={(event) =>
                            setStopDraft({
                              ...stopDraft,
                              location: event.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="wide">
                        Notes
                        <input
                          placeholder="Optional note"
                          value={stopDraft.notes}
                          onChange={(event) =>
                            setStopDraft({
                              ...stopDraft,
                              notes: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="button stop-submit"
                      disabled={stopBusy}
                    >
                      {stopBusy
                        ? "Saving…"
                        : selectedStop
                          ? "Save stop"
                          : "+ Add stop"}
                    </button>
                  </form>
                </div>
                <div className="modal-actions">
                  <button className="button" onClick={() => setMode("edit")}>
                    Edit ride day
                  </button>
                  <button
                    className="danger"
                    onClick={async () => {
                      if (
                        await save("itinerary", "DELETE", { id: selected.id })
                      )
                        close();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="eyebrow">
                  {mode === "add" ? "NEW RIDE DAY" : "UPDATE ROUTE"}
                </p>
                <h2>{mode === "add" ? "Add ride day" : "Edit ride day"}</h2>
                <form onSubmit={submitStop} className="data-form">
                  <label>
                    Trip day
                    <input
                      required
                      value={draft.day}
                      onChange={(e) =>
                        setDraft({ ...draft, day: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Date
                    <input
                      required
                      type="date"
                      value={draft.date}
                      onChange={(e) =>
                        setDraft({ ...draft, date: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    From
                    <input
                      required
                      value={draft.from}
                      onChange={(e) =>
                        setDraft({ ...draft, from: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    To
                    <input
                      required
                      value={draft.to}
                      onChange={(e) =>
                        setDraft({ ...draft, to: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Distance (km)
                    <input
                      value={draft.distanceKm}
                      onChange={(e) =>
                        setDraft({ ...draft, distanceKm: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Ride type
                    <input
                      value={draft.rideType}
                      onChange={(e) =>
                        setDraft({ ...draft, rideType: e.target.value })
                      }
                    />
                  </label>
                  <label className="wide">
                    Notes
                    <textarea
                      value={draft.notes}
                      onChange={(e) =>
                        setDraft({ ...draft, notes: e.target.value })
                      }
                    />
                  </label>
                  <div className="modal-actions">
                    <button disabled={busy} className="button">
                      {busy
                        ? "Saving…"
                        : mode === "edit"
                          ? "Save changes"
                          : "Add ride day"}
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        mode === "edit" ? setMode("view") : close()
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <PageState>
      <Itinerary />
    </PageState>
  );
}
