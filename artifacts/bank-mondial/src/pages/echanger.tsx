import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight, TrendingUp, Info, Search, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { code: "EUR", label: "Euro", flag: "🇪🇺", rate: 1 },
  { code: "USD", label: "Dollar américain", flag: "🇺🇸", rate: 1.085 },
  { code: "GBP", label: "Livre sterling", flag: "🇬🇧", rate: 0.856 },
  { code: "CHF", label: "Franc suisse", flag: "🇨🇭", rate: 0.957 },
  { code: "JPY", label: "Yen japonais", flag: "🇯🇵", rate: 161.5 },
  { code: "CNY", label: "Yuan chinois", flag: "🇨🇳", rate: 7.87 },
  { code: "CAD", label: "Dollar canadien", flag: "🇨🇦", rate: 1.48 },
  { code: "AUD", label: "Dollar australien", flag: "🇦🇺", rate: 1.66 },
  { code: "NZD", label: "Dollar néo-zélandais", flag: "🇳🇿", rate: 1.81 },
  { code: "SEK", label: "Couronne suédoise", flag: "🇸🇪", rate: 11.27 },
  { code: "NOK", label: "Couronne norvégienne", flag: "🇳🇴", rate: 11.56 },
  { code: "DKK", label: "Couronne danoise", flag: "🇩🇰", rate: 7.46 },
  { code: "PLN", label: "Złoty polonais", flag: "🇵🇱", rate: 4.27 },
  { code: "CZK", label: "Couronne tchèque", flag: "🇨🇿", rate: 25.2 },
  { code: "HUF", label: "Forint hongrois", flag: "🇭🇺", rate: 392 },
  { code: "RON", label: "Leu roumain", flag: "🇷🇴", rate: 4.97 },
  { code: "BGN", label: "Lev bulgare", flag: "🇧🇬", rate: 1.956 },
  { code: "HRK", label: "Kuna croate", flag: "🇭🇷", rate: 7.53 },
  { code: "RSD", label: "Dinar serbe", flag: "🇷🇸", rate: 117.1 },
  { code: "TRY", label: "Livre turque", flag: "🇹🇷", rate: 34.9 },
  { code: "RUB", label: "Rouble russe", flag: "🇷🇺", rate: 99.5 },
  { code: "UAH", label: "Hryvnia ukrainienne", flag: "🇺🇦", rate: 44.7 },
  { code: "MAD", label: "Dirham marocain", flag: "🇲🇦", rate: 10.85 },
  { code: "DZD", label: "Dinar algérien", flag: "🇩🇿", rate: 145.8 },
  { code: "TND", label: "Dinar tunisien", flag: "🇹🇳", rate: 3.38 },
  { code: "EGP", label: "Livre égyptienne", flag: "🇪🇬", rate: 52.3 },
  { code: "LYD", label: "Dinar libyen", flag: "🇱🇾", rate: 5.28 },
  { code: "XOF", label: "Franc CFA (BCEAO)", flag: "🌍", rate: 655.96 },
  { code: "XAF", label: "Franc CFA (BEAC)", flag: "🌍", rate: 655.96 },
  { code: "NGN", label: "Naira nigérian", flag: "🇳🇬", rate: 1680 },
  { code: "GHS", label: "Cedi ghanéen", flag: "🇬🇭", rate: 16.2 },
  { code: "KES", label: "Shilling kényan", flag: "🇰🇪", rate: 139 },
  { code: "UGX", label: "Shilling ougandais", flag: "🇺🇬", rate: 4050 },
  { code: "TZS", label: "Shilling tanzanien", flag: "🇹🇿", rate: 2830 },
  { code: "ETB", label: "Birr éthiopien", flag: "🇪🇹", rate: 120 },
  { code: "ZAR", label: "Rand sud-africain", flag: "🇿🇦", rate: 20.2 },
  { code: "ZMW", label: "Kwacha zambien", flag: "🇿🇲", rate: 27.4 },
  { code: "MWK", label: "Kwacha malawite", flag: "🇲🇼", rate: 1870 },
  { code: "RWF", label: "Franc rwandais", flag: "🇷🇼", rate: 1395 },
  { code: "BIF", label: "Franc burundais", flag: "🇧🇮", rate: 3160 },
  { code: "DJF", label: "Franc djiboutien", flag: "🇩🇯", rate: 193 },
  { code: "SOS", label: "Shilling somalien", flag: "🇸🇴", rate: 619 },
  { code: "SDG", label: "Livre soudanaise", flag: "🇸🇩", rate: 645 },
  { code: "MRU", label: "Ouguiya mauritanien", flag: "🇲🇷", rate: 43.2 },
  { code: "GMD", label: "Dalasi gambien", flag: "🇬🇲", rate: 74.5 },
  { code: "SLL", label: "Leone sierra-léonais", flag: "🇸🇱", rate: 22400 },
  { code: "GNF", label: "Franc guinéen", flag: "🇬🇳", rate: 9350 },
  { code: "SLE", label: "Leone (nouvelle)", flag: "🇸🇱", rate: 22.4 },
  { code: "LRD", label: "Dollar libérien", flag: "🇱🇷", rate: 204 },
  { code: "CVE", label: "Escudo cap-verdien", flag: "🇨🇻", rate: 110.3 },
  { code: "STN", label: "Dobra santoméen", flag: "🇸🇹", rate: 24.5 },
  { code: "AOA", label: "Kwanza angolais", flag: "🇦🇴", rate: 897 },
  { code: "MZN", label: "Metical mozambicain", flag: "🇲🇿", rate: 69.2 },
  { code: "BWP", label: "Pula botswanais", flag: "🇧🇼", rate: 14.7 },
  { code: "NAD", label: "Dollar namibien", flag: "🇳🇦", rate: 20.2 },
  { code: "SZL", label: "Lilangeni swazi", flag: "🇸🇿", rate: 20.2 },
  { code: "LSL", label: "Loti lésothan", flag: "🇱🇸", rate: 20.2 },
  { code: "KMF", label: "Franc comorien", flag: "🇰🇲", rate: 491 },
  { code: "MGA", label: "Ariary malgache", flag: "🇲🇬", rate: 4850 },
  { code: "MUR", label: "Roupie mauricienne", flag: "🇲🇺", rate: 49.7 },
  { code: "SCR", label: "Roupie seychelloise", flag: "🇸🇨", rate: 14.8 },
  { code: "SAR", label: "Riyal saoudien", flag: "🇸🇦", rate: 4.07 },
  { code: "AED", label: "Dirham émirati", flag: "🇦🇪", rate: 3.98 },
  { code: "QAR", label: "Riyal qatari", flag: "🇶🇦", rate: 3.95 },
  { code: "KWD", label: "Dinar koweïtien", flag: "🇰🇼", rate: 0.334 },
  { code: "BHD", label: "Dinar bahreïni", flag: "🇧🇭", rate: 0.409 },
  { code: "OMR", label: "Rial omanais", flag: "🇴🇲", rate: 0.418 },
  { code: "JOD", label: "Dinar jordanien", flag: "🇯🇴", rate: 0.770 },
  { code: "ILS", label: "Shekel israélien", flag: "🇮🇱", rate: 4.02 },
  { code: "LBP", label: "Livre libanaise", flag: "🇱🇧", rate: 97100 },
  { code: "SYP", label: "Livre syrienne", flag: "🇸🇾", rate: 14000 },
  { code: "IQD", label: "Dinar irakien", flag: "🇮🇶", rate: 1420 },
  { code: "IRR", label: "Rial iranien", flag: "🇮🇷", rate: 45700 },
  { code: "YER", label: "Rial yéménite", flag: "🇾🇪", rate: 272 },
  { code: "PKR", label: "Roupie pakistanaise", flag: "🇵🇰", rate: 302 },
  { code: "INR", label: "Roupie indienne", flag: "🇮🇳", rate: 90.5 },
  { code: "BDT", label: "Taka bangladais", flag: "🇧🇩", rate: 119 },
  { code: "LKR", label: "Roupie sri-lankaise", flag: "🇱🇰", rate: 323 },
  { code: "NPR", label: "Roupie népalaise", flag: "🇳🇵", rate: 144.8 },
  { code: "MVR", label: "Rufiyaa maldivien", flag: "🇲🇻", rate: 16.7 },
  { code: "AFN", label: "Afghani afghan", flag: "🇦🇫", rate: 76.1 },
  { code: "KZT", label: "Tenge kazakh", flag: "🇰🇿", rate: 505 },
  { code: "UZS", label: "Sum ouzbek", flag: "🇺🇿", rate: 13800 },
  { code: "TMT", label: "Manat turkmène", flag: "🇹🇲", rate: 3.80 },
  { code: "KGS", label: "Som kirghiz", flag: "🇰🇬", rate: 93.6 },
  { code: "TJS", label: "Somoni tadjik", flag: "🇹🇯", rate: 11.8 },
  { code: "AZN", label: "Manat azerbaïdjanais", flag: "🇦🇿", rate: 1.844 },
  { code: "GEL", label: "Lari géorgien", flag: "🇬🇪", rate: 2.93 },
  { code: "AMD", label: "Dram arménien", flag: "🇦🇲", rate: 420 },
  { code: "BYN", label: "Rouble biélorusse", flag: "🇧🇾", rate: 3.54 },
  { code: "MDL", label: "Leu moldave", flag: "🇲🇩", rate: 19.3 },
  { code: "MKD", label: "Denar macédonien", flag: "🇲🇰", rate: 61.5 },
  { code: "ALL", label: "Lek albanais", flag: "🇦🇱", rate: 104 },
  { code: "BAM", label: "Mark convertible (Bosnie)", flag: "🇧🇦", rate: 1.956 },
  { code: "THB", label: "Baht thaïlandais", flag: "🇹🇭", rate: 38.8 },
  { code: "VND", label: "Dông vietnamien", flag: "🇻🇳", rate: 27500 },
  { code: "IDR", label: "Roupiah indonésien", flag: "🇮🇩", rate: 17200 },
  { code: "MYR", label: "Ringgit malaisien", flag: "🇲🇾", rate: 5.1 },
  { code: "SGD", label: "Dollar de Singapour", flag: "🇸🇬", rate: 1.455 },
  { code: "PHP", label: "Peso philippin", flag: "🇵🇭", rate: 63.1 },
  { code: "KHR", label: "Riel cambodgien", flag: "🇰🇭", rate: 4350 },
  { code: "LAK", label: "Kip laotien", flag: "🇱🇦", rate: 22800 },
  { code: "MMK", label: "Kyat birman", flag: "🇲🇲", rate: 2280 },
  { code: "BND", label: "Dollar de Brunei", flag: "🇧🇳", rate: 1.455 },
  { code: "TWD", label: "Dollar de Taïwan", flag: "🇹🇼", rate: 34.5 },
  { code: "HKD", label: "Dollar de Hong Kong", flag: "🇭🇰", rate: 8.46 },
  { code: "KRW", label: "Won sud-coréen", flag: "🇰🇷", rate: 1460 },
  { code: "MNT", label: "Tögrög mongol", flag: "🇲🇳", rate: 3720 },
  { code: "BRL", label: "Real brésilien", flag: "🇧🇷", rate: 6.1 },
  { code: "ARS", label: "Peso argentin", flag: "🇦🇷", rate: 965 },
  { code: "CLP", label: "Peso chilien", flag: "🇨🇱", rate: 1015 },
  { code: "COP", label: "Peso colombien", flag: "🇨🇴", rate: 4580 },
  { code: "PEN", label: "Sol péruvien", flag: "🇵🇪", rate: 4.08 },
  { code: "VES", label: "Bolívar vénézuélien", flag: "🇻🇪", rate: 52.3 },
  { code: "BOB", label: "Boliviano bolivien", flag: "🇧🇴", rate: 7.49 },
  { code: "PYG", label: "Guaraní paraguayen", flag: "🇵🇾", rate: 8200 },
  { code: "UYU", label: "Peso uruguayen", flag: "🇺🇾", rate: 43.2 },
  { code: "GYD", label: "Dollar guyanais", flag: "🇬🇾", rate: 227 },
  { code: "SRD", label: "Dollar surinamais", flag: "🇸🇷", rate: 38.4 },
  { code: "MXN", label: "Peso mexicain", flag: "🇲🇽", rate: 20.6 },
  { code: "GTQ", label: "Quetzal guatémaltèque", flag: "🇬🇹", rate: 8.42 },
  { code: "HNL", label: "Lempira hondurien", flag: "🇭🇳", rate: 26.7 },
  { code: "NIO", label: "Córdoba nicaraguayen", flag: "🇳🇮", rate: 39.8 },
  { code: "CRC", label: "Colón costaricain", flag: "🇨🇷", rate: 570 },
  { code: "PAB", label: "Balboa panaméen", flag: "🇵🇦", rate: 1.085 },
  { code: "DOP", label: "Peso dominicain", flag: "🇩🇴", rate: 63.9 },
  { code: "HTG", label: "Gourde haïtienne", flag: "🇭🇹", rate: 143 },
  { code: "JMD", label: "Dollar jamaïcain", flag: "🇯🇲", rate: 168 },
  { code: "TTD", label: "Dollar de Trinité-et-Tobago", flag: "🇹🇹", rate: 7.37 },
  { code: "BBD", label: "Dollar de Barbade", flag: "🇧🇧", rate: 2.17 },
  { code: "BSD", label: "Dollar des Bahamas", flag: "🇧🇸", rate: 1.085 },
  { code: "XCD", label: "Dollar des Caraïbes orientales", flag: "🌎", rate: 2.93 },
  { code: "CUP", label: "Peso cubain", flag: "🇨🇺", rate: 26.0 },
  { code: "AWG", label: "Florin arubais", flag: "🇦🇼", rate: 1.95 },
  { code: "ANG", label: "Florin antillais", flag: "🇳🇱", rate: 1.95 },
  { code: "ISK", label: "Couronne islandaise", flag: "🇮🇸", rate: 149 },
  { code: "HUF", label: "Forint hongrois", flag: "🇭🇺", rate: 392 },
  { code: "FJD", label: "Dollar fidjien", flag: "🇫🇯", rate: 2.43 },
  { code: "PGK", label: "Kina papouasien", flag: "🇵🇬", rate: 4.06 },
  { code: "SBD", label: "Dollar des Îles Salomon", flag: "🇸🇧", rate: 9.12 },
  { code: "VUV", label: "Vatu vanuatais", flag: "🇻🇺", rate: 128 },
  { code: "WST", label: "Tālā samoan", flag: "🇼🇸", rate: 3.01 },
  { code: "TOP", label: "Paʻanga tonguien", flag: "🇹🇴", rate: 2.56 },
  { code: "XPF", label: "Franc Pacifique (CFP)", flag: "🌏", rate: 119.3 },
];

type Currency = typeof CURRENCIES[0];

function CurrencyPicker({
  value,
  onChange,
  exclude,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  exclude: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = CURRENCIES.find((c) => c.code === value)!;
  const filtered = CURRENCIES.filter(
    (c) =>
      c.code !== exclude &&
      (search === "" ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.label.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border rounded-xl px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#003087] hover:bg-gray-50 transition-colors min-w-[90px]"
      >
        <span className="text-base">{selected.flag}</span>
        <span>{selected.code}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-0.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-64 max-h-72 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une devise..."
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Aucune devise trouvée</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${c.code === value ? "bg-blue-50 text-[#003087] font-semibold" : "text-gray-700"}`}
              >
                <span className="text-base w-6 text-center shrink-0">{c.flag}</span>
                <span className="font-semibold shrink-0 w-10">{c.code}</span>
                <span className="text-xs text-gray-500 truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Echanger() {
  const { toast } = useToast();
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("XAF");
  const [amount, setAmount] = useState("100");
  const [converted, setConverted] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = CURRENCIES.find((c) => c.code === fromCurrency)!;
  const to = CURRENCIES.find((c) => c.code === toCurrency)!;

  useEffect(() => {
    const num = parseFloat(amount);
    if (!isNaN(num) && num > 0) {
      const inEur = num / from.rate;
      setConverted(inEur * to.rate);
    } else {
      setConverted(null);
    }
  }, [amount, fromCurrency, toCurrency]);

  const swap = () => {
    const prev = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prev);
    setAmount(converted ? converted.toFixed(2) : amount);
    setConfirmed(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setConfirmed(true);
    toast({
      title: "Échange effectué !",
      description: `${parseFloat(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${fromCurrency} → ${converted?.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${toCurrency}`,
    });
  };

  const rate = to.rate / from.rate;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <ArrowLeftRight className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Échanger des devises</h1>
          <p className="text-sm text-gray-500">Taux en temps réel · {CURRENCIES.length} devises disponibles</p>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-5 space-y-4">
          {/* From */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vous envoyez</label>
            <div className="flex gap-2">
              <CurrencyPicker
                value={fromCurrency}
                onChange={(code) => { setFromCurrency(code); setConfirmed(false); }}
                exclude={toCurrency}
                label="Devise source"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setConfirmed(false); }}
                className="flex-1 text-xl font-bold"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-400">{from.flag} {from.label}</p>
          </div>

          {/* Swap */}
          <div className="flex items-center justify-center">
            <button
              onClick={swap}
              className="h-10 w-10 rounded-full bg-[#003087] flex items-center justify-center hover:bg-[#002060] transition-colors shadow"
            >
              <ArrowLeftRight className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vous recevez</label>
            <div className="flex gap-2">
              <CurrencyPicker
                value={toCurrency}
                onChange={(code) => { setToCurrency(code); setConfirmed(false); }}
                exclude={fromCurrency}
                label="Devise cible"
              />
              <div className="flex-1 bg-gray-50 rounded-xl px-4 flex items-center">
                <span className="text-xl font-bold text-[#003087]">
                  {converted != null
                    ? converted.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "—"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400">{to.flag} {to.label}</p>
          </div>
        </CardContent>
      </Card>

      {/* Rate card */}
      <Card className="border border-blue-100 bg-blue-50/50 shadow-none">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#003087]" />
              <span className="text-sm font-medium text-gray-700">Taux de change</span>
            </div>
            <span className="text-sm font-bold text-[#003087]">
              1 {fromCurrency} = {rate.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {toCurrency}
            </span>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <Info className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">Frais de conversion : 0.5% · Taux indicatifs du marché</p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleConfirm}
        className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
        disabled={loading || !converted || confirmed}
      >
        {loading ? "Traitement..." : confirmed ? "Échange confirmé ✓" : "Confirmer l'échange"}
      </Button>
    </div>
  );
}
