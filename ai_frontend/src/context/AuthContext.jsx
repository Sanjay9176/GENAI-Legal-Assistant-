// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 1. Initialize User from LocalStorage (FIXED: Now loads email too)
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("user_name");
    const email = localStorage.getItem("user_email"); // <--- NEW
    return token ? { token, user_name: userName, email: email } : null;
  });

  const [loading, setLoading] = useState(false);

  // Helper to handle Auth Response
  // We now pass 'email' explicitly because the backend response might not contain it
  const handleAuthResponse = (data, email) => {
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_name", data.user_name);
      localStorage.setItem("user_email", email); // <--- NEW: Save Email

      setUser({ 
        token: data.access_token, 
        user_name: data.user_name,
        email: email // <--- NEW: Update State
      });
      return true;
    }
    return false;
  };

  // 2. Login Action (FIXED)
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      // Pass the 'email' argument to our helper so it gets saved
      return handleAuthResponse(data, email); 

    } catch (error) {
      console.error("Login Error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 3. Register Action (FIXED)
  const register = async (fullName, email, password) => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          full_name: fullName, 
          email: email, 
          password: password 
        }),
      });

      if (!response.ok) throw new Error("Registration failed");

      const data = await response.json();
      return handleAuthResponse(data, email); // Pass email here too

    } catch (error) {
      console.error("Registration Error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout Action
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email"); // <--- Clear email
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);