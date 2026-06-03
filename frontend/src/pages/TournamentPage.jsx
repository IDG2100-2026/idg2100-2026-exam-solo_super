import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function TournamentPage() {
  const { id } = useParams();

  const [tournament, setTournament] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState("anonymous");
  const [timeLeft, setTimeLeft] = useState("");

  const isParticipant = tournament?.participants?.some((participant) => participant.user?._id === userId) || false;

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("http://localhost:5008/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        setUserId(null);
        setRole("anonymous");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setUserId(data.data._id);
        setRole(data.data.role || "user");
      }
    } catch {
      setUserId(null);
      setRole("anonymous");
    }
  };

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
    fetchCurrentUser();
    fetchComments();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTournament();
    }, 5000);

    return () => clearInterval(interval);
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
          credentials: "include",
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

  const handleLeaveTournament = async () => {
    try {
      setJoining(true);

      const response = await fetch(
        `http://localhost:5008/api/tournaments/${id}/leave`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to leave tournament.");
        return;
      }

      await fetchTournament();
    } catch (error) {
      console.error(error);
      setError("Could not leave tournament.");
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
        credentials: "include",
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

  useEffect(() => {
    if (!tournament?.startDate) return;

    const updateCountdown = () => {
      const difference = new Date(tournament.startDate) - new Date();

      if (difference <= 0) {
        setTimeLeft("Tournament has started");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [tournament?.startDate]);

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
      <section>

        <div className="tournament-trophy-box">
          <h2>Trophy</h2>

          <p>
            <strong>{tournament?.trophy?.title || "No trophy title"}</strong>
          </p>

          {tournament?.trophy?.imageUrl ? (
            <img
              src={
                tournament.trophy.imageUrl.startsWith("http")
                  ? tournament.trophy.imageUrl
                  : `http://localhost:5008${tournament.trophy.imageUrl}`
              }
              alt={tournament.trophy?.title || "Tournament trophy"}
              className="tournament-trophy-image"
            />
          ) : (
            <p>No trophy image uploaded.</p>
          )}
        </div>
        </section>

        <section className="tournament-detail-card">
          <p><strong>Status:</strong> {tournament?.status}</p>

          <p>
            <strong>Date:</strong>{" "}
            {tournament?.startDate
              ? new Date(tournament.startDate).toLocaleString()
              : "Not set"}
          </p>

          <p>
            <strong>Rules:</strong> Best of {tournament?.bestOf},{" "}
            {tournament?.straightsAllowed ? "straights allowed" : "straights off"},{" "}
            {tournament?.roundTimeSeconds}s rounds
          </p>

          <p>
            <strong>Players:</strong>{" "}
            {tournament?.participants?.length || 0}/{tournament?.maxPlayers}
          </p>

          <p>
            <strong>Minimum players:</strong> {tournament?.minPlayers}
          </p>

          <p>
            <strong>Created by:</strong>{" "}
            {tournament?.createdBy?.username || "Unknown"}
          </p>

          {error && <p className="form-error">{error}</p>}

          {isParticipant ? (
            <button onClick={handleLeaveTournament} disabled={joining}>
              {joining ? "Leaving..." : "Leave Tournament"}
            </button>
          ) : (
            <button onClick={handleJoinTournament} disabled={joining}>
              {joining ? "Joining..." : "Join Tournament"}
            </button>
          )}

          {tournament?.status === "ongoing" && (
            <Link to={`/tournaments/${id}/play`} className="tournament-link-button">
              Enter Tournament Room
            </Link>
          )}
          <p><strong>Countdown:</strong> {timeLeft || "Not available"}</p>
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

        <section className="tournament-detail-card">
        <h2>Tournament Comments</h2>

        {comments.length > 0 ? (
          <ul className="comment-list">
            {comments.map((comment) => (
              <li key={comment._id}>
                <strong>{comment.author?.username || "Unknown"}:</strong>{" "}
                {comment.content}
              </li>
            ))}
          </ul>
        ) : (
          <p>No comments yet.</p>
        )}

        {userId ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
            />

            <button type="submit" disabled={postingComment}>
              {postingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <p>Log in to comment.</p>
        )}
      </section>

      
    </main>
  );
}

export default TournamentPage;