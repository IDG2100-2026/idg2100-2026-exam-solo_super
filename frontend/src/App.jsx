import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import HomePage from "./pages/HomePage";
import LobbyPage from "./pages/LobbyPage";
import CreateGamePage from "./pages/CreateGamePage";
import GamePage from "./pages/GamePage";
import TournamentHomePage from "./pages/TournamentHomePage";
import TournamentPage from "./pages/TournamentPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProfilePage from "./pages/ProfilePage";
import AboutUs from "./pages/AboutUs";
import AboutSpanishDice from "./pages/AboutSpanishDice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Unauthorized from "./pages/Unauthorized";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFoundPage from "./pages/NotFoundPage";
import { useEffect } from "react";
import { playSound } from "./utils/soundManager";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminCommentsPage from "./pages/AdminCommentsPage";
import AdminCreateTournamentPage from "./pages/AdminCreateTournamentPage";
import AdminTournamentListPage from "./pages/AdminTournamentListPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";


function App() {
  useEffect(() => {
    const handleClick = (event) => {
      const clickable = event.target.closest(
        "button, a, input, select, textarea"
      );

      if (!clickable) return;

      playSound("/sounds/click.mp3");
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/create-game" element={<CreateGamePage />} />
        <Route path="/games/:id" element={<GamePage />} />
        <Route path="/tournaments" element={<TournamentHomePage />} />
        <Route path="/tournaments/:id" element={<TournamentPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/about-game" element={<AboutSpanishDice />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/comments" element={<AdminCommentsPage />} />
        <Route path="/admin/tournaments/create" element={<AdminCreateTournamentPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/admin/tournaments" element={<AdminTournamentListPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;