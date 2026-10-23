import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ContentProvider } from "./content.jsx";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Register from "./pages/Register";

const Status = lazy(() => import("./pages/Status"));
const AdmitCard = lazy(() => import("./pages/AdmitCard"));
const Results = lazy(() => import("./pages/Results"));
const Contact = lazy(() => import("./pages/Contact"));
const Admin = lazy(() => import("./pages/Admin"));

function PageFallback() {
  return <div className="px-4 py-24 text-center font-semibold text-pine">Loading…</div>;
}

export default function App() {
  return (
    <ContentProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/status" element={<Status />} />
            <Route path="/admit-card" element={<AdmitCard />} />
            <Route path="/results" element={<Results />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
          <Route path="/admin" element={<Suspense fallback={<PageFallback />}><Admin /></Suspense>} />
        </Routes>
      </BrowserRouter>
    </ContentProvider>
  );
}
