import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function ProfilePage() {
  // Stores the logged-in user's profile data
  const [user, setUser] = useState(null);

  // Stores editable form fields
  const [formData, setFormData] = useState({
    email: "",
    age: "",
    password: "",
  });

  // Stores profile image URL and edit mode state
  const [profileImage, setProfileImage] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Stores recent games connected to this user
  const [recentGames, setRecentGames] = useState([]);
  const [loadingRecentGames, setLoadingRecentGames] = useState(true);

  // General page states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Gets logged-in user info from localStorage
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  // Runs when the page loads, or when userId/role changes
  useEffect(() => {
    // Fetches profile data from backend
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // If no userId exists, user is not logged in
        if (!userId) {
          setError("No logged-in user found.");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5008/api/users/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            "x-user-role": role || "user",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load profile.");
          setLoading(false);
          return;
        }

        // Save user data to state
        setUser(data.data);

        // Fill edit form with existing user data
        setFormData({
          email: data.data.email || "",
          age: data.data.age || "",
          password: "",
        });

        // Adds timestamp to prevent browser from showing old cached image
        setProfileImage(
          data.data.profileImage
            ? `http://localhost:5008${data.data.profileImage}?t=${Date.now()}`
            : "/default_profile.png"
        );
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    // Fetches matches and filters only games this user participated in
    const fetchRecentGames = async () => {
      try {
        setLoadingRecentGames(true);

        if (!userId) {
          setLoadingRecentGames(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5008/api/games/matches?limit=100&sortBy=createdAt&order=desc"
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to load recent matches:", data.message);
          setLoadingRecentGames(false);
          return;
        }

        const matches = Array.isArray(data.data) ? data.data : [];

        // Keep only matches where this user is one of the players
        const filteredMatches = matches.filter((match) => {
          const players = Array.isArray(match.players) ? match.players : [];

          return players.some((player) => {
            const playerUserId = player?.user?._id || player?.user || null;
            return playerUserId === userId;
          });
        });

        // Only show latest 5 games
        setRecentGames(filteredMatches.slice(0, 5));
      } catch (err) {
        console.error("Recent games fetch error:", err);
      } finally {
        setLoadingRecentGames(false);
      }
    };

    fetchProfile();
    fetchRecentGames();
  }, [userId, role]);

  // Updates formData when user types in an input
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Uploads a new profile image
  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setError("");
      setSuccessMessage("");

      // FormData is needed for file uploads
      const imageFormData = new FormData();
      imageFormData.append("profileImage", file);

      const response = await fetch(
        `http://localhost:5008/api/users/${userId}/profile-image`,
        {
          method: "PATCH",
          headers: {
            "x-user-id": userId,
            "x-user-role": role || "user",
          },
          body: imageFormData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to upload image.");
        return;
      }

      // Refresh image URL and avoid browser cache
      const updatedImageUrl = `http://localhost:5008${data.data.profileImage}?t=${Date.now()}`;
      setProfileImage(updatedImageUrl);

      // Update local user state with new image path
      setUser((prev) => ({
        ...prev,
        profileImage: data.data.profileImage,
      }));

      setSuccessMessage("Profile image updated successfully.");
    } catch (err) {
      console.error("Image upload error:", err);
      setError("Could not upload image.");
    } finally {
      // Allows choosing the same file again later
      event.target.value = "";
    }
  };

  // Saves edited profile info
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      // Data sent to backend
      const payload = {
        email: formData.email,
        age: Number(formData.age),
      };

      // Only update password if user typed one
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const response = await fetch(`http://localhost:5008/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-role": role || "user",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile.");
        setSaving(false);
        return;
      }

      // Update user state with returned backend data
      setUser(data.data);

      // Reset form, especially password field
      setFormData({
        email: data.data.email || "",
        age: data.data.age || "",
        password: "",
      });

      // Keep image updated if backend returns it
      if (data.data.profileImage) {
        setProfileImage(
          `http://localhost:5008${data.data.profileImage}?t=${Date.now()}`
        );
      }

      setSuccessMessage("Profile updated successfully.");
      setEditMode(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  // Page loading state
  if (loading) {
    return (
      <main className="profile-page">
        <h2>Loading profile...</h2>
      </main>
    );
  }

  // If profile failed to load completely
  if (error && !user) {
    return (
      <main className="profile-page">
        <h2>Profile</h2>
        <p className="form-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-top">
          <div className="profile-image-section">
            <div className="profile-image-wrapper">
              <img
                src={profileImage || "/default_profile.png"}
                alt="Profile"
                className="profile-image"
              />
            </div>

            {/* Hidden file input styled through label */}
            <label className="upload-button">
              Upload profile image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </label>
          </div>

          <div className="profile-main-info">
            <h1>{user?.username}</h1>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Age:</strong> {user?.age}</p>
            <p><strong>ELO Rating:</strong> {user?.eloRating}</p>
            <p><strong>Wins:</strong> {user?.wins || 0}</p>
            <p><strong>Matches Played:</strong> {user?.matchesPlayed || 0}</p>

            {/* Toggles edit form */}
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
            >
              {editMode ? "Cancel Editing" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Edit form only shows when editMode is true */}
        {editMode && (
          <section className="profile-section">
            <h2>Edit Details</h2>

            <form onSubmit={handleSaveProfile} className="auth-form">
              <label>
                Username
                <input type="text" value={user?.username || ""} disabled />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </label>

              <label>
                Age
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="18"
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
              </label>

              {error && <p className="form-error">{error}</p>}
              {successMessage && <p className="form-success">{successMessage}</p>}

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>
        )}

        {/* Success/error messages outside edit form */}
        {!editMode && successMessage && (
          <section className="profile-section">
            <p className="form-success">{successMessage}</p>
          </section>
        )}

        {!editMode && error && (
          <section className="profile-section">
            <p className="form-error">{error}</p>
          </section>
        )}

        {/* Trophies awarded from tournaments */}
        <section className="profile-section">
          <h2>Trophies</h2>
          {user?.trophies?.length > 0 ? (
            <div className="trophy-grid">
              {user.trophies.map((trophy, index) => (
                <div key={index} className="trophy-card">
                  <p><strong>{trophy.title}</strong></p>
                  <p>
                    {trophy.awardedAt
                      ? new Date(trophy.awardedAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No trophies yet.</p>
          )}
        </section>

        {/* Main user statistics */}
        <section className="profile-section">
          <h2>User Stats</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <h3>{user?.eloRating ?? 0}</h3>
              <p>Current ELO</p>
            </div>
            <div className="stat-box">
              <h3>{user?.matchesPlayed ?? 0}</h3>
              <p>Matches Played</p>
            </div>
            <div className="stat-box">
              <h3>{user?.wins ?? 0}</h3>
              <p>Total Wins</p>
            </div>
          </div>
        </section>

        {/* Recent games with clickable links */}
        <section className="profile-section">
          <h2>Recent Games</h2>

          {loadingRecentGames ? (
            <p>Loading recent games...</p>
          ) : recentGames.length > 0 ? (
            <div className="recent-games-list">
              {recentGames.map((match) => (
                <Link
                  key={match._id}
                  to={`/games/${match._id}`}
                  className="recent-game-card"
                >
                  <h3>Match {match._id.slice(-6)}</h3>
                  <p>
                    <strong>Status:</strong> {match.status}
                  </p>
                  <p>
                    <strong>Variant:</strong> Best of {match.bestOf} ·{" "}
                    {match.straightsAllowed ? "Straights allowed" : "Straights off"} ·{" "}
                    {match.roundTimeSeconds}s
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {match.createdAt
                      ? new Date(match.createdAt).toLocaleString()
                      : "Unknown"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p>No recent games found for this user.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export default ProfilePage;