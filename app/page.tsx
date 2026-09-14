"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { label: string; category: string; done: boolean };
type Expense = { label: string; amount: number; category: string };

const itinerary = [
  { day: "01", place: "Kochi", note: "Land, fuel up & wander Fort Kochi", km: "24 km", tag: "Arrival" },
  { day: "02", place: "Kochi → Munnar", note: "Waterfalls, tea gardens & cool mountain bends", km: "127 km", tag: "Ride day" },
  { day: "03", place: "Munnar", note: "Sunrise at Top Station + slow tea estate day", km: "46 km", tag: "Explore" },
  { day: "04", place: "Munnar → Thekkady", note: "Cardamom hills and Periyar forests", km: "93 km", tag: "Ride day" },
  { day: "05", place: "Thekkady → Varkala", note: "Trade forest green for Arabian Sea blue", km: "171 km", tag: "Long ride" },
  { day: "06", place: "Varkala", note: "Cliff walk, sea swim, unhurried sunset", km: "18 km", tag: "Rest" }
];

const initialItems: Item[] = [
  { label: "Riding jacket & gloves", category: "Ride", done: true },
  { label: "Rain layer / poncho", category: "Ride", done: false },
  { label: "Spare bungee cords", category: "Ride", done: false },
  { label: "Power bank & charging cable", category: "Essentials", done: true },
  { label: "ID, licence & bike papers", category: "Essentials", done: true },
  { label: "Basic first-aid kit", category: "Essentials", done: false },
  { label: "Sunscreen & mosquito repellent", category: "Care", done: false }
];

export default function Home() {
  const [items, setItems] = useState(initialItems);
  const [activeDay, setActiveDay] = useState(1);
  const [startDate, setStartDate] = useState("2026-10-12");
  const [expenses, setExpenses] = useState<Expense[]>([
    { label: "Advance stay booking", amount: 2400, category: "Stays" },
    { label: "Riding gear refresh", amount: 1250, category: "Ride" }
  ]);
  const [newExpense, setNewExpense] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const completed = useMemo(() => items.filter((item) => item.done).length, [items]);
  const spent = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const daysAway = Math.max(0, Math.ceil((new Date(`${startDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000));
  const toggle = (index: number) => setItems((current) => current.map((item, i) => i === index ? { ...item, done: !item.done } : item));
  const addExpense = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(newAmount);
    if (!newExpense.trim() || !amount) return;
    setExpenses((current) => [...current, { label: newExpense.trim(), amount, category: "Other" }]);
    setNewExpense(""); setNewAmount("");
  };

  useEffect(() => {
    const saved = localStorage.getItem("kerala-roadbook");
    if (!saved) return;
    try { const trip = JSON.parse(saved); if (trip.items) setItems(trip.items); if (trip.expenses) setExpenses(trip.expenses); if (trip.startDate) setStartDate(trip.startDate); } catch { /* Keep the starter plan if saved data is invalid. */ }
  }, []);
  useEffect(() => { localStorage.setItem("kerala-roadbook", JSON.stringify({ items, expenses, startDate })); }, [items, expenses, startDate]);

  return (
    <main>
      <nav><a className="brand" href="#top"><span>✦</span> KERALA ROADBOOK</a><div className="nav-links"><a href="#route">Route</a><a href="#pack">Pack list</a><a href="#expenses">Expenses</a><a href="#notes">Notes</a></div><button className="share" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share trip ↗</button></nav>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow">SOUTH INDIA · ON TWO WHEELS</p><h1>Chase the<br/><em>monsoon.</em></h1><p className="intro">A six-day ride through tea-covered hills, wild forests, and the warm blue edge of Kerala.</p><div className="hero-actions"><a href="#route" className="primary">See the route <span>↓</span></a><span className="trip-date">DEPARTURE IN<br/><strong>{daysAway} DAYS</strong></span></div><label className="date-picker">Trip starts <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label></div>
        <div className="hero-art" aria-label="Illustration of Kerala hills"><div className="sun"/><div className="cloud cloud-one"/><div className="cloud cloud-two"/><div className="mountain far"/><div className="mountain near"/><div className="road"/><div className="bike">🏍️</div><div className="palm palm-one">♣</div><div className="palm palm-two">♣</div><p className="art-caption">MUNNAR · WESTERN GHATS</p></div>
      </section>

      <section className="stats"><div><b>479</b><span>kilometres</span></div><div><b>6</b><span>days riding</span></div><div><b>4</b><span>stays to book</span></div><div><b>₹18k</b><span>rough budget</span></div></section>

      <section className="route section" id="route"><div className="section-heading"><p className="eyebrow">THE PLAN</p><h2>Route at a glance</h2><p>Tap a day to focus your plan.</p></div><div className="route-grid"><div className="timeline">{itinerary.map((stop, index) => <button key={stop.day} className={`stop ${activeDay === index ? "selected" : ""}`} onClick={() => setActiveDay(index)}><span className="day">DAY {stop.day}</span><span className="line"/><span className="stop-info"><b>{stop.place}</b><small>{stop.note}</small></span><span className="km">{stop.km}<i>{stop.tag}</i></span></button>)}</div><aside className="route-card"><p>DAY {itinerary[activeDay].day} / {itinerary[activeDay].tag.toUpperCase()}</p><h3>{itinerary[activeDay].place}</h3><div className="mini-map"><span className="map-line"/><span className="pin p1">●</span><span className="pin p2">●</span><span className="pin p3">●</span><span className="pin p4">●</span></div><b>{itinerary[activeDay].km}</b><span>on the road</span><button>Open in Maps ↗</button></aside></div></section>

      <section className="planner section" id="pack"><div className="packing"><div className="section-heading"><p className="eyebrow">DON'T LEAVE HOME WITHOUT</p><h2>Packing checklist</h2></div><div className="progress"><span style={{ width: `${(completed / items.length) * 100}%` }}/></div><p className="progress-text">{completed} of {items.length} packed · saved on this device</p><div className="checklist">{items.map((item, index) => <label key={item.label} className={item.done ? "checked" : ""}><input type="checkbox" checked={item.done} onChange={() => toggle(index)}/><span className="box">{item.done && "✓"}</span><span>{item.label}</span><i>{item.category}</i></label>)}</div></div><aside className="budget"><p className="eyebrow">MONEY MATTERS</p><h2>Trip fund</h2><div className="fund"><b>₹11,250</b><span>of ₹18,000 goal</span><div><i style={{ width: "62.5%" }}/></div></div><div className="cost"><span>Fuel</span><b>₹4,800</b></div><div className="cost"><span>Stays</span><b>₹8,000</b></div><div className="cost"><span>Food & fun</span><b>₹5,200</b></div><a className="outline" href="#expenses">Track spend →</a></aside></section>

      <section className="utility section" id="expenses"><div className="expense-card"><p className="eyebrow">LIVE SPEND</p><h2>Expense log</h2><div className="spend-total"><span>Already logged</span><b>₹{spent.toLocaleString("en-IN")}</b></div><div className="expense-list">{expenses.map((expense, index) => <div key={`${expense.label}-${index}`}><span>{expense.label}<i>{expense.category}</i></span><b>₹{expense.amount.toLocaleString("en-IN")}</b><button aria-label={`Remove ${expense.label}`} onClick={() => setExpenses((current) => current.filter((_, i) => i !== index))}>×</button></div>)}</div><form className="expense-form" onSubmit={addExpense}><input aria-label="Expense name" placeholder="What did you pay for?" value={newExpense} onChange={(event) => setNewExpense(event.target.value)} /><input aria-label="Expense amount" placeholder="₹ Amount" inputMode="numeric" value={newAmount} onChange={(event) => setNewAmount(event.target.value)} /><button type="submit">Add</button></form></div><aside className="safety-card"><p className="eyebrow">BEFORE YOU RIDE</p><h2>Quick safety check</h2><ul><li><span>01</span> Tyre pressure, tread & brake pads</li><li><span>02</span> Chain cleaned, lubed & adjusted</li><li><span>03</span> Offline maps downloaded</li><li><span>04</span> Emergency contact shared</li></ul><div className="emergency"><b>Emergency</b><span>112 · India’s single emergency number</span></div><p className="weather-cue">☔ October can bring showers. Pack dry bags and check the forecast before each mountain leg.</p></aside></section>

      <section className="notes section" id="notes"><div><p className="eyebrow">GOOD TO KNOW</p><h2>Ride notes</h2></div><div className="note-grid"><article><span>☔</span><h3>Rain is part of it</h3><p>Keep electronics dry and start mountain rides early—the mist rolls in fast after lunch.</p></article><article><span>⛽</span><h3>Fuel before hills</h3><p>Top up in Kochi, Munnar and Kumily. The scenic stretches are worth keeping your tank full for.</p></article><article><span>☕</span><h3>Save room to linger</h3><p>The best stops are usually tiny tea stalls. Factor in time for a cup and a conversation.</p></article></div></section>
      <footer><span>MADE FOR THE OPEN ROAD</span><span>KERALA / 2026</span></footer>
    </main>
  );
}
