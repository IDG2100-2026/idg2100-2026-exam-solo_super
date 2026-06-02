import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchComments = async () => {
    const response = await fetch("http://localhost:5008/api/admin/comments", {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to load comments.");
      return;
    }

    setComments(data.data || []);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDeleteComment = async (comment) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this comment?`
    );

    if (!confirmed) return;

    const response = await fetch(
      `http://localhost:5008/api/admin/comments/${comment._id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to delete comment.");
      return;
    }

    setComments((prev) => prev.filter((item) => item._id !== comment._id));
  };

  const filteredComments = comments.filter((comment) => {
    const author = comment.author?.username || "Unknown";
    const content = comment.content || "";
    const targetType = comment.targetType || "";

    return `${author} ${content} ${targetType}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <main className="admin-page">
      <h1>Comment Administration</h1>

      <Link to="/admin" className="nav-link">
        ← Back to Admin Dashboard
      </Link>

      {error && <p className="form-error">{error}</p>}

      <input
        type="search"
        placeholder="Search comments..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="admin-search"
      />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Author</th>
            <th>Target</th>
            <th>Comment</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredComments.map((comment) => (
            <tr key={comment._id}>
              <td>{comment.author?.username || "Unknown"}</td>
              <td>
                {comment.targetType}: {comment.targetId}
              </td>
              <td>{comment.content}</td>
              <td>
                {comment.createdAt
                  ? new Date(comment.createdAt).toLocaleString()
                  : "Unknown"}
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => handleDeleteComment(comment)}
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

export default AdminCommentsPage;