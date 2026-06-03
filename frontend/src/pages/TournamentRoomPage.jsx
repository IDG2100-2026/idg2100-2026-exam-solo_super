import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function TournamentRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const response = await fetch("http://localhost:5008/api/auth/me", {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      setCurrentUserId(data.data._id);
    }
  };

  const fetchTournament = async () => {
    const response = await fetch(`http://localhost:5008/api/tournaments/${id}`);
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to load tournament room.");
      setLoading(false);
      return;
    }

    setTournament(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchTournament();
  }, [id]);

  if (loading) {
    return (
      <main className="tournament-page">
        <h1>Loading tournament room...</h1>
      </main>
    );
  }

    const currentRound = tournament?.rounds?.find(
        (round) => round.roundNumber === tournament.currentRound
    );

    const myMatch = currentRound?.matches?.find((match) => {
    const playerOneId = match.playerOne?._id || match.playerOne;
    const playerTwoId = match.playerTwo?._id || match.playerTwo;

    return playerOneId === currentUserId || playerTwoId === currentUserId;
    });

    const myMatchId = myMatch?.matchId?._id || myMatch?.matchId;

  return (
    <main className="tournament-page">
      <section className="tournament-detail-card">
        <h1>{tournament?.title} Room</h1>

        {error && <p className="form-error">{error}</p>}

        <p>
          <strong>Status:</strong> {tournament?.status}
        </p>

        <p>
          <strong>Round:</strong>{" "}
          {tournament?.currentRound || 0}/{tournament?.totalRounds || 0}
        </p>

        {myMatchId && (
            <button
                type="button"
                onClick={() => navigate(`/games/${myMatchId}`)}
            >
                Go to Your Match
            </button>
            )}
      </section>

      <section className="tournament-detail-card">
        <h2>Current Matches</h2>

        {currentRound?.matches?.length > 0 ? (
          <ul>
            {currentRound.matches.map((match, index) => (
              <li key={index}>
                {match.status === "bye" ? (
                  <>
                    Bye: {match.playerOne?.username || "Player"}
                  </>
                ) : (
                  <>
                    {match.playerOne?.username || "Player 1"} vs{" "}
                    {match.playerTwo?.username || "Player 2"} — {match.status}{" "}

                    {match.matchId && (
                      <Link to={`/games/${match.matchId._id || match.matchId}`}>
                        View Game
                      </Link>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No matches for this round yet.</p>
        )}
      </section>

      <section className="tournament-detail-card">
        <h2>Standings</h2>

        {tournament?.standings?.length > 0 ? (
          <ol>
            {[...tournament.standings]
              .sort((a, b) => b.points - a.points)
              .map((standing) => (
                <li key={standing.user?._id || standing.user}>
                  {standing.user?.username || "Player"} — {standing.points} pts
                </li>
              ))}
          </ol>
        ) : (
          <p>No standings yet.</p>
        )}
      </section>

      <Link to={`/tournaments/${id}`}>Back to tournament details</Link>
    </main>
  );
}

export default TournamentRoomPage;