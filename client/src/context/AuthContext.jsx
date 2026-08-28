import { createContext, useContext, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("team_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("team_username"));
  const [role, setRole] = useState(() => localStorage.getItem("team_role"));

  async function login(username, password) {
    const res = await api.post("/auth/login", { username, password });
    const { token, username: name, role: userRole } = res.data;
    localStorage.setItem("team_token", token);
    localStorage.setItem("team_username", name);
    localStorage.setItem("team_role", userRole || "");
    setToken(token);
    setUsername(name);
    setRole(userRole || "");
  }

  function logout() {
    localStorage.removeItem("team_token");
    localStorage.removeItem("team_username");
    localStorage.removeItem("team_role");
    setToken(null);
    setUsername(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        login,
        logout,
        isLoggedIn: !!token,
        isAdmin: role === "Admin",
        isMember: role === "Member",
        isThirdParty: role === "3rd Party",
        canEdit: role === "Admin" || role === "Member",
        canEditUnits: role === "Admin" || role === "Member" || role === "3rd Party",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
