"use client";

import { useState, useEffect } from "react";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;

      // Direct check: Agar local storage mein true hai toh user logged in hai
      const localFlag = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(localFlag);
    };

    checkAuth();

    // Custom events ko listen karega instant update ke liye
    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("storage", checkAuth); // Dusre tabs ke liye

    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return isLoggedIn;
}