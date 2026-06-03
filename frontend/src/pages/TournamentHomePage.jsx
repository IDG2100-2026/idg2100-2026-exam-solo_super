import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function TournamentHomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5008/api/tournaments");
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load tournaments.");
          return;
        }

        setTournaments(data.data || []);
      } catch (err) {
        console.error("Tournament fetch error:", err);
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

    const now = new Date();
    const upcomingTournaments = tournaments.filter((tournament) => {
      if (!tournament.startDate) return false;

      return (
        new Date(tournament.startDate) >= now &&
        tournament.status !== "cancelled" &&
        tournament.status !== "finished"
      );
    });

  if (loading) {
    return (
      <main className="tournament-list-page">
        <h1>Tournaments</h1>
        <p>Loading tournaments...</p>
      </main>
    );
  }

  return (
    <main className="tournament-list-page">
      <section className="tournament-list-header">
        <h1>Tournaments</h1>
        <p>Browse upcoming Spanish Poker Dice tournaments.</p>
      </section>

      {error && <p className="form-error">{error}</p>}

      {upcomingTournaments.length === 0 ? (
        <section className="tournament-empty">
          <p>No tournaments available right now.</p>
        </section>
      ) : (
        <section className="tournament-grid">
          {upcomingTournaments.map((tournament) => (
            <article key={tournament._id} className="tournament-card">
              <h2>{tournament.title}</h2>

              <p>
                <strong>Date:</strong>{" "}
                {tournament.startDate
                  ? new Date(tournament.startDate).toLocaleString()
                  : "Not set"}
              </p>

              <p>
                <strong>Format:</strong>{" "}
                Best of {tournament.bestOf} ·{" "}
                {tournament.straightsAllowed ? "Straights allowed" : "Straights off"} ·{" "}
                {tournament.roundTimeSeconds}s
              </p>

              <p>
                <strong>Players:</strong>{" "}
                {tournament.participants?.length || 0}/{tournament.maxPlayers}
              </p>

              <p>
                <strong>Status:</strong> {tournament.status}
              </p>

              <p>
                <strong>Trophy:</strong>{" "}
                {tournament.trophy?.title || "No trophy title"}
              </p>

              <Link
                to={`/tournaments/${tournament._id}`}
                className="tournament-link-button"
              >
                View Tournament
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default TournamentHomePage;