import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export const CURRENCIES = {
  USD: { code: "USD", label: "US Dollar", short: "USD", symbol: "$" },
  EUR: { code: "EUR", label: "Euro", short: "EUR", symbol: "€" },
  MKD: { code: "MKD", label: "Македонски денар", short: "MKD", symbol: "ден." },
};

const FORMATTERS = {
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }),
  EUR: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }),
  MKD: new Intl.NumberFormat("mk-MK", {
    style: "currency",
    currency: "MKD",
  }),
};

const CurrencyContext = createContext(null);

const keyFor = (username) => `stockmind_currency_${username || "guest"}`;

export function CurrencyProvider({ children }) {
  const { user } = useAuth();
  const storageKey = keyFor(user?.username);

  const [currency, setCurrencyState] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || "USD";
    } catch {
      return "USD";
    }
  });

  // When user changes (login/logout), reload preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && stored !== currency) setCurrencyState(stored);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  const setCurrency = (code) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(storageKey, code);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      currencies: CURRENCIES,
      format: (value) => {
        const num = Number(value || 0);
        if (Number.isNaN(num)) return "";
        return FORMATTERS[currency].format(num);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
