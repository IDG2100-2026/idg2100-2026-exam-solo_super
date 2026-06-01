import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5008", {
  withCredentials: true,
});

function LobbyPage() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningMatchId, setJoiningMatchId] = useState("");
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role") || "anonymous";

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5008/api/games/matches?limit=50&sortBy=createdAt&order=desc"
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to load matches.");
        return;
      }

      const allMatches = Array.isArray(data.data) ? data.data : [];
      const visibleMatches = allMatches.filter((match) => {
      const isLobbyStatus = match.status === "waiting" || match.status === "ongoing";
      const shouldHideFromAnonymous = !userId && match.hideFromAnonymous;
      return isLobbyStatus && !shouldHideFromAnonymous;
  });

      setMatches(visibleMatches);
    } catch (err) {
      console.error("Lobby fetch error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      fetchMatches();
    }, []);

    const handleJoinMatch = async (match) => {
      if (match.status !== "waiting") {
        setError("Only waiting matches can be joined.");
        return;
      }

      try {
        setJoiningMatchId(match._id);
        setError("");

        const headers = {
          "Content-Type": "application/json",
        };

        if (userId) {
          headers["x-user-id"] = userId;
          headers["x-user-role"] = role;
        }

        const response = await fetch(
          `http://localhost:5008/api/games/matches/${match._id}/join`,
          {
            method: "PATCH",
            credentials: "include",
            headers,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to join match.");
          return;
        }

        socket.emit("match-updated", match._id);

        navigate(`/games/${match._id}`);

        navigate(`/games/${match._id}`);
      } catch (err) {
        console.error("Join match error:", err);
        setError("Could not join match.");
      } finally {
        setJoiningMatchId("");
      }
    };

    const formatVariant = (match) => {
      return `Best of ${match.bestOf} · ${
        match.straightsAllowed ? "Straights allowed" : "Straights off"
      } · ${match.roundTimeSeconds}s`;
    };

    const formatPlayers = (match) => {
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
    };

    const calculateAverageElo = (match) => {
    const ratings = [];

      if (Array.isArray(match.players)) {
        match.players.forEach((player) => {
          const elo = player?.user?.eloRating ?? null;

          if (typeof elo === "number") {
            ratings.push(elo);
          }
        });
      }

      if (ratings.length === 0) return "N/A";

      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      return Math.round(average);
    };

    if (loading) {
      return (
        <main className="lobby-page">
          <h1>Lobby</h1>
          <p>Loading matches...</p>
        </main>
      );
    }

  return (
    <main className="lobby-page">
      <section className="lobby-header">
        <h1>Game Lobby</h1>
        <p>Join waiting games or view games already in progress.</p>
        <button type="button" onClick={() => navigate("/create-game")}>
          Create Game
        </button>
      </section>

      {error && <p className="form-error">{error}</p>}

      {matches.length === 0 ? (
        <section className="lobby-empty">
          <p>No waiting or ongoing matches available.</p>
        </section>
      ) : (
        <section className="lobby-list">
          {matches.map((match) => {
            const registeredPlayers = match.players?.length || 0;
            const anonymousPlayers = match.anonymousPlayers || 0;
            const totalPlayers = registeredPlayers + anonymousPlayers;

            const alreadyJoined =
              !!userId &&
              match.players?.some((player) => {
                const playerId = player?.user?._id || player?.user;
                return playerId === userId;
              });

            return (
              <article key={match._id} className="lobby-card">
                <div className="lobby-card-info">
                  <h2>Match {match._id.slice(-6)}</h2>

                  <p>
                    <strong>Status:</strong> {match.status}
                  </p>

                  <p>
                    <strong>Variant:</strong> {formatVariant(match)}
                  </p>

                  <p>
                    <strong>Players:</strong> {formatPlayers(match)}
                  </p>

                  <p>
                    <strong>Players joined:</strong> {totalPlayers}/2
                  </p>

                  <p>
                    <strong>Average Elo:</strong> {calculateAverageElo(match)}
                  </p>
                </div>

                <div className="lobby-card-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate(`/games/${match._id}`)}
                  >
                    View
                  </button>

                  {match.status === "waiting" && !alreadyJoined && (
                    <button
                      type="button"
                      onClick={() => handleJoinMatch(match)}
                      disabled={joiningMatchId === match._id}
                    >
                      {joiningMatchId === match._id ? "Joining..." : "Join"}
                    </button>
                  )}

                  {match.status === "waiting" && alreadyJoined && (
                    <p className="match-status-note">You are already in this match.</p>
                  )}

                  {match.status === "ongoing" && (
                    <p className="match-status-note">Game already ongoing.</p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default LobbyPage;