"use client";
import { useTrip } from "./trip-provider";
export function PageState({ children }: { children: React.ReactNode }) { const { loading, data, error, refresh } = useTrip(); if (loading) return <div className="state-card">Loading your roadbook…</div>; if (!data) return <div className="state-card"><b>Couldn’t connect to Google Sheets.</b><p>{error || "The planner could not load your trip data."}</p><button className="button" onClick={() => void refresh()}>Try again</button></div>; return <>{children}</>; }
