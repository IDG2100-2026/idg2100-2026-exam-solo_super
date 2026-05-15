import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function TournamentPage() {
  const { id } = useParams();

  const [tournament, setTournament] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role") || "anonymous";

  const fetchTournament = async () => {
    try {
      setError("");

      const response = await fetch(`http://localhost:5008/api/tournaments/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load tournament.");
        return;
      }

      setTournament(data.data);
    } catch (err) {
      console.error("Tournament fetch error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `http://localhost:5008/api/games/comments?targetType=tournament&targetId=${id}`
      );
      const data = await response.json();

      if (response.ok) {
        setComments(data.data || []);
      }
    } catch (err) {
      console.error("Comment fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTournament();
    fetchComments();
  }, [id]);

  const handleJoinTournament = async () => {
    try {
      setJoining(true);
      setError("");

      const headers = {
        "Content-Type": "application/json",
      };

      if (userId) {
        headers["x-user-id"] = userId;
        headers["x-user-role"] = role;
      }

      const response = await fetch(
        `http://localhost:5008/api/tournaments/${id}/join`,
        {
          method: "PATCH",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to join tournament.");
        return;
      }

      await fetchTournament();
    } catch (err) {
      console.error("Join tournament error:", err);
      setError("Could not join tournament.");
    } finally {
      setJoining(false);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) return;

    try {
      setPostingComment(true);
      setError("");

      const headers = {
        "Content-Type": "application/json",
      };

      if (userId) {
        headers["x-user-id"] = userId;
        headers["x-user-role"] = role;
      }

      const response = await fetch("http://localhost:5008/api/games/comments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetType: "tournament",
          targetId: id,
          content: commentText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to post comment.");
        return;
      }

      setCommentText("");
      await fetchComments();
    } catch (err) {
      console.error("Post comment error:", err);
      setError("Could not post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <main className="tournament-page">
        <h1>Loading tournament...</h1>
      </main>
    );
  }

  if (error && !tournament) {
    return (
      <main className="tournament-page">
        <h1>Tournament</h1>
        <p className="form-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="tournament-page">
      <section className="tournament-detail-card">
        <section>
        <h1>{tournament?.title}</h1>
        <p>{tournament?.description}</p>

        <p>
          <strong>Date/Time:</strong>{" "}
          {tournament?.startDate
            ? new Date(tournament.startDate).toLocaleString()
            : "Not set"}
        </p>

        <p>
          <strong>Format:</strong>{" "}
          Best of {tournament?.bestOf} ·{" "}
          {tournament?.straightsAllowed ? "Straights allowed" : "Straights off"} ·{" "}
          {tournament?.roundTimeSeconds}s
        </p>
       
        

        <p>
          <strong>Category Key:</strong> {tournament?.categoryKey}
        </p>

        <p>
          <strong>Status:</strong> {tournament?.status}
        </p>

        <p>
          <strong>Players:</strong>{" "}
          {tournament?.participants?.length || 0}/{tournament?.maxPlayers}
        </p>
         </section>
        <section>

        <div className="tournament-trophy-box">
          <h2>Trophy</h2>
          <p><strong>{tournament?.trophy?.title || "No trophy title"}</strong></p>
          {tournament?.trophy?.imageUrl ? (
            <img
              src={`http://localhost:5008${tournament.trophy.imageUrl}`}
              alt={tournament.trophy.title}
              className="tournament-trophy-image"
            />
          ) : (
            <p>No trophy image uploaded.</p>
          )}
        </div>
        </section>

        {error && <p className="form-error">{error}</p>}

        <button onClick={handleJoinTournament} disabled={joining}>
          {joining ? "Joining..." : "Join Tournament"}
        </button>
      </section>

      <section className="tournament-detail-card">
        <h2>Participants</h2>
        {tournament?.participants?.length > 0 ? (
          <ul className="participant-list">
            {tournament.participants.map((participant, index) => (
              <li key={index}>
                {participant.user?.username || "Unknown participant"}
              </li>
            ))}
          </ul>
        ) : (
          <p>No participants yet.</p>
        )}
      </section>

      
    </main>
  );
}

export default TournamentPage;