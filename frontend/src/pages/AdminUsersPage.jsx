import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    const response = await fetch("http://localhost:5008/api/admin/users", {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to load users.");
      return;
    }

    setUsers(data.data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (userId, updates) => {
    const response = await fetch(`http://localhost:5008/api/admin/users/${userId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to update user.");
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user._id === userId ? data.data : user))
    );
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.username}?`
    );

    if (!confirmed) return;

    const response = await fetch(
      `http://localhost:5008/api/admin/users/${user._id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to delete user.");
      return;
    }

    setUsers((prev) => prev.filter((item) => item._id !== user._id));
  };

  const filteredUsers = users.filter((user) =>
    `${user.username} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="admin-page">
      <h1>User Administration</h1>

      <Link to="/admin" className="nav-link">
        ← Back to Admin Dashboard
      </Link>

      {error && <p className="form-error">{error}</p>}

      <input
        type="search"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="admin-search"
      />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Elo</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user._id}>
              <td>
                <img
                  src={
                    user.profileImage
                      ? `http://localhost:5008${user.profileImage}`
                      : "/default_profile.png"
                  }
                  alt={user.username}
                  className="admin-user-avatar"
                />
              </td>

              <td>
                <Link to={`/profile/${user._id}`}>{user.username}</Link>
              </td>

              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isBanned ? "Banned" : "Active"}</td>
              <td>{user.eloRating}</td>

              <td>
                <button
                  type="button"
                  onClick={() =>
                    updateUser(user._id, {
                      isBanned: !user.isBanned,
                    })
                  }
                >
                  {user.isBanned ? "Unban" : "Ban"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateUser(user._id, {
                      role: user.role === "admin" ? "user" : "admin",
                    })
                  }
                >
                  {user.role === "admin" ? "Make User" : "Make Admin"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(user)}
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

export default AdminUsersPage;