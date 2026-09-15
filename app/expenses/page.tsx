"use client";

import { FormEvent, useState } from "react";
import { PageState } from "@/components/page-state";
import { useTrip } from "@/components/trip-provider";

const initial = {
  date: "",
  label: "",
  amount: "",
  category: "Fuel",
  notes: "",
};

function Expenses() {
  const { data, save } = useTrip();
  const [draft, setDraft] = useState(initial);

  if (!data) return null;

  const total = data.expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const budget = Number(data.trip.totalBudget || 0);
  const remaining = Math.max(0, budget - total);
  const budgetPct = budget
    ? Math.min(100, Math.round((total / budget) * 100))
    : 0;

  const byCategory = data.expenses.reduce<Record<string, number>>(
    (all, item) => ({
      ...all,
      [item.category]: (all[item.category] || 0) + Number(item.amount || 0),
    }),
    {},
  );

  const add = async (event: FormEvent) => {
    event.preventDefault();

    if (await save("expenses", "POST", draft)) {
      setDraft(initial);
    }
  };

  const edit = (item: (typeof data.expenses)[number]) => {
    const label = window.prompt("What did you pay for?", item.label);
    const amount = window.prompt("Amount", item.amount);
    const category = window.prompt("Category", item.category);

    if (label && amount && category) {
      void save("expenses", "PATCH", {
        ...item,
        label,
        amount,
        category,
      });
    }
  };

  return (
    <div className="expenses-page">
      <section className="expenses-hero">
        <div className="expenses-hero-copy">
          <p className="eyebrow">TRIP FINANCES</p>

          <h1>
            Know what the <em>road</em> costs.
          </h1>

          <p className="lead">
            Keep every fuel stop, meal and unexpected expense in one place.
          </p>
        </div>

        <div className="expense-hero-total">
          <span className="eyebrow">TOTAL SPENT</span>

          <strong>₹{total.toLocaleString("en-IN")}</strong>

          <span>
            {data.expenses.length}{" "}
            {data.expenses.length === 1 ? "expense" : "expenses"} logged
          </span>
        </div>
      </section>

      <section className="expense-stats">
        <article>
          <span className="expense-stat-label">SPENT</span>
          <strong>₹{total.toLocaleString("en-IN")}</strong>
          <small>{budgetPct}% of budget</small>
        </article>

        <article>
          <span className="expense-stat-label">BUDGET</span>
          <strong>₹{budget.toLocaleString("en-IN")}</strong>
          <small>Trip allowance</small>
        </article>

        <article>
          <span className="expense-stat-label">REMAINING</span>
          <strong>₹{remaining.toLocaleString("en-IN")}</strong>
          <small>
            {budget
              ? `${Math.max(0, 100 - budgetPct)}% available`
              : "Set a trip budget"}
          </small>
        </article>
      </section>

      <div className="expense-layout">
        <section className="expense-main">
          <article className="spend-card">
            <div className="spend-card-header">
              <div>
                <p className="eyebrow">BUDGET TRACKER</p>
                <h2>How the trip is spending</h2>
              </div>

              <span className="spend-percent">{budgetPct}%</span>
            </div>

            <div className="spend-money">
              <strong>₹{total.toLocaleString("en-IN")}</strong>

              <span>of ₹{budget.toLocaleString("en-IN")}</span>
            </div>

            <div className="spend-meter">
              <i style={{ width: `${budgetPct}%` }} />
            </div>

            <div className="spend-meter-foot">
              <span>₹0</span>
              <span>
                {budget
                  ? `₹${budget.toLocaleString("en-IN")}`
                  : "No budget set"}
              </span>
            </div>
          </article>

          {Object.keys(byCategory).length > 0 && (
            <article className="category-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">WHERE IT GOES</p>
                  <h2>Spend by category</h2>
                </div>
              </div>

              <div className="category-grid">
                {Object.entries(byCategory).map(([category, amount]) => {
                  const categoryPct = total
                    ? Math.round((amount / total) * 100)
                    : 0;

                  return (
                    <article key={category} className="category-item">
                      <div className="category-item-top">
                        <span>{category}</span>
                        <strong>₹{amount.toLocaleString("en-IN")}</strong>
                      </div>

                      <div className="category-meter">
                        <i
                          style={{
                            width: `${categoryPct}%`,
                          }}
                        />
                      </div>

                      <small>{categoryPct}% of total spend</small>
                    </article>
                  );
                })}
              </div>
            </article>
          )}

          <article className="expenses-list-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TRANSACTION LOG</p>
                <h2>Every rupee has a story.</h2>
              </div>

              <span className="expense-count">{data.expenses.length}</span>
            </div>

            {data.expenses.length === 0 ? (
              <div className="expense-empty">
                <span>₹</span>
                <strong>No expenses logged yet</strong>
                <p>
                  Your fuel stops, meals and other trip costs will appear here.
                </p>
              </div>
            ) : (
              <div className="expense-list">
                {data.expenses.map((item) => (
                  <article key={item.id} className="expense-row">
                    <div className="expense-row-icon">₹</div>

                    <div className="expense-row-copy">
                      <strong>{item.label}</strong>

                      <span>
                        {item.date || "Date not set"}
                        <i>·</i>
                        {item.category}
                        {item.notes ? (
                          <>
                            <i>·</i>
                            {item.notes}
                          </>
                        ) : null}
                      </span>
                    </div>

                    <strong className="expense-row-amount">
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                    </strong>

                    <div className="expense-row-actions">
                      <button type="button" onClick={() => edit(item)}>
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          save("expenses", "DELETE", {
                            id: item.id,
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>

        <aside className="expense-form-card">
          <p className="eyebrow">NEW EXPENSE</p>

          <h2>Log a cost.</h2>

          <p>
            Add every stop along the way. Small costs become useful trip data.
          </p>

          <form onSubmit={add} className="data-form">
            <label>
              Date
              <input
                type="date"
                value={draft.date}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    date: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Category
              <input
                value={draft.category}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    category: e.target.value,
                  })
                }
                placeholder="Fuel"
              />
            </label>

            <label className="wide">
              What did you pay for?
              <input
                required
                value={draft.label}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    label: e.target.value,
                  })
                }
                placeholder="e.g. Petrol — Goa"
              />
            </label>

            <label>
              Amount (₹)
              <input
                required
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    amount: e.target.value,
                  })
                }
                placeholder="1200"
              />
            </label>

            <label>
              Notes
              <input
                value={draft.notes}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    notes: e.target.value,
                  })
                }
                placeholder="Optional"
              />
            </label>

            <button className="button" type="submit">
              Save expense <span>→</span>
            </button>
          </form>
        </aside>
      </div>

      <style jsx global>{`
        .expenses-page {
          min-height: 100%;
          padding-bottom: 48px;
          color: var(--rb-text, #f3f4f5);
        }

        .expenses-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          min-height: 270px;
          padding: 42px;
          margin-bottom: 18px;
          border: 1px solid var(--rb-line, rgba(255, 255, 255, 0.09));
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 78% 20%,
              rgba(255, 106, 26, 0.14),
              transparent 35%
            ),
            linear-gradient(135deg, #101316, #0b0e10);
        }

        .expenses-hero::before {
          content: "";
          position: absolute;
          width: 360px;
          height: 360px;
          right: -100px;
          bottom: -220px;
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 50%;
          box-shadow:
            0 0 0 34px rgba(255, 255, 255, 0.018),
            0 0 0 68px rgba(255, 255, 255, 0.012);
          pointer-events: none;
        }

        .expenses-hero-copy {
          position: relative;
          z-index: 1;
        }

        .expenses-hero h1 {
          max-width: 720px;
          margin: 10px 0;
          font-size: clamp(42px, 5vw, 70px);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .expenses-hero h1 em {
          color: var(--rb-accent, #ff6a1a);
          font-style: normal;
        }

        .expenses-hero .lead {
          max-width: 570px;
          margin: 0;
          color: var(--rb-muted, #8f989f);
          font-size: 16px;
          line-height: 1.55;
        }

        .expense-hero-total {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 230px;
        }

        .expense-hero-total strong {
          margin: 7px 0 4px;
          color: #fff;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .expense-hero-total > span:last-child {
          color: var(--rb-muted, #8f989f);
          font-size: 11px;
        }

        .expense-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-bottom: 18px;
          overflow: hidden;
          border: 1px solid var(--rb-line, rgba(255, 255, 255, 0.09));
          border-radius: 18px;
          background: var(--rb-panel, #101316);
        }

        .expense-stats article {
          min-height: 105px;
          padding: 22px 26px;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
        }

        .expense-stats article:last-child {
          border-right: 0;
        }

        .expense-stat-label {
          display: block;
          margin-bottom: 8px;
          color: var(--rb-muted, #8f989f);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .expense-stats strong {
          display: block;
          font-size: 25px;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .expense-stats small {
          display: block;
          margin-top: 7px;
          color: #707980;
          font-size: 10px;
        }

        .expense-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 18px;
        }

        .expense-main {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }

        .spend-card,
        .category-card,
        .expenses-list-card,
        .expense-form-card {
          border: 1px solid var(--rb-line, rgba(255, 255, 255, 0.09));
          border-radius: 20px;
          background: var(--rb-panel, #101316);
        }

        .spend-card {
          padding: 28px 30px;
        }

        .spend-card-header,
        .section-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .spend-card h2,
        .section-heading h2 {
          margin: 6px 0 0;
          font-size: 21px;
          letter-spacing: -0.025em;
        }

        .spend-percent {
          display: grid;
          place-items: center;
          min-width: 52px;
          height: 32px;
          padding: 0 10px;
          border: 1px solid rgba(255, 106, 26, 0.3);
          border-radius: 999px;
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
          font-size: 11px;
          font-weight: 800;
        }

        .spend-money {
          display: flex;
          align-items: baseline;
          gap: 9px;
          margin-top: 28px;
        }

        .spend-money strong {
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .spend-money span {
          color: var(--rb-muted, #8f989f);
          font-size: 12px;
        }

        .spend-meter {
          height: 8px;
          margin-top: 20px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
        }

        .spend-meter i {
          display: block;
          height: 100%;
          min-width: 0;
          border-radius: inherit;
          background: var(--rb-accent, #ff6a1a);
          box-shadow: 0 0 18px rgba(255, 106, 26, 0.3);
        }

        .spend-meter-foot {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          color: #687178;
          font-size: 9px;
          font-weight: 700;
        }

        .category-card {
          padding: 28px 30px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .category-item {
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.018);
        }

        .category-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .category-item-top span {
          color: #aeb5ba;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .category-item-top strong {
          font-size: 14px;
        }

        .category-meter {
          height: 4px;
          margin-top: 13px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
        }

        .category-meter i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #707980;
        }

        .category-item small {
          display: block;
          margin-top: 8px;
          color: #626b71;
          font-size: 9px;
        }

        .expenses-list-card {
          overflow: hidden;
        }

        .expenses-list-card > .section-heading {
          padding: 28px 30px 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .expense-count {
          display: grid;
          place-items: center;
          min-width: 32px;
          height: 30px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.05);
          color: #aeb5ba;
          font-size: 11px;
          font-weight: 800;
        }

        .expense-list {
          display: flex;
          flex-direction: column;
          max-height: 340px;
          overflow-y: auto;
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 106, 26, 0.75) rgba(255, 255, 255, 0.04);
        }

        .expense-list::-webkit-scrollbar {
          width: 10px;
        }

        .expense-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }

        .expense-list::-webkit-scrollbar-thumb {
          border: 2px solid rgba(255, 255, 255, 0.04);
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            rgba(255, 158, 92, 0.95),
            rgba(255, 106, 26, 0.9)
          );
        }

        .expense-list::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(255, 185, 128, 1),
            rgba(255, 120, 38, 1)
          );
        }

        .expense-row {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 14px;
          min-height: 72px;
          padding: 12px 20px 12px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
          transition: background 0.18s ease;
        }

        .expense-row:last-child {
          border-bottom: 0;
        }

        .expense-row:hover {
          background: rgba(255, 255, 255, 0.025);
        }

        .expense-row-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255, 106, 26, 0.25);
          border-radius: 9px;
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
          font-size: 13px;
          font-weight: 800;
        }

        .expense-row-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .expense-row-copy strong {
          overflow: hidden;
          color: #e9ebed;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .expense-row-copy span {
          overflow: hidden;
          color: #747d84;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .expense-row-copy i {
          margin: 0 5px;
          color: #4d555a;
          font-style: normal;
        }

        .expense-row-amount {
          color: #f3f4f5;
          font-size: 14px;
          white-space: nowrap;
        }

        .expense-row-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.4;
          transition: opacity 0.18s ease;
        }

        .expense-row:hover .expense-row-actions {
          opacity: 1;
        }

        .expense-row-actions button {
          border: 0;
          background: transparent;
          color: #8f989f;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .expense-row-actions button:hover {
          color: #fff;
        }

        .expense-row-actions .danger {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          font-size: 18px;
          line-height: 1;
        }

        .expense-row-actions .danger:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .expense-form-card {
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

        .expense-form-card h2 {
          margin: 7px 0 8px;
          font-size: 25px;
          letter-spacing: -0.03em;
        }

        .expense-form-card > p:not(.eyebrow) {
          margin: 0 0 24px;
          color: var(--rb-muted, #8f989f);
          font-size: 13px;
          line-height: 1.6;
        }

        .expense-form-card .data-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px 12px;
        }

        .expense-form-card .data-form label {
          color: #aeb5ba;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .expense-form-card .data-form label.wide {
          grid-column: 1 / -1;
        }

        .expense-form-card .data-form input {
          width: 100%;
          box-sizing: border-box;
          margin-top: 7px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          outline: none;
          background: #0b0e10;
          color: #f3f4f5;
          padding: 12px 13px;
          font: inherit;
          font-size: 12px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .expense-form-card .data-form input:focus {
          border-color: rgba(255, 106, 26, 0.65);
          box-shadow: 0 0 0 3px rgba(255, 106, 26, 0.08);
        }

        .expense-form-card .data-form .button {
          grid-column: 1 / -1;
          justify-content: center;
          width: 100%;
          margin-top: 3px;
        }

        .expense-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          padding: 30px;
          text-align: center;
        }

        .expense-empty > span {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          margin-bottom: 14px;
          border: 1px solid rgba(255, 106, 26, 0.25);
          border-radius: 50%;
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
          font-size: 18px;
          font-weight: 800;
        }

        .expense-empty strong {
          font-size: 15px;
        }

        .expense-empty p {
          margin: 7px 0 0;
          color: var(--rb-muted, #8f989f);
          font-size: 12px;
        }

        @media (max-width: 1000px) {
          .expense-layout {
            grid-template-columns: 1fr;
          }

          .expense-form-card {
            order: -1;
          }
        }

        @media (max-width: 760px) {
          .expenses-hero {
            align-items: flex-start;
            flex-direction: column;
            min-height: auto;
            padding: 30px;
          }

          .expense-hero-total {
            align-items: flex-start;
          }

          .expense-stats {
            grid-template-columns: 1fr;
          }

          .expense-stats article {
            min-height: auto;
            border-right: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          }

          .expense-stats article:last-child {
            border-bottom: 0;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .expenses-hero {
            padding: 24px;
            border-radius: 18px;
          }

          .expenses-hero h1 {
            font-size: 44px;
          }

          .spend-card,
          .category-card {
            padding: 22px 20px;
          }

          .expenses-list-card > .section-heading {
            padding: 22px 20px 18px;
          }

          .expense-row {
            grid-template-columns: 34px minmax(0, 1fr) auto;
            padding: 12px 16px;
          }

          .expense-row-amount {
            grid-column: 2;
            grid-row: 2;
          }

          .expense-row-actions {
            grid-column: 3;
            grid-row: 1 / span 2;
            opacity: 1;
          }

          .expense-form-card {
            padding: 22px;
          }

          .expense-form-card .data-form {
            grid-template-columns: 1fr;
          }

          .expense-form-card .data-form label.wide,
          .expense-form-card .data-form .button {
            grid-column: auto;
          }

          .expense-list {
            max-height: 240px;
          }

          .expense-list::-webkit-scrollbar {
            width: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <PageState>
      <Expenses />
    </PageState>
  );
}
