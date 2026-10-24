import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../api";
import { useContent } from "../content.jsx";

const steps = ["Personal", "Location", "Photo", "Payment"];

const empty = {
  fullName: "",
  fatherName: "",
  dob: "",
  gender: "",
  identityNumber: "",
  province: "",
  city: "",
  address: "",
  mobile: "",
  email: "",
  paymentMethod: "easypaisa",
  transactionId: "",
  declaration: false,
};

function ageFrom(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function Register() {
  const { content, error } = useContent();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [busy, setBusy] = useState(false);

  const cities = useMemo(
    () => (content?.centers || []).filter((center) => center.province === form.province),
    [content, form.province]
  );
  const age = ageFrom(form.dob);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function validate(index) {
    if (index === 0) {
      if (form.fullName.trim().length < 3) return "Please enter the applicant’s full name.";
      if (form.fatherName.trim().length < 3) return "Please enter the father’s name.";
      if (age === null) return "Please enter a valid date of birth.";
      if (content && age > content.maxAge) return `Applicants must be ${content.maxAge} years of age or younger.`;
      if (!form.gender) return "Please select a gender.";
    }
    if (index === 1) {
      if (!form.province || !form.city) return "Please select a province and test city.";
      if (form.address.trim().length < 8) return "Please enter the complete address.";
      if (!/^03\d{9}$/.test(form.mobile.replace(/\D/g, ""))) return "Enter a mobile number like 03001234567.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
      if (form.identityNumber.replace(/\D/g, "").length !== 13) {
        return "Enter one 13-digit CNIC or B-Form number.";
      }
    }
    if (index === 2) {
      if (form.gender !== "Female" && !photo) return "Please upload a passport-size photograph.";
      if (!form.declaration) return "Please accept the declaration.";
    }
    if (index === 3) {
      if (form.transactionId.trim().length < 4) return "Please enter the transaction ID.";
      if (!receipt) return "Please upload the payment receipt.";
    }
    return "";
  }

  function next() {
    const problem = validate(step);
    if (problem) {
      setMessage(problem);
      return;
    }
    setStep((value) => value + 1);
  }

  async function submit(event) {
    event.preventDefault();
    const problem = validate(3);
    if (problem) {
      setMessage(problem);
      return;
    }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.set("declaration", form.declaration ? "true" : "false");
    if (photo) body.append("photo", photo);
    body.append("receipt", receipt);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(apiUrl("/api/register"), { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit the registration.");
      setRegNumber(data.regNumber);
    } catch (err) {
      const text = err?.message || "";
      setMessage(
        text === "Failed to fetch"
          ? "The website could not reach the server. Please check your connection and try again."
          : text || "Could not submit the registration."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!content) {
    return <div className="px-4 py-24 text-center text-pine">{error || "Loading registration…"}</div>;
  }

  if (!content.registrationOpen) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-pine">Registration is closed</h1>
        <p className="mt-4 text-muted">New applications are not being accepted right now. You can still check an existing registration.</p>
        <Link to="/status" className="btn-primary mt-8">Check Status</Link>
      </div>
    );
  }

  if (regNumber) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="card p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-goldDeep">Registration received</p>
          <p className="mt-4 rounded-2xl bg-gold/30 px-4 py-3 text-base font-extrabold text-pine">Your request has been received.</p>
          <h1 className="mt-6 text-3xl font-extrabold text-pine">Your registration number</h1>
          <p className="mt-6 rounded-2xl bg-cream px-4 py-5 text-3xl font-extrabold tracking-wider text-pine">{regNumber}</p>
          <p className="mt-4 text-sm leading-7 text-muted">
            Save this number. Your roll number and admit card will be available after the academy verifies the fee and approves the application.
          </p>
          <button
            type="button"
            className="btn-outline mt-6"
            onClick={() => navigator.clipboard.writeText(regNumber)}
          >
            Copy number
          </button>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/status" className="btn-primary">Check Status</Link>
            <Link to="/" className="btn-outline">Back to Home</Link>
          </div>
          <p className="mt-6 text-sm font-semibold leading-7 text-pine">
            If your request is accepted or rejected, you will receive an email.
          </p>
        </div>
      </div>
    );
  }

  const payment = content.payment;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[280px_1fr]">
      <aside className="card h-fit p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-goldDeep">Admission</p>
        <h1 className="mt-2 text-2xl font-extrabold text-pine">Registration Form</h1>
        <p className="urdu mt-3 text-sm text-muted" dir="rtl">داخلہ فارم</p>
        <p className="mt-4 rounded-xl bg-gold/30 px-3 py-2 text-sm font-extrabold leading-6 text-red-700">Registration fee is only PKR 310.</p>
        <ol className="mt-6 space-y-3">
          {steps.map((label, index) => (
            <li key={label} className="flex items-center gap-3 text-sm font-semibold">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${index <= step ? "bg-pine text-white" : "bg-cream text-muted"}`}>{index + 1}</span>
              <span className={index === step ? "text-pine" : "text-muted"}>{label}</span>
            </li>
          ))}
        </ol>
      </aside>

      <form className="card p-6 md:p-8" onSubmit={submit}>
        {step === 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full name / نام" required value={form.fullName} onChange={(v) => set("fullName", v)} />
            <Field label="Father’s name / والد کا نام" required value={form.fatherName} onChange={(v) => set("fatherName", v)} />
            <label className="block">
              <Label required>Date of birth / تاریخ پیدائش</Label>
              <input type="date" className="field" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              {age !== null && <span className="mt-1 block text-xs text-muted">Age on registration day: {age} years. Limit: {content.maxAge}.</span>}
            </label>
            <label className="block">
              <Label required>Gender / جنس</Label>
              <select className="field" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <Label required>Province / صوبہ</Label>
              <select className="field" value={form.province} onChange={(e) => { set("province", e.target.value); set("city", ""); }}>
                <option value="">Select province</option>
                {[...new Set(content.centers.map((center) => center.province))].map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label required>Test city / شہر</Label>
              <select className="field" value={form.city} onChange={(e) => set("city", e.target.value)}>
                <option value="">Select city</option>
                {cities.map((center) => (
                  <option key={center.city}>{center.city}</option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <Label required>Complete address / مکمل پتہ</Label>
              <textarea className="field min-h-24" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </label>
            <Field label="Mobile / WhatsApp" required value={form.mobile} onChange={(v) => set("mobile", v)} placeholder="03001234567" />
            <Field label="Email / ای میل" required value={form.email} onChange={(v) => set("email", v)} type="email" />
            <label className="block md:col-span-2">
              <Label required>CNIC / B-Form</Label>
              <input
                className="field"
                value={form.identityNumber}
                placeholder="12345-1234567-1"
                onChange={(e) => set("identityNumber", e.target.value)}
              />
              <span className="mt-1 block text-xs text-muted">18 سال یا اس سے زیادہ عمر کے لیے CNIC، اور 18 سال سے کم عمر کے لیے B-Form اسی خانے میں لکھیں۔</span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <label className="block">
              <Label required={form.gender !== "Female"}>Passport-size photograph / پاسپورٹ سائز تصویر</Label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="field"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPhoto(file || null);
                  setPreview(file ? URL.createObjectURL(file) : "");
                }}
              />
              <span className="mt-1 block text-xs text-muted">
                {form.gender === "Female"
                  ? "Optional for female candidates. You may upload a photo, or leave this blank and continue."
                  : "Required. A clear, recent photo of the face. PNG is preferred. Maximum 5 MB."}
              </span>
            </label>
            {preview && <img src={preview} alt="Photograph preview" className="h-36 w-28 rounded-xl object-cover ring-1 ring-gold/40" />}
            <label className="flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm leading-7">
              <input type="checkbox" className="mt-1" checked={form.declaration} onChange={(e) => set("declaration", e.target.checked)} />
              <span>
                <span className="text-red-600" aria-hidden="true">* </span>
                I confirm that I am {content.maxAge} years of age or younger, that male and female students of school, college, or madrasa may apply, that I do not hold a postgraduate qualification, that this is my only registration, and that the information given is true.
              </span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-cream p-5 text-sm leading-7 text-ink">
              <p className="font-bold text-pine">Fee payment</p>
              <p className="mt-2 rounded-xl bg-gold/30 px-3 py-2 text-base font-extrabold text-red-700">Registration fee is only PKR 310.</p>
              <p className="mt-2">{content.feeNote}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-gold/30 p-3 ring-2 ring-gold">
                  <p className="font-extrabold text-pine">EasyPaisa</p>
                  <p className="mt-1 font-extrabold">{payment.easypaisaName || "Account name will be published by the academy."}</p>
                  <p className="font-extrabold tracking-wide">{payment.easypaisaNumber || "Number not added yet."}</p>
                </div>
                <div className="rounded-xl bg-gold/30 p-3 ring-2 ring-gold">
                  <p className="font-extrabold text-pine">JazzCash</p>
                  <p className="mt-1 font-extrabold">{payment.jazzCashName || payment.easypaisaName || "Account name will be published by the academy."}</p>
                  <p className="font-extrabold tracking-wide">{payment.jazzCashNumber || "Number not added yet."}</p>
                </div>
                <div className="rounded-xl bg-gold/30 p-3 ring-2 ring-gold">
                  <p className="font-extrabold text-pine">Meezan Bank</p>
                  <p className="mt-1 font-extrabold">{payment.accountTitle || "KHIZAR HAYAT ABBASI"}</p>
                  <p className="font-extrabold tracking-wide">Account: {payment.accountNumber || "15810110903850"}</p>
                  <p className="font-extrabold">IBAN: {payment.iban || "PK16MEZN0015810110903850"}</p>
                  <p className="font-semibold">{payment.branch || "ABBOTTABAD CITY BRANCH"}</p>
                </div>
              </div>
            </div>
            <label className="block">
              <Label required>Payment method</Label>
              <select className="field" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="bank">Meezan Bank transfer</option>
              </select>
            </label>
            <Field label="Transaction ID" required value={form.transactionId} onChange={(v) => set("transactionId", v)} />
            <label className="block">
              <Label required>Payment receipt</Label>
              <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="field" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
            </label>
          </div>
        )}

        {message && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}

        <div className="mt-8 flex justify-between gap-3">
          {step > 0 ? (
            <button type="button" className="btn-outline" onClick={() => setStep((value) => value - 1)}>Back</button>
          ) : <span />}
          {step < 3 ? (
            <button type="button" className="btn-primary" onClick={next}>Continue</button>
          ) : (
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit registration"}</button>
          )}
        </div>
      </form>
    </div>
  );
}

function Label({ children, required = false }) {
  return (
    <span className="label">
      {children}
      {required && <span className="text-red-600"> *</span>}
    </span>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required = false }) {
  return (
    <label className="block">
      <Label required={required}>{label}</Label>
      <input className="field" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
