import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    dateOfBirth: "",
    password: "",
    repeatPassword: "",
    agreeToTerms: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 0;

    const today = new Date();
    const birthDate = new Date(dateString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const age = calculateAge(formData.dateOfBirth);

      if (
        !formData.username ||
        !formData.email ||
        !formData.dateOfBirth ||
        !formData.password ||
        !formData.repeatPassword
      ) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }

      if (formData.password !== formData.repeatPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      if (age < 18) {
        setError("You must be at least 18 years old to register.");
        setLoading(false);
        return;
      }

      if (!formData.agreeToTerms) {
        setError("You must agree to the terms and conditions.");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5008/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          age: age,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        setLoading(false);
        return;
      }

      navigate("/login");
    } catch (error) {
      setError("Something went wrong while registering.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Register</h1>
        <p>Create a new Spanish Poker Dice account.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </label>

          <label>
            Date of Birth
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Choose a password"
            />
          </label>

          <label>
            Repeat Password
            <input
              type="password"
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
            />
            I agree to the terms and conditions
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </section>
    </main>
  );
}

export default Signup;