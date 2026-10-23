import crypto from "crypto";
import { MongoClient, Binary } from "mongodb";
import { defaultSettings } from "./defaults.js";
import { hashPassword } from "./auth.js";

let database;

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env");
  }
  const client = new MongoClient(uri, {
    maxPoolSize: 50,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  database = client.db(process.env.MONGODB_DB || "alkitab-quiz");
  await ensureIndex("registrations", { email: 1 }, { unique: true });
  await ensureIndex("registrations", { mobile: 1 }, { unique: true });
  await ensureIndex("registrations", { identityNumber: 1 }, { unique: true });
  await ensureIndex("registrations", { cnic: 1 });
  await ensureIndex("registrations", { bform: 1 });
  await ensureIndex("registrations", { status: 1 });
  await ensureIndex("registrations", { regNumber: 1 }, { unique: true });
  await ensureIndex("registrations", { createdAt: -1 });
  await ensureIndex("messages", { createdAt: -1 });
  const existing = await database.collection("meta").findOne({ _id: "app" });
  if (!existing) {
    await database.collection("meta").insertOne({
      _id: "app",
      admin: { username: "admin", passwordHash: hashPassword("AlKitab@2026") },
      jwtSecret: crypto.randomBytes(32).toString("hex"),
      counters: { registration: 0, roll: 0 },
      settings: defaultSettings,
    });
  }
  await migrateRollSlips();
  await renameAcademy();
  await migratePrizes();
  await migratePublishedDetails();
  return database;
}

function renameAcademyValue(value) {
  if (typeof value === "string") {
    return value.split("Al-Kitab Online Quran Academy").join("Al-Kitab International Academy");
  }
  if (Array.isArray(value)) return value.map(renameAcademyValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renameAcademyValue(item)]));
  }
  return value;
}

async function migratePrizes() {
  const meta = await database.collection("meta").findOne({ _id: "app" });
  const prizes = meta?.settings?.prizes;
  if (!Array.isArray(prizes)) return;
  const byPlace = Object.fromEntries(prizes.map((prize) => [prize.place, prize.amount]));
  if (byPlace["1st"] !== "PKR 200,000" || byPlace["2nd"] !== "PKR 100,000" || byPlace["3rd"] !== "PKR 50,000") return;
  const next = prizes.map((prize) => {
    if (prize.place === "1st") return { ...prize, amount: "PKR 300,000" };
    if (prize.place === "2nd") return { ...prize, amount: "PKR 200,000" };
    if (prize.place === "3rd") return { ...prize, amount: "PKR 100,000" };
    return prize;
  });
  await database.collection("meta").updateOne({ _id: "app" }, { $set: { "settings.prizes": next } });
}

async function migratePublishedDetails() {
  const meta = await database.collection("meta").findOne({ _id: "app" });
  const settings = meta?.settings;
  if (!settings) return;
  const payment = { ...(settings.payment || {}) };
  const contact = { ...(settings.contact || {}) };
  if (!payment.easypaisaName) payment.easypaisaName = "Khizar Hayyat Abbasi";
  if (!payment.easypaisaNumber) payment.easypaisaNumber = "+92313-5671167";
  if (!payment.jazzCashName) payment.jazzCashName = "Khizar Hayyat Abbasi";
  if (!payment.jazzCashNumber) payment.jazzCashNumber = "+92313-5671167";
  if (!payment.bankName) payment.bankName = "Meezan Bank";
  if (!payment.accountTitle || payment.accountTitle === "Al-Kitab International Academy" || payment.accountTitle === "Al-Kitab Online Quran Academy") {
    payment.accountTitle = "Khizar Hayyat Abbasi";
  }
  if (!payment.accountNumber) payment.accountNumber = "15 81 011 090 3850";
  if (!contact.email || contact.email === "info@alkitabacademy.com") contact.email = "alkitabquranacademy279@gmail.com";
  if (!contact.phone) contact.phone = "03135671167";
  if (!contact.whatsapp) contact.whatsapp = "03135671167";
  const maxAge = Number(settings.maxAge) === 24 || !settings.maxAge ? 25 : Number(settings.maxAge);
  const eligibility = (settings.eligibility || []).map((item) => {
    if (item.title === "Age Requirement" && String(item.text).includes("24 years")) {
      return { ...item, text: item.text.replace("24 years", "25 years") };
    }
    if (item.title === "Photograph" && String(item.text).startsWith("Each applicant must upload")) {
      return { ...item, text: "Male applicants must upload a clear, recent, passport-size photograph. Female applicants may upload a photograph if they wish. PNG is preferred." };
    }
    return item;
  });
  const top100 = String(settings.top100 || "").replace(/top 100/gi, "top 20");
  const oldFeeAnswer = "Pay the announced fee through EasyPaisa or the official bank account, then enter the transaction ID and upload the payment receipt with your registration. The academy accepts or rejects the registration. The roll number is issued when the registration is accepted.";
  const nextFeeAnswer = "Pay the announced fee through EasyPaisa, JazzCash, or the Meezan Bank account, then enter the transaction ID and upload the payment receipt with your registration. The academy accepts or rejects the registration. The roll number is issued when the registration is accepted.";
  const nextBookAnswer = defaultSettings.faq.find((item) => item.q === "Which books are included in the syllabus?")?.a;
  const oldBookAnswer = "The complete quiz is based on all three volumes of Seerat-ul-Mustafa ﷺ by Maulana Idris Kandhlavi and Muhammad Arabi ﷺ by Inayat Ullah Subhani.";
  const faq = (settings.faq || []).map((item) => {
    let answer = item.a;
    if (answer === oldFeeAnswer) answer = nextFeeAnswer;
    if (answer === oldBookAnswer && nextBookAnswer) answer = nextBookAnswer;
    if (String(answer || "").includes("24 years of age")) answer = answer.replace("24 years of age", "25 years of age");
    return answer === item.a ? item : { ...item, a: answer };
  });
  const syllabus = String(settings.syllabus?.english || "").includes("Seerat-ul-Mustafa")
    ? defaultSettings.syllabus
    : settings.syllabus;
  const books = (settings.books || []).some((book) => String(book.english || "").includes("Seerat-ul-Mustafa"))
    ? defaultSettings.books
    : settings.books;
  await database.collection("meta").updateOne(
    { _id: "app" },
    {
      $set: {
        "settings.payment": payment,
        "settings.contact": contact,
        "settings.top100": top100,
        "settings.faq": faq,
        "settings.maxAge": maxAge,
        "settings.eligibility": eligibility,
        "settings.syllabus": syllabus,
        "settings.books": books,
      },
    }
  );
}

async function renameAcademy() {
  const meta = await database.collection("meta").findOne({ _id: "app" });
  if (!meta?.settings) return;
  const settings = renameAcademyValue(meta.settings);
  if (JSON.stringify(settings) === JSON.stringify(meta.settings)) return;
  await database.collection("meta").updateOne({ _id: "app" }, { $set: { settings } });
}

async function migrateRollSlips() {
  const meta = await database.collection("meta").findOne({ _id: "app" });
  const settings = meta?.settings;
  if (!settings) return;
  const oldFaq = "The test is held at a designated center in the city you select during registration, across Khyber Pakhtunkhwa, Punjab, Sindh, and Balochistan. The exact venue, date, and time are printed on the admit card.";
  const nextFaq = "You select your city at registration. No test center is confirmed yet. The roll number slip shows your city, and the exact address appears on that slip after the academy confirms the center.";
  const oldEligibility = "Only one registration is allowed. The test will be held at a designated center in the selected city. The roll number is sent after the admission fee is confirmed.";
  const feeEligibility = "Only one registration is allowed. The candidate selects a city now. The exact test center is printed on the roll number slip after the academy confirms it. The roll number is sent after the admission fee is confirmed.";
  const nextEligibility = "Only one registration is allowed. The candidate selects a city now. The exact test center is printed on the roll number slip after the academy confirms it. The roll number is issued when the academy accepts the registration.";
  const oldFeeAnswer = "Pay the announced fee through EasyPaisa or the official bank account, then enter the transaction ID and upload the payment receipt with your registration. The roll number is issued only after the fee is verified.";
  const nextFeeAnswer = "Pay the announced fee through EasyPaisa or the official bank account, then enter the transaction ID and upload the payment receipt with your registration. The academy accepts or rejects the registration. The roll number is issued when the registration is accepted.";
  const oldRollAnswer = "After you submit the form, you receive a registration number immediately. Once the academy verifies your payment and approves the application, your roll number is issued and the admit card can be downloaded from this website.";
  const nextRollAnswer = "After you submit the form, you receive a registration number immediately. When the academy accepts the application, your roll number is issued and the admit card can be downloaded from this website.";
  const oldFeeNote = "Transfer the registration fee through EasyPaisa or the bank account, then submit the transaction ID and payment receipt. Your roll number is issued only after the fee is confirmed.";
  const nextFeeNote = "Transfer the registration fee through EasyPaisa or the bank account, then submit the transaction ID and payment receipt. Your roll number is issued when the academy accepts your registration.";
  const centers = (settings.centers || []).map((center) => {
    const placeholder = !center.venue || String(center.venue).startsWith("Designated center");
    const confirmed = center.confirmed === true && !placeholder && String(center.venue || "").trim().length >= 8;
    return {
      ...center,
      confirmed,
      venue: confirmed ? center.venue : "",
      examDate: center.examDate || "",
      examTime: center.examTime || "",
    };
  });
  const faq = (settings.faq || []).map((item) => {
    if (item.a === oldFaq) return { ...item, a: nextFaq };
    if (item.a === oldFeeAnswer) return { ...item, a: nextFeeAnswer };
    if (item.a === oldRollAnswer) return { ...item, a: nextRollAnswer };
    return item;
  });
  const eligibility = (settings.eligibility || []).map((item) =>
    item.text === oldEligibility || item.text === feeEligibility ? { ...item, text: nextEligibility } : item
  );
  const timeline = (settings.timeline || []).map((item) => {
    if (item.title === "Fee Verification") return { ...item, title: "Application Review", date: "After the form is submitted" };
    if (item.title === "Roll Number & Admit Card" && item.date === "Issued once the fee is confirmed") {
      return { ...item, date: "Issued when the application is accepted" };
    }
    return item;
  });
  const feeNote = settings.feeNote === oldFeeNote ? nextFeeNote : settings.feeNote;
  await database.collection("meta").updateOne(
    { _id: "app" },
    { $set: { "settings.centers": centers, "settings.faq": faq, "settings.eligibility": eligibility, "settings.timeline": timeline, "settings.feeNote": feeNote } }
  );
  await database.collection("registrations").updateMany(
    { examVenue: { $regex: "^Designated center" } },
    { $set: { examVenue: "", centerConfirmed: false } }
  );
  await database.collection("registrations").updateMany(
    { centerConfirmed: { $exists: false } },
    { $set: { centerConfirmed: false } }
  );
}

async function ensureIndex(collection, keys, options = {}) {
  try {
    await database.collection(collection).createIndex(keys, options);
  } catch (error) {
    const conflict = error.code === 85 || error.codeName === "IndexOptionsConflict";
    if (!conflict) throw error;
    const name = Object.entries(keys)
      .map(([key, direction]) => `${key}_${direction}`)
      .join("_");
    await database.collection(collection).dropIndex(name);
    await database.collection(collection).createIndex(keys, options);
  }
}

function db() {
  if (!database) throw new Error("Database is not connected.");
  return database;
}

export async function getMeta() {
  return db().collection("meta").findOne({ _id: "app" });
}

let publicSettings = null;
let publicSettingsAt = 0;
const PUBLIC_SETTINGS_MS = 30_000;

export function clearPublicSettingsCache() {
  publicSettings = null;
  publicSettingsAt = 0;
}

export async function getPublicSettings() {
  if (publicSettings && Date.now() - publicSettingsAt < PUBLIC_SETTINGS_MS) return publicSettings;
  const meta = await getMeta();
  publicSettings = meta?.settings || null;
  publicSettingsAt = Date.now();
  return publicSettings;
}

export async function saveSettings(settings) {
  await db().collection("meta").updateOne({ _id: "app" }, { $set: { settings } });
  clearPublicSettingsCache();
}

export async function nextNumber(counter, prefix) {
  const updated = await db().collection("meta").findOneAndUpdate(
    { _id: "app" },
    { $inc: { [`counters.${counter}`]: 1 } },
    { returnDocument: "after" }
  );
  const doc = updated?.counters ? updated : updated?.value;
  const value = doc?.counters?.[counter] || 1;
  return `${prefix}-${String(value).padStart(4, "0")}`;
}

export async function saveFile(buffer, mime) {
  const id = crypto.randomUUID();
  await db().collection("files").insertOne({
    _id: id,
    mime,
    data: new Binary(buffer),
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function readFileDataUrl(id) {
  if (!id) return null;
  const file = await db().collection("files").findOne({ _id: id });
  if (!file?.data) return null;
  const binary = file.data;
  const buffer = Buffer.isBuffer(binary)
    ? binary
    : Buffer.from(binary.value ? binary.value(true) : binary.buffer);
  return `data:${file.mime};base64,${buffer.toString("base64")}`;
}

export async function deleteFile(id) {
  if (!id) return;
  await db().collection("files").deleteOne({ _id: id });
}

export function registrations() {
  return db().collection("registrations");
}

export function messages() {
  return db().collection("messages");
}
