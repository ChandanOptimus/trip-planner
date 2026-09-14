"use client";

import { useTrip } from "./trip-provider";

export function PageState({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, data, error, refresh } = useTrip();

  if (loading) {
    return (
      <div className="state-card state-loading">
        <div className="state-loading-mark">
          <span>KR</span>
        </div>

        <div className="state-loading-copy">
          <span>KERALA ROADBOOK</span>
          <strong>Preparing your ride</strong>
          <p>Syncing your roadbook with Google Sheets…</p>
        </div>

        <div className="state-loading-line">
          <i />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="state-card">
        <b>Couldn’t connect to Google Sheets.</b>
        <p>
          {error || "The planner could not load your trip data."}
        </p>

        <button
          className="button"
          onClick={() => void refresh()}
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}