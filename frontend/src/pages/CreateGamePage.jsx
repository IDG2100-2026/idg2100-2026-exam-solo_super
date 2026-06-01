import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateGamePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bestOf: 3,
    straightsAllowed: true,
    roundTimeSeconds: 10,
    isAnonymousMatch: false,
    eloPreference: "any",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState("anonymous");

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("http://localhost:5008/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        setUserId(null);
        setRole("anonymous");
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        return null;
      }

      setUserId(data.data._id);
      setRole(data.data.role);

      return data.data;
    } catch (error) {
      console.error("Current user fetch error:", error);
      return null;
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "bestOf" || name === "roundTimeSeconds"
          ? Number(value)
          : value === "true"
          ? true
          : value === "false"
          ? false
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5008/api/games/matches", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create match.");
        return;
      }

      navigate(`/games/${data.data._id}`);
    } catch (err) {
      console.error("Create match error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-game-page">
      <section className="create-game-card">
        <h1>Create Game</h1>
        <p>Choose your Spanish Poker Dice match settings.</p>

        <form onSubmit={handleSubmit} className="create-game-form">
          <label>
            Best Of
            <select name="bestOf" value={formData.bestOf} onChange={handleChange}>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
              <option value={7}>Best of 7</option>
            </select>
          </label>

          <label>
            Straights Allowed
            <select
              name="straightsAllowed"
              value={String(formData.straightsAllowed)}
              onChange={handleChange}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <label>
            Round Time
            <select
              name="roundTimeSeconds"
              value={formData.roundTimeSeconds}
              onChange={handleChange}
            >
              <option value={3}>3 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </label>

          <label>
            Opponent Elo
            <select
              name="eloPreference"
              value={formData.eloPreference}
              onChange={handleChange}
            >
              <option value="any">Any Elo</option>
              <option value="higher">Only higher Elo</option>
              <option value="lower">Only lower Elo</option>
              <option value="similar">Similar Elo (+/- 100)</option>
            </select>
          </label>

          <label className="checkbox-label">
          <input
            type="checkbox"
            name="hideFromAnonymous"
            checked={formData.hideFromAnonymous}
            onChange={handleChange}
          />
          Hide this game from anonymous players
        </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Match"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateGamePage;