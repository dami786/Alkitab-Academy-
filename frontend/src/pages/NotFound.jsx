import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold text-pine">This page is not available</h1>
      <p className="mt-3 text-muted">The address may be incorrect. You can return to the competition homepage.</p>
      <Link to="/" className="btn-primary mt-8">Back to homepage</Link>
    </div>
  );
}
