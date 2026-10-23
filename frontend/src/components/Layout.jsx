import { Outlet } from "react-router-dom";
import { useContent } from "../content.jsx";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const { content } = useContent();
  const whatsapp = (content?.contact?.whatsapp || "03135671167").replace(/\D/g, "");
  const wa = whatsapp ? `https://wa.me/${whatsapp.startsWith("0") ? `92${whatsapp.slice(1)}` : whatsapp}` : "/contact";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <a
        href={wa}
        className="no-print fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"
        aria-label="Chat on WhatsApp"
        target={whatsapp ? "_blank" : undefined}
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.4a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 14.12c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.41-.14-.95-.31-1.63-.61-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.27.64-.39 1.02-.39.12 0 .23 0 .33.01.3.01.45.03.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.28-.12.54.16.27.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.35.27.13.43.11.59-.07.16-.17.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.13.44.2.51.31.06.11.06.64-.18 1.32z" />
        </svg>
      </a>
    </div>
  );
}
