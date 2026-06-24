import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type CurrencyCode = "EUR" | "USD" | "GBP" | "MAD" | "XOF" | "DZD" | "TND" | "CAD" | "CHF" | "XAF";

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string;
  symbol: string;
  flag: string;
  rateFromEUR: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "EUR", label: "Euro",                  symbol: "€",    flag: "🇪🇺", rateFromEUR: 1 },
  { code: "USD", label: "Dollar américain",       symbol: "$",    flag: "🇺🇸", rateFromEUR: 1.08 },
  { code: "GBP", label: "Livre sterling",         symbol: "£",    flag: "🇬🇧", rateFromEUR: 0.86 },
  { code: "MAD", label: "Dirham marocain",        symbol: "د.م.", flag: "🇲🇦", rateFromEUR: 10.77 },
  { code: "XOF", label: "Franc CFA (UEMOA)",      symbol: "CFA",  flag: "🌍", rateFromEUR: 655.96 },
  { code: "XAF", label: "Franc CFA (CEMAC)",      symbol: "CFA",  flag: "🌍", rateFromEUR: 655.96 },
  { code: "DZD", label: "Dinar algérien",         symbol: "دج",   flag: "🇩🇿", rateFromEUR: 145.80 },
  { code: "TND", label: "Dinar tunisien",         symbol: "د.ت", flag: "🇹🇳", rateFromEUR: 3.35 },
  { code: "CAD", label: "Dollar canadien",        symbol: "CA$",  flag: "🇨🇦", rateFromEUR: 1.47 },
  { code: "CHF", label: "Franc suisse",           symbol: "Fr",   flag: "🇨🇭", rateFromEUR: 0.97 },
];

const STORAGE_KEY = "banque_mondiale_currency";

function getDefaultCurrency(): CurrencyCode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CURRENCIES.find((c) => c.code === stored)) {
    return stored as CurrencyCode;
  }
  return "EUR";
}

interface CurrencyContextValue {
  currency: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  formatAmount: (amount: number, fromCurrency?: string) => string;
  convertAmount: (amount: number, fromCurrency?: string) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(getDefaultCurrency);

  const currency = CURRENCIES.find((c) => c.code === currencyCode)!;

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyCode(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const convertAmount = useCallback(
    (amount: number, fromCurrency = "EUR"): number => {
      const from = CURRENCIES.find((c) => c.code === fromCurrency);
      const fromRate = from?.rateFromEUR ?? 1;
      const amountInEUR = amount / fromRate;
      return amountInEUR * currency.rateFromEUR;
    },
    [currency],
  );

  const formatAmount = useCallback(
    (amount: number, fromCurrency = "EUR"): string => {
      const converted = convertAmount(amount, fromCurrency);
      const isLarge = currency.rateFromEUR > 100;
      const decimals = isLarge ? 0 : 2;
      const formatted = converted.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${formatted} ${currency.symbol}`;
    },
    [convertAmount, currency],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
