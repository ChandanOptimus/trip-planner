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

  const route = [...data.itinerary].sort(
    (a, b) => Number(a.sortOrder || a.day) - Number(b.sortOrder || b.day),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const total = data.expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const packed = data.packing.filter((item) => item.packed === "true").length;

  const totalDistance = data.itinerary.reduce(
    (sum, item) => sum + Number(item.distanceKm || 0),
    0,
  );

  const budget = Number(data.trip.totalBudget || 0);

  const remaining = budget - total;

  const budgetPct = budget
    ? Math.min(100, Math.round((total / budget) * 100))
    : 0;
  const budgetStatus = !budget
    ? "unset"
    : remaining < 0
      ? "over"
      : budgetPct >= 85
        ? "warning"
        : "healthy";

  const budgetStatusLabel =
    budgetStatus === "unset"
      ? "BUDGET NOT SET"
      : budgetStatus === "over"
        ? "OVER BUDGET"
        : budgetStatus === "warning"
          ? "NEAR LIMIT"
          : "ON TRACK";

  const budgetStatusText =
    budgetStatus === "unset"
      ? "Set a trip budget to keep your spending under control."
      : budgetStatus === "over"
        ? `You're ₹${Math.abs(remaining).toLocaleString(
            "en-IN",
          )} over your planned budget.`
        : budgetStatus === "warning"
          ? `Only ₹${remaining.toLocaleString(
              "en-IN",
            )} remains in your trip budget.`
          : `₹${remaining.toLocaleString("en-IN")} remains for the trip.`;
  const packingPct = data.packing.length
    ? Math.round((packed / data.packing.length) * 100)
    : 0;
  const packingRemaining = data.packing.length - packed;

  const prepTotal = data.ridePrep.length;

  const prepDone = data.ridePrep.filter(
    (item) => item.checked === "true",
  ).length;

  const prepPct = prepTotal ? Math.round((prepDone / prepTotal) * 100) : 0;

  const prepRemaining = prepTotal - prepDone;

  const hasRoute = data.itinerary.length > 0;

  const hasStops = data.stops.length > 0;

  const hasBudget = budget > 0;

  const readinessChecks = [
    {
      label: "Route planned",
      done: hasRoute,
    },
    {
      label: "Trip date set",
      done: Boolean(data.trip.startDate),
    },
    {
      label: "Budget set",
      done: hasBudget,
    },
    {
      label: "Packing",
      done: data.packing.length > 0 && packingRemaining === 0,
    },
    {
      label: "Ride prep",
      done: prepTotal > 0 && prepRemaining === 0,
    },
  ];

  const readinessDone = readinessChecks.filter((item) => item.done).length;

  const readinessPct = Math.round(
    (readinessDone / readinessChecks.length) * 100,
  );
  let attentionTitle = "Everything looks good.";
  let attentionText = "Your roadbook is in good shape.";
  let attentionHref = "/itinerary";
  let attentionAction = "Review itinerary";

  if (!data.trip.startDate) {
    attentionTitle = "Set your departure date.";
    attentionText = "Your countdown can't start until the trip date is set.";
    attentionHref = "/ride-prep";
    attentionAction = "Set trip date";
  } else if (!hasRoute) {
    attentionTitle = "Plan your route.";
    attentionText = "Add your first ride day to start building the roadbook.";
    attentionHref = "/itinerary";
    attentionAction = "Plan itinerary";
  } else if (packingRemaining > 0) {
    attentionTitle = `${packingRemaining} ${packingRemaining === 1 ? "item" : "items"} still to pack.`;
    attentionText = "Get the essentials sorted before you hit the road.";
    attentionHref = "/packing";
    attentionAction = "Open packing";
  } else if (prepRemaining > 0) {
    attentionTitle = `${prepRemaining} ride prep ${prepRemaining === 1 ? "task" : "tasks"} remaining.`;
    attentionText =
      "Finish your safety and motorcycle checks before departure.";
    attentionHref = "/ride-prep";
    attentionAction = "Finish ride prep";
  } else if (!hasBudget) {
    attentionTitle = "Set your trip budget.";
    attentionText = "A budget makes the expense tracker much more useful.";
    attentionHref = "/ride-prep";
    attentionAction = "Set budget";
  } else if (budget > 0 && remaining < 0) {
    attentionTitle = "You're over budget.";
    attentionText = `You've spent ₹${Math.abs(remaining).toLocaleString("en-IN")} more than planned.`;
    attentionHref = "/expenses";
    attentionAction = "Review expenses";
  } else if (!hasStops) {
    attentionTitle = "Add a few road stops.";
    attentionText =
      "Fuel, food and sightseeing stops will make the route more useful.";
    attentionHref = "/itinerary";
    attentionAction = "Add stops";
  }
  const startDate = data.trip.startDate
    ? new Date(`${data.trip.startDate}T00:00:00`)
    : null;

  const daysToDeparture = startDate
    ? Math.ceil((startDate.getTime() - today.getTime()) / 86400000)
    : null;

  /*
   * Find the first ride day that is today or still upcoming.
   * If the entire trip is already in the past, fall back
   * to the final planned ride day.
   */
  const upcomingRoute =
    route.find((item) => {
      if (!item.date) return false;

      const rideDate = new Date(`${item.date}T00:00:00`);

      return rideDate >= today;
    }) ?? route[route.length - 1];

  const nextDayItems = upcomingRoute
    ? route.filter((item) => item.day === upcomingRoute.day)
    : [];

  const nextRouteStart = nextDayItems[0]?.from ?? upcomingRoute?.from ?? "";

  const nextRouteEnd =
    nextDayItems[nextDayItems.length - 1]?.to ?? upcomingRoute?.to ?? "";

  const nextStops = upcomingRoute
    ? data.stops.filter((stop) => stop.day === upcomingRoute.day)
    : [];
  const nextDayDistance = nextDayItems.reduce(
    (sum, item) => sum + Number(item.distanceKm || 0),
    0,
  );

  const nextDayRideTypes = [
    ...new Set(nextDayItems.map((item) => item.rideType).filter(Boolean)),
  ];

  const nextDayNotes = nextDayItems.map((item) => item.notes).filter(Boolean);

  const nextDayStopCount = nextStops.length;
  const nextRideDate = upcomingRoute?.date
    ? new Date(`${upcomingRoute.date}T00:00:00`)
    : null;

  const nextRideIsToday = nextRideDate?.getTime() === today.getTime();

  const tripHasStarted =
    startDate !== null && startDate.getTime() <= today.getTime();
  const stopCounts = data.stops.reduce<Record<string, number>>((all, stop) => {
    all[stop.type] = (all[stop.type] || 0) + 1;
    return all;
  }, {});
  const tripDays = Array.from(
    new Set(route.filter((item) => item.day).map((item) => item.day)),
  );

  const totalTripDays = tripDays.length;

  const completedTripDays =
    route.filter((item) => {
      if (!item.date) return false;

      const rideDate = new Date(`${item.date}T00:00:00`);

      return rideDate < today;
    }).length > 0
      ? new Set(
          route
            .filter((item) => {
              if (!item.date) return false;

              const rideDate = new Date(`${item.date}T00:00:00`);

              return rideDate < today;
            })
            .map((item) => item.day),
        ).size
      : 0;

  const completedDistance = route.reduce((sum, item) => {
    if (!item.date) return sum;

    const rideDate = new Date(`${item.date}T00:00:00`);

    return rideDate < today ? sum + Number(item.distanceKm || 0) : sum;
  }, 0);

  const remainingDistance = Math.max(0, totalDistance - completedDistance);

  const tripProgressPct =
    totalTripDays === 0
      ? 0
      : !startDate
        ? 0
        : today < startDate
          ? 0
          : completedTripDays >= totalTripDays
            ? 100
            : Math.round((completedTripDays / totalTripDays) * 100);

  const expenseCompletedDays = route
    .filter((item) => {
      if (!item.date) return false;

      const rideDate = new Date(`${item.date}T00:00:00`);

      return rideDate < today;
    })
    .reduce((days, item) => {
      days.add(item.day);
      return days;
    }, new Set<string>()).size;

  const averageDailySpend =
    expenseCompletedDays > 0 ? total / expenseCompletedDays : 0;

  const projectedTripSpend =
    expenseCompletedDays > 0 && totalTripDays > 0
      ? averageDailySpend * totalTripDays
      : 0;

  const spendingPace =
    !budget || projectedTripSpend === 0
      ? "unset"
      : projectedTripSpend > budget
        ? "risk"
        : projectedTripSpend >= budget * 0.85
          ? "warning"
          : "healthy";

  const spendingPaceLabel =
    spendingPace === "unset"
      ? "PACE UNAVAILABLE"
      : spendingPace === "risk"
        ? "PACE: OVER BUDGET"
        : spendingPace === "warning"
          ? "PACE: TIGHT"
          : "PACE: HEALTHY";
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
            linear-gradient(145deg, rgba(255, 106, 26, 0.1), transparent 60%),
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
        .dashboard-stop-summary {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .dashboard-stop-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .dashboard-stop-heading > span:last-child {
          display: grid;
          place-items: center;
          min-width: 28px;
          height: 24px;
          padding: 0 7px;
          border: 1px solid rgba(255, 106, 26, 0.25);
          border-radius: 999px;
          background: rgba(255, 106, 26, 0.07);
          color: var(--rb-accent, #ff6a1a);
          font-size: 10px;
          font-weight: 800;
        }

        .dashboard-stop-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 13px;
        }

        .dashboard-stop {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dashboard-stop-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }

        .dashboard-stop-dot.fuel {
          background: #facc15;
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.1);
        }

        .dashboard-stop-dot.food {
          background: #fb923c;
          box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
        }

        .dashboard-stop-dot.sightseeing {
          background: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }

        .dashboard-stop-dot.stay {
          background: #c084fc;
          box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.1);
        }

        .dashboard-stop div {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .dashboard-stop strong {
          overflow: hidden;
          color: #dfe3e5;
          font-size: 11px;
          font-weight: 650;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dashboard-stop small {
          overflow: hidden;
          color: #6f787f;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dashboard-more-stops {
          margin-left: 18px;
          color: #687178;
          font-size: 9px;
        }

        .dashboard-no-stops {
          margin-top: 12px;
          color: #687178;
          font-size: 10px;
        }
        .stat-strip article b {
          color: var(--rb-accent);
        }
        .dashboard-readiness-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 18px 0;
        }

        .dashboard-readiness-item {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #a2a9ae;
          font-size: 11px;
        }

        .dashboard-readiness-item > span {
          display: grid;
          place-items: center;
          width: 19px;
          height: 19px;
          flex: 0 0 19px;
          border: 1px solid rgba(255, 106, 26, 0.35);
          border-radius: 50%;
          color: var(--rb-accent);
          font-size: 9px;
          font-weight: 900;
        }

        .dashboard-readiness-item.done {
          color: #dfe3e5;
        }

        .dashboard-readiness-item.done > span {
          border-color: rgba(34, 197, 94, 0.4);
          color: #22c55e;
          background: rgba(34, 197, 94, 0.08);
        }

        .dashboard-readiness-actions {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .dashboard-attention-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          padding: 18px 20px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 106, 26, 0.08),
              rgba(255, 106, 26, 0.025)
            ),
            var(--rb-panel);
          border: 1px solid rgba(255, 106, 26, 0.18);
          border-radius: 16px;
        }

        .dashboard-attention-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255, 106, 26, 0.35);
          border-radius: 50%;
          background: rgba(255, 106, 26, 0.1);
          color: var(--rb-accent);
          font-size: 15px;
          font-weight: 900;
        }

        .dashboard-attention-copy {
          min-width: 0;
        }

        .dashboard-attention-copy h2 {
          margin: 4px 0 3px;
          color: var(--rb-text);
          font-size: 17px;
          letter-spacing: -0.02em;
        }

        .dashboard-attention-copy p {
          margin: 0;
          color: var(--rb-muted);
          font-size: 11px;
          line-height: 1.5;
        }

        .dashboard-attention-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--rb-accent);
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }

        .dashboard-attention-action:hover {
          text-decoration: underline;
        }

        @media (max-width: 700px) {
          .dashboard-attention-card {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .dashboard-attention-action {
            grid-column: 2;
          }
        }
        .budget-status {
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.1em;
        }

        .budget-status.healthy {
          color: #22c55e;
        }

        .budget-status.warning {
          color: #facc15;
        }

        .budget-status.over {
          color: #ef4444;
        }

        .budget-status.unset {
          color: var(--rb-muted);
        }

        .budget-message {
          margin-top: 14px;
          padding-top: 13px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--rb-muted);
          font-size: 10px;
          line-height: 1.5;
        }

        .budget-message.warning {
          color: #d7c77a;
        }

        .budget-message.over {
          color: #e58b8b;
        }

        .budget-message.unset {
          color: var(--rb-muted);
        }

        .budget-message a {
          margin-left: 8px;
          color: var(--rb-accent);
          font-weight: 800;
          text-decoration: none;
        }

        .budget-message a:hover {
          text-decoration: underline;
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
            {daysToDeparture === null ? (
              <Link href="/ride-prep" className="countdown-set-date">
                <b>+</b>
                <span>SET DATE</span>
              </Link>
            ) : (
              <>
                <b>{daysToDeparture > 0 ? daysToDeparture : "ON"}</b>

                <span>{daysToDeparture > 0 ? "DAYS TO GO" : "THE ROAD"}</span>
              </>
            )}
          </div>

          <div className="departure">
            <div className="departure">
              <small>{tripHasStarted ? "TRIP STARTED" : "DEPARTURE"}</small>

              <strong>
                {data.trip.startDate ? (
                  new Date(
                    `${data.trip.startDate}T00:00:00`,
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                ) : (
                  <Link href="/ride-prep" className="departure-set-date">
                    Set a date →
                  </Link>
                )}
              </strong>
            </div>
          </div>

          <Link href="/itinerary" className="button hero-button">
            Open itinerary <span>↗</span>
          </Link>
        </div>
      </section>

      <section className="stat-strip">
        <article>
          <span className="stat-icon">↗</span>
          <div>
            <b>{route.length}</b>
            <small>RIDE DAYS</small>
          </div>
        </article>

        <article>
          <span className="stat-icon">⌁</span>
          <div>
            <b>
              {totalDistance
                ? `${totalDistance.toLocaleString("en-IN")} km`
                : "—"}
            </b>
            <small>ROAD DISTANCE</small>
          </div>
        </article>

        <article>
          <span className="stat-icon">◉</span>
          <div>
            <b>{data.stops.length}</b>
            <small>ROAD STOPS</small>
          </div>
        </article>

        <article>
          <span className="stat-icon">₹</span>
          <div>
            <b>₹{total.toLocaleString("en-IN")}</b>
            <small>SPENT</small>
          </div>
        </article>
      </section>
      <section className="dashboard-trip-progress">
        <div className="dashboard-trip-progress-top">
          <div>
            <span className="eyebrow">TRIP PROGRESS</span>

            <h2>
              {totalTripDays > 0
                ? `DAY ${Math.min(
                    completedTripDays + 1,
                    totalTripDays,
                  )} OF ${totalTripDays}`
                : "NO ROUTE PLANNED"}
            </h2>
          </div>

          <strong>{tripProgressPct}%</strong>
        </div>

        <div className="dashboard-trip-progress-bar">
          <i
            style={{
              width: `${tripProgressPct}%`,
            }}
          />
        </div>

        <div className="dashboard-trip-progress-meta">
          <span>
            {Math.round(completedDistance).toLocaleString("en-IN")} km ridden
          </span>

          <span>
            {Math.round(remainingDistance).toLocaleString("en-IN")} km remaining
          </span>
        </div>
      </section>
      <section className="dashboard-main-grid">
        <article className="dashboard-card">
          <div className="card-inner">
            <div className="card-top">
              <span className="eyebrow">NEXT ON THE ROAD</span>
              <span className="day-badge">
                {upcomingRoute
                  ? nextRideIsToday
                    ? "TODAY"
                    : `DAY ${upcomingRoute.day}`
                  : "DAY —"}
              </span>
            </div>

            <div className="route-big">
              {upcomingRoute ? (
                <>
                  <strong>{nextRouteStart}</strong>
                  <span>→</span>
                  <strong>{nextRouteEnd}</strong>
                </>
              ) : (
                <strong>Add your first ride day</strong>
              )}
            </div>
            <div className="dashboard-route-intelligence">
              <div>
                <span>DISTANCE</span>
                <strong>{Math.round(nextDayDistance)} km</strong>
              </div>

              <div>
                <span>STOPS</span>
                <strong>{nextDayStopCount}</strong>
              </div>

              <div>
                <span>RIDE TYPE</span>
                <strong>
                  {nextDayRideTypes.length ? nextDayRideTypes.join(" · ") : "—"}
                </strong>
              </div>
            </div>
            <p>
              {upcomingRoute?.notes ||
                "Your next ride details will appear here once the route is planned."}
            </p>

            {upcomingRoute && (
              <div className="dashboard-stop-summary">
                <div className="dashboard-stop-heading">
                  <span className="eyebrow">STOPS ON THIS DAY</span>

                  <span>{nextStops.length}</span>
                </div>

                {nextStops.length ? (
                  <div className="dashboard-stop-list">
                    {nextStops.slice(0, 4).map((stop) => (
                      <div key={stop.id} className="dashboard-stop">
                        <span className={`dashboard-stop-dot ${stop.type}`} />

                        <div>
                          <strong>{stop.location}</strong>

                          <small>
                            {stop.type}
                            {stop.notes ? ` · ${stop.notes}` : ""}
                          </small>
                        </div>
                      </div>
                    ))}

                    {nextStops.length > 4 && (
                      <small className="dashboard-more-stops">
                        +{nextStops.length - 4} more stops
                      </small>
                    )}
                  </div>
                ) : (
                  <div className="dashboard-no-stops">
                    No stops planned for this ride day yet.
                  </div>
                )}
              </div>
            )}

            <div className="route-meta">
              <span>◷ {upcomingRoute?.rideType || "Ride day"}</span>

              <span>
                ⌁{" "}
                {nextDayItems.length
                  ? nextDayItems
                      .reduce(
                        (sum, item) => sum + Number(item.distanceKm || 0),
                        0,
                      )
                      .toLocaleString("en-IN")
                  : "—"}{" "}
                km
              </span>

              {nextRideDate && (
                <span>
                  ◷{" "}
                  {nextRideDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
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
                  "--progress": `${readinessPct * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <div>
                <b>{readinessPct}%</b>
                <small>READY</small>
              </div>
            </div>
          </div>

          <h2>
            {readinessPct === 100
              ? "You're ready to ride."
              : `${readinessChecks.length - readinessDone} things need attention`}
          </h2>

          <p>
            {readinessPct === 100
              ? "Route, budget, packing and ride prep are all sorted."
              : "A few things still need attention before departure day."}
          </p>

          <div className="dashboard-readiness-list">
            {readinessChecks.map((check) => (
              <div
                key={check.label}
                className={`dashboard-readiness-item ${
                  check.done ? "done" : ""
                }`}
              >
                <span>{check.done ? "✓" : "!"}</span>

                <strong>{check.label}</strong>
              </div>
            ))}
          </div>

          <div className="dashboard-readiness-actions">
            <Link href="/packing" className="button dark-button">
              Open packing <span>→</span>
            </Link>

            <Link href="/ride-prep" className="text-link">
              Ride prep →
            </Link>
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-card budget-card">
          <div className="card-top">
            <span className="eyebrow">SPEND TRACKER</span>

            <span className={`budget-status ${budgetStatus}`}>
              {budgetStatusLabel}
            </span>
          </div>

          <div className="money-line">
            <b>₹{total.toLocaleString("en-IN")}</b>

            <span>
              {budget
                ? `of ₹${budget.toLocaleString("en-IN")}`
                : "No budget set"}
            </span>
          </div>

          {budget ? (
            <>
              <div className="meter">
                <i
                  style={{
                    width: `${budgetPct}%`,
                  }}
                />
              </div>

              <div className="budget-foot">
                <span>Remaining</span>

                <strong>
                  ₹{Math.max(0, remaining).toLocaleString("en-IN")}
                </strong>

                <Link href="/expenses">Manage expenses →</Link>
              </div>

              <div className={`budget-message ${budgetStatus}`}>
                {budgetStatusText}
              </div>
              {expenseCompletedDays > 0 && budget > 0 && (
                <div className="dashboard-spending-intelligence">
                  <div className="dashboard-spending-intelligence-top">
                    <span>SPENDING PACE</span>

                    <strong className={spendingPace}>
                      {spendingPaceLabel}
                    </strong>
                  </div>

                  <div className="dashboard-spending-intelligence-grid">
                    <div>
                      <span>AVG / RIDE DAY</span>
                      <b>
                        ₹{Math.round(averageDailySpend).toLocaleString("en-IN")}
                      </b>
                    </div>

                    <div>
                      <span>PROJECTED TOTAL</span>
                      <b>
                        ₹
                        {Math.round(projectedTripSpend).toLocaleString("en-IN")}
                      </b>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="budget-message unset">
              {budgetStatusText}
              {expenseCompletedDays > 0 && budget > 0 && (
                <div className="dashboard-spending-intelligence">
                  <div className="dashboard-spending-intelligence-top">
                    <span>SPENDING PACE</span>

                    <strong className={spendingPace}>
                      {spendingPaceLabel}
                    </strong>
                  </div>

                  <div className="dashboard-spending-intelligence-grid">
                    <div>
                      <span>AVG / RIDE DAY</span>
                      <b>
                        ₹{Math.round(averageDailySpend).toLocaleString("en-IN")}
                      </b>
                    </div>

                    <div>
                      <span>PROJECTED TOTAL</span>
                      <b>
                        ₹
                        {Math.round(projectedTripSpend).toLocaleString("en-IN")}
                      </b>
                    </div>
                  </div>
                </div>
              )}
              <Link href="/ride-prep">Set budget →</Link>
            </div>
          )}
        </article>

        <article className="quote-card">
          <span>“</span>
          <p>
            Good trips are planned. Great trips leave room for the road to
            surprise you.
          </p>
          <small>— YOUR ROADBOOK</small>
        </article>
      </section>
      <section className="dashboard-attention-card">
        <div className="dashboard-attention-icon">!</div>

        <div className="dashboard-attention-copy">
          <span className="eyebrow">ROADBOOK ATTENTION</span>

          <h2>{attentionTitle}</h2>

          <p>{attentionText}</p>
        </div>

        <Link href={attentionHref} className="dashboard-attention-action">
          {attentionAction}
          <span>→</span>
        </Link>
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
