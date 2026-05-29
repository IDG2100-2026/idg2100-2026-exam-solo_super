import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const [waitingMatches, setWaitingMatches] = useState([]);
  const [recentFinishedMatches, setRecentFinishedMatches] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);

  const [loadingLobby, setLoadingLobby] = useState(true);
  const [loadingFinished, setLoadingFinished] = useState(true);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  const [joiningMatchId, setJoiningMatchId] = useState("");
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role") || "anonymous";

  const lobbyPreviewCount =
    Number(localStorage.getItem("homepageLobbyCount")) || 5;

  useEffect(() => {
    fetchLobbyPreview();
    fetchRecentFinishedGames();
    fetchTournamentPreview();
  }, []);

  const fetchLobbyPreview = async () => {
    try {
      setLoadingLobby(true);

      const response = await fetch(
        "http://localhost:5008/api/games/matches?status=waiting&limit=20"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load lobby preview.");
      }

      setWaitingMatches(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Lobby preview error:", err);
      setError((prev) => prev || "Some homepage data could not be loaded.");
    } finally {
      setLoadingLobby(false);
    }
  };

  const fetchRecentFinishedGames = async () => {
    try {
      setLoadingFinished(true);

      const response = await fetch(
        "http://localhost:5008/api/games/matches?status=finished&limit=20&sortBy=finishedAt&order=desc"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load recent games.");
      }

      const finished = Array.isArray(data.data) ? data.data : [];
      setRecentFinishedMatches(finished.slice(0, 5));
    } catch (err) {
      console.error("Recent games error:", err);
      setError((prev) => prev || "Some homepage data could not be loaded.");
    } finally {
      setLoadingFinished(false);
    }
  };

  const fetchTournamentPreview = async () => {
    try {
      setLoadingTournaments(true);

      const response = await fetch(
        "http://localhost:5008/api/tournaments?limit=20&sortBy=startDate&order=asc"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load tournaments.");
      }

      const tournaments = Array.isArray(data.data) ? data.data : [];

      const upcoming = tournaments
        .filter((tournament) => {
          if (!tournament.startDate) return false;
          return new Date(tournament.startDate) >= new Date();
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);

      setUpcomingTournaments(upcoming);
    } catch (err) {
      console.error("Tournament preview error:", err);
      setError((prev) => prev || "Some homepage data could not be loaded.");
    } finally {
      setLoadingTournaments(false);
    }
  };

  const lobbyPreviewMatches = useMemo(() => {
    return waitingMatches.slice(0, lobbyPreviewCount);
  }, [waitingMatches, lobbyPreviewCount]);

  const handleJoinAndOpenMatch = async (matchId) => {
    try {
      setJoiningMatchId(matchId);
      setError("");

      const headers = {
        "Content-Type": "application/json",
      };

      if (userId) {
        headers["x-user-id"] = userId;
        headers["x-user-role"] = role;
      }

      const response = await fetch(
        `http://localhost:5008/api/games/matches/${matchId}/join`,
        {
          method: "PATCH",
          credentials: "include",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.message === "You have already joined this match.") {
          navigate(`/games/${matchId}`);
          return;
        }

        setError(data.message || "Failed to join match.");
        return;
      }

      navigate(`/games/${matchId}`);
    } catch (err) {
      console.error("Join match error:", err);
      setError("Could not join the match.");
    } finally {
      setJoiningMatchId("");
    }
  };

  return (
    <main className="home-page">
      <section className="hero-card">
        <h1>Spanish Poker Dice</h1>
        <p>
          Spanish Poker Dice is a fast-paced dice game inspired by poker, where
          players roll for combinations using A, K, Q, J, 8, and 7. Create a
          game, join the lobby, and compete in matches and tournaments.
        </p>
      </section>

      <section className="home-section">
        <div className="hero-actions">
          <Link to="/create-game" className="primary-action-button">
            Create New Game
          </Link>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="home-section">
        <div className="section-header">
          <h2>Lobby Preview</h2>
          <Link to="/lobby" className="section-link">
            View all
          </Link>
        </div>

        {loadingLobby ? (
          <div className="preview-empty-card">
            <p>Loading lobby preview...</p>
          </div>
        ) : lobbyPreviewMatches.length === 0 ? (
          <div className="preview-empty-card">
            <p>No joinable matches available right now.</p>
          </div>
        ) : (
          <div className="preview-grid">
            {lobbyPreviewMatches.map((match) => (
              <button
                key={match._id}
                type="button"
                className="preview-card preview-card-button"
                onClick={() => handleJoinAndOpenMatch(match._id)}
                disabled={joiningMatchId === match._id}
              >
                <h3>Match {match._id.slice(-6)}</h3>
                <p>
                  <strong>Variant:</strong> {formatVariant(match)}
                </p>
                <p>
                  <strong>Players:</strong> {formatPlayers(match)}
                </p>
                <p>
                  <strong>Average Elo:</strong> {calculateAverageElo(match)}
                </p>
                <p>
                  {joiningMatchId === match._id
                    ? "Joining..."
                    : "Click to join and open"}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-header">
          <h2>Last 5 Games Played</h2>
        </div>

        {loadingFinished ? (
          <div className="preview-empty-card">
            <p>Loading recent games...</p>
          </div>
        ) : recentFinishedMatches.length === 0 ? (
          <div className="preview-empty-card">
            <p>No finished games available yet.</p>
          </div>
        ) : (
          <div className="preview-grid">
            {recentFinishedMatches.map((match) => (
              <button
                key={match._id}
                type="button"
                className="preview-card preview-card-button"
                onClick={() => navigate(`/games/${match._id}`)}
              >
                <h3>Match {match._id.slice(-6)}</h3>
                <p>
                  <strong>Variant:</strong> {formatVariant(match)}
                </p>
                <p>
                  <strong>Players:</strong> {formatPlayers(match)}
                </p>
                <p>
                  <strong>Average Elo:</strong> {calculateAverageElo(match)}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-header">
          <h2>Tournament Preview</h2>
          <Link to="/tournaments" className="section-link">
            View all
          </Link>
        </div>

        {loadingTournaments ? (
          <div className="preview-empty-card">
            <p>Loading tournaments...</p>
          </div>
        ) : upcomingTournaments.length === 0 ? (
          <div className="preview-empty-card">
            <p>No upcoming tournaments available right now.</p>
          </div>
        ) : (
          <div className="preview-grid">
            {upcomingTournaments.map((tournament) => (
              <button
                key={tournament._id}
                type="button"
                className="preview-card preview-card-button"
                onClick={() => navigate(`/tournaments/${tournament._id}`)}
              >
                <h3>{tournament.title}</h3>
                <p>
                  <strong>Date:</strong>{" "}
                  {tournament.startDate
                    ? new Date(tournament.startDate).toLocaleString()
                    : "Not set"}
                </p>
                <p>
                  <strong>Variant:</strong> {formatVariant(tournament)}
                </p>
                <p>
                  <strong>Players signed up:</strong>{" "}
                  {tournament.participants?.length || 0}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function formatVariant(item) {
  const bestOf = item.bestOf ? `Best of ${item.bestOf}` : "Unknown format";
  const straights = item.straightsAllowed
    ? "Straights allowed"
    : "Straights off";
  const timer = item.roundTimeSeconds
    ? `${item.roundTimeSeconds}s rounds`
    : "Unknown timer";

  return `${bestOf} · ${straights} · ${timer}`;
}

function formatPlayers(match) {
  const names = [];

  if (Array.isArray(match.players)) {
    match.players.forEach((player) => {
      if (player?.user?.username) {
        names.push(player.user.username);
      } else if (player?.usernameSnapshot) {
        names.push(player.usernameSnapshot);
      }
    });
  }

  const anonymousCount = match.anonymousPlayers || 0;
  for (let i = 0; i < anonymousCount; i += 1) {
    names.push("Anonymous");
  }

  return names.length > 0 ? names.join(", ") : "No players yet";
}

function calculateAverageElo(match) {
  const ratings = [];

  if (Array.isArray(match.players)) {
    match.players.forEach((player) => {
      const elo = player?.user?.eloRating ?? player?.eloRating ?? null;
      if (typeof elo === "number") {
        ratings.push(elo);
      }
    });
  }

  if (ratings.length === 0) return "N/A";

  const average =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  return Math.round(average);
}

export default HomePage;