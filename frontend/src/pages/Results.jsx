import { useState } from "react";
import { request } from "../api";

export default function Results() {
  const [regNumber, setRegNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await request("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNumber }),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-goldDeep">Results</p>
      <h1 className="mt-2 text-4xl font-extrabold text-pine">Check your result</h1>
      <p className="mt-3 text-muted">Enter the registration number. A result appears here only after the academy publishes it.</p>
      <form onSubmit={search} className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="label">Registration number</span>
          <input className="field" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="AKSQ-0001" />
        </label>
        <button className="btn-primary" disabled={busy}>{busy ? "Checking…" : "View result"}</button>
      </form>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {result && (
        <article className="card mt-6 p-6">
          <h2 className="text-2xl font-extrabold text-pine">{result.name}</h2>
          <p className="text-sm text-muted">{result.regNumber}</p>
          {!result.published ? (
            <p className="mt-4 text-sm leading-7">{result.message}</p>
          ) : (
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div><dt className="text-xs uppercase text-muted">Position</dt><dd className="text-xl font-extrabold text-pine">{result.position || "—"}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Marks</dt><dd className="text-xl font-extrabold text-pine">{result.marks || "—"}</dd></div>
              <div><dt className="text-xs uppercase text-muted">City</dt><dd className="text-xl font-extrabold text-pine">{result.city}</dd></div>
              {result.remarks && <p className="text-sm text-muted sm:col-span-3">{result.remarks}</p>}
            </dl>
          )}
        </article>
      )}
    </div>
  );
}
