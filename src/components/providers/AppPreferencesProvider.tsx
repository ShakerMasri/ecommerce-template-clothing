"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  type Language,
  type TranslationDictionary,
} from "~/lib/translations";

type Theme = "light" | "dark";

type AppPreferencesContextValue = {
  theme: Theme;
  language: Language;
  t: TranslationDictionary;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(
  null,
);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

function applyLanguage(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  localStorage.setItem("language", language);
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const nextTheme: Theme =
      savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    const savedLanguage = localStorage.getItem("language");
    const nextLanguage: Language = savedLanguage === "ar" ? "ar" : "en";

    applyTheme(nextTheme);
    applyLanguage(nextLanguage);

    setTheme(nextTheme);
    setLanguageState(nextLanguage);
  }, []);

  function updateTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  function updateLanguage(nextLanguage: Language) {
    applyLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  }

  const value = useMemo<AppPreferencesContextValue>(() => {
    return {
      theme,
      language,
      t: translations[language],
      toggleTheme: () => updateTheme(theme === "dark" ? "light" : "dark"),
      toggleLanguage: () => updateLanguage(language === "en" ? "ar" : "en"),
      setLanguage: updateLanguage,
    };
  }, [theme, language]);

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error(
      "useAppPreferences must be used inside AppPreferencesProvider.",
    );
  }

  return context;
}
