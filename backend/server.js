import "dotenv/config";
import express from "express";
import compression from "compression";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import ExcelJS from "exceljs";
import {
  connectDb,
  deleteFile,
  getMeta,
  getPublicSettings,
  messages,
  nextNumber,
  readFileDataUrl,
  registrations,
  saveFile,
  saveSettings,
} from "./src/db.js";
import { signToken, verifyPassword, verifyToken } from "./src/auth.js";
import { prepareMail, sendDecisionEmail } from "./src/mail.js";

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.includes(origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    const host = hostname.toLowerCase();
    if (protocol !== "https:") return false;
    if (host === "alkitabinternationalacademy.com" || host === "www.alkitabinternationalacademy.com") return true;
    return host.endsWith(".vercel.app") && (host.includes("alkitab") || host.includes("alkitaab"));
  } catch {
    return false;
  }
}

const hits = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  if (hits.size > 20000) {
    for (const [storedKey, times] of hits) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length) hits.set(storedKey, fresh);
      else hits.delete(storedKey);
    }
  }
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}

app.set("trust proxy", 1);
app.use(compression());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});
app.use(cors({ origin: (origin, callback) => callback(null, isAllowedOrigin(origin)) }));
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const photoTypes = ["image/png", "image/jpeg", "image/webp"];
    const receiptTypes = [...photoTypes, "application/pdf"];
    const allowed = file.fieldname === "photo" ? photoTypes : receiptTypes;
    if (!allowed.includes(file.mimetype)) {
      cb(new Error(file.fieldname === "photo" ? "Photo must be a PNG or JPG image." : "Receipt must be an image or PDF."));
      return;
    }
    cb(null, true);
  },
});

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function clean(value, max = 200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function ageFromDob(dob) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  if (birth > today) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatCnic(value) {
  const d = digits(value);
  if (d.length !== 13) return "";
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

function toPublicRecord(item) {
  const { photoId, receiptId, _id, ...rest } = item;
  return {
    ...rest,
    identityNumber: rest.identityNumber || rest.cnic || rest.bform || "",
    identityType: rest.identityType || (rest.cnic ? "CNIC" : rest.bform ? "B-Form" : ""),
    centerConfirmed: rest.centerConfirmed === true,
    hasPhoto: Boolean(photoId),
    hasReceipt: Boolean(receiptId),
  };
}

const pendingVenueMessage =
  "The test center for this city has not been confirmed yet. Your selected city is printed on this slip. The academy will add the exact address when the center is confirmed.";

function buildSlip(record, settings) {
  const center = (settings.centers || []).find((item) => item.city === record.city && item.province === record.province);
  const confirmed = record.centerConfirmed === true && clean(record.examVenue, 200).length >= 8;
  return {
    regNumber: record.regNumber,
    rollNumber: record.rollNumber,
    name: record.fullName,
    fatherName: record.fatherName,
    gender: record.gender,
    city: record.city,
    province: record.province,
    date: record.examDate || center?.examDate || settings.exam?.date || "To be announced",
    time: record.examTime || center?.examTime || settings.exam?.time || "To be announced",
    centerConfirmed: confirmed,
    venue: confirmed ? record.examVenue : "",
    venueMessage: confirmed ? "" : pendingVenueMessage,
    instructions: settings.exam?.instructions || [],
    competition: settings.hero?.title || "",
  };
}

function slipSchedule(body) {
  const centerConfirmed = body.centerConfirmed === true || body.centerConfirmed === "true";
  const examVenue = clean(body.examVenue, 200);
  if (centerConfirmed && examVenue.length < 8) {
    throw new Error("Enter the confirmed center address, or leave the center as not confirmed.");
  }
  return {
    examDate: clean(body.examDate, 80),
    examTime: clean(body.examTime, 80),
    centerConfirmed,
    examVenue: centerConfirmed ? examVenue : "",
  };
}

function normalizeCenters(centers) {
  if (!Array.isArray(centers)) return [];
  return centers.map((center) => {
    const confirmed = center.confirmed === true || center.confirmed === "true";
    const venue = clean(center.venue, 200);
    if (confirmed && venue.length < 8) {
      throw new Error(`Enter a center address for ${center.city || "this city"}, or mark the center as not confirmed.`);
    }
    return {
      ...center,
      province: clean(center.province, 80),
      city: clean(center.city, 80),
      confirmed,
      venue: confirmed ? venue : "",
      examDate: clean(center.examDate, 80),
      examTime: clean(center.examTime, 80),
    };
  });
}

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const meta = await getMeta();
    const payload = verifyToken(token, meta.jwtSecret);
    if (!payload || payload.role !== "admin") {
      res.status(401).json({ error: "Please sign in again." });
      return;
    }
    req.admin = payload;
    next();
  } catch (error) {
    next(error);
  }
}
function toPublicStatus(record) {
  const ready = record.status === "approved" && Boolean(record.rollNumber);
  return {
    regNumber: record.regNumber,
    name: record.fullName,
    fatherName: record.fatherName,
    city: record.city,
    province: record.province,
    status: record.status,
    paymentStatus: record.paymentStatus,
    rollNumber: ready ? record.rollNumber : null,
    admitCardReady: ready,
    resultPublished: Boolean(record.result?.published),
    note: record.status === "rejected" ? record.adminNote || "" : "",
    submittedAt: record.createdAt,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/content", async (_req, res, next) => {
  try {
    const settings = await getPublicSettings();
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.post("/api/contact", async (req, res, next) => {
  try {
    const ip = req.ip || "local";
    if (!rateLimit(`contact:${ip}`, 8, 60 * 60 * 1000)) {
      res.status(429).json({ error: "Please wait before sending another message." });
      return;
    }
    const name = clean(req.body.name, 80);
    const mobile = digits(req.body.mobile);
    const email = clean(req.body.email, 120).toLowerCase();
    const message = clean(req.body.message, 1000);
    if (name.length < 3 || message.length < 10) {
      res.status(400).json({ error: "Please enter your name and a short message." });
      return;
    }
    const id = crypto.randomUUID();
    await messages().insertOne({
      _id: id,
      id,
      name,
      mobile,
      email,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

const duplicateMessage = "This candidate is already registered. The same CNIC, B-Form, mobile number, or email cannot be used again.";

app.post("/api/register", (req, res) => {
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "receipt", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Could not upload the files." });
      return;
    }
    let photoId = "";
    let receiptId = "";
    try {
      const ip = req.ip || "local";
      if (!rateLimit(`register:${ip}`, 12, 60 * 60 * 1000)) {
        res.status(429).json({ error: "Too many registration attempts. Please try again later." });
        return;
      }

      const settings = await getPublicSettings();
      if (!settings.registrationOpen) {
        res.status(403).json({ error: "Registration is currently closed." });
        return;
      }

      const fullName = clean(req.body.fullName, 80);
      const fatherName = clean(req.body.fatherName, 80);
      const dob = clean(req.body.dob, 20);
      const gender = clean(req.body.gender, 20);
      const province = clean(req.body.province, 60);
      const city = clean(req.body.city, 80);
      const address = clean(req.body.address, 300);
      const email = clean(req.body.email, 120).toLowerCase();
      const mobile = digits(req.body.mobile);
      const identityNumber = formatCnic(req.body.identityNumber || req.body.cnic || req.body.bform);
      const paymentMethod = clean(req.body.paymentMethod, 20);
      const transactionId = clean(req.body.transactionId, 40);
      const accepted = req.body.declaration === "true" || req.body.declaration === true;
      const age = ageFromDob(dob);
      const photo = req.files?.photo?.[0];
      const receipt = req.files?.receipt?.[0];
      const center = settings.centers.find((item) => item.province === province && item.city === city);
      const cityConfirmed = center?.confirmed === true && clean(center.venue, 200).length >= 8;

      if (fullName.length < 3) throw new Error("Please enter the applicant’s full name.");
      if (fatherName.length < 3) throw new Error("Please enter the father’s name.");
      if (age === null) throw new Error("Please enter a valid date of birth.");
      if (age > Number(settings.maxAge || 25)) {
        throw new Error(`Applicants must be ${settings.maxAge || 25} years of age or younger.`);
      }
      if (!["Male", "Female"].includes(gender)) throw new Error("Please select a gender.");
      if (!center) throw new Error("Please select a province and a test city.");
      if (address.length < 8) throw new Error("Please enter the complete address.");
      if (!/^03\d{9}$/.test(mobile)) throw new Error("Enter a valid Pakistani mobile number, for example 03001234567.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
      if (!identityNumber) throw new Error("Enter a 13-digit CNIC or B-Form number.");
      const identityType = age < 18 ? "B-Form" : "CNIC";
      const cnic = identityType === "CNIC" ? identityNumber : "";
      const bform = identityType === "B-Form" ? identityNumber : "";
      if (gender !== "Female" && !photo) throw new Error("Please upload a passport-size photograph.");
      if (!["easypaisa", "jazzcash", "bank"].includes(paymentMethod)) throw new Error("Please choose EasyPaisa, JazzCash, or bank transfer.");
      if (transactionId.length < 4) throw new Error("Please enter the transaction ID.");
      if (!receipt) throw new Error("Please upload the payment receipt.");
      if (!accepted) throw new Error("Please accept the declaration to continue.");

      const duplicate = await registrations().findOne({
        $or: [{ email }, { mobile }, { identityNumber }, { cnic: identityNumber }, { bform: identityNumber }],
      });
      if (duplicate) throw new Error(duplicateMessage);

      if (photo) photoId = await saveFile(photo.buffer, photo.mimetype);
      receiptId = await saveFile(receipt.buffer, receipt.mimetype);
      const regNumber = await nextNumber("registration", "AKSQ");
      const id = crypto.randomUUID();
      await registrations().insertOne({
        _id: id,
        id,
        regNumber,
        rollNumber: "",
        fullName,
        fatherName,
        dob,
        age,
        gender,
        identityNumber,
        identityType,
        cnic,
        bform,
        province,
        city,
        address,
        mobile,
        email,
        photoId,
        paymentMethod,
        transactionId,
        receiptId,
        paymentStatus: "unverified",
        status: "pending",
        adminNote: "",
        examDate: center.examDate || "",
        examTime: center.examTime || "",
        centerConfirmed: cityConfirmed,
        examVenue: cityConfirmed ? center.venue : "",
        result: { marks: "", position: "", remarks: "", published: false },
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        regNumber,
        message: "Registration received. Your roll number will be issued when the academy accepts your registration.",
      });
    } catch (error) {
      await deleteFile(photoId);
      await deleteFile(receiptId);
      const duplicate = error?.code === 11000;
      res.status(400).json({ error: duplicate ? duplicateMessage : error.message || "Could not submit the registration." });
    }
  });
});

app.post("/api/status", async (req, res, next) => {
  try {
    const regNumber = clean(req.body.regNumber, 20).toUpperCase();
    const mobile = digits(req.body.mobile);
    if (!regNumber && !mobile) {
      res.status(400).json({ error: "Enter a registration number or mobile number." });
      return;
    }
    const query = {};
    if (regNumber) query.regNumber = regNumber;
    if (mobile) query.mobile = mobile;
    const matches = await registrations().find(query).sort({ createdAt: -1 }).limit(5).toArray();
    if (!matches.length) {
      res.status(404).json({ error: "No registration was found with these details." });
      return;
    }
    res.json({ registrations: matches.map(toPublicStatus) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admit-card", async (req, res, next) => {
  try {
    const regNumber = clean(req.body.regNumber, 20).toUpperCase();
    const mobile = digits(req.body.mobile);
    const record = await registrations().findOne({ regNumber, mobile });
    if (!record) {
      res.status(404).json({ error: "Registration number and mobile number do not match." });
      return;
    }
    if (record.status === "rejected") {
      res.status(403).json({
        ready: false,
        error: "This registration was not accepted. Please contact the academy if you have a question.",
      });
      return;
    }
    if (record.status !== "approved" || !record.rollNumber) {
      res.json({
        ready: false,
        message: "Your roll number slip is not ready yet. Please check again in a few days. Keep your registration number and the mobile number you used in the form.",
      });
      return;
    }
    const settings = await getPublicSettings();
    res.json({
      ready: true,
      ...buildSlip(record, settings),
      photo: await readFileDataUrl(record.photoId),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/results", async (req, res, next) => {
  try {
    const regNumber = clean(req.body.regNumber, 20).toUpperCase();
    const record = await registrations().findOne({ regNumber });
    if (!record) {
      res.status(404).json({ error: "No registration was found with this number." });
      return;
    }
    if (!record.result?.published) {
      res.json({
        published: false,
        regNumber: record.regNumber,
        name: record.fullName,
        message: "The result for this registration has not been published yet.",
      });
      return;
    }
    res.json({
      published: true,
      regNumber: record.regNumber,
      name: record.fullName,
      city: record.city,
      marks: record.result.marks,
      position: record.result.position,
      remarks: record.result.remarks,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", async (req, res, next) => {
  try {
    const ip = req.ip || "local";
    if (!rateLimit(`login:${ip}`, 20, 15 * 60 * 1000)) {
      res.status(429).json({ error: "Too many sign-in attempts. Please wait a few minutes." });
      return;
    }
    const username = clean(req.body.username, 40);
    const password = String(req.body.password || "");
    const meta = await getMeta();
    if (username !== meta.admin.username || !verifyPassword(password, meta.admin.passwordHash)) {
      res.status(401).json({ error: "Incorrect username or password." });
      return;
    }
    const token = signToken({ role: "admin", username }, meta.jwtSecret);
    res.json({ token, username });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/overview", requireAdmin, async (_req, res, next) => {
  try {
    const [total, pending, approved, rejected, paymentPending, unread] = await Promise.all([
      registrations().countDocuments(),
      registrations().countDocuments({ status: "pending" }),
      registrations().countDocuments({ status: "approved" }),
      registrations().countDocuments({ status: "rejected" }),
      registrations().countDocuments({ paymentStatus: "unverified" }),
      messages().countDocuments({ read: false }),
    ]);
    res.json({ total, pending, approved, rejected, paymentPending, messages: unread });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/registrations", requireAdmin, async (req, res, next) => {
  try {
    const q = clean(req.query.q, 80);
    const requested = clean(req.query.status, 20).toLowerCase();
    const status = requested === "accepted" ? "approved" : requested;
    const payment = clean(req.query.payment, 20);
    const filter = {};
    if (status) filter.status = status;
    if (payment) filter.paymentStatus = payment;
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(safe, "i");
      filter.$or = ["regNumber", "fullName", "fatherName", "mobile", "email", "city", "identityNumber", "cnic", "bform", "rollNumber", "transactionId"].map(
        (field) => ({ [field]: pattern })
      );
    }
    const [grouped, list] = await Promise.all([
      registrations().aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray(),
      registrations().find(filter).sort({ createdAt: -1 }).limit(300).toArray(),
    ]);
    const counts = { all: 0, pending: 0, accepted: 0, rejected: 0 };
    for (const row of grouped) {
      counts.all += row.n;
      if (row._id === "pending") counts.pending = row.n;
      if (row._id === "approved") counts.accepted = row.n;
      if (row._id === "rejected") counts.rejected = row.n;
    }
    res.json({ counts, registrations: list.map(toPublicRecord) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/registrations/:id", requireAdmin, async (req, res, next) => {
  try {
    const record = await registrations().findOne({ id: req.params.id });
    if (!record) {
      res.status(404).json({ error: "Registration not found." });
      return;
    }
    const { photoId, receiptId, _id, ...rest } = record;
    res.json({
      ...rest,
      photo: await readFileDataUrl(photoId),
      receipt: await readFileDataUrl(receiptId),
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/registrations/:id", requireAdmin, async (req, res) => {
  const action = clean(req.body.action, 30);
  try {
    const record = await registrations().findOne({ id: req.params.id });
    if (!record) throw new Error("Registration not found.");
    const patch = {};
    if (action === "verify-payment" || action === "reject-payment") {
      throw new Error("Payment is not a separate step. Accept or reject the registration.");
    } else if (action === "approve" || action === "accept") {
      patch.status = "approved";
      patch.rollNumber = record.rollNumber || (await nextNumber("roll", "RN"));
      const meta = await getMeta();
      const center = (meta.settings.centers || []).find((item) => item.city === record.city && item.province === record.province);
      if (record.centerConfirmed !== true && center?.confirmed === true && clean(center.venue, 200).length >= 8) {
        patch.centerConfirmed = true;
        patch.examVenue = center.venue;
      }
      if (!record.examDate && center?.examDate) patch.examDate = center.examDate;
      if (!record.examTime && center?.examTime) patch.examTime = center.examTime;
    } else if (action === "reject") {
      patch.status = "rejected";
      patch.adminNote = clean(req.body.note, 300);
    } else if (action === "pending") {
      patch.status = "pending";
    } else if (action === "schedule" || action === "roll-slip") {
      Object.assign(patch, slipSchedule(req.body));
    } else {
      throw new Error("Unknown action.");
    }
    await registrations().updateOne({ id: record.id }, { $set: patch });
    const updated = { ...record, ...patch };
    let emailSent = false;
    let emailError = "";
    if (action === "approve" || action === "accept" || action === "reject") {
      const email = await sendDecisionEmail(updated);
      emailSent = email.sent;
      emailError = email.error;
      if (email.sent) {
        await registrations().updateOne({ id: record.id }, { $set: { decisionEmailStatus: updated.status } });
      }
    }
    res.json({
      id: record.id,
      status: patch.status || record.status,
      paymentStatus: patch.paymentStatus || record.paymentStatus,
      rollNumber: patch.rollNumber || record.rollNumber,
      adminNote: patch.adminNote ?? record.adminNote,
      examDate: patch.examDate ?? record.examDate,
      examTime: patch.examTime ?? record.examTime,
      centerConfirmed: patch.centerConfirmed ?? record.centerConfirmed === true,
      examVenue: patch.examVenue ?? record.examVenue,
      emailSent,
      emailError,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/admin/registrations/:id", requireAdmin, async (req, res) => {
  try {
    const record = await registrations().findOne({ id: req.params.id });
    if (!record) {
      res.status(404).json({ error: "Registration not found." });
      return;
    }
    await Promise.all([
      deleteFile(record.photoId),
      deleteFile(record.receiptId),
      registrations().deleteOne({ id: record.id }),
    ]);
    res.json({ ok: true, id: record.id, regNumber: record.regNumber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/admin/registrations/:id/result", requireAdmin, async (req, res) => {
  try {
    const result = {
      marks: clean(req.body.marks, 20),
      position: clean(req.body.position, 40),
      remarks: clean(req.body.remarks, 200),
      published: Boolean(req.body.published),
    };
    const updated = await registrations().findOneAndUpdate(
      { id: req.params.id },
      { $set: { result } },
      { returnDocument: "after" }
    );
    const doc = updated?.result ? updated : updated?.value;
    if (!doc) throw new Error("Registration not found.");
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/admin/registrations/:id/roll-slip", requireAdmin, async (req, res, next) => {
  try {
    const record = await registrations().findOne({ id: req.params.id });
    if (!record) {
      res.status(404).json({ error: "Registration not found." });
      return;
    }
    if (record.status !== "approved" || !record.rollNumber) {
      res.status(403).json({ error: "Accept the registration before opening the roll number slip." });
      return;
    }
    const meta = await getMeta();
    res.json({
      ...buildSlip(record, meta.settings),
      photo: await readFileDataUrl(record.photoId),
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/roll-slip-city", requireAdmin, async (req, res) => {
  try {
    const province = clean(req.body.province, 80);
    const city = clean(req.body.city, 80);
    const schedule = slipSchedule(req.body);
    const meta = await getMeta();
    const index = (meta.settings.centers || []).findIndex((item) => item.province === province && item.city === city);
    if (index === -1) throw new Error("Select one of the competition cities.");
    const centers = meta.settings.centers.map((item, itemIndex) =>
      itemIndex === index
        ? { ...item, confirmed: schedule.centerConfirmed, venue: schedule.examVenue, examDate: schedule.examDate, examTime: schedule.examTime }
        : item
    );
    await saveSettings({ ...meta.settings, centers });
    const result = await registrations().updateMany(
      { province, city },
      { $set: schedule }
    );
    res.json({ city, province, ...schedule, updated: result.modifiedCount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/admin/export", requireAdmin, async (_req, res, next) => {
  try {
  const cursor = registrations().find().sort({ createdAt: -1 });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Registrations");
  sheet.columns = [
    { header: "Registration No", key: "regNumber", width: 18 },
    { header: "Roll No", key: "rollNumber", width: 14 },
    { header: "Name", key: "fullName", width: 24 },
    { header: "Father Name", key: "fatherName", width: 24 },
    { header: "Date of Birth", key: "dob", width: 16 },
    { header: "Gender", key: "gender", width: 12 },
    { header: "CNIC / B-Form", key: "identityNumber", width: 22 },
    { header: "Document Type", key: "identityType", width: 16 },
    { header: "Province", key: "province", width: 22 },
    { header: "City", key: "city", width: 26 },
    { header: "Address", key: "address", width: 36 },
    { header: "Mobile", key: "mobile", width: 16 },
    { header: "Email", key: "email", width: 28 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Transaction ID", key: "transactionId", width: 22 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Application Status", key: "status", width: 18 },
    { header: "Exam Date", key: "examDate", width: 18 },
    { header: "Exam Time", key: "examTime", width: 16 },
    { header: "Venue", key: "examVenue", width: 32 },
    { header: "Center Confirmed", key: "centerConfirmed", width: 18 },
    { header: "Marks", key: "marks", width: 12 },
    { header: "Position", key: "position", width: 16 },
    { header: "Result Published", key: "published", width: 18 },
    { header: "Submitted At", key: "createdAt", width: 24 },
  ];
  sheet.getRow(1).font = { bold: true };
  for await (const item of cursor) {
    sheet.addRow({
      ...item,
      identityNumber: item.identityNumber || item.cnic || item.bform || "",
      identityType: item.identityType || (item.cnic ? "CNIC" : item.bform ? "B-Form" : ""),
      marks: item.result?.marks || "",
      position: item.result?.position || "",
      published: item.result?.published ? "Yes" : "No",
      centerConfirmed: item.centerConfirmed === true ? "Yes" : "No",
    });
  }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=alkitab-registrations.xlsx");
  await workbook.xlsx.write(res);
  res.end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/content", requireAdmin, async (_req, res, next) => {
  try {
    const meta = await getMeta();
    res.json(meta.settings);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/content", requireAdmin, async (req, res, next) => {
  try {
    const incoming = req.body || {};
    if (!incoming.hero || !incoming.contact || !Array.isArray(incoming.centers) || !Array.isArray(incoming.prizes)) {
      res.status(400).json({ error: "The content update is incomplete." });
      return;
    }
    incoming.centers = normalizeCenters(incoming.centers);
    await saveSettings(incoming);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/messages", requireAdmin, async (_req, res, next) => {
  try {
    const list = await messages().find().sort({ createdAt: -1 }).toArray();
    res.json({
      messages: list.map(({ _id, ...item }) => item),
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/messages/:id/read", requireAdmin, async (req, res, next) => {
  try {
    await messages().updateOne({ id: req.params.id }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

async function sendMissedDecisionEmails() {
  const records = await registrations().find({ status: { $in: ["approved", "rejected"] } }).toArray();
  let sent = 0;
  for (const record of records) {
    if (record.decisionEmailStatus === record.status) continue;
    const email = await sendDecisionEmail(record);
    if (!email.sent) continue;
    await registrations().updateOne({ id: record.id }, { $set: { decisionEmailStatus: record.status } });
    sent += 1;
  }
  if (sent) console.log(`Decision emails sent to ${sent} earlier candidates.`);
}

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Al-Kitab quiz API running on http://localhost:${PORT}`);
    });
    prepareMail().finally(() => {
      sendMissedDecisionEmails().catch((error) => console.error(error));
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
