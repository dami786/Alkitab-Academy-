import { Link } from "react-router-dom";
import { useContent } from "../content.jsx";

export default function Footer() {
  const { content } = useContent();
  const contact = content?.contact || {};

  return (
    <footer className="no-print bg-pineDark text-white">
      <div className="h-1 bg-gold" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <h2 className="text-lg font-extrabold">Al-Kitab International Academy</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            The Rahmat-e-Kainat ﷺ Seerah Quiz Competition invites young people to study the life of Prophet Muhammad ﷺ,
            understand his teachings, and carry his example into daily life.
          </p>
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
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Support</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>Address: {contact.address || "Abbottabad, Pakistan"}</li>
            <li className="break-all">Email: {contact.email || "—"}</li>
            <li>Helpline: {contact.phone || "03135671167"}</li>
            <li>WhatsApp: {contact.whatsapp || "03135671167"}</li>
            <li>Timing: {contact.hours || "Monday – Saturday"}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/60">
        <p>© {new Date().getFullYear()} Rahmat-e-Kainat Quiz Competition. Al-Kitab International Academy.</p>
        <Link to="/admin" className="mt-2 inline-block text-white/40 hover:text-gold">Academy office</Link>
      </div>
    </footer>
  );
}
