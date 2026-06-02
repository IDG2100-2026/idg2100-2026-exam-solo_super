//reused from my previous quiz assignment!!
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "./Layout.css";

function Layout({ children }) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  // Example: hide footer on login/register if you want
  const hideFooterRoutes = ["/login", "/signup"];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">{children}</main>
      {!shouldHideFooter && !isAdminPage && <Footer />}
    </div>
  );
}

export default Layout;