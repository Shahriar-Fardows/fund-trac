"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  email: string;
  name: string;
  role: "admin" | "viewer";
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Get current month in format YYYY-MM
    const currentMonth = new Date().toISOString().substring(0, 7);
    setSelectedMonth(currentMonth);

    // Retrieve session from localStorage
    const storedUser = localStorage.getItem("shahriar_finance_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("shahriar_finance_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("shahriar_finance_user", JSON.stringify(userData));
      router.push("/dashboard");
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("shahriar_finance_user");
    router.push("/login");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        selectedMonth,
        setSelectedMonth,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
