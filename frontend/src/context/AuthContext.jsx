import { createContext, useContext, useMemo, useState } from "react";

const USER_KEY = "educloud_user";
const TOKEN_KEY = "educloud_token";

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  const login = (user, nextToken = "") => {
    setCurrentUser(user);
    setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken("");
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const role = currentUser?.role || "Guest";

  const value = useMemo(
    () => ({ currentUser, token, role, login, logout }),
    [currentUser, token, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
