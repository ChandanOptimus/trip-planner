"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageState } from "@/components/page-state";
import { useTrip } from "@/components/trip-provider";

const packingCategories = [
  "Ride Gear",
  "Clothing",
  "Camping",
  "Toiletries",
  "Electronics",
  "Documents",
  "Medicines",
  "Tools",
  "Food",
  "Misc",
] as const;

const defaultCategory = packingCategories[0];

function Packing() {
  const { data, save } = useTrip();

  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [editingItem, setEditingItem] = useState<
    (typeof data.packing)[number] | null
  >(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingCategory, setEditingCategory] = useState(defaultCategory);

  if (!data) return null;

  useEffect(() => {
    if (!editingItem) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingItem(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingItem]);

  const packed = data.packing.filter((item) => item.packed === "true").length;

  const total = data.packing.length;
  const remaining = total - packed;
  const packingPct = total ? Math.round((packed / total) * 100) : 0;

  const packingGroups = groupByCategory
    ? data.packing.reduce<Record<string, typeof data.packing>>(
        (groups, item) => {
          const key = item.category || "Uncategorized";

          if (!groups[key]) {
            groups[key] = [];
          }

          groups[key].push(item);

          return groups;
        },
        {},
      )
    : null;
  const visibleCategories = groupByCategory
    ? Object.keys(packingGroups || {}).sort((left, right) =>
        left.localeCompare(right),
      )
    : [];

  const add = async (e: FormEvent) => {
    e.preventDefault();

    if (
      await save("packing", "POST", {
        label,
        category,
        packed: "false",
        sortOrder: String(data.packing.length + 1),
      })
    ) {
      setLabel("");
    }
  };

  const edit = (item: (typeof data.packing)[number]) => {
    setEditingItem(item);
    setEditingLabel(item.label);
    setEditingCategory(item.category || defaultCategory);
  };

  const closeEditor = () => {
    setEditingItem(null);
    setEditingLabel("");
    setEditingCategory(defaultCategory);
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingItem) return;

    const ok = await save("packing", "PATCH", {
      ...editingItem,
      label: editingLabel,
      category: editingCategory,
    });

    if (ok) {
      closeEditor();
    }
  };

  return (
    <div className="packing-page">
      <section className="packing-hero">
        <div>
          <p className="eyebrow">PRE-RIDE CHECKLIST</p>
          <h1>
            Pack for the <em>road.</em>
          </h1>
          <p className="lead">Everything you need before the wheels roll.</p>
        </div>

        <div className="packing-readiness">
          <div
            className="packing-ring"
            style={
              {
                "--progress": `${packingPct * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{packingPct}%</strong>
              <span>READY</span>
            </div>
          </div>

          <div className="packing-readiness-copy">
            <span className="eyebrow">BAG STATUS</span>
            <strong>
              {packed} <small>/ {total}</small>
            </strong>
            <span>
              {remaining === 0
                ? "Everything is packed."
                : `${remaining} ${remaining === 1 ? "item" : "items"} left`}
            </span>
          </div>
        </div>
      </section>

      <div className="packing-layout">
        <section className="packing-list-card">
          <div className="packing-card-header">
            <div>
              <p className="eyebrow">YOUR LOADOUT</p>
              <h2>What’s going in the bag</h2>
            </div>

            <div className="packing-header-actions">
              <button
                type="button"
                className={
                  groupByCategory ? "group-toggle active" : "group-toggle"
                }
                onClick={() => setGroupByCategory((current) => !current)}
              >
                {groupByCategory ? "Flat view" : "Group by category"}
              </button>

              <span className="packing-count">
                {packed}/{total}
              </span>
            </div>
          </div>

          {data.packing.length === 0 ? (
            <div className="packing-empty">
              <span>＋</span>
              <strong>Your bag is empty</strong>
              <p>Add your first item using the panel on the right.</p>
            </div>
          ) : groupByCategory ? (
            <div className="packing-category-groups">
              {visibleCategories.map((categoryName) => {
                const items = packingGroups?.[categoryName] ?? [];
                const packedCount = items.filter(
                  (item) => item.packed === "true",
                ).length;

                return (
                  <section
                    key={categoryName}
                    className="packing-category-group"
                  >
                    <div className="packing-category-heading">
                      <div>
                        <strong>{categoryName}</strong>
                        <span>
                          {packedCount}/{items.length} packed
                        </span>
                      </div>

                      <span>{items.length}</span>
                    </div>

                    <div className="check-list">
                      {items.map((item) => {
                        const isPacked = item.packed === "true";

                        return (
                          <label
                            key={item.id}
                            className={
                              isPacked ? "packing-item packed" : "packing-item"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={isPacked}
                              onChange={() =>
                                save("packing", "PATCH", {
                                  ...item,
                                  packed: isPacked ? "false" : "true",
                                })
                              }
                            />

                            <span className="packing-checkbox">
                              {isPacked ? "✓" : ""}
                            </span>

                            <span className="packing-item-copy">
                              <strong>{item.label}</strong>
                              <i>{item.category}</i>
                            </span>

                            <span className="packing-item-actions">
                              <button type="button" onClick={() => edit(item)}>
                                Edit
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  save("packing", "DELETE", {
                                    id: item.id,
                                  })
                                }
                              >
                                ×
                              </button>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="check-list">
              {data.packing.map((item) => {
                const isPacked = item.packed === "true";

                return (
                  <label
                    key={item.id}
                    className={
                      isPacked ? "packing-item packed" : "packing-item"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isPacked}
                      onChange={() =>
                        save("packing", "PATCH", {
                          ...item,
                          packed: isPacked ? "false" : "true",
                        })
                      }
                    />

                    <span className="packing-checkbox">
                      {isPacked ? "✓" : ""}
                    </span>

                    <span className="packing-item-copy">
                      <strong>{item.label}</strong>
                      <i>{item.category}</i>
                    </span>

                    <span className="packing-item-actions">
                      <button type="button" onClick={() => edit(item)}>
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          save("packing", "DELETE", {
                            id: item.id,
                          })
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
        </section>

        <aside className="packing-form-card">
          <p className="eyebrow">ADD TO LOADOUT</p>
          <h2>Pack something new.</h2>
          <p>
            Keep the checklist simple. Add the things that matter once the ride
            begins.
          </p>

          <form onSubmit={add} className="data-form">
            <label>
              Item
              <input
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Rain jacket"
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {packingCategories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button className="button" type="submit">
              Add to packing list <span>→</span>
            </button>
          </form>
        </aside>
      </div>

      {editingItem && (
        <div className="packing-modal-backdrop" onClick={closeEditor}>
          <div
            className="packing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="packing-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="packing-modal-header">
              <div>
                <p className="eyebrow">EDIT ITEM</p>
                <h2 id="packing-modal-title">Update packing item</h2>
              </div>

              <button
                type="button"
                className="packing-modal-close"
                onClick={closeEditor}
              >
                ×
              </button>
            </div>

            <form onSubmit={submitEdit} className="packing-modal-form">
              <label>
                Item name
                <input
                  required
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                />
              </label>

              <label>
                Category
                <select
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                >
                  {packingCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="packing-modal-foot">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={closeEditor}
                >
                  Cancel
                </button>

                <button className="button" type="submit">
                  Save changes <span>→</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .packing-page {
          min-height: 100%;
          padding-bottom: 48px;
          color: var(--rb-text, #f3f4f5);
        }

        .packing-hero {
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
              circle at 80% 20%,
              rgba(255, 106, 26, 0.13),
              transparent 34%
            ),
            linear-gradient(135deg, #101316, #0b0e10);
        }

        .packing-hero::after {
          content: "";
          position: absolute;
          width: 330px;
          height: 330px;
          right: -120px;
          bottom: -190px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 50%;
          pointer-events: none;
        }

        .packing-hero h1 {
          position: relative;
          z-index: 1;
          margin: 10px 0 10px;
          font-size: clamp(42px, 5vw, 72px);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .packing-hero h1 em {
          color: var(--rb-accent, #ff6a1a);
          font-style: normal;
        }

        .packing-hero .lead {
          position: relative;
          z-index: 1;
          max-width: 560px;
          margin: 0;
          color: var(--rb-muted, #8f989f);
          font-size: 16px;
        }

        .packing-readiness {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 245px;
        }

        .packing-ring {
          --progress: 0deg;
          display: grid;
          place-items: center;
          width: 112px;
          height: 112px;
          flex: 0 0 112px;
          border-radius: 50%;
          background: conic-gradient(
            var(--rb-accent, #ff6a1a) var(--progress),
            rgba(255, 255, 255, 0.08) 0deg
          );
        }

        .packing-ring::before {
          content: "";
          position: absolute;
          width: 92px;
          height: 92px;
          border-radius: 50%;
          background: #101316;
        }

        .packing-ring > div {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .packing-ring strong {
          font-size: 24px;
          line-height: 1;
        }

        .packing-ring span {
          margin-top: 5px;
          color: var(--rb-muted, #8f989f);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .packing-readiness-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .packing-readiness-copy strong {
          font-size: 30px;
          line-height: 1;
        }

        .packing-readiness-copy strong small {
          color: var(--rb-muted, #8f989f);
          font-size: 14px;
          font-weight: 500;
        }

        .packing-readiness-copy > span:last-child {
          color: var(--rb-muted, #8f989f);
          font-size: 12px;
        }

        .packing-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 18px;
        }

        .packing-list-card,
        .packing-form-card {
          border: 1px solid var(--rb-line, rgba(255, 255, 255, 0.09));
          border-radius: 20px;
          background: var(--rb-panel, #101316);
        }

        .packing-list-card {
          overflow: hidden;
        }

        .packing-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 28px 30px 22px;
          border-bottom: 1px solid var(--rb-line, rgba(255, 255, 255, 0.09));
        }

        .packing-card-header h2 {
          margin: 6px 0 0;
          font-size: 22px;
          letter-spacing: -0.025em;
        }

        .packing-count {
          display: grid;
          place-items: center;
          min-width: 52px;
          height: 32px;
          padding: 0 10px;
          border: 1px solid rgba(255, 106, 26, 0.3);
          border-radius: 999px;
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
          font-size: 12px;
          font-weight: 800;
        }

        .packing-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .group-toggle {
          height: 32px;
          padding: 0 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.03);
          color: #aeb5ba;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        }

        .group-toggle:hover,
        .group-toggle.active {
          border-color: rgba(255, 106, 26, 0.35);
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
        }

        .packing-category-groups {
          display: flex;
          flex-direction: column;
        }

        .packing-category-group {
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
        }

        .packing-category-group:last-child {
          border-bottom: 0;
        }

        .packing-category-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 20px 12px 26px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: rgba(255, 255, 255, 0.012);
        }

        .packing-category-heading strong {
          display: block;
          color: #f3f4f5;
          font-size: 13px;
          letter-spacing: 0.02em;
        }

        .packing-category-heading span {
          color: #8f989f;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .packing-category-heading > span {
          display: grid;
          place-items: center;
          min-width: 30px;
          height: 26px;
          padding: 0 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.03);
          color: #c8cdd1;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: none;
        }

        .packing-category-heading > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .check-list {
          display: flex;
          flex-direction: column;
          max-height: 340px;
          overflow-y: auto;
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 106, 26, 0.75) rgba(255, 255, 255, 0.04);
        }

        .check-list::-webkit-scrollbar {
          width: 10px;
        }

        .check-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }

        .check-list::-webkit-scrollbar-thumb {
          border: 2px solid rgba(255, 255, 255, 0.04);
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            rgba(255, 158, 92, 0.95),
            rgba(255, 106, 26, 0.9)
          );
        }

        .check-list::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(255, 185, 128, 1),
            rgba(255, 120, 38, 1)
          );
        }

        .packing-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 15px;
          min-height: 70px;
          padding: 12px 20px 12px 26px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
          cursor: pointer;
          transition:
            background 0.18s ease,
            opacity 0.18s ease;
        }

        .packing-item:last-child {
          border-bottom: 0;
        }

        .packing-item:hover {
          background: rgba(255, 255, 255, 0.025);
        }

        .packing-item > input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .packing-checkbox {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 6px;
          background: #0b0e10;
          color: #fff;
          font-size: 13px;
          font-weight: 900;
        }

        .packing-item.packed .packing-checkbox {
          border-color: var(--rb-accent, #ff6a1a);
          background: var(--rb-accent, #ff6a1a);
        }

        .packing-item-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }

        .packing-item-copy strong {
          overflow: hidden;
          color: #e9ebed;
          font-size: 14px;
          font-weight: 650;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .packing-item.packed .packing-item-copy strong {
          color: #737b82;
          text-decoration: line-through;
        }

        .packing-item-copy i {
          color: var(--rb-muted, #8f989f);
          font-size: 10px;
          font-style: normal;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .packing-item-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          opacity: 0.45;
          transition: opacity 0.18s ease;
        }

        .packing-item:hover .packing-item-actions {
          opacity: 1;
        }

        .packing-item-actions button {
          border: 0;
          background: transparent;
          color: #8f989f;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .packing-item-actions button:hover {
          color: #fff;
        }

        .packing-item-actions .danger {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          font-size: 18px;
          line-height: 1;
        }

        .packing-item-actions .danger:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .packing-form-card {
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

        .packing-form-card h2 {
          margin: 7px 0 8px;
          font-size: 25px;
          letter-spacing: -0.03em;
        }

        .packing-form-card > p:not(.eyebrow) {
          margin: 0 0 24px;
          color: var(--rb-muted, #8f989f);
          font-size: 13px;
          line-height: 1.6;
        }

        .packing-form-card .data-form {
          gap: 17px;
        }

        .packing-form-card .data-form label {
          color: #aeb5ba;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .packing-form-card .data-form input,
        .packing-form-card .data-form select {
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
          font-size: 13px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .packing-form-card .data-form select {
          appearance: none;
          cursor: pointer;
        }

        .packing-form-card .data-form input:focus,
        .packing-form-card .data-form select:focus {
          border-color: rgba(255, 106, 26, 0.65);
          box-shadow: 0 0 0 3px rgba(255, 106, 26, 0.08);
        }

        .packing-form-card .button {
          justify-content: center;
          width: 100%;
          margin-top: 3px;
        }

        .packing-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(5, 7, 10, 0.72);
          backdrop-filter: blur(10px);
        }

        .packing-modal {
          width: min(520px, 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          background:
            radial-gradient(
              circle at 100% 0,
              rgba(255, 106, 26, 0.1),
              transparent 42%
            ),
            #101316;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.48);
          overflow: hidden;
        }

        .packing-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 26px 26px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .packing-modal-header h2 {
          margin: 6px 0 0;
          font-size: 24px;
          letter-spacing: -0.03em;
        }

        .packing-modal-close {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          color: #e9ebed;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .packing-modal-close:hover {
          border-color: rgba(255, 106, 26, 0.4);
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
        }

        .packing-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 22px 26px 26px;
        }

        .packing-modal-form label {
          color: #aeb5ba;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .packing-modal-form input,
        .packing-modal-form select {
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
          font-size: 13px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .packing-modal-form select {
          appearance: none;
          cursor: pointer;
        }

        .packing-modal-form input:focus,
        .packing-modal-form select:focus {
          border-color: rgba(255, 106, 26, 0.65);
          box-shadow: 0 0 0 3px rgba(255, 106, 26, 0.08);
        }

        .packing-modal-foot {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }

        .ghost-button {
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: transparent;
          color: #c8cdd1;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .ghost-button:hover {
          border-color: rgba(255, 106, 26, 0.35);
          color: var(--rb-accent, #ff6a1a);
        }

        .packing-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 260px;
          padding: 30px;
          text-align: center;
        }

        .packing-empty > span {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          margin-bottom: 14px;
          border: 1px solid rgba(255, 106, 26, 0.25);
          border-radius: 50%;
          background: rgba(255, 106, 26, 0.08);
          color: var(--rb-accent, #ff6a1a);
          font-size: 22px;
        }

        .packing-empty strong {
          font-size: 15px;
        }

        .packing-empty p {
          margin: 7px 0 0;
          color: var(--rb-muted, #8f989f);
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .packing-hero {
            align-items: flex-start;
            flex-direction: column;
            min-height: auto;
            padding: 30px;
          }

          .packing-readiness {
            width: 100%;
          }

          .packing-layout {
            grid-template-columns: 1fr;
          }

          .packing-form-card {
            order: -1;
          }

          .packing-header-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 600px) {
          .packing-hero {
            padding: 24px;
            border-radius: 18px;
          }

          .packing-hero h1 {
            font-size: 44px;
          }

          .packing-card-header {
            padding: 22px 20px 18px;
          }

          .packing-card-header,
          .packing-header-actions {
            gap: 8px;
          }

          .packing-item {
            padding-left: 18px;
            padding-right: 14px;
          }

          .packing-category-heading {
            padding-left: 18px;
            padding-right: 14px;
          }

          .packing-item-actions {
            opacity: 1;
          }

          .packing-header-actions {
            width: 100%;
          }

          .group-toggle {
            width: 100%;
          }

          .packing-form-card {
            padding: 22px;
          }

          .check-list {
            max-height: 240px;
          }

          .check-list::-webkit-scrollbar {
            width: 8px;
          }

          .packing-modal-backdrop {
            padding: 14px;
          }

          .packing-modal-header,
          .packing-modal-form {
            padding-left: 18px;
            padding-right: 18px;
          }

          .packing-modal-foot {
            flex-direction: column;
          }

          .packing-modal-foot .button,
          .ghost-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function PackingPage() {
  return (
    <PageState>
      <Packing />
    </PageState>
  );
}
