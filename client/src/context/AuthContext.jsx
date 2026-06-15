import { createContext, useContext, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("team_token"));
  const [username, setUsername] = useState(() => localStorage.getItem("team_username"));

  async function login(username, password) {
    const res = await api.post("/auth/login", { username, password });
    const { token, username: name } = res.data;
    localStorage.setItem("team_token", token);
    localStorage.setItem("team_username", name);
    setToken(token);
    setUsername(name);
  }

  function logout() {
    localStorage.removeItem("team_token");
    localStorage.removeItem("team_username");
    setToken(null);
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
