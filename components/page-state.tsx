"use client";
import { useTrip } from "./trip-provider";
export function PageState({ children }: { children: React.ReactNode }) { const { loading, data } = useTrip(); if (loading) return <div className="state-card">Loading your roadbook…</div>; if (!data) return <div className="state-card">Connect your Google Sheet to begin planning.</div>; return <>{children}</>; }
