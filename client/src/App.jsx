import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import ResidentPortal from "./pages/ResidentPortal.jsx";
import Announcements from "./pages/Announcements.jsx";
import StatusCheck from "./pages/StatusCheck.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import TeamDashboard from "./pages/TeamDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main className="main">
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/portal" element={<ResidentPortal />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/status" element={<StatusCheck />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/team"
                element={
                  <ProtectedRoute>
                    <TeamDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
