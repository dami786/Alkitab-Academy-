import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { request } from "../api";

export default function AdmitCard() {
  const [params] = useSearchParams();
  const [regNumber, setRegNumber] = useState(params.get("reg") || "");
  const [mobile, setMobile] = useState("");
  const [card, setCard] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCard(null);
    try {
      const data = await request("/api/admit-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNumber, mobile }),
      });
      setCard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="no-print">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-goldDeep">Admit card</p>
        <h1 className="mt-2 text-4xl font-extrabold text-pine">Download your roll number slip</h1>
        <p className="mt-3 text-muted">Enter the registration number and the same mobile number used in the form. The card opens after the academy accepts the registration.</p>
        <form onSubmit={load} className="card mt-8 grid gap-4 p-6 md:grid-cols-2">
          <label>
            <span className="label">Registration number</span>
            <input className="field" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
          </label>
          <label>
            <span className="label">Mobile number</span>
            <input className="field" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="03001234567" />
          </label>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={busy}>{busy ? "Opening…" : "Open admit card"}</button>
          </div>
        </form>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      </div>

      {card && (
        <article className="print-card mt-8 rounded-3xl border-4 border-gold bg-white p-6 md:p-10">
          <div className="border-b border-gold/40 pb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-goldDeep">Al-Kitab International Quran Academy</p>
            <h2 className="mt-2 text-2xl font-extrabold text-pine">{card.competition}</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Admit Card / Roll Number Slip</p>
          </div>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            {card.photo && <img src={card.photo} alt="" className="h-40 w-32 rounded-xl object-cover ring-1 ring-[#eadfd8]" />}
            <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
              <Item label="Name" value={card.name} />
              <Item label="Father’s name" value={card.fatherName} />
              <Item label="Registration number" value={card.regNumber} />
              <Item label="Roll number" value={card.rollNumber} />
              <Item label="City" value={`${card.city}, ${card.province}`} />
              <Item label="Gender" value={card.gender} />
              <Item label="Date" value={card.date || "To be announced"} />
              <Item label="Time" value={card.time || "To be announced"} />
              <Item label="Venue" value={card.centerConfirmed ? card.venue : card.venueMessage} wide />
            </dl>
          </div>
          <div className="mt-6 rounded-2xl bg-cream p-4">
            <h3 className="font-extrabold text-pine">Instructions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
              {card.instructions.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
          <button type="button" className="btn-primary no-print mt-6" onClick={() => window.print()}>Print / Save PDF</button>
        </article>
      )}
    </div>
  );
}

function Item({ label, value, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="font-bold text-ink">{value}</dd>
    </div>
  );
}
