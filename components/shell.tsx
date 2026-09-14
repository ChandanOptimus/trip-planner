"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TripProvider, useTrip } from "./trip-provider";
const links = [["/", "Dashboard"], ["/itinerary", "Itinerary"], ["/packing", "Packing"], ["/expenses", "Expenses"], ["/ride-prep", "Ride prep"]];
function Frame({ children }: { children: React.ReactNode }) { const path = usePathname(); const { error, loading } = useTrip(); return <><header className="site-header"><Link href="/" className="brand"><span>✦</span> KERALA ROADBOOK</Link><nav>{links.map(([href, label]) => <Link key={href} href={href} className={path === href ? "active" : ""}>{label}</Link>)}</nav><span className="sync-state">{loading ? "Syncing…" : "Google Sheets"}</span></header>{error && <div className="error-banner">{error}</div>}<main className="page-wrap">{children}</main><footer><span>MADE FOR THE OPEN ROAD</span><span>KERALA / 2026</span></footer></>; }
export function AppShell({ children }: { children: React.ReactNode }) { return <TripProvider><Frame>{children}</Frame></TripProvider>; }
