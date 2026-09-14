"use client";

import { FormEvent, useState } from "react";
import { PageState } from "@/components/page-state";
import { useTrip } from "@/components/trip-provider";

function RidePrep() {
  const { data, save } = useTrip();

  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Safety");

  const [note, setNote] = useState({
    title: "",
    body: "",
  });

  const [settings, setSettings] =
    useState<Record<string, string> | null>(null);

  if (!data) return null;

  const trip = settings ?? data.trip;

  const completed = data.ridePrep.filter(
    (item) => item.checked === "true"
  ).length;

  const totalTasks = data.ridePrep.length;

  const prepPct = totalTasks
    ? Math.round((completed / totalTasks) * 100)
    : 0;

  const remainingTasks = totalTasks - completed;

  const addPrep = async (e: FormEvent) => {
    e.preventDefault();

    if (
      await save("ridePrep", "POST", {
        label,
        category,
        checked: "false",
        sortOrder: String(data.ridePrep.length + 1),
      })
    ) {
      setLabel("");
    }
  };

  const addNote = async (e: FormEvent) => {
    e.preventDefault();

    if (
      await save("notes", "POST", {
        ...note,
        sortOrder: String(data.notes.length + 1),
      })
    ) {
      setNote({
        title: "",
        body: "",
      });
    }
  };

  const editPrep = (
    item: typeof data.ridePrep[number]
  ) => {
    const nextLabel = window.prompt(
      "Task",
      item.label
    );

    const nextCategory = window.prompt(
      "Category",
      item.category
    );

    if (nextLabel && nextCategory) {
      void save("ridePrep", "PATCH", {
        ...item,
        label: nextLabel,
        category: nextCategory,
      });
    }
  };

  const editNote = (
    item: typeof data.notes[number]
  ) => {
    const title = window.prompt(
      "Title",
      item.title
    );

    const body = window.prompt(
      "Note",
      item.body
    );

    if (title && body) {
      void save("notes", "PATCH", {
        ...item,
        title,
        body,
      });
    }
  };

  return (
    <div className="ride-prep-page">
      <section className="prep-hero">
        <div className="prep-hero-copy">
          <p className="eyebrow">
            PRE-DEPARTURE CONTROL
          </p>

          <h1>
            Ready when the <em>road calls.</em>
          </h1>

          <p className="lead">
            Check the machine, sort the essentials and leave
            nothing important behind.
          </p>
        </div>

        <div className="prep-hero-status">
          <div
            className="prep-ring"
            style={
              {
                "--progress": `${prepPct * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{prepPct}%</strong>
              <span>READY</span>
            </div>
          </div>

          <div className="prep-status-copy">
            <span className="eyebrow">
              RIDE STATUS
            </span>

            <strong>
              {completed}
              <small> / {totalTasks}</small>
            </strong>

            <span>
              {remainingTasks === 0
                ? "Everything is checked."
                : `${remainingTasks} ${
                    remainingTasks === 1
                      ? "task"
                      : "tasks"
                  } remaining`}
            </span>
          </div>
        </div>
      </section>

      <section className="prep-stats">
        <article>
          <span>CHECKLIST</span>
          <strong>
            {completed}/{totalTasks}
          </strong>
          <small>
            {prepPct}% complete
          </small>
        </article>

        <article>
          <span>TRIP NOTES</span>
          <strong>{data.notes.length}</strong>
          <small>
            Things worth remembering
          </small>
        </article>

        <article>
          <span>EMERGENCY</span>
          <strong>
            {trip.emergencyPhone
              ? "SET"
              : "NOT SET"}
          </strong>
          <small>
            Emergency contact
          </small>
        </article>
      </section>

      <div className="prep-layout">
        <section className="prep-main">
          <article className="prep-checklist-card">
            <div className="prep-section-heading">
              <div>
                <p className="eyebrow">
                  BEFORE YOU RIDE
                </p>

                <h2>
                  The pre-ride checklist
                </h2>
              </div>

              <span className="prep-count">
                {completed}/{totalTasks}
              </span>
            </div>

            {data.ridePrep.length === 0 ? (
              <div className="prep-empty">
                <span>✓</span>

                <strong>
                  Nothing on the checklist yet
                </strong>

                <p>
                  Add your first safety or bike-prep
                  task below.
                </p>
              </div>
            ) : (
              <div className="prep-check-list">
                {data.ridePrep.map((item) => {
                  const checked =
                    item.checked === "true";

                  return (
                    <label
                      key={item.id}
                      className={
                        checked
                          ? "prep-item checked"
                          : "prep-item"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          save(
                            "ridePrep",
                            "PATCH",
                            {
                              ...item,
                              checked: checked
                                ? "false"
                                : "true",
                            }
                          )
                        }
                      />

                      <span className="prep-checkbox">
                        {checked ? "✓" : ""}
                      </span>

                      <span className="prep-item-copy">
                        <strong>
                          {item.label}
                        </strong>

                        <i>
                          {item.category}
                        </i>
                      </span>

                      <span className="prep-item-actions">
                        <button
                          type="button"
                          onClick={() =>
                            editPrep(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            save(
                              "ridePrep",
                              "DELETE",
                              {
                                id: item.id,
                              }
                            )
                          }
                        >
                          ×
                        </button>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <form
              onSubmit={addPrep}
              className="prep-add-form"
            >
              <input
                required
                placeholder="Add safety task"
                value={label}
                onChange={(e) =>
                  setLabel(e.target.value)
                }
              />

              <input
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                placeholder="Safety"
              />

              <button
                className="button"
                type="submit"
              >
                Add task <span>→</span>
              </button>
            </form>
          </article>

          <article className="notes-card">
            <div className="prep-section-heading">
              <div>
                <p className="eyebrow">
                  ROAD NOTES
                </p>

                <h2>
                  Things worth remembering.
                </h2>
              </div>

              <span className="prep-count">
                {data.notes.length}
              </span>
            </div>

            {data.notes.length === 0 ? (
              <div className="notes-empty">
                <span>✦</span>

                <strong>
                  No trip notes yet
                </strong>

                <p>
                  Add reminders, route ideas or
                  anything you don't want to forget.
                </p>
              </div>
            ) : (
              <div className="notes-list">
                {data.notes.map((item) => (
                  <article
                    key={item.id}
                    className="note-item"
                  >
                    <div className="note-mark">
                      ✦
                    </div>

                    <div className="note-copy">
                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.body}
                      </p>
                    </div>

                    <div className="note-actions">
                      <button
                        type="button"
                        onClick={() =>
                          editNote(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          save(
                            "notes",
                            "DELETE",
                            {
                              id: item.id,
                            }
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <form
              onSubmit={addNote}
              className="note-form"
            >
              <label>
                Title
                <input
                  required
                  value={note.title}
                  onChange={(e) =>
                    setNote({
                      ...note,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Check rain radar"
                />
              </label>

              <label>
                Note
                <textarea
                  required
                  value={note.body}
                  onChange={(e) =>
                    setNote({
                      ...note,
                      body: e.target.value,
                    })
                  }
                  placeholder="Write something worth remembering..."
                />
              </label>

              <button
                className="button"
                type="submit"
              >
                Add road note <span>→</span>
              </button>
            </form>
          </article>
        </section>

        <aside className="prep-settings-card">
          <p className="eyebrow">
            TRIP SETTINGS
          </p>

          <h2>
            Know before you go.
          </h2>

          <p className="settings-copy">
            Keep the important trip details close,
            especially when you're already on the road.
          </p>

          <form
            className="data-form"
            onSubmit={async (e) => {
              e.preventDefault();

              if (
                await save(
                  "trip",
                  "POST",
                  trip
                )
              ) {
                setSettings(null);
              }
            }}
          >
            <label>
              Trip start

              <input
                type="date"
                value={
                  trip.startDate || ""
                }
                onChange={(e) =>
                  setSettings({
                    ...trip,
                    startDate:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Total budget (₹)

              <input
                inputMode="decimal"
                value={
                  trip.totalBudget || ""
                }
                onChange={(e) =>
                  setSettings({
                    ...trip,
                    totalBudget:
                      e.target.value,
                  })
                }
              />
            </label>

            <div className="settings-divider" />

            <div className="emergency-heading">
              <span className="emergency-icon">
                !
              </span>

              <div>
                <span className="eyebrow">
                  EMERGENCY CONTACT
                </span>

                <small>
                  Keep someone reachable.
                </small>
              </div>
            </div>

            <label>
              Contact name

              <input
                value={
                  trip.emergencyContact ||
                  ""
                }
                onChange={(e) =>
                  setSettings({
                    ...trip,
                    emergencyContact:
                      e.target.value,
                  })
                }
                placeholder="Name"
              />
            </label>

            <label>
              Emergency phone

              <input
                type="tel"
                value={
                  trip.emergencyPhone || ""
                }
                onChange={(e) =>
                  setSettings({
                    ...trip,
                    emergencyPhone:
                      e.target.value,
                  })
                }
                placeholder="+91..."
              />
            </label>

            <button
              className="button"
              type="submit"
            >
              Save trip settings{" "}
              <span>→</span>
            </button>
          </form>
        </aside>
      </div>

      <style jsx global>{`
        .ride-prep-page {
          min-height: 100%;
          padding-bottom: 48px;
          color: var(--rb-text, #f3f4f5);
        }

        .prep-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          min-height: 270px;
          padding: 42px;
          margin-bottom: 18px;
          border: 1px solid
            var(--rb-line, rgba(255, 255, 255, 0.09));
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 80% 20%,
              rgba(255, 106, 26, 0.14),
              transparent 34%
            ),
            linear-gradient(135deg, #101316, #0b0e10);
        }

        .prep-hero::after {
          content: "";
          position: absolute;
          width: 350px;
          height: 350px;
          right: -110px;
          bottom: -215px;
          border: 1px solid
            rgba(255, 255, 255, 0.055);
          border-radius: 50%;
          box-shadow:
            0 0 0 34px
              rgba(255, 255, 255, 0.018),
            0 0 0 68px
              rgba(255, 255, 255, 0.012);
          pointer-events: none;
        }

        .prep-hero-copy {
          position: relative;
          z-index: 1;
        }

        .prep-hero h1 {
          max-width: 760px;
          margin: 10px 0;
          font-size: clamp(42px, 5vw, 70px);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .prep-hero h1 em {
          color: var(--rb-accent, #ff6a1a);
          font-style: normal;
        }

        .prep-hero .lead {
          max-width: 570px;
          margin: 0;
          color: var(--rb-muted, #8f989f);
          font-size: 16px;
          line-height: 1.55;
        }

        .prep-hero-status {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 245px;
        }

        .prep-ring {
          --progress: 0deg;
          position: relative;
          display: grid;
          place-items: center;
          width: 112px;
          height: 112px;
          flex: 0 0 112px;
          border-radius: 50%;
          background:
            conic-gradient(
              var(--rb-accent, #ff6a1a)
                var(--progress),
              rgba(255, 255, 255, 0.08) 0deg
            );
        }

        .prep-ring::before {
          content: "";
          position: absolute;
          width: 92px;
          height: 92px;
          border-radius: 50%;
          background: #101316;
        }

        .prep-ring > div {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .prep-ring strong {
          font-size: 24px;
          line-height: 1;
        }

        .prep-ring span {
          margin-top: 5px;
          color: var(--rb-muted, #8f989f);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .prep-status-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .prep-status-copy strong {
          font-size: 30px;
          line-height: 1;
        }

        .prep-status-copy strong small {
          color: var(--rb-muted, #8f989f);
          font-size: 14px;
          font-weight: 500;
        }

        .prep-status-copy > span:last-child {
          color: var(--rb-muted, #8f989f);
          font-size: 11px;
        }

        .prep-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-bottom: 18px;
          overflow: hidden;
          border: 1px solid
            var(--rb-line, rgba(255, 255, 255, 0.09));
          border-radius: 18px;
          background: var(--rb-panel, #101316);
        }

        .prep-stats article {
          min-height: 105px;
          padding: 22px 26px;
          border-right: 1px solid
            rgba(255, 255, 255, 0.07);
        }

        .prep-stats article:last-child {
          border-right: 0;
        }

        .prep-stats span {
          display: block;
          margin-bottom: 8px;
          color: var(--rb-muted, #8f989f);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .prep-stats strong {
          display: block;
          font-size: 25px;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .prep-stats small {
          display: block;
          margin-top: 7px;
          color: #707980;
          font-size: 10px;
        }

        .prep-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 18px;
        }

        .prep-main {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }

        .prep-checklist-card,
        .notes-card,
        .prep-settings-card {
          border: 1px solid
            var(--rb-line, rgba(255, 255, 255, 0.09));
          border-radius: 20px;
          background: var(--rb-panel, #101316);
        }

        .prep-checklist-card,
        .notes-card {
          overflow: hidden;
        }

        .prep-section-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 28px 30px 22px;
          border-bottom: 1px solid
            rgba(255, 255, 255, 0.07);
        }

        .prep-section-heading h2 {
          margin: 6px 0 0;
          font-size: 21px;
          letter-spacing: -0.025em;
        }

        .prep-count {
          display: grid;
          place-items: center;
          min-width: 40px;
          height: 30px;
          padding: 0 9px;
          border: 1px solid
            rgba(255, 106, 26, 0.3);
          border-radius: 999px;
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
          font-size: 11px;
          font-weight: 800;
        }

        .prep-check-list {
          display: flex;
          flex-direction: column;
        }

        .prep-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 15px;
          min-height: 70px;
          padding: 12px 20px 12px 26px;
          border-bottom: 1px solid
            rgba(255, 255, 255, 0.055);
          cursor: pointer;
          transition: background 0.18s ease;
        }

        .prep-item:last-child {
          border-bottom: 0;
        }

        .prep-item:hover {
          background: rgba(255, 255, 255, 0.025);
        }

        .prep-item > input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .prep-checkbox {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          border: 1px solid
            rgba(255, 255, 255, 0.25);
          border-radius: 6px;
          background: #0b0e10;
          color: #fff;
          font-size: 13px;
          font-weight: 900;
        }

        .prep-item.checked .prep-checkbox {
          border-color: var(--rb-accent, #ff6a1a);
          background: var(--rb-accent, #ff6a1a);
        }

        .prep-item-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }

        .prep-item-copy strong {
          overflow: hidden;
          color: #e9ebed;
          font-size: 13px;
          font-weight: 650;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .prep-item.checked
          .prep-item-copy strong {
          color: #737b82;
          text-decoration: line-through;
        }

        .prep-item-copy i {
          color: var(--rb-muted, #8f989f);
          font-size: 9px;
          font-style: normal;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .prep-item-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          opacity: 0.4;
          transition: opacity 0.18s ease;
        }

        .prep-item:hover
          .prep-item-actions {
          opacity: 1;
        }

        .prep-item-actions button,
        .note-actions button {
          border: 0;
          background: transparent;
          color: #8f989f;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .prep-item-actions button:hover,
        .note-actions button:hover {
          color: #fff;
        }

        .prep-item-actions .danger {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          font-size: 18px;
        }

        .prep-item-actions .danger:hover,
        .note-actions .danger:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .prep-add-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 150px auto;
          gap: 9px;
          padding: 18px 20px;
          border-top: 1px solid
            rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.015);
        }

        .prep-add-form input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid
            rgba(255, 255, 255, 0.1);
          border-radius: 9px;
          outline: none;
          background: #0b0e10;
          color: #f3f4f5;
          padding: 11px 12px;
          font: inherit;
          font-size: 12px;
        }

        .prep-add-form input:focus {
          border-color: rgba(255, 106, 26, 0.6);
        }

        .prep-add-form .button {
          min-width: 95px;
        }

        .notes-card {
          padding-bottom: 20px;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
        }

        .note-item {
          display: grid;
          grid-template-columns: 36px minmax(0, 1fr) auto;
          gap: 13px;
          align-items: start;
          padding: 20px 24px;
          border-bottom: 1px solid
            rgba(255, 255, 255, 0.055);
        }

        .note-mark {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border: 1px solid
            rgba(255, 106, 26, 0.25);
          border-radius: 8px;
          background: rgba(255, 106, 26, 0.07);
          color: var(--rb-accent, #ff6a1a);
          font-size: 12px;
        }

        .note-copy {
          min-width: 0;
        }

        .note-copy strong {
          color: #e9ebed;
          font-size: 13px;
        }

        .note-copy p {
          margin: 6px 0 0;
          color: #808990;
          font-size: 11px;
          line-height: 1.55;
        }

        .note-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          padding-top: 3px;
        }

        .note-form {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: end;
          padding: 20px 24px 0;
        }

        .note-form label,
        .prep-settings-card .data-form label {
          color: #aeb5ba;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .note-form input,
        .note-form textarea,
        .prep-settings-card input {
          width: 100%;
          box-sizing: border-box;
          margin-top: 7px;
          border: 1px solid
            rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          outline: none;
          background: #0b0e10;
          color: #f3f4f5;
          padding: 11px 12px;
          font: inherit;
          font-size: 12px;
        }

        .note-form textarea {
          min-height: 42px;
          resize: vertical;
        }

        .note-form input:focus,
        .note-form textarea:focus,
        .prep-settings-card input:focus {
          border-color: rgba(255, 106, 26, 0.6);
          box-shadow: 0 0 0 3px
            rgba(255, 106, 26, 0.07);
        }

        .note-form .button {
          height: 42px;
          white-space: nowrap;
        }

        .prep-empty,
        .notes-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 220px;
          padding: 30px;
          text-align: center;
        }

        .prep-empty > span,
        .notes-empty > span {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          margin-bottom: 14px;
          border: 1px solid
            rgba(255, 106, 26, 0.25);
          border-radius: 50%;
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
          font-size: 18px;
          font-weight: 800;
        }

        .prep-empty strong,
        .notes-empty strong {
          font-size: 14px;
        }

        .prep-empty p,
        .notes-empty p {
          max-width: 380px;
          margin: 7px 0 0;
          color: var(--rb-muted, #8f989f);
          font-size: 11px;
          line-height: 1.5;
        }

        .prep-settings-card {
          align-self: start;
          padding: 28px;
          background:
            radial-gradient(
              circle at 100% 0,
              rgba(255, 106, 26, 0.09),
              transparent 42%
            ),
            var(--rb-panel, #101316);
        }

        .prep-settings-card h2 {
          margin: 7px 0 8px;
          font-size: 25px;
          letter-spacing: -0.03em;
        }

        .settings-copy {
          margin: 0 0 24px;
          color: var(--rb-muted, #8f989f);
          font-size: 13px;
          line-height: 1.6;
        }

        .prep-settings-card .data-form {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .settings-divider {
          height: 1px;
          margin: 4px 0 2px;
          background: rgba(255, 255, 255, 0.07);
        }

        .emergency-heading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .emergency-icon {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border: 1px solid
            rgba(239, 68, 68, 0.25);
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          font-size: 13px;
          font-weight: 900;
        }

        .emergency-heading > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .emergency-heading small {
          color: #707980;
          font-size: 9px;
        }

        .prep-settings-card .button {
          justify-content: center;
          width: 100%;
          margin-top: 3px;
        }

        @media (max-width: 1050px) {
          .prep-layout {
            grid-template-columns: 1fr;
          }

          .prep-settings-card {
            order: -1;
          }
        }

        @media (max-width: 800px) {
          .prep-hero {
            align-items: flex-start;
            flex-direction: column;
            min-height: auto;
            padding: 30px;
          }

          .prep-hero-status {
            width: 100%;
          }

          .prep-stats {
            grid-template-columns: 1fr;
          }

          .prep-stats article {
            min-height: auto;
            border-right: 0;
            border-bottom: 1px solid
              rgba(255, 255, 255, 0.07);
          }

          .prep-stats article:last-child {
            border-bottom: 0;
          }

          .prep-add-form {
            grid-template-columns: 1fr 1fr;
          }

          .prep-add-form .button {
            grid-column: 1 / -1;
          }

          .note-form {
            grid-template-columns: 1fr;
          }

          .note-form .button {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .prep-hero {
            padding: 24px;
            border-radius: 18px;
          }

          .prep-hero h1 {
            font-size: 44px;
          }

          .prep-section-heading {
            padding: 22px 20px 18px;
          }

          .prep-item {
            padding-left: 18px;
            padding-right: 14px;
          }

          .prep-item-actions {
            opacity: 1;
          }

          .prep-add-form {
            grid-template-columns: 1fr;
          }

          .prep-add-form .button {
            grid-column: auto;
            width: 100%;
          }

          .note-item {
            grid-template-columns: 34px minmax(0, 1fr);
            padding: 18px 20px;
          }

          .note-actions {
            grid-column: 2;
          }

          .note-form {
            padding: 18px 20px 0;
          }

          .prep-settings-card {
            padding: 22px;
          }
        }
      `}</style>
    </div>
  );
}

export default function RidePrepPage() {
  return (
    <PageState>
      <RidePrep />
    </PageState>
  );
}