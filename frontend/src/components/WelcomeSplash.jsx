import { useEffect, useState } from "react";

export default function WelcomeSplash() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("alkitab-welcome") === "1") return undefined;
    const show = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(show);
  }, []);

  function close() {
    sessionStorage.setItem("alkitab-welcome", "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f3d48a]/95 p-4" role="dialog" aria-label="Register now">
      <button
        type="button"
        onClick={close}
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-2xl font-bold leading-none text-pine shadow-md"
        aria-label="Close"
      >
        ×
      </button>
      <img
        src="/register-now.jpg"
        alt="Rahmat-e-Kainat Quiz Competition 2026-27. Register now at alkitabinternationalacademy.com."
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
