import { Link } from "react-router-dom";
import { useContent } from "../content.jsx";

const courses = [
  "Nazra Quran (With Tajweed)",
  "Quran Memorization (Hifz)",
  "Tajweed & Qira'at Course",
  "Quran Translation & Tafseer",
  "Hadith & Fiqh",
  "Dars-e-Nizami (Sarfi, Nahw)",
  "Arabic Language Course",
];

const reasons = [
  "No age limit",
  "Flexible classes via WhatsApp or Zoom",
  "Female tutors available for sisters",
];

const socials = [
  { label: "Pakistan", href: "https://wa.me/923135671167", icon: "whatsapp" },
  { label: "KSA", href: "https://wa.me/923473371350", icon: "whatsapp" },
  { label: "Email", href: "mailto:alkitabquranacademy279@gmail.com", icon: "email" },
  { label: "Facebook", href: "https://www.facebook.com/share/1BAukJFonc/", icon: "facebook" },
  { label: "YouTube", href: "https://youtube.com/@khizarabbasiofficial", icon: "youtube" },
  { label: "Channel", href: "https://whatsapp.com/channel/0029VbEdB9pKrWQp67AO3I1H", icon: "channel" },
];

function SocialIcon({ name }) {
  if (name === "whatsapp" || name === "channel") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.4a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 14.12c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.41-.14-.95-.31-1.63-.61-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.27.64-.39 1.02-.39.12 0 .23 0 .33.01.3.01.45.03.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.28-.12.54.16.27.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.35.27.13.43.11.59-.07.16-.17.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.13.44.2.51.31.06.11.06.64-.18 1.32z" />
      </svg>
    );
  }
  if (name === "email") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    );
  }
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  if (name === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export default function Footer() {
  const { content } = useContent();
  const contact = content?.contact || {};

  return (
    <footer className="no-print bg-pineDark text-white">
      <div className="h-1 bg-gold" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-extrabold">Welcome to Al-Kitab International Quran Academy</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            Light up your life with Islamic teachings from home. Alhamdulillah, our academy serves the Muslim Ummah worldwide with expert tutors.
          </p>
          <p className="mt-3 text-sm leading-7 text-white/75">
            The Rahmat-e-Kainat <span className="honorific">ﷺ</span> Seerah Quiz Competition invites young people to study the life of Prophet Muhammad <span className="honorific">ﷺ</span>,
            understand his teachings, and carry his example into daily life.
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            {socials.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="group flex w-16 flex-col items-center gap-2 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-gold ring-1 ring-gold/40 transition group-hover:bg-gold group-hover:text-pine">
                  <SocialIcon name={item.icon} />
                </span>
                <span className="text-[11px] font-semibold text-white/80 group-hover:text-gold">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Courses we offer</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {courses.map((course) => (
              <li key={course}>{course}</li>
            ))}
          </ul>
          <h2 className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-gold">Why choose us</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Information</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><a href="/#about" className="hover:text-gold">About the Competition</a></li>
            <li><a href="/#eligibility" className="hover:text-gold">Eligibility</a></li>
            <li><a href="/#syllabus" className="hover:text-gold">Syllabus</a></li>
            <li><a href="/#timeline" className="hover:text-gold">Timeline</a></li>
            <li><Link to="/status" className="hover:text-gold">Registration Status</Link></li>
          </ul>
          <h2 className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-gold">Support</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>Address: {contact.address || "Abbottabad, Pakistan"}</li>
            <li className="break-all">Email: {contact.email || "alkitabquranacademy279@gmail.com"}</li>
            <li>Helpline: {contact.phone || "03135671167"}</li>
            <li>WhatsApp: {contact.whatsapp || "03135671167"}</li>
            <li>Timing: {contact.hours || "Monday – Saturday"}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/60">
        <p>© {new Date().getFullYear()} Rahmat-e-Kainat Quiz Competition. Al-Kitab International Quran Academy.</p>
        <Link to="/admin" className="mt-2 inline-block text-white/40 hover:text-gold">Academy office</Link>
      </div>
    </footer>
  );
}
