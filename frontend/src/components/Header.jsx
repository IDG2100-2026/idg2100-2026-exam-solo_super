import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import { playClick } from "../utils/soundManager";

//customizable content
function Header() {
  const {
    theme,
    setLightMode,
    setDarkMode,
    accentColor,
    setAccentColor,
    soundEnabled,
    boardColor,
    setBoardColor,
    toggleSound,
  } = useTheme();

  //check user and add states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);
  const [role, setRole] = useState("anonymous");
  const [homepageLobbyCount, setHomepageLobbyCount] = useState(Number(localStorage.getItem("homepageLobbyCount")) || 5);
  const [profileImage, setProfileImage] = useState("/default_profile.png");

  const navigate = useNavigate();

  //save in storage
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch("http://localhost:5008/api/auth/me", {
          credentials: "include",
        });

       if (response.status === 401) {
        setIsLoggedIn(false);
        setUserId(null);
        setUsername("");
        setRole("anonymous");
        return;
      }

      if (!response.ok) {
        console.error("Failed to check login status");
        return;
      }

        const data = await response.json();

        setIsLoggedIn(true);
        setUserId(data.data._id);
        setUsername(data.data.username);
        setRole(data.data.role || "user");
        setProfileImage(data.data.profileImage
          ? `http://localhost:5008${data.data.profileImage}?t=${Date.now()}`
          : "/default_profile.png"
      );
      } catch (error) {
        setIsLoggedIn(false);
        setUserId(null);
        setUsername("");
        setRole("anonymous");
      }
    };

    checkLogin();

    window.addEventListener("authChanged", checkLogin);
    window.addEventListener("profileUpdated", checkLogin);

    return () => {
      window.removeEventListener("authChanged", checkLogin);
      window.removeEventListener("profileUpdated", checkLogin);
    };
}, []);
    const handleLogout = async () => {
      try {
        await fetch("http://localhost:5008/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }

      setIsLoggedIn(false);
      setUserId(null);
      setUsername("");

      window.dispatchEvent(new Event("authChanged"));
      navigate("/login");
    };
    const handleLobbyCountChange = (event) => {
      const value = Number(event.target.value);

      setHomepageLobbyCount(value);
      localStorage.setItem("homepageLobbyCount", String(value));

      window.dispatchEvent(new Event("settingsChanged"));
    };

  return (
    //home page
    <header className={`site-header ${theme}`}>
      <Link to="/" className="site-logo">
        <img src="/cards.png" alt="Spanish Poker Dice" className="logo-image" />
      </Link>
    
      {isLoggedIn ? (
          <>
          
            <Link to={`/profile/${userId}`} className="nav-link header-profile-link" >
              <img src={profileImage} alt="Profile" className="header-profile-image"/>
              <span>Welcome, {username || "Player"}</span>
            </Link>

            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          <Link to="/login" className="nav-link">Login</Link>
        )}

        {role === "admin" && (<Link to="/admin" className="nav-link">Admin</Link>)}

      <nav className="site-nav">
        <Link to="/lobby" className="nav-link">Lobby</Link>
        <Link to="/tournaments" className="nav-link">Tournaments</Link>
        <Link to="/about-game" className="nav-link">About the Game</Link>
        <Link to="/create-game" className="nav-link">Create Game</Link>

      </nav>

      <div className="customization-wrapper">
        <button
          type="button"
          className="theme-button"
          onClick={() => setShowCustomization((prev) => !prev)}
        >
          Customization
        </button>

        {showCustomization && (
          <div className="customization-menu">
            <div className="customization-group">
              <p>Appearance</p>
              <button type="button" onClick={setLightMode} className="theme-button">
                Light Mode
              </button>
              <button type="button" onClick={setDarkMode} className="theme-button">
                Dark Mode
              </button>
            </div>

            <div className="customization-group">
              <p>N of Games</p>
              <select value={homepageLobbyCount} onChange={handleLobbyCountChange} className="theme-select">
                <option value={3}>3 games</option>
                <option value={5}>5 games</option>
                <option value={10}>10 games</option>
                <option value={20}>20 games</option>
              </select>
            </div>

            <div className="customization-group">
              <p>Accent Color</p>
              <div className="accent-options">
                <button
                  type="button"
                  className="accent-swatch"
                  style={{ backgroundColor: "#8b5cf6" }}
                  onClick={() => setAccentColor("#8b5cf6")}
                />
                <button
                  type="button"
                  className="accent-swatch"
                  style={{ backgroundColor: "#2563eb" }}
                  onClick={() => setAccentColor("#2563eb")}
                />
                <button
                  type="button"
                  className="accent-swatch"
                  style={{ backgroundColor: "#16a34a" }}
                  onClick={() => setAccentColor("#16a34a")}
                />
                <button
                  type="button"
                  className="accent-swatch"
                  style={{ backgroundColor: "#dc2626" }}
                  onClick={() => setAccentColor("#dc2626")}
                />
                <button
                  type="button"
                  className="accent-swatch"
                  style={{ backgroundColor: "#d97706" }}
                  onClick={() => setAccentColor("#d97706")}
                />
              </div>
            </div>

            <div className="customization-group">
              <p>Board Background</p>

            </div>

            <div className="customization-group">
              <p>Sound</p>
              <button type="button" className="theme-button" onClick={() => {playClick(); toggleSound();}}>
                {soundEnabled ? "Sound On" : "Sound Off"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;