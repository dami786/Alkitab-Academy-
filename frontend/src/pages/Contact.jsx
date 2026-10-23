import { useState } from "react";
import { useContent } from "../content.jsx";
import { request } from "../api";

export default function Contact() {
  const { content, error } = useContent();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", message: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      await request("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setNote("Your message has been sent to the academy office.");
      setForm({ name: "", mobile: "", email: "", message: "" });
    } catch (err) {
      setNote(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!content) return <div className="px-4 py-24 text-center">{error || "Loading…"}</div>;
  const contact = content.contact;
  const cards = [
    ["Helpline", contact.phone || "03135671167"],
    ["WhatsApp", contact.whatsapp || "03135671167"],
    ["Email", contact.email || "—"],
    ["Office", contact.address || "Abbottabad, Pakistan"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-goldDeep">Contact support</p>
      <h1 className="mt-2 text-4xl font-extrabold text-pine">Talk to the academy</h1>
      <p className="mt-3 max-w-2xl text-muted">Office hours: {contact.hours}. The academy can update these contact details from the office panel.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-goldDeep">{label}</h2>
            {label === "Email" && value.includes("@") ? (
              <p className="mt-2 text-sm font-semibold leading-6 text-pine">
                {value.split("@")[0]}
                <br />
                @{value.split("@")[1]}
              </p>
            ) : (
              <p className="mt-2 font-semibold text-pine">{value}</p>
            )}
          </article>
        ))}
      </div>
      <form onSubmit={send} className="card mt-8 grid max-w-3xl gap-4 p-6 md:grid-cols-2">
        <label><span className="label">Name <span className="text-red-600">*</span></span><input className="field" required minLength={3} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label><span className="label">Mobile</span><input className="field" inputMode="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
        <label className="md:col-span-2"><span className="label">Email</span><input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="md:col-span-2"><span className="label">Message <span className="text-red-600">*</span></span><textarea className="field min-h-32" required minLength={10} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
          {note && <p className="mt-3 text-sm text-pine">{note}</p>}
        </div>
      </form>
    </div>
  );
}
