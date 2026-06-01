import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";

//customizable content
function Header() {
  const {
    theme,
    setLightMode,
    setDarkMode,
    accentColor,
    setAccentColor,
    soundEnabled,
    toggleSound,
  } = useTheme();

  //check user
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);

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
      } catch (error) {
        setIsLoggedIn(false);
        setUserId(null);
        setUsername("");
      }
    };

    checkLogin();

    window.addEventListener("authChanged", checkLogin);

    return () => {
      window.removeEventListener("authChanged", checkLogin);
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
  return (
    //home page
    <header className={`site-header ${theme}`}>
      <Link to="/" className="site-logo">
        <img src="/cards.png" alt="Spanish Poker Dice" className="logo-image" />
      </Link>
    
      {isLoggedIn ? (
          <>
          
            <Link to={`/profile/${userId}`} className="nav-link">
              Welcome, {username || "Player"}
            </Link>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          <Link to="/login" className="nav-link">Login</Link>
        )}

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
              <p>Sound</p>
              <button type="button" className="theme-button">
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