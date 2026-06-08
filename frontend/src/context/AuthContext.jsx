import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe } from "../api/auth";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistUser = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const me = await getMe();
      const data = {
        id: me.id,
        username: me.username,
        email: me.email,
        avatar: me.profile?.avatar || null,
        store_name: me.profile?.store_name || "",
        preferred_language: me.profile?.preferred_language || "en",
        preferred_currency: me.profile?.preferred_currency || "USD",
      };
      persistUser(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.clear();
      }
    }
    // If token exists, refresh from server
    if (localStorage.getItem("access_token")) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (username, password) => {
    const { data } = await apiClient.post("/auth/login/", { username, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    persistUser({ username });
    await fetchProfile();
  };

  const register = async (username, email, password, passwordConfirm) => {
    const { data } = await apiClient.post("/auth/register/", {
      username,
      email,
      password,
      password_confirm: passwordConfirm,
    });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    persistUser({ id: data.user.id, username: data.user.username, email: data.user.email });
    await fetchProfile();
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const refreshUser = (patch) => {
    if (patch) {
      const next = { ...user, ...patch };
      persistUser(next);
    } else {
      fetchProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, loading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
