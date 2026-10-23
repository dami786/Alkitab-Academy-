import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useContent } from "../content.jsx";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/register", label: "Registration" },
  { to: "/#about", label: "About" },
  { to: "/admit-card", label: "Admit Card" },
  { to: "/results", label: "Results" },
  { to: "/#prizes", label: "Prizes" },
  { to: "/#syllabus", label: "Syllabus" },
  { to: "/#centers", label: "Centers" },
  { to: "/contact", label: "Contact" },
];

function Item({ to, label, end, onClick, block = false }) {
  const layout = block ? "block w-full rounded-xl px-3 py-3 text-left" : "whitespace-nowrap rounded-full px-3 py-2";
  const className = ({ isActive }) =>
    `${layout} text-sm font-semibold transition ${isActive ? "text-gold" : "text-white/90 hover:text-gold"}`;
  if (to.includes("#")) {
    return (
      <a href={to} onClick={onClick} className={`${layout} text-sm font-semibold text-white/90 transition hover:text-gold`}>
        {label}
      </a>
    );
  }
  return (
    <NavLink to={to} end={end} onClick={onClick} className={className}>
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { content } = useContent();
  const closed = content && !content.registrationOpen;

  return (
    <header className="no-print sticky top-0 z-40">
      <nav className="border-b-4 border-gold bg-pine text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-gold/50">
              <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
                <path d="M6 22c4-8 16-8 20 0" fill="none" stroke="#E4B15C" strokeWidth="2" />
                <path d="M8 14c3 4 13 4 16 0v8H8v-8z" fill="#FBF6F1" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold leading-tight">Al-Kitab International Academy</span>
              <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-gold sm:hidden">Quiz Competition 2026–27</span>
              <span className="mt-0.5 hidden truncate text-[11px] font-medium leading-tight text-gold sm:block">
                Rahmat-e-Kainat <span className="honorific">ﷺ</span> Quiz Competition 2026–27
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            {links.map((link) => (
              <Item key={link.label} {...link} />
            ))}
            <Link to="/register" className={`ml-2 shrink-0 whitespace-nowrap ${closed ? "btn-outline !px-4 !py-2 !text-white" : "btn-gold !px-4 !py-2"}`}>
              {closed ? "Registration Closed" : "Apply Now"}
            </Link>
          </div>

          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 xl:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <div className="space-y-1 border-t border-white/10 px-4 py-3 xl:hidden">
            {links.map((link) => (
              <Item key={link.label} {...link} block onClick={() => setOpen(false)} />
            ))}
            <Link to="/register" onClick={() => setOpen(false)} className="btn-gold mt-2 w-full whitespace-nowrap">
              {closed ? "Registration Closed" : "Apply Now"}
            </Link>
          </div>
        )}
      </nav>
      {content?.announcement && (
        <div className="bg-goldDeep px-4 py-2 text-center text-sm font-semibold text-white">{content.announcement}</div>
      )}
    </header>
  );
}
