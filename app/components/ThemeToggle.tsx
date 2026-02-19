"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "theme-preference";

type Theme = "light" | "dark";

function resolveSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    if (typeof window !== "undefined") {
      try {
        saved = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        saved = null;
      }
    }
    const initial =
      saved === "light" || saved === "dark" ? (saved as Theme) : resolveSystemTheme();

    applyTheme(initial);
    setTheme(initial);
    setMounted(true);

    if (saved === "light" || saved === "dark") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const next = media.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const onToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (e.g., restricted browsing mode).
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className="theme-toggle inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:bg-white/15"
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
      title={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
    >
      {mounted && theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      <span>{mounted ? (theme === "dark" ? "Dark" : "Light") : "Theme"}</span>
    </button>
  );
}
