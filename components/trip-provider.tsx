"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CollectionName, TripData } from "@/lib/types";

type TripContext = { data: TripData | null; loading: boolean; error: string | null; refresh: () => Promise<void>; save: (collection: CollectionName | "trip", method: "POST" | "PATCH" | "DELETE", body: Record<string, string>) => Promise<boolean> };
const Context = createContext<TripContext | null>(null);
export function TripProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<TripData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { setLoading(true); try { const response = await fetch("/api/data", { cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData(payload); setError(null); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load the planner."); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const save: TripContext["save"] = async (collection, method, body) => { try { const response = await fetch(`/api/${collection}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); await refresh(); return true; } catch (err) { setError(err instanceof Error ? err.message : "Unable to save your change."); return false; } };
  return <Context.Provider value={{ data, loading, error, refresh, save }}>{children}</Context.Provider>;
}
export function useTrip() { const context = useContext(Context); if (!context) throw new Error("useTrip must be used within TripProvider"); return context; }
