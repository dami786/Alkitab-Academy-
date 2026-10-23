import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl, authHeader, request } from "../api";

const tabs = ["Overview", "Registrations", "Website", "Messages"];

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("alkitab_admin") || "");
  const [tab, setTab] = useState("Overview");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState(null);
  const [content, setContent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [note, setNote] = useState("");

  async function login(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("alkitab_admin", data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("alkitab_admin");
    setToken("");
    setDetail(null);
  }

  useEffect(() => {
    if (!token) return;
    const headers = authHeader();
    request("/api/admin/overview", { headers }).then(setStats).catch(() => logout());
  }, [token]);

  async function loadRegistrations(event) {
    event?.preventDefault();
    const params = new URLSearchParams({ q: query, status });
    const data = await request(`/api/admin/registrations?${params}`, { headers: authHeader() });
    setRows(data.registrations);
  }

  async function openRow(id) {
    const data = await request(`/api/admin/registrations/${id}`, { headers: authHeader() });
    setDetail(data);
  }

  async function act(action, extra = {}) {
    setNote("");
    try {
      await request(`/api/admin/registrations/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ action, ...extra }),
      });
      await openRow(detail.id);
      await loadRegistrations();
      setNote("Saved.");
    } catch (err) {
      setNote(err.message);
    }
  }

  async function removeCandidate() {
    if (!detail) return;
    if (!window.confirm(`Delete ${detail.fullName} (${detail.regNumber})? This cannot be undone.`)) return;
    setNote("");
    try {
      await request(`/api/admin/registrations/${detail.id}`, { method: "DELETE", headers: authHeader() });
      setDetail(null);
      await loadRegistrations();
      setNote("Candidate deleted.");
    } catch (err) {
      setNote(err.message);
    }
  }

  async function applyCitySlip(center) {
    setNote("");
    try {
      const data = await request("/api/admin/roll-slip-city", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          province: center.province,
          city: center.city,
          examDate: center.examDate || "",
          examTime: center.examTime || "",
          centerConfirmed: center.confirmed === true,
          examVenue: center.confirmed === true ? center.venue : "",
        }),
      });
      setContent(await request("/api/admin/content", { headers: authHeader() }));
      setNote(`${center.city} saved. ${data.updated} candidate ${data.updated === 1 ? "record" : "records"} updated.`);
    } catch (err) {
      setNote(err.message);
    }
  }

  async function saveResult(event) {
    event.preventDefault();
    await request(`/api/admin/registrations/${detail.id}/result`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(detail.result),
    });
    setNote("Result saved.");
  }

  async function loadContent() {
    setContent(await request("/api/admin/content", { headers: authHeader() }));
  }

  async function saveContent(event) {
    event.preventDefault();
    await request("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        ...content,
        maxAge: Number(content.maxAge),
        feeAmount: Number(content.feeAmount),
      }),
    });
    setNote("Website content updated.");
  }

  async function loadMessages() {
    const data = await request("/api/admin/messages", { headers: authHeader() });
    setMessages(data.messages);
  }

  async function markMessageRead(item) {
    if (item.read) return;
    await request(`/api/admin/messages/${item.id}/read`, { method: "PATCH", headers: authHeader() });
    setMessages((current) => current.map((message) => (message.id === item.id ? { ...message, read: true } : message)));
  }

  async function downloadExcel() {
    const response = await fetch(apiUrl("/api/admin/export"), { headers: authHeader() });
    if (!response.ok) {
      setNote("Could not download the Excel file.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alkitab-registrations.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!token) return;
    const run =
      tab === "Registrations" ? loadRegistrations() : tab === "Website" ? loadContent() : tab === "Messages" ? loadMessages() : null;
    run?.catch((err) => setNote(err.message));
  }, [tab, token]);

  if (!token) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-4">
        <form onSubmit={login} className="card w-full max-w-md p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-goldDeep">Academy office</p>
          <h1 className="mt-2 text-3xl font-extrabold text-pine">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted">Candidate records are visible only after you sign in.</p>
          <label className="mt-6 block"><span className="label">Username</span><input className="field" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          <label className="mt-4 block"><span className="label">Password</span><input type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <button className="btn-primary mt-6 w-full">Sign in</button>
          <Link to="/" className="mt-4 block text-center text-sm text-pine">Back to website</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b-4 border-gold bg-pine text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">Al-Kitab International Quran Academy</p>
            <h1 className="text-lg font-extrabold">Competition administration</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="text-sm font-semibold text-white/80">View site</Link>
            <button type="button" onClick={logout} className="text-sm font-semibold text-gold">Sign out</button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-4">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => { setTab(item); setNote(""); }} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === item ? "bg-pine text-white" : "bg-white text-pine"}`}>
            {item}
          </button>
        ))}
      </div>
      {note && <p className="mx-auto max-w-6xl px-4 text-sm font-semibold text-pine">{note}</p>}

      {tab === "Overview" && stats && (
        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:grid-cols-3">
          {[
            ["Registrations", stats.total],
            ["Pending review", stats.pending],
            ["Approved", stats.approved],
            ["Rejected", stats.rejected],
            ["New messages", stats.messages],
          ].map(([label, value]) => (
            <article key={label} className="card p-5">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-pine">{value}</p>
            </article>
          ))}
        </section>
      )}

      {tab === "Registrations" && (
        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <form onSubmit={loadRegistrations} className="card grid gap-3 p-4 md:grid-cols-3">
              <input className="field md:col-span-2" placeholder="Search name, mobile, city, number" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="flex gap-2 md:col-span-3">
                <button className="btn-primary">Search</button>
                <button type="button" className="btn-outline" onClick={downloadExcel}>Download Excel</button>
              </div>
            </form>
            <div className="mt-4 space-y-2">
              {rows.map((row) => (
                <button key={row.id} type="button" onClick={() => openRow(row.id)} className="card block w-full p-4 text-left">
                  <span className="text-xs font-bold text-goldDeep">{row.regNumber} {row.rollNumber && `· ${row.rollNumber}`}</span>
                  <span className="mt-1 block font-extrabold text-pine">{row.fullName}</span>
                  <span className="text-sm text-muted">{row.city} · {row.mobile} · {row.status === "approved" ? "accepted" : row.status}</span>
                </button>
              ))}
              {!rows.length && <p className="text-sm text-muted">No registrations match this search.</p>}
              {rows.length >= 300 && <p className="text-sm text-muted">Showing the latest 300 matches. Search a name, mobile, or registration number to find someone else.</p>}
            </div>
          </div>

          {detail && (
            <aside className="card h-fit p-5">
              <h2 className="text-xl font-extrabold text-pine">{detail.fullName}</h2>
              <p className="text-sm text-muted">{detail.fatherName} · {detail.gender} · {detail.dob}</p>
              <dl className="mt-4 space-y-1 text-sm">
                <Line k="Registration" v={detail.regNumber} />
                <Line k="Roll no." v={detail.rollNumber || "—"} />
                <Line k="Center" v={detail.centerConfirmed ? detail.examVenue : "Not confirmed yet"} />
                <Line k="CNIC / B-Form" v={detail.identityNumber || detail.cnic || detail.bform || "—"} />
                <Line k="Document" v={detail.identityType || (detail.cnic ? "CNIC" : detail.bform ? "B-Form" : "—")} />
                <Line k="Mobile" v={detail.mobile} />
                <Line k="Email" v={detail.email} />
                <Line k="City" v={`${detail.city}, ${detail.province}`} />
                <Line k="Address" v={detail.address} />
                <Line k="Payment" v={`${detail.paymentMethod} · ${detail.transactionId}`} />
              </dl>
              <div className="mt-4 flex gap-3">
                {detail.photo && <img src={detail.photo} alt="" className="h-28 w-24 rounded-lg object-cover" />}
                {detail.receipt && (
                  detail.receipt.startsWith("data:application/pdf")
                    ? <a className="text-sm font-bold text-pine" href={detail.receipt} download={`${detail.regNumber}-receipt.pdf`}>Receipt PDF</a>
                    : <img src={detail.receipt} alt="Payment receipt" className="h-28 w-24 rounded-lg object-cover" />
                )}
              </div>
              <p className="mt-4 text-sm text-muted">Accept or reject this candidate. A decision can be changed later. The receipt stays on this page for reference.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.status !== "approved" && (
                  <button type="button" className="btn-primary !px-3 !py-2" onClick={() => act("approve")}>Accept</button>
                )}
                {detail.status !== "rejected" && (
                  <button type="button" className="btn-outline !px-3 !py-2" onClick={() => act("reject", { note: window.prompt("Reason for rejection (optional)") || "" })}>Reject</button>
                )}
                <button type="button" className="btn-outline !px-3 !py-2" onClick={removeCandidate}>Delete</button>
              </div>
              <form className="mt-4 grid gap-2" onSubmit={(event) => {
                event.preventDefault();
                const venue = String(detail.examVenue || "").trim();
                const confirmed = detail.centerConfirmed === true || venue.length >= 8;
                if (confirmed && venue.length < 8) {
                  setNote("Enter the full center address (at least 8 characters), or tick “Center not confirmed yet”.");
                  return;
                }
                act("roll-slip", {
                  examDate: detail.examDate || "",
                  examTime: detail.examTime || "",
                  centerConfirmed: confirmed,
                  examVenue: confirmed ? venue : "",
                });
              }}>
                <p className="text-sm font-bold text-pine">Roll number slip</p>
                <input className="field" placeholder="Date, or leave blank to announce later" value={detail.examDate || ""} onChange={(e) => setDetail({ ...detail, examDate: e.target.value })} />
                <input className="field" placeholder="Time, or leave blank to announce later" value={detail.examTime || ""} onChange={(e) => setDetail({ ...detail, examTime: e.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={detail.centerConfirmed !== true} onChange={(e) => setDetail({ ...detail, centerConfirmed: !e.target.checked })} />
                  Center not confirmed yet
                </label>
                <input className="field" placeholder="Center address" value={detail.examVenue || ""} onChange={(e) => setDetail({ ...detail, examVenue: e.target.value, centerConfirmed: e.target.value.trim().length >= 8 ? true : detail.centerConfirmed })} />
                <button className="btn-outline">Save slip</button>
              </form>
              <form className="mt-4 grid gap-2" onSubmit={saveResult}>
                <p className="text-sm font-bold text-pine">Result</p>
                <input className="field" placeholder="Marks" value={detail.result?.marks || ""} onChange={(e) => setDetail({ ...detail, result: { ...detail.result, marks: e.target.value } })} />
                <input className="field" placeholder="Position" value={detail.result?.position || ""} onChange={(e) => setDetail({ ...detail, result: { ...detail.result, position: e.target.value } })} />
                <input className="field" placeholder="Remarks" value={detail.result?.remarks || ""} onChange={(e) => setDetail({ ...detail, result: { ...detail.result, remarks: e.target.value } })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(detail.result?.published)} onChange={(e) => setDetail({ ...detail, result: { ...detail.result, published: e.target.checked } })} />
                  Publish this result
                </label>
                <button className="btn-primary">Save result</button>
              </form>
            </aside>
          )}
        </section>
      )}

      {tab === "Website" && content && (
        <form onSubmit={saveContent} className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
          <section className="card grid gap-3 p-5 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
              <input type="checkbox" checked={content.registrationOpen} onChange={(e) => setContent({ ...content, registrationOpen: e.target.checked })} />
              Registration is open
            </label>
            <Text label="Announcement bar" value={content.announcement} onChange={(v) => setContent({ ...content, announcement: v })} />
            <Text label="Maximum age" value={content.maxAge} onChange={(v) => setContent({ ...content, maxAge: v })} />
            <Text label="Fee amount (PKR, 0 if not set)" value={content.feeAmount} onChange={(v) => setContent({ ...content, feeAmount: v })} />
            <label className="md:col-span-2"><span className="label">Fee note</span><textarea className="field min-h-20" value={content.feeNote} onChange={(e) => setContent({ ...content, feeNote: e.target.value })} /></label>
          </section>
          <section className="card grid gap-3 p-5 md:grid-cols-2">
            <h2 className="font-extrabold text-pine md:col-span-2">EasyPaisa, JazzCash and bank</h2>
            {["easypaisaName", "easypaisaNumber", "jazzCashName", "jazzCashNumber", "bankName", "accountTitle", "accountNumber", "iban"].map((key) => (
              <Text key={key} label={key} value={content.payment[key]} onChange={(v) => setContent({ ...content, payment: { ...content.payment, [key]: v } })} />
            ))}
          </section>
          <section className="card grid gap-3 p-5 md:grid-cols-2">
            <h2 className="font-extrabold text-pine md:col-span-2">Contact</h2>
            {["phone", "whatsapp", "email", "address", "hours"].map((key) => (
              <Text key={key} label={key} value={content.contact[key]} onChange={(v) => setContent({ ...content, contact: { ...content.contact, [key]: v } })} />
            ))}
          </section>
          <section className="card grid gap-3 p-5">
            <h2 className="font-extrabold text-pine">Exam date for admit cards</h2>
            <Text label="Default date" value={content.exam.date} onChange={(v) => setContent({ ...content, exam: { ...content.exam, date: v } })} />
            <Text label="Default time" value={content.exam.time} onChange={(v) => setContent({ ...content, exam: { ...content.exam, time: v } })} />
            <label><span className="label">Instructions, one per line</span>
              <textarea className="field min-h-28" value={content.exam.instructions.join("\n")} onChange={(e) => setContent({ ...content, exam: { ...content.exam, instructions: e.target.value.split("\n").filter(Boolean) } })} />
            </label>
          </section>
          <section className="card grid gap-3 p-5">
            <h2 className="font-extrabold text-pine">Prizes</h2>
            {content.prizes.map((prize, index) => (
              <div key={prize.place} className="grid gap-2 md:grid-cols-3">
                <Text label="Title" value={prize.title} onChange={(v) => updateList(content, setContent, "prizes", index, { title: v })} />
                <Text label="Amount" value={prize.amount} onChange={(v) => updateList(content, setContent, "prizes", index, { amount: v })} />
                <Text label="Detail" value={prize.detail} onChange={(v) => updateList(content, setContent, "prizes", index, { detail: v })} />
              </div>
            ))}
            <label><span className="label">Top 20 note</span><textarea className="field" value={content.top100} onChange={(e) => setContent({ ...content, top100: e.target.value })} /></label>
          </section>
          <section className="card grid gap-3 p-5">
            <h2 className="font-extrabold text-pine">Timeline, syllabus and centers</h2>
            {content.timeline.map((item, index) => (
              <div key={item.title} className="grid gap-2 md:grid-cols-2">
                <Text label="Step" value={item.title} onChange={(v) => updateList(content, setContent, "timeline", index, { title: v })} />
                <Text label="Date" value={item.date} onChange={(v) => updateList(content, setContent, "timeline", index, { date: v })} />
              </div>
            ))}
            <label><span className="label">Syllabus Urdu</span><textarea className="field min-h-24" dir="rtl" value={content.syllabus.urdu} onChange={(e) => setContent({ ...content, syllabus: { ...content.syllabus, urdu: e.target.value } })} /></label>
            <label><span className="label">Syllabus English</span><textarea className="field min-h-20" value={content.syllabus.english} onChange={(e) => setContent({ ...content, syllabus: { ...content.syllabus, english: e.target.value } })} /></label>
            {content.centers.map((center, index) => (
              <div key={`${center.province}-${center.city}`} className="grid gap-2 rounded-2xl border border-[#eadfd8] p-3 md:grid-cols-2">
                <Text label="Province" value={center.province} onChange={(v) => updateList(content, setContent, "centers", index, { province: v })} />
                <Text label="City" value={center.city} onChange={(v) => updateList(content, setContent, "centers", index, { city: v })} />
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={center.confirmed !== true}
                    onChange={(e) => updateList(content, setContent, "centers", index, { confirmed: !e.target.checked, venue: e.target.checked ? "" : center.venue })}
                  />
                  Center not confirmed yet
                </label>
                {center.confirmed === true && (
                  <Text label="Confirmed address" value={center.venue} onChange={(v) => updateList(content, setContent, "centers", index, { venue: v })} />
                )}
                <Text label="Slip date" value={center.examDate || ""} onChange={(v) => updateList(content, setContent, "centers", index, { examDate: v })} />
                <Text label="Slip time" value={center.examTime || ""} onChange={(v) => updateList(content, setContent, "centers", index, { examTime: v })} />
                <button
                  type="button"
                  className="btn-outline md:col-span-2"
                  onClick={() => applyCitySlip(center)}
                >
                  Apply this city to every candidate in {center.city}
                </button>
              </div>
            ))}
          </section>
          <section className="card grid gap-3 p-5">
            <h2 className="font-extrabold text-pine">Homepage text</h2>
            <Text label="Hero title" value={content.hero.title} onChange={(v) => setContent({ ...content, hero: { ...content.hero, title: v } })} />
            <label><span className="label">Short introduction</span><textarea className="field min-h-24" value={content.hero.intro} onChange={(e) => setContent({ ...content, hero: { ...content.hero, intro: e.target.value } })} /></label>
            <label><span className="label">Mission</span><textarea className="field min-h-24" value={content.about.mission} onChange={(e) => setContent({ ...content, about: { ...content.about, mission: e.target.value } })} /></label>
            <label><span className="label">Vision</span><textarea className="field min-h-24" value={content.about.vision} onChange={(e) => setContent({ ...content, about: { ...content.about, vision: e.target.value } })} /></label>
          </section>
          <button className="btn-primary w-fit">Save website content</button>
        </form>
      )}

      {tab === "Messages" && (
        <section className="mx-auto max-w-6xl space-y-3 px-4 py-4">
          {messages.map((item) => (
            <article key={item.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-extrabold text-pine">{item.name}</h2>
                {!item.read && <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-pine">New</span>}
              </div>
              <p className="text-sm text-muted">{item.mobile || "No mobile"} · {item.email || "No email"}</p>
              <p className="mt-2 text-sm leading-7">{item.message}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
                {!item.read && <button type="button" className="font-bold text-pine" onClick={() => markMessageRead(item)}>Mark as read</button>}
              </div>
            </article>
          ))}
          {!messages.length && <p className="text-sm text-muted">No messages yet.</p>}
        </section>
      )}
    </div>
  );
}

function Line({ k, v }) {
  return <div className="flex gap-2"><dt className="w-28 shrink-0 text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>;
}

function Text({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function updateList(content, setContent, key, index, patch) {
  const next = content[key].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
  setContent({ ...content, [key]: next });
}
