import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { playSound } from "../utils/soundManager";

// Imports the custom web components from oblig 1
import "../webComponents/dice-poker-board";
import "../webComponents/dice-poker-die";
import "../webComponents/dice-poker-monitor";

const socket = io("http://localhost:5008", {
  withCredentials: true,
});

function GamePage() {
  // Gets the match id from the URL
  const { id } = useParams();

  // Stores the match data from the backend
  const [match, setMatch] = useState(null);


  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  // Loading states for different async actions
  const [loading, setLoading] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);


  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  // Gives React access to the dice-poker-board web component
  const boardRef = useRef(null);


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
        return;
      }

      const data = await response.json();

      if (!response.ok) return;

      setUserId(data.data._id);
      setRole(data.data.role || "user");
    } catch (err) {
      setUserId(null);
      setRole("anonymous");
    }
  };

  // Fetches the current match from the backend
  const fetchMatch = async () => {
    try {
      setError("");

      const response = await fetch(`http://localhost:5008/api/games/matches/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load match.");
        return;
      }

      setMatch(data.data);
    } catch (err) {
      console.error("Fetch match error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };


  const fetchComments = async () => {
    try {
      const response = await fetch(
        `http://localhost:5008/api/games/comments?targetType=match&targetId=${id}`
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
      if (!id) return;

      socket.emit("join-match-room", id);

      socket.on("match-updated", () => {
        fetchMatch();
        fetchComments();
      });

      socket.on("new-comment", (comment) => {
        setComments((prevComments) => [...prevComments, comment]);
      });

      socket.on("dice-board-event", ({ eventName, detail }) => {
        console.log("Live board event:", eventName, detail);
      });

      socket.on("dice-board-state", (state) => {
        const boardElement = boardRef.current;
        if (!boardElement) return;

        boardElement.applyGameState(state);
      });

      return () => {
        socket.emit("leave-match-room", id);
        socket.off("new-comment");
        socket.off("dice-board-event");
        socket.off("match-updated");
        socket.off("dice-board-state");
      };
}, [id]);

  // Runs when the page loads or when the URL id changes
  useEffect(() => {
    fetchMatch();
    fetchCurrentUser();
    fetchComments();
  }, [id]);

  // If match is waiting for a second player, refresh every 15 seconds
  useEffect(() => {
    if (!match) return;

    const registeredPlayers = match.players || [];
    const totalPlayers = registeredPlayers.length + (match.anonymousPlayers || 0);

    if (match.status === "waiting" && totalPlayers < 2) {
      const interval = setInterval(() => {
        fetchMatch();
      }, 15000);

      // Cleanup: stops interval when component changes/unmounts
      return () => clearInterval(interval);
    }
  }, [match]);

  // Listens for the custom event from the web component when a match ends
  useEffect(() => {
    const boardElement = boardRef.current;


    if (!boardElement || !match || match.status === "finished") return;

    const handleMatchDecided = async (event) => {
      try {
        // Gets winner info from the custom event
        const { champion, scoreline } = event.detail;

        const playerOneId =
          match.players?.[0]?.user?._id || match.players?.[0]?.user || null;

        const playerTwoId =
          match.players?.[1]?.user?._id || match.players?.[1]?.user || null;

        let winnerUserId = null;
        let winnerAnonymous = false;

        // Converts web component winner name into backend winner data
        if (champion === "player1") {
          winnerUserId = playerOneId;
          winnerAnonymous = !playerOneId;
        } else if (champion === "player2") {
          winnerUserId = playerTwoId;
          winnerAnonymous = !playerTwoId;
        }

        setSubmittingResult(true);
        setError("");
        setResultMessage("");

        const response = await fetch(
          `http://localhost:5008/api/games/matches/${id}/result`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              winnerUserId,
              winnerAnonymous,
              rounds: [],
              finalOutcome: `${champion} wins the match ${scoreline.player1}-${scoreline.player2}`,
              comments: "",
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to save match result.");
          return;
        }

        setResultMessage("Match result saved successfully.");
        playSound("/sounds/victory.mp3");

    //Reload
        await fetchMatch();
        socket.emit("match-updated", id);
      } catch (err) {
        console.error("Submit match result error:", err);
        setError("Could not save the match result.");
      } finally {
        setSubmittingResult(false);
      }
    };

    //dispatch live updates
    const handleLiveBoardEvent = () => {
      const boardElement = boardRef.current;
      if (!boardElement) return;

      socket.emit("dice-board-state", {
        matchId: id,
        state: boardElement.getGameState(),
      });
  };

    boardElement.addEventListener("dp:round-start", handleLiveBoardEvent);
    boardElement.addEventListener("dp:turn-changed", handleLiveBoardEvent);
    boardElement.addEventListener("dp:roll-executed", handleLiveBoardEvent);
    boardElement.addEventListener("dp:round-decided", handleLiveBoardEvent);

    boardElement.addEventListener("dp:match-decided", handleMatchDecided);
    boardElement.addEventListener("dp:die-held-changed", handleLiveBoardEvent);
    

    // Cleanup: removes listener to avoid duplicate event handlers
    return () => {
      boardElement.removeEventListener("dp:round-start", handleLiveBoardEvent);
      boardElement.removeEventListener("dp:turn-changed", handleLiveBoardEvent);
      boardElement.removeEventListener("dp:roll-executed", handleLiveBoardEvent);
      boardElement.removeEventListener("dp:round-decided", handleLiveBoardEvent);
      boardElement.removeEventListener("dp:match-decided", handleMatchDecided);
      boardElement.removeEventListener("dp:die-held-changed", handleLiveBoardEvent);
    };
  }, [match, id]);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    // Prevents empty comments
    if (!commentText.trim()) return;

    try {
      setPostingComment(true);
      setError("");

      const response = await fetch("http://localhost:5008/api/games/comments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId || "",
          "x-user-role": role,
        },
        body: JSON.stringify({
          targetType: "match",
          targetId: id,
          content: commentText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to post comment.");
        return;
      }

      // Clears textarea and reloads comments
      setCommentText("");

      socket.emit("new-comment", {
        matchId: id,
        comment: data.data,
      });
    } catch (err) {
      console.error("Post comment error:", err);
      setError("Could not post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <main className="game-page">
        <h1>Loading match...</h1>
      </main>
    );
  }

  // Error screen if match could not be loaded
  if (error && !match) {
    return (
      <main className="game-page">
        <h1>Game Page</h1>
        <p className="form-error">{error}</p>
      </main>
    );
  }


  const registeredPlayers = match?.players || [];
  const anonymousPlayers = match?.anonymousPlayers || 0;

  const playerOne = registeredPlayers[0] || null;
  const playerTwo = registeredPlayers[1] || null;

  // Default names before real names are known
  let playerOneName = "Player 1";
  let playerTwoName = "Waiting for player 2";

  if (playerOne) {
    playerOneName = playerOne.usernameSnapshot || playerOne.user?.username || "Player 1";
  } else if (anonymousPlayers >= 1) {
    playerOneName = "Anonymous";
  }


  if (playerTwo) {
    playerTwoName = playerTwo.usernameSnapshot || playerTwo.user?.username || "Player 2";
  } else if (playerOne && anonymousPlayers >= 1) {
    playerTwoName = "Anonymous";
  } else if (!playerOne && anonymousPlayers >= 2) {
    playerTwoName = "Anonymous";
  }

  // Determines if the board should be shown
  const totalPlayers = registeredPlayers.length + anonymousPlayers;
  const isFinished = match?.status === "finished";
  const canStart = totalPlayers >= 2 && !isFinished;

  const currentUserPlayer =
  playerOne?.user?._id === userId || playerOne?.user === userId
    ? "player1"
    : playerTwo?.user?._id === userId || playerTwo?.user === userId
    ? "player2"
    : "spectator";

  return (
    <main className="game-page">
      <section className="game-header-card">
        <h1>Match {match?._id?.slice(-6)}</h1>

        <p><strong>Status:</strong> {match?.status}</p>

        <p>
          <strong>Variant:</strong> Best of {match?.bestOf} ·{" "}
          {match?.straightsAllowed ? "Straights allowed" : "Straights off"} ·{" "}
          {match?.roundTimeSeconds}s
        </p>

        <p><strong>Player 1:</strong> {playerOneName}</p>
        <p><strong>Player 2:</strong> {playerTwoName}</p>

        {error && <p className="form-error">{error}</p>}
        {resultMessage && <p className="form-success">{resultMessage}</p>}
        {submittingResult && <p>Saving match result...</p>}
      </section>

      {/* Shows finished message, waiting message, or game board */}
      {isFinished ? (
        <section className="finished-card">
          <h2>Match Finished</h2>
          <p>{match.finalOutcome || "This match has already been completed."}</p>
        </section>
      ) : !canStart ? (
        <section className="waiting-card">
          <h2>Waiting for other player</h2>
          <p>This page checks every 15 seconds to see if another player joined.</p>
        </section>
      ) : (
        <section className="game-board-card">
          <dice-poker-monitor></dice-poker-monitor>

          <dice-poker-board
            ref={boardRef}
            player1={playerOneName}
            player2={playerTwoName}
            bestof={String(match.bestOf)}
            include-straight={String(match.straightsAllowed)}
            current-user-player={currentUserPlayer}
          ></dice-poker-board>
        </section>
      )}
      <section className="game-comments-card">
        <h2>Comments</h2>

        {role !== "anonymous" && userId ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment..."
              rows="4"
            />
            <button type="submit" disabled={postingComment}>
              {postingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <p>Log in to leave a comment.</p>
        )}

        {comments.length > 0 ? (
          <div className="comment-list">
            {comments.map((comment) => (
              <article key={comment._id} className="comment-card">
                <p>
                  <strong>{comment.author?.username || "Unknown user"}</strong>
                </p>
                <p>{comment.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>No comments yet.</p>
        )}
      </section>
    </main>
  );
}

export default GamePage;