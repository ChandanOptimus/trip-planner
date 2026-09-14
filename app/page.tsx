"use client";
import Link from "next/link";
import { PageState } from "@/components/page-state";
import { useTrip } from "@/components/trip-provider";

function Dashboard() {
  const { data } = useTrip();
  if (!data) return null;
  const start = data.trip.startDate ? new Date(`${data.trip.startDate}T00:00:00`) : null;
  const days = start ? Math.max(0, Math.ceil((start.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)) : "—";
  const total = data.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const packed = data.packing.filter((item) => item.packed === "true").length;
  const next = [...data.itinerary].sort((a, b) => Number(a.sortOrder || a.day) - Number(b.sortOrder || b.day))[0];
  const budget = Number(data.trip.totalBudget || 0);
  const budgetPct = budget ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  const packingPct = data.packing.length ? Math.round((packed / data.packing.length) * 100) : 0;

  return <div className="dashboard-page">
    <section className="dash-hero">
      <div className="hero-kicker"><span className="eyebrow">SOUTH INDIA · ON TWO WHEELS</span><span className="live-pill"><i /> ROADBOOK LIVE</span></div>
      <h1>Chase the <em>monsoon.</em></h1>
      <p className="hero-copy">One calm place for the route, the checklist, the costs and everything you need before the wheels roll.</p>
      <div className="hero-bottom">
        <div className="countdown-big"><b>{days}</b><span>DAYS<br/>TO GO</span></div>
        <div className="departure"><small>DEPARTURE</small><strong>{data.trip.startDate ? new Date(`${data.trip.startDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Set a date"}</strong></div>
        <Link href="/itinerary" className="button hero-button">Open itinerary <span>↗</span></Link>
      </div>
    </section>

    <section className="stat-strip">
      <article><span className="stat-icon">↗</span><div><b>{data.itinerary.length}</b><small>ROUTE DAYS</small></div></article>
      <article><span className="stat-icon">✓</span><div><b>{packed}<i>/{data.packing.length}</i></b><small>PACKED</small></div></article>
      <article><span className="stat-icon">₹</span><div><b>₹{total.toLocaleString("en-IN")}</b><small>SPENT</small></div></article>
      <article><span className="stat-icon">◌</span><div><b>₹{budget.toLocaleString("en-IN")}</b><small>BUDGET</small></div></article>
    </section>

    <section className="dashboard-grid dashboard-grid-new">
      <article className="next-card">
        <div className="card-top"><span className="eyebrow">NEXT ON THE ROAD</span><span className="day-badge">{next ? `DAY ${next.day}` : "DAY —"}</span></div>
        <div className="route-big">{next ? <><strong>{next.from}</strong><span>→</span><strong>{next.to}</strong></> : <strong>Add your first ride day</strong>}</div>
        <p>{next?.notes || "Your next route will appear here once you add a dated ride day."}</p>
        <div className="route-meta"><span>◷ {next?.rideType || "Ride day"}</span><span>⌁ {next?.distanceKm || "—"} km</span></div>
        <Link href="/itinerary" className="text-link">View route details <span>→</span></Link>
      </article>
      <article className="progress-card">
        <div className="card-top"><span className="eyebrow">TRIP READINESS</span><span>{packingPct}%</span></div>
        <div className="progress-ring" style={{ "--progress": `${packingPct * 3.6}deg` } as React.CSSProperties}><div><b>{packingPct}%</b><small>READY</small></div></div>
        <h2>{data.packing.length - packed} things left to pack</h2>
        <p>Get the essentials sorted before departure day.</p>
        <Link href="/packing" className="button dark-button">Open packing list <span>→</span></Link>
      </article>
    </section>

    <section className="bottom-grid">
      <article className="budget-card">
        <div className="card-top"><span className="eyebrow">SPEND TRACKER</span><span>{budgetPct}% OF BUDGET</span></div>
        <div className="money-line"><b>₹{total.toLocaleString("en-IN")}</b><span>of ₹{budget.toLocaleString("en-IN")}</span></div>
        <div className="meter"><i style={{ width: `${budgetPct}%` }} /></div>
        <div className="budget-foot"><span>Remaining</span><strong>₹{Math.max(0, budget - total).toLocaleString("en-IN")}</strong><Link href="/expenses">Manage expenses →</Link></div>
      </article>
      <article className="quote-card"><span>“</span><p>Good trips are planned. Great trips leave room for the road to surprise you.</p><small>— YOUR ROADBOOK</small></article>
    </section>
  </div>;
}
export default function Home() { return <PageState><Dashboard /></PageState>; }
