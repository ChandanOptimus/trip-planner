"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TripProvider, useTrip } from "./trip-provider";

const links = [
  ["/", "Dashboard", "⌂"],
  ["/itinerary", "Itinerary", "↗"],
  ["/packing", "Packing", "✓"],
  ["/expenses", "Expenses", "₹"],
  ["/ride-prep", "Ride prep", "⚙"],
] as const;

function Frame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { error, loading, data } = useTrip();
  const tripName = data?.trip.name || "Kerala Roadbook";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">KR</span>
          <span>
            <strong>KERALA</strong>
            <small>ROADBOOK</small>
          </span>
        </Link>
        <div className="sidebar-section-label">TRIP CONTROL</div>
        <nav className="side-nav">
          {links.map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "active" : ""}
            >
              <span className="nav-icon">{icon}</span>

              <span className="nav-label">{label}</span>

              {path === href && <span className="nav-active-marker" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trip-mini-card">
            <span className={`status-dot ${loading ? "syncing" : ""}`} />

            <div>
              <small>SYNC STATUS</small>

              <b>{loading ? "Syncing…" : "Google Sheets"}</b>
            </div>

            <span className="sync-state">{loading ? "SYNC" : "LIVE"}</span>
          </div>
          <div className="sidebar-trip">
            <small>CURRENT TRIP</small>
            <b>{tripName}</b>
            <span>South India · 2026</span>
          </div>
        </div>
      </aside>
      <nav className="mobile-nav">
        {links.map(([href, label, icon]) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "active" : ""}
          >
            <span className="mobile-nav-icon">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">KR</span>
            <b>ROADBOOK</b>
          </div>
          <div className="topbar-context">
            <span>PERSONAL TRIP PLANNER</span>
            <b>
              {path === "/"
                ? "Dashboard"
                : links.find(([href]) => href === path)?.[1]}
            </b>
          </div>
          <div className="topbar-status">
            <span className="status-dot" /> {loading ? "Syncing" : "Synced"}
          </div>
        </header>
        {error && (
          <div className="error-banner">
            <span>!</span>
            {error}
          </div>
        )}
        <main className="page-wrap">{children}</main>
        <footer>
          <span>KERALA ROADBOOK</span>
          <span>MADE FOR THE OPEN ROAD · 2026</span>
        </footer>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TripProvider>
      <Frame>{children}</Frame>
    </TripProvider>
  );
}
