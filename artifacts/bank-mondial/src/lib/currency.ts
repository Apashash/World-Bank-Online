// EUR-based exchange rates (approximate, static)
export const EUR_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.94,
  CAD: 1.47,
  AUD: 1.65,
  JPY: 163,
  MAD: 10.80,
  TND: 3.32,
  DZD: 145.50,
  XOF: 655.96,
  XAF: 655.96,
  GNF: 9400,
  CDF: 2980,
  MGA: 4800,
  NGN: 1620,
  GHS: 16.5,
  KES: 139,
  ZAR: 20,
  EGP: 52,
  TRY: 35,
  BRL: 5.60,
  MXN: 18.5,
  CNY: 7.80,
  INR: 90,
  AED: 3.97,
  SAR: 4.05,
};

export const CURRENCY_LABELS: Record<string, string> = {
  EUR: "Euro (€)",
  USD: "Dollar américain ($)",
  GBP: "Livre sterling (£)",
  CHF: "Franc suisse (CHF)",
  CAD: "Dollar canadien (CAD)",
  AUD: "Dollar australien (AUD)",
  JPY: "Yen japonais (¥)",
  MAD: "Dirham marocain (MAD)",
  TND: "Dinar tunisien (TND)",
  DZD: "Dinar algérien (DZD)",
  XOF: "Franc CFA BCEAO (XOF)",
  XAF: "Franc CFA BEAC (XAF)",
  GNF: "Franc guinéen (GNF)",
  CDF: "Franc congolais (CDF)",
  MGA: "Ariary malgache (MGA)",
  NGN: "Naira nigérian (NGN)",
  GHS: "Cedi ghanéen (GHS)",
  KES: "Shilling kényan (KES)",
  ZAR: "Rand sud-africain (ZAR)",
  EGP: "Livre égyptienne (EGP)",
  TRY: "Livre turque (TRY)",
  BRL: "Réal brésilien (BRL)",
  MXN: "Peso mexicain (MXN)",
  AED: "Dirham émirien (AED)",
  SAR: "Riyal saoudien (SAR)",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€", USD: "$", GBP: "£", CHF: "CHF", CAD: "CA$", AUD: "A$",
  JPY: "¥", MAD: "MAD", TND: "TND", DZD: "DZD", XOF: "FCFA", XAF: "FCFA",
  GNF: "GNF", CDF: "FC", MGA: "Ar", NGN: "₦", GHS: "₵", KES: "KSh",
  ZAR: "R", EGP: "E£", TRY: "₺", BRL: "R$", MXN: "$", AED: "AED", SAR: "SAR",
};

export function convertFromEur(amountEur: number, targetCurrency: string): number {
  const rate = EUR_RATES[targetCurrency] ?? 1;
  return amountEur * rate;
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const isLargeInt = ["XOF", "XAF", "GNF", "CDF", "MGA", "NGN", "JPY"].includes(currency);
  const decimals = isLargeInt ? 0 : 2;
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${symbol}`;
}
