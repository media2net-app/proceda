"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AdminTheme = "dark" | "light";

const STORAGE_KEY = "proceda-admin-theme";

type AdminThemeContextValue = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

function readStoredTheme(): AdminTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "dark";
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  if (!ready) {
    return (
      <AdminThemeContext.Provider
        value={{
          theme: "dark",
          setTheme,
          toggleTheme,
          isDark: true,
        }}
      >
        {children}
      </AdminThemeContext.Provider>
    );
  }

  return (
    <AdminThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme requires AdminThemeProvider");
  }
  return ctx;
}
