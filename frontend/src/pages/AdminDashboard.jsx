import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await fetch(
        "http://localhost:5008/api/admin/dashboard",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <main>
      <h1>Admin Dashboard</h1>

      {stats && (
        <>
          <p>Total users: {stats.totalUsers}</p>
          <p>Total matches: {stats.totalMatches}</p>
        </>
      )}



        <Link to="/admin/users" className="admin-link-card">User Administration </Link>
        <Link to="/admin/comments" className="admin-link-card">Comment Administration</Link>
        <Link to="/admin/tournaments" className="admin-link-card">Tournament Administration</Link>
        
    </main>
  );
}

export default AdminDashboard;