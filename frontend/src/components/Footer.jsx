import { Link } from "react-router-dom";
//enable light and dark mode
import { useTheme } from "../context/ThemeContext.jsx";

function Footer() {
  const { theme } = useTheme();

  return (
    <footer className={`site-footer ${theme}`}>
      <div className="footer-links">
        <Link to="/about" className="footer-link">About Us</Link>
        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        <Link to="/terms" className="footer-link">Terms and Conditions</Link>
      </div>

      <div className="footer-info">
        <p>Spanish Poker Dice Platform © 2026</p>
      </div>
    </footer>
  );
}

export default Footer;