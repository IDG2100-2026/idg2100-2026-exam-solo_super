import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminCreateTournamentPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    bestOf: 3,
    straightsAllowed: true,
    roundTimeSeconds: 10,
    minPlayers: 2,
    maxPlayers: 8,
    status: "open",
    trophyTitle: "",
    trophyImageUrl: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "bestOf" ||
        name === "roundTimeSeconds" ||
        name === "minPlayers" ||
        name === "maxPlayers"
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
      const response = await fetch("http://localhost:5008/api/admin/tournaments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create tournament.");
        return;
      }

      navigate(`/tournaments/${data.data._id}`);
    } catch (error) {
      console.error("Create tournament error:", error);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-page">
      <h1>Create Tournament</h1>

      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Title
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            required
          />
        </label>

        <label>
          Start Date
          <input
            type="datetime-local"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          End Date
          <input
            type="datetime-local"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
          />
        </label>

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
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
          </select>
        </label>

        <label>
          Min Players
          <input
            type="number"
            name="minPlayers"
            value={formData.minPlayers}
            onChange={handleChange}
            min={2}
          />
        </label>

        <label>
          Max Players
          <input
            type="number"
            name="maxPlayers"
            value={formData.maxPlayers}
            onChange={handleChange}
            min={2}
          />
        </label>

        <label>
          Trophy Title
          <input
            name="trophyTitle"
            value={formData.trophyTitle}
            onChange={handleChange}
          />
        </label>

        <label>
            Trophy Image
            <input
                type="file"
                accept="image/*"
                onChange={(event) => setTrophyImage(event.target.files[0])}
            />
            </label>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Tournament"}
        </button>
      </form>
    </main>
  );
}

export default AdminCreateTournamentPage;