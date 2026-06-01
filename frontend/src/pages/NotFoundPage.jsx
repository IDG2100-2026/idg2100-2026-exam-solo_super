import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>

        <Link to="/" className="button-link">Back to homepage</Link>
      </section>
    </main>
  );
}

export default NotFoundPage;