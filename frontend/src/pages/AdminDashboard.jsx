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
        <section className="hero-card">
                <h1>Spanish Poker Dice</h1>
                <p>
                  Spanish Poker Dice is a fast-paced dice game inspired by poker, where
                  players roll for combinations using A, K, Q, J, 8, and 7. Create a
                  game, join the lobby, and compete in matches and tournaments.
                </p>
              </section>
        
              
      <h1>Admin Dashboard</h1>

      {stats && (
        <>
          <p>Total users: {stats.totalUsers}</p>
          <p>Total matches: {stats.totalMatches}</p>
        </>
      )}


    <section className="admin-button-cards">
        <Link to="/admin/users" className="admin-link-card hero-card">User Administration </Link>
        <Link to="/admin/comments" className="admin-link-card theme-button hero-card">Comment Administration</Link>
        <Link to="/admin/tournaments" className="admin-link-card theme-button hero-card">Tournament Administration</Link>
    </section>

    </main>
  );
}

export default AdminDashboard;