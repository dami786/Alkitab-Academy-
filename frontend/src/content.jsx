import { createContext, useContext, useEffect, useState } from "react";
import { defaultSettings } from "../../backend/src/defaults.js";
import { getContent } from "./api";

const ContentContext = createContext(null);

function renameAcademy(value) {
  if (typeof value === "string") {
    let next = value.split("Al-Kitab International Academy").join("Al-Kitab International Quran Academy");
    if (!next.includes("دامت برکاتہم")) next = next.split("مفتی مصطفیٰ عزیز").join("مفتی مصطفٰی عزیز دامت برکاتہم");
    if (!next.includes("damat barakatuhum")) next = next.split("Mufti Mustafa Aziz").join("Mufti Mustafa Aziz, damat barakatuhum");
    return next;
  }
  if (Array.isArray(value)) return value.map(renameAcademy);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renameAcademy(item)]));
  }
  return value;
}

function applySiteCopy(settings) {
  const next = renameAcademy({ ...defaultSettings, ...settings });
  next.hero = {
    ...next.hero,
    urduTitle: "الکتاب انٹرنیشنل قرآن اکیڈمی کے زیر اہتمام رحمت کائنات سیرت کوئز کمپٹیشن 27-2026",
  };
  next.books = (next.books || []).map((book, index) => ({
    ...book,
    image: ["/book-raheeq.jpg", "/book-aasan.png"][index] || book.image,
    author: index === 1 ? "مفتی مصطفٰی عزیز دامت برکاتہم" : book.author,
  }));
  next.payment = {
    ...next.payment,
    bankName: "Meezan Bank",
    accountTitle: "KHIZAR HAYAT ABBASI",
    accountNumber: "15810110903850",
    iban: "PK16MEZN0015810110903850",
    branch: "ABBOTTABAD CITY BRANCH",
  };
  return next;
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => applySiteCopy(defaultSettings));
  const [error, setError] = useState("");

  const reload = () =>
    getContent()
      .then((data) => {
        if (data && typeof data === "object") setContent(applySiteCopy(data));
        setError("");
        return data;
      })
      .catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  return <ContentContext.Provider value={{ content, error, reload }}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}
