import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminTournamentListPage() {
  const [tournaments, setTournaments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  const fetchTournaments = async () => {
    const response = await fetch("http://localhost:5008/api/admin/tournaments", {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to load tournaments.");
      return;
    }

    setTournaments(data.data || []);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCancelTournament = async (tournament) => {
    const confirmed = window.confirm(
      `Cancel tournament "${tournament.title}"?`
    );

    if (!confirmed) return;

    const response = await fetch(
      `http://localhost:5008/api/admin/tournaments/${tournament._id}/cancel`,
      {
        method: "PATCH",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to cancel tournament.");
      return;
    }

    setTournaments((prev) =>
      prev.map((item) =>
        item._id === tournament._id ? data.data : item
      )
    );
  };

  const handleDeleteTournament = async (tournament) => {
    const confirmed = window.confirm(
      `Permanently delete tournament "${tournament.title}"?`
    );

    if (!confirmed) return;

    const response = await fetch(
      `http://localhost:5008/api/admin/tournaments/${tournament._id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to delete tournament.");
      return;
    }

    setTournaments((prev) =>
      prev.filter((item) => item._id !== tournament._id)
    );
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.title
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || tournament.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="admin-page">
      <h1>Tournament Administration</h1>

      <Link to="/admin" className="nav-link">
        ← Back to Admin Dashboard
      </Link>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-controls">
        <input
          type="search"
          placeholder="Search tournaments..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="admin-search"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="theme-select"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="finished">Finished</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <Link
          to="/admin/tournaments/create"
          className="tournament-link-button"
        >
          Create Tournament
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Trophy</th>
            <th>Title</th>
            <th>Status</th>
            <th>Date</th>
            <th>Players</th>
            <th>Rules</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredTournaments.map((tournament) => (
            <tr key={tournament._id}>
              <td>
                {tournament.trophy?.imageUrl ? (
                  <img
                    src={
                      tournament.trophy.imageUrl.startsWith("http")
                        ? tournament.trophy.imageUrl
                        : `http://localhost:5008${tournament.trophy.imageUrl}`
                    }
                    alt={tournament.trophy?.title || "Trophy"}
                    className="admin-user-avatar"
                  />
                ) : (
                  "No image"
                )}
              </td>

              <td>
                <Link to={`/tournaments/${tournament._id}`}>
                  {tournament.title}
                </Link>
              </td>

              <td>{tournament.status}</td>

              <td>
                {tournament.startDate
                  ? new Date(tournament.startDate).toLocaleString()
                  : "Not set"}
              </td>

              <td>
                {tournament.participants?.length || 0}/{tournament.maxPlayers}
              </td>

              <td>
                Best of {tournament.bestOf},{" "}
                {tournament.straightsAllowed ? "Straights" : "No straights"},{" "}
                {tournament.roundTimeSeconds}s
              </td>

              <td>
                <Link to={`/admin/tournaments/create?edit=${tournament._id}`}>
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={() => handleCancelTournament(tournament)}
                  disabled={tournament.status === "cancelled"}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTournament(tournament)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default AdminTournamentListPage;