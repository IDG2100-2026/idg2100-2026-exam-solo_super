import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";

function VerifyEmailPage() {
  const { token } = useParams();
  const [message, setMessage] = useState("Verifying email...");
  const [success, setSuccess] = useState(false);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `http://localhost:5008/api/auth/verify-email/${token}`
        );

        const data = await response.json();

        setSuccess(response.ok);
        setMessage(data.message || "Verification failed.");
      } catch (error) {
        setSuccess(false);
        setMessage("Could not connect to the server.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Email Verification</h1>

        <p className={success ? "form-success" : "form-error"}>
          {message}
        </p>

        <Link to="/login">Go to login</Link>
      </section>
    </main>
  );
}

export default VerifyEmailPage;