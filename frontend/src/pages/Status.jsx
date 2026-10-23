import { useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api";

const labels = {
  pending: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  unverified: "Receipt submitted",
  verified: "Receipt submitted",
};

export default function Status() {
  const [regNumber, setRegNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setRows(null);
    try {
      const data = await request("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNumber, mobile }),
      });
      setRows(data.registrations);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-goldDeep">Registration status</p>
      <h1 className="mt-2 text-4xl font-extrabold text-pine">Check your application</h1>
      <p className="mt-3 text-muted">Search with the registration number or the mobile number used on the form. Personal identity details stay with the academy office.</p>
      <form onSubmit={search} className="card mt-8 grid gap-4 p-6 md:grid-cols-2">
        <label>
          <span className="label">Registration number</span>
          <input className="field" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="AKSQ-0001" />
        </label>
        <label>
          <span className="label">Mobile number</span>
          <input className="field" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="03001234567" />
        </label>
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Checking…" : "Check status"}</button>
        </div>
      </form>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 space-y-4">
        {rows?.map((row) => (
          <article key={row.regNumber} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{row.regNumber}</p>
                <h2 className="text-2xl font-extrabold text-pine">{row.name}</h2>
                <p className="text-sm text-muted">{row.city}, {row.province}</p>
              </div>
              <span className="rounded-full bg-cream px-3 py-1 text-sm font-bold text-pine">{labels[row.status] || row.status}</span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Payment</dt><dd className="font-semibold">{labels[row.paymentStatus] || row.paymentStatus}</dd></div>
              <div><dt className="text-muted">Roll number</dt><dd className="font-semibold">{row.rollNumber || "Issued after approval"}</dd></div>
            </dl>
            {row.note && <p className="mt-4 text-sm text-red-700">{row.note}</p>}
            {row.admitCardReady && (
              <Link to={`/admit-card?reg=${row.regNumber}`} className="btn-primary mt-5">Download admit card</Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
