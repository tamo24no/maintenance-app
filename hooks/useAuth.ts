"use client";
// hooks/useAuth.ts
import { useEffect, useState } from "react";

export type AuthUser = {
  employeeId: string;
  name: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("maintenanceAppUser");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("maintenanceAppUser");
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("maintenanceAppUser");
    }
    setUser(null);
  };

  return { user, loading, logout };
}
