"use client";

import Link from "next/link";
import { PageState } from "@/components/page-state";
import { useTrip } from "@/components/trip-provider";

function Dashboard() {
  const { data } = useTrip();

  if (!data) return null;

  const start = data.trip.startDate
    ? new Date(`${data.trip.startDate}T00:00:00`)
    : null;

  const days = start
    ? Math.max(
        0,
        Math.ceil(
          (start.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000,
        ),
      )
    : "—";

  const total = data.expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const packed = data.packing.filter(
    (item) => item.packed === "true",
  ).length;

  const route = [...data.itinerary].sort(
    (a, b) =>
      Number(a.sortOrder || a.day) - Number(b.sortOrder || b.day),
  );

  const next = route[0];

  const budget = Number(data.trip.totalBudget || 0);

  const budgetPct = budget
    ? Math.min(100, Math.round((total / budget) * 100))
    : 0;

  const packingPct = data.packing.length
    ? Math.round((packed / data.packing.length) * 100)
    : 0;

  const remaining = Math.max(0, budget - total);

  return (
    <div className="dashboard-page">
      <style jsx global>{`
        .dashboard-page {
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

        .dashboard-hero {
          position: relative;
          overflow: hidden;
          min-height: 340px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 30px;
          margin-bottom: 12px;
          border: 1px solid var(--rb-line);
          border-radius: 16px;
          background:
            radial-gradient(
              circle at 85% 15%,
              rgba(255, 106, 26, 0.12),
              transparent 32%
            ),
            linear-gradient(145deg, #121619, #0d1012 65%, #090b0d);
        }

        .dashboard-hero::after {
          content: "";
          position: absolute;
          right: -90px;
          bottom: -130px;
          width: 330px;
          height: 330px;
          border: 1px solid rgba(255, 106, 26, 0.12);
          border-radius: 50%;
          box-shadow:
            0 0 0 35px rgba(255, 106, 26, 0.025),
            0 0 0 70px rgba(255, 106, 26, 0.018);
          pointer-events: none;
        }

        .dashboard-kicker {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .eyebrow {
          color: var(--rb-accent);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          border: 1px solid var(--rb-line);
          border-radius: 999px;
          color: #aeb5ba;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .live-pill i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
        }

        .dashboard-hero h1 {
          position: relative;
          z-index: 1;
          margin: 18px 0 10px;
          max-width: 850px;
          font-size: clamp(42px, 7vw, 78px);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .dashboard-hero h1 em {
          color: var(--rb-accent);
          font-style: normal;
        }

        .hero-copy {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0;
          color: var(--rb-muted);
          font-size: 14px;
          line-height: 1.65;
        }

        .hero-bottom {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 24px;
          margin-top: 32px;
        }

        .countdown-big {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .countdown-big b {
          font-size: 58px;
          line-height: 0.9;
          letter-spacing: -0.06em;
        }

        .countdown-big span {
          color: var(--rb-muted);
          font-size: 9px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: 0.13em;
        }

        .departure {
          padding-left: 24px;
          border-left: 1px solid var(--rb-line);
        }

        .departure small {
          display: block;
          margin-bottom: 5px;
          color: #687178;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .departure strong {
          font-size: 14px;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-radius: 9px;
          background: var(--rb-accent);
          color: #111;
          padding: 11px 15px;
          font-weight: 850;
          text-decoration: none;
          cursor: pointer;
        }

        .hero-button {
          margin-left: auto;
        }

        .dashboard-stat-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }

        .dashboard-stat {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
          padding: 16px;
          background: var(--rb-panel);
          border: 1px solid var(--rb-line);
          border-radius: 12px;
        }

        .stat-icon {
          display: grid;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 1px solid var(--rb-line);
          border-radius: 9px;
          background: var(--rb-panel-2);
          color: var(--rb-accent);
          font-size: 14px;
          font-weight: 800;
        }

        .dashboard-stat b {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 19px;
          letter-spacing: -0.02em;
        }

        .dashboard-stat b i {
          color: #626b71;
          font-size: 12px;
          font-style: normal;
        }

        .dashboard-stat small {
          display: block;
          margin-top: 3px;
          color: var(--rb-muted);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .dashboard-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.85fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .dashboard-card {
          background: var(--rb-panel);
          border: 1px solid var(--rb-line);
          border-radius: 16px;
          overflow: hidden;
        }

        .card-inner {
          padding: 22px;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .day-badge {
          padding: 6px 9px;
          border: 1px solid rgba(255, 106, 26, 0.22);
          border-radius: 999px;
          background: var(--rb-accent-soft);
          color: var(--rb-accent);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .route-big {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: center;
          gap: 14px;
          margin: 32px 0 20px;
        }

        .route-big strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: clamp(24px, 3vw, 38px);
          letter-spacing: -0.045em;
        }

        .route-big strong:last-child {
          text-align: right;
        }

        .route-big span {
          color: var(--rb-accent);
          font-size: 25px;
        }

        .route-description {
          min-height: 45px;
          margin: 0;
          color: var(--rb-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .route-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .route-meta span {
          padding: 7px 10px;
          border: 1px solid var(--rb-line);
          border-radius: 999px;
          background: var(--rb-panel-2);
          color: #cbd0d4;
          font-size: 11px;
        }

        .text-link {
          display: inline-flex;
          gap: 8px;
          margin-top: 22px;
          color: var(--rb-accent);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .readiness-card {
          padding: 22px;
        }

        .readiness-ring-wrap {
          display: grid;
          place-items: center;
          margin: 25px 0 20px;
        }

        .progress-ring {
          width: 150px;
          height: 150px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: conic-gradient(
            var(--rb-accent) var(--progress),
            #252a2e 0
          );
          position: relative;
        }

        .progress-ring::before {
          content: "";
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          background: var(--rb-panel);
        }

        .progress-ring > div {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .progress-ring b {
          display: block;
          font-size: 28px;
          letter-spacing: -0.04em;
        }

        .progress-ring small {
          color: var(--rb-muted);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .readiness-card h2 {
          margin: 0 0 6px;
          font-size: 18px;
          letter-spacing: -0.02em;
        }

        .readiness-card p {
          margin: 0 0 18px;
          color: var(--rb-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .dark-button {
          width: 100%;
          box-sizing: border-box;
          background: var(--rb-panel-2);
          border: 1px solid var(--rb-line);
          color: #fff;
        }

        .dashboard-bottom-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
          gap: 12px;
        }

        .budget-card {
          padding: 22px;
        }

        .budget-percentage {
          color: var(--rb-muted);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .money-line {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin: 22px 0 13px;
        }

        .money-line b {
          font-size: 34px;
          letter-spacing: -0.04em;
        }

        .money-line span {
          color: var(--rb-muted);
          font-size: 12px;
        }

        .meter {
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: #252a2e;
        }

        .meter i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--rb-accent);
        }

        .budget-foot {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin-top: 14px;
          color: var(--rb-muted);
          font-size: 11px;
        }

        .budget-foot strong {
          color: #fff;
        }

        .budget-foot a {
          margin-left: auto;
          color: var(--rb-accent);
          font-weight: 800;
          text-decoration: none;
        }

        .quote-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 170px;
          padding: 22px;
          overflow: hidden;
          background:
            linear-gradient(
              145deg,
              rgba(255, 106, 26, 0.1),
              transparent 60%
            ),
            var(--rb-panel);
          border: 1px solid var(--rb-line);
          border-radius: 16px;
        }

        .quote-card > span {
          position: absolute;
          top: -20px;
          left: 18px;
          color: rgba(255, 106, 26, 0.13);
          font-family: Georgia, serif;
          font-size: 130px;
          line-height: 1;
        }

        .quote-card p {
          position: relative;
          z-index: 1;
          max-width: 420px;
          margin: 0 0 14px;
          font-size: 17px;
          line-height: 1.45;
          letter-spacing: -0.015em;
        }

        .quote-card small {
          color: var(--rb-accent);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        @media (max-width: 900px) {
          .dashboard-main-grid,
          .dashboard-bottom-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-stat-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .dashboard-hero {
            min-height: 390px;
            padding: 20px;
          }

          .dashboard-hero h1 {
            font-size: 43px;
          }

          .hero-bottom {
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 18px;
          }

          .hero-button {
            width: 100%;
            margin-left: 0;
          }

          .countdown-big b {
            font-size: 48px;
          }

          .departure {
            padding-left: 18px;
          }

          .dashboard-stat {
            padding: 13px;
          }

          .dashboard-stat b {
            font-size: 16px;
          }

          .route-big {
            gap: 8px;
          }

          .route-big strong {
            font-size: 22px;
          }

          .card-inner,
          .readiness-card,
          .budget-card {
            padding: 18px;
          }

          .budget-foot a {
            width: 100%;
            margin-left: 0;
          }
        }

        @media (max-width: 420px) {
          .dashboard-stat-strip {
            gap: 6px;
          }

          .dashboard-stat {
            gap: 8px;
            padding: 10px;
          }

          .stat-icon {
            flex-basis: 28px;
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          .dashboard-stat b {
            font-size: 14px;
          }

          .dashboard-stat small {
            font-size: 8px;
          }

          .route-big strong {
            font-size: 19px;
          }

          .route-big span {
            font-size: 18px;
          }
        }
      `}</style>

      <section className="dashboard-hero">
        <div>
          <div className="dashboard-kicker">
            <span className="eyebrow">SOUTH INDIA · ON TWO WHEELS</span>
            <span className="live-pill">
              <i />
              ROADBOOK LIVE
            </span>
          </div>

          <h1>
            Chase the <em>monsoon.</em>
          </h1>

          <p className="hero-copy">
            One calm place for the route, the checklist, the costs and
            everything you need before the wheels roll.
          </p>
        </div>

        <div className="hero-bottom">
          <div className="countdown-big">
            <b>{days}</b>
            <span>
              DAYS
              <br />
              TO GO
            </span>
          </div>

          <div className="departure">
            <small>DEPARTURE</small>
            <strong>
              {data.trip.startDate
                ? new Date(
                    `${data.trip.startDate}T00:00:00`,
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Set a date"}
            </strong>
          </div>

          <Link href="/itinerary" className="button hero-button">
            Open itinerary <span>↗</span>
          </Link>
        </div>
      </section>

      <section className="dashboard-stat-strip">
        <article className="dashboard-stat">
          <span className="stat-icon">↗</span>
          <div>
            <b>{data.itinerary.length}</b>
            <small>ROUTE DAYS</small>
          </div>
        </article>

        <article className="dashboard-stat">
          <span className="stat-icon">✓</span>
          <div>
            <b>
              {packed}
              <i>/{data.packing.length}</i>
            </b>
            <small>PACKED</small>
          </div>
        </article>

        <article className="dashboard-stat">
          <span className="stat-icon">₹</span>
          <div>
            <b>₹{total.toLocaleString("en-IN")}</b>
            <small>SPENT</small>
          </div>
        </article>

        <article className="dashboard-stat">
          <span className="stat-icon">◌</span>
          <div>
            <b>₹{budget.toLocaleString("en-IN")}</b>
            <small>BUDGET</small>
          </div>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-card">
          <div className="card-inner">
            <div className="card-top">
              <span className="eyebrow">NEXT ON THE ROAD</span>
              <span className="day-badge">
                {next ? `DAY ${next.day}` : "DAY —"}
              </span>
            </div>

            <div className="route-big">
              {next ? (
                <>
                  <strong>{next.from}</strong>
                  <span>→</span>
                  <strong>{next.to}</strong>
                </>
              ) : (
                <strong>Add your first ride day</strong>
              )}
            </div>

            <p className="route-description">
              {next?.notes ||
                "Your next route will appear here once you add a dated ride day."}
            </p>

            <div className="route-meta">
              <span>◷ {next?.rideType || "Ride day"}</span>
              <span>⌁ {next?.distanceKm || "—"} km</span>
              {next?.date ? (
                <span>
                  ◷{" "}
                  {new Date(
                    `${next.date}T00:00:00`,
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              ) : null}
            </div>

            <Link href="/itinerary" className="text-link">
              View route details <span>→</span>
            </Link>
          </div>
        </article>

        <article className="dashboard-card readiness-card">
          <div className="card-top">
            <span className="eyebrow">TRIP READINESS</span>
            <span className="budget-percentage">{packingPct}%</span>
          </div>

          <div className="readiness-ring-wrap">
            <div
              className="progress-ring"
              style={
                {
                  "--progress": `${packingPct * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <div>
                <b>{packingPct}%</b>
                <small>READY</small>
              </div>
            </div>
          </div>

          <h2>
            {data.packing.length - packed} things left to pack
          </h2>

          <p>Get the essentials sorted before departure day.</p>

          <Link href="/packing" className="button dark-button">
            Open packing list <span>→</span>
          </Link>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-card budget-card">
          <div className="card-top">
            <span className="eyebrow">SPEND TRACKER</span>
            <span className="budget-percentage">
              {budgetPct}% OF BUDGET
            </span>
          </div>

          <div className="money-line">
            <b>₹{total.toLocaleString("en-IN")}</b>
            <span>of ₹{budget.toLocaleString("en-IN")}</span>
          </div>

          <div className="meter">
            <i style={{ width: `${budgetPct}%` }} />
          </div>

          <div className="budget-foot">
            <span>Remaining</span>
            <strong>₹{remaining.toLocaleString("en-IN")}</strong>
            <Link href="/expenses">Manage expenses →</Link>
          </div>
        </article>

        <article className="quote-card">
          <span>“</span>
          <p>
            Good trips are planned. Great trips leave room for the road
            to surprise you.
          </p>
          <small>— YOUR ROADBOOK</small>
        </article>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <PageState>
      <Dashboard />
    </PageState>
  );
}