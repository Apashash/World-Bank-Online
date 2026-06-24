import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type CurrencyCode =
  | "EUR" | "USD" | "GBP" | "JPY" | "CNY" | "CHF" | "CAD" | "AUD" | "NZD" | "SEK"
  | "NOK" | "DKK" | "PLN" | "CZK" | "HUF" | "RON" | "BGN" | "HRK" | "RSD" | "BAM"
  | "ALL" | "MKD" | "TRY" | "UAH" | "RUB" | "GEL" | "AMD" | "AZN" | "BYN" | "MDL"
  | "MAD" | "DZD" | "TND" | "LYD" | "EGP" | "XOF" | "XAF" | "NGN" | "GHS" | "KES"
  | "TZS" | "UGX" | "ETB" | "ZAR" | "MZN" | "AOA" | "CDF" | "RWF" | "SDG" | "SOS"
  | "USD_DJ" | "MUR" | "SCR" | "MGA" | "BIF" | "GMD" | "GNF" | "SLL" | "LRD" | "XOF_SN"
  | "SAR" | "AED" | "QAR" | "KWD" | "BHD" | "OMR" | "JOD" | "IQD" | "ILS" | "LBP"
  | "YER" | "SYP" | "IRR" | "AFN" | "PKR" | "INR" | "BDT" | "LKR" | "NPR" | "MVR"
  | "MYR" | "SGD" | "THB" | "IDR" | "PHP" | "VND" | "KHR" | "LAK" | "MMK" | "BND"
  | "HKD" | "TWD" | "KRW" | "MNT" | "KZT" | "UZS" | "TJS" | "TMT" | "KGS"
  | "MXN" | "BRL" | "ARS" | "CLP" | "COP" | "PEN" | "UYU" | "BOB" | "PYG" | "VES"
  | "GTQ" | "HNL" | "NIO" | "CRC" | "PAB" | "DOP" | "HTG" | "JMD" | "TTD" | "BBD"
  | "XCD" | "BSD" | "BZD";

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string;
  symbol: string;
  flag: string;
  rateFromEUR: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  // Europe
  { code: "EUR", label: "Euro",                    symbol: "€",       flag: "🇪🇺", rateFromEUR: 1 },
  { code: "GBP", label: "Livre sterling",           symbol: "£",       flag: "🇬🇧", rateFromEUR: 0.86 },
  { code: "CHF", label: "Franc suisse",             symbol: "Fr",      flag: "🇨🇭", rateFromEUR: 0.97 },
  { code: "SEK", label: "Couronne suédoise",        symbol: "kr",      flag: "🇸🇪", rateFromEUR: 11.58 },
  { code: "NOK", label: "Couronne norvégienne",     symbol: "kr",      flag: "🇳🇴", rateFromEUR: 11.72 },
  { code: "DKK", label: "Couronne danoise",         symbol: "kr",      flag: "🇩🇰", rateFromEUR: 7.46 },
  { code: "PLN", label: "Złoty polonais",           symbol: "zł",      flag: "🇵🇱", rateFromEUR: 4.24 },
  { code: "CZK", label: "Couronne tchèque",         symbol: "Kč",      flag: "🇨🇿", rateFromEUR: 25.31 },
  { code: "HUF", label: "Forint hongrois",          symbol: "Ft",      flag: "🇭🇺", rateFromEUR: 392.0 },
  { code: "RON", label: "Leu roumain",              symbol: "lei",     flag: "🇷🇴", rateFromEUR: 4.97 },
  { code: "BGN", label: "Lev bulgare",              symbol: "лв",      flag: "🇧🇬", rateFromEUR: 1.96 },
  { code: "HRK", label: "Kuna croate",              symbol: "kn",      flag: "🇭🇷", rateFromEUR: 7.53 },
  { code: "RSD", label: "Dinar serbe",              symbol: "din",     flag: "🇷🇸", rateFromEUR: 117.2 },
  { code: "BAM", label: "Mark convertible",         symbol: "KM",      flag: "🇧🇦", rateFromEUR: 1.96 },
  { code: "ALL", label: "Lek albanais",             symbol: "L",       flag: "🇦🇱", rateFromEUR: 107.8 },
  { code: "MKD", label: "Denar macédonien",         symbol: "ден",     flag: "🇲🇰", rateFromEUR: 61.5 },
  { code: "TRY", label: "Livre turque",             symbol: "₺",       flag: "🇹🇷", rateFromEUR: 35.2 },
  { code: "UAH", label: "Hryvnia ukrainienne",      symbol: "₴",       flag: "🇺🇦", rateFromEUR: 44.5 },
  { code: "RUB", label: "Rouble russe",             symbol: "₽",       flag: "🇷🇺", rateFromEUR: 97.2 },
  { code: "GEL", label: "Lari géorgien",            symbol: "₾",       flag: "🇬🇪", rateFromEUR: 2.95 },
  { code: "AMD", label: "Dram arménien",            symbol: "֏",       flag: "🇦🇲", rateFromEUR: 418.0 },
  { code: "AZN", label: "Manat azerbaïdjanais",     symbol: "₼",       flag: "🇦🇿", rateFromEUR: 1.84 },
  { code: "BYN", label: "Rouble biélorusse",        symbol: "Br",      flag: "🇧🇾", rateFromEUR: 3.52 },
  { code: "MDL", label: "Leu moldave",              symbol: "L",       flag: "🇲🇩", rateFromEUR: 19.4 },

  // Amérique du Nord
  { code: "USD", label: "Dollar américain",         symbol: "$",       flag: "🇺🇸", rateFromEUR: 1.08 },
  { code: "CAD", label: "Dollar canadien",          symbol: "CA$",     flag: "🇨🇦", rateFromEUR: 1.47 },
  { code: "MXN", label: "Peso mexicain",            symbol: "MX$",     flag: "🇲🇽", rateFromEUR: 20.5 },
  { code: "GTQ", label: "Quetzal guatémaltèque",   symbol: "Q",       flag: "🇬🇹", rateFromEUR: 8.43 },
  { code: "HNL", label: "Lempira hondurien",        symbol: "L",       flag: "🇭🇳", rateFromEUR: 26.7 },
  { code: "NIO", label: "Córdoba nicaraguayen",     symbol: "C$",      flag: "🇳🇮", rateFromEUR: 39.6 },
  { code: "CRC", label: "Colón costaricien",        symbol: "₡",       flag: "🇨🇷", rateFromEUR: 556.0 },
  { code: "PAB", label: "Balboa panaméen",          symbol: "B/.",     flag: "🇵🇦", rateFromEUR: 1.08 },
  { code: "DOP", label: "Peso dominicain",          symbol: "RD$",     flag: "🇩🇴", rateFromEUR: 64.5 },
  { code: "HTG", label: "Gourde haïtienne",         symbol: "G",       flag: "🇭🇹", rateFromEUR: 143.0 },
  { code: "JMD", label: "Dollar jamaïcain",         symbol: "J$",      flag: "🇯🇲", rateFromEUR: 169.0 },
  { code: "TTD", label: "Dollar de T&T",            symbol: "TT$",     flag: "🇹🇹", rateFromEUR: 7.34 },
  { code: "BBD", label: "Dollar barbadien",         symbol: "Bds$",    flag: "🇧🇧", rateFromEUR: 2.16 },
  { code: "XCD", label: "Dollar des Caraïbes",      symbol: "EC$",     flag: "🌴", rateFromEUR: 2.92 },
  { code: "BSD", label: "Dollar bahamien",          symbol: "B$",      flag: "🇧🇸", rateFromEUR: 1.08 },
  { code: "BZD", label: "Dollar bélizien",          symbol: "BZ$",     flag: "🇧🇿", rateFromEUR: 2.16 },

  // Amérique du Sud
  { code: "BRL", label: "Real brésilien",           symbol: "R$",      flag: "🇧🇷", rateFromEUR: 5.93 },
  { code: "ARS", label: "Peso argentin",            symbol: "$",       flag: "🇦🇷", rateFromEUR: 982.0 },
  { code: "CLP", label: "Peso chilien",             symbol: "$",       flag: "🇨🇱", rateFromEUR: 1012.0 },
  { code: "COP", label: "Peso colombien",           symbol: "$",       flag: "🇨🇴", rateFromEUR: 4430.0 },
  { code: "PEN", label: "Sol péruvien",             symbol: "S/",      flag: "🇵🇪", rateFromEUR: 4.01 },
  { code: "UYU", label: "Peso uruguayen",           symbol: "$U",      flag: "🇺🇾", rateFromEUR: 43.2 },
  { code: "BOB", label: "Boliviano bolivien",       symbol: "Bs.",     flag: "🇧🇴", rateFromEUR: 7.47 },
  { code: "PYG", label: "Guaraní paraguayen",       symbol: "₲",       flag: "🇵🇾", rateFromEUR: 8240.0 },
  { code: "VES", label: "Bolívar vénézuélien",      symbol: "Bs.S",    flag: "🇻🇪", rateFromEUR: 39.3 },

  // Afrique du Nord & Moyen-Orient
  { code: "MAD", label: "Dirham marocain",          symbol: "د.م.",    flag: "🇲🇦", rateFromEUR: 10.77 },
  { code: "DZD", label: "Dinar algérien",           symbol: "دج",      flag: "🇩🇿", rateFromEUR: 145.8 },
  { code: "TND", label: "Dinar tunisien",           symbol: "د.ت",     flag: "🇹🇳", rateFromEUR: 3.35 },
  { code: "LYD", label: "Dinar libyen",             symbol: "ل.د",     flag: "🇱🇾", rateFromEUR: 5.24 },
  { code: "EGP", label: "Livre égyptienne",         symbol: "ج.م",     flag: "🇪🇬", rateFromEUR: 52.5 },
  { code: "SAR", label: "Riyal saoudien",           symbol: "﷼",       flag: "🇸🇦", rateFromEUR: 4.05 },
  { code: "AED", label: "Dirham émirati",           symbol: "د.إ",     flag: "🇦🇪", rateFromEUR: 3.97 },
  { code: "QAR", label: "Riyal qatarien",           symbol: "﷼",       flag: "🇶🇦", rateFromEUR: 3.93 },
  { code: "KWD", label: "Dinar koweïtien",          symbol: "د.ك",     flag: "🇰🇼", rateFromEUR: 0.33 },
  { code: "BHD", label: "Dinar bahreïni",           symbol: ".د.ب",    flag: "🇧🇭", rateFromEUR: 0.41 },
  { code: "OMR", label: "Rial omanais",             symbol: "﷼",       flag: "🇴🇲", rateFromEUR: 0.42 },
  { code: "JOD", label: "Dinar jordanien",          symbol: "د.ا",     flag: "🇯🇴", rateFromEUR: 0.77 },
  { code: "IQD", label: "Dinar irakien",            symbol: "ع.د",     flag: "🇮🇶", rateFromEUR: 1414.0 },
  { code: "ILS", label: "Shekel israélien",         symbol: "₪",       flag: "🇮🇱", rateFromEUR: 3.99 },
  { code: "LBP", label: "Livre libanaise",          symbol: "ل.ل",     flag: "🇱🇧", rateFromEUR: 96600.0 },
  { code: "YER", label: "Riyal yéménite",           symbol: "﷼",       flag: "🇾🇪", rateFromEUR: 270.0 },
  { code: "IRR", label: "Rial iranien",             symbol: "﷼",       flag: "🇮🇷", rateFromEUR: 45500.0 },
  { code: "AFN", label: "Afghani",                  symbol: "؋",       flag: "🇦🇫", rateFromEUR: 75.6 },

  // Afrique subsaharienne
  { code: "XOF", label: "Franc CFA (UEMOA)",        symbol: "CFA",     flag: "🌍", rateFromEUR: 655.96 },
  { code: "XAF", label: "Franc CFA (CEMAC)",        symbol: "CFA",     flag: "🌍", rateFromEUR: 655.96 },
  { code: "NGN", label: "Naira nigérian",           symbol: "₦",       flag: "🇳🇬", rateFromEUR: 1680.0 },
  { code: "GHS", label: "Cedi ghanéen",             symbol: "₵",       flag: "🇬🇭", rateFromEUR: 16.5 },
  { code: "KES", label: "Shilling kényan",          symbol: "KSh",     flag: "🇰🇪", rateFromEUR: 139.0 },
  { code: "TZS", label: "Shilling tanzanien",       symbol: "TSh",     flag: "🇹🇿", rateFromEUR: 2830.0 },
  { code: "UGX", label: "Shilling ougandais",       symbol: "USh",     flag: "🇺🇬", rateFromEUR: 3980.0 },
  { code: "ETB", label: "Birr éthiopien",           symbol: "Br",      flag: "🇪🇹", rateFromEUR: 131.0 },
  { code: "ZAR", label: "Rand sud-africain",        symbol: "R",       flag: "🇿🇦", rateFromEUR: 20.3 },
  { code: "MZN", label: "Metical mozambicain",      symbol: "MT",      flag: "🇲🇿", rateFromEUR: 69.0 },
  { code: "AOA", label: "Kwanza angolais",          symbol: "Kz",      flag: "🇦🇴", rateFromEUR: 999.0 },
  { code: "CDF", label: "Franc congolais",          symbol: "FC",      flag: "🇨🇩", rateFromEUR: 3010.0 },
  { code: "RWF", label: "Franc rwandais",           symbol: "RF",      flag: "🇷🇼", rateFromEUR: 1395.0 },
  { code: "SDG", label: "Livre soudanaise",         symbol: "ج.س.",    flag: "🇸🇩", rateFromEUR: 648.0 },
  { code: "SOS", label: "Shilling somalien",        symbol: "Sh",      flag: "🇸🇴", rateFromEUR: 618.0 },
  { code: "MUR", label: "Roupie mauricienne",       symbol: "₨",       flag: "🇲🇺", rateFromEUR: 49.7 },
  { code: "SCR", label: "Roupie seychelloise",      symbol: "₨",       flag: "🇸🇨", rateFromEUR: 15.6 },
  { code: "MGA", label: "Ariary malgache",          symbol: "Ar",      flag: "🇲🇬", rateFromEUR: 4870.0 },

  // Asie du Sud & du Centre
  { code: "INR", label: "Roupie indienne",          symbol: "₹",       flag: "🇮🇳", rateFromEUR: 90.5 },
  { code: "PKR", label: "Roupie pakistanaise",      symbol: "₨",       flag: "🇵🇰", rateFromEUR: 300.0 },
  { code: "BDT", label: "Taka bangladais",          symbol: "৳",       flag: "🇧🇩", rateFromEUR: 118.0 },
  { code: "LKR", label: "Roupie sri-lankaise",      symbol: "₨",       flag: "🇱🇰", rateFromEUR: 322.0 },
  { code: "NPR", label: "Roupie népalaise",         symbol: "₨",       flag: "🇳🇵", rateFromEUR: 144.5 },
  { code: "MVR", label: "Rufiyaa maldivien",        symbol: "Rf",      flag: "🇲🇻", rateFromEUR: 16.7 },
  { code: "KZT", label: "Tenge kazakh",             symbol: "₸",       flag: "🇰🇿", rateFromEUR: 505.0 },
  { code: "UZS", label: "Sum ouzbek",               symbol: "лв",      flag: "🇺🇿", rateFromEUR: 13700.0 },
  { code: "TJS", label: "Somoni tadjik",            symbol: "SM",      flag: "🇹🇯", rateFromEUR: 11.7 },
  { code: "TMT", label: "Manat turkmène",           symbol: "T",       flag: "🇹🇲", rateFromEUR: 3.78 },
  { code: "KGS", label: "Som kirghiz",              symbol: "с",       flag: "🇰🇬", rateFromEUR: 93.8 },

  // Asie de l'Est & du Sud-Est
  { code: "JPY", label: "Yen japonais",             symbol: "¥",       flag: "🇯🇵", rateFromEUR: 163.0 },
  { code: "CNY", label: "Yuan chinois",             symbol: "¥",       flag: "🇨🇳", rateFromEUR: 7.85 },
  { code: "HKD", label: "Dollar de Hong Kong",      symbol: "HK$",     flag: "🇭🇰", rateFromEUR: 8.44 },
  { code: "TWD", label: "Dollar taïwanais",         symbol: "NT$",     flag: "🇹🇼", rateFromEUR: 35.3 },
  { code: "KRW", label: "Won sud-coréen",           symbol: "₩",       flag: "🇰🇷", rateFromEUR: 1483.0 },
  { code: "MNT", label: "Tögrög mongol",            symbol: "₮",       flag: "🇲🇳", rateFromEUR: 3700.0 },
  { code: "SGD", label: "Dollar de Singapour",      symbol: "S$",      flag: "🇸🇬", rateFromEUR: 1.46 },
  { code: "MYR", label: "Ringgit malaisien",        symbol: "RM",      flag: "🇲🇾", rateFromEUR: 5.07 },
  { code: "THB", label: "Baht thaïlandais",         symbol: "฿",       flag: "🇹🇭", rateFromEUR: 38.2 },
  { code: "IDR", label: "Roupie indonésienne",      symbol: "Rp",      flag: "🇮🇩", rateFromEUR: 17540.0 },
  { code: "PHP", label: "Peso philippin",           symbol: "₱",       flag: "🇵🇭", rateFromEUR: 63.4 },
  { code: "VND", label: "Dong vietnamien",          symbol: "₫",       flag: "🇻🇳", rateFromEUR: 27200.0 },
  { code: "KHR", label: "Riel cambodgien",          symbol: "៛",       flag: "🇰🇭", rateFromEUR: 4390.0 },
  { code: "LAK", label: "Kip laotien",              symbol: "₭",       flag: "🇱🇦", rateFromEUR: 23400.0 },
  { code: "MMK", label: "Kyat birman",              symbol: "K",       flag: "🇲🇲", rateFromEUR: 2270.0 },
  { code: "BND", label: "Dollar de Brunei",         symbol: "B$",      flag: "🇧🇳", rateFromEUR: 1.46 },

  // Océanie
  { code: "AUD", label: "Dollar australien",        symbol: "A$",      flag: "🇦🇺", rateFromEUR: 1.66 },
  { code: "NZD", label: "Dollar néo-zélandais",     symbol: "NZ$",     flag: "🇳🇿", rateFromEUR: 1.81 },
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
