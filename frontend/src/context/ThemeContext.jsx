//reused from my previous quiz assignment!!
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [accentColor, setAccentColor] = useState("#8b5cf6"); // default purple
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load saved settings on first render
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedAccent = localStorage.getItem("accentColor");
    const savedSound = localStorage.getItem("soundEnabled");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    if (savedAccent) {
      setAccentColor(savedAccent);
    }

    if (savedSound !== null) {
      setSoundEnabled(savedSound === "true");
    }
  }, []);

  // Apply theme + accent globally
  useEffect(() => {
    // Apply light/dark class to body
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(`${theme}-theme`);

    // Apply accent color as CSS variable
    document.documentElement.style.setProperty("--accent", accentColor);

    // Save to localStorage
    localStorage.setItem("theme", theme);
    localStorage.setItem("accentColor", accentColor);
    localStorage.setItem("soundEnabled", String(soundEnabled));
  }, [theme, accentColor, soundEnabled]);

  // Theme controls
  const setLightMode = () => setTheme("light");
  const setDarkMode = () => setTheme("dark");

  // Sound toggle
  const toggleSound = () => setSoundEnabled((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setLightMode,
        setDarkMode,
        accentColor,
        setAccentColor,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}