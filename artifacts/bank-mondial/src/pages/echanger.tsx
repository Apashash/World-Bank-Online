import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight, TrendingUp, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { code: "EUR", label: "Euro", flag: "🇪🇺", rate: 1 },
  { code: "USD", label: "Dollar américain", flag: "🇺🇸", rate: 1.085 },
  { code: "GBP", label: "Livre sterling", flag: "🇬🇧", rate: 0.856 },
  { code: "CHF", label: "Franc suisse", flag: "🇨🇭", rate: 0.957 },
  { code: "MAD", label: "Dirham marocain", flag: "🇲🇦", rate: 10.85 },
  { code: "XOF", label: "Franc CFA", flag: "🌍", rate: 655.96 },
  { code: "CAD", label: "Dollar canadien", flag: "🇨🇦", rate: 1.48 },
  { code: "TND", label: "Dinar tunisien", flag: "🇹🇳", rate: 3.38 },
];

export default function Echanger() {
  const { toast } = useToast();
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("MAD");
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
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount(converted ? converted.toFixed(2) : amount);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setConfirmed(true);
    toast({ title: "Échange effectué !", description: `${parseFloat(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${fromCurrency} → ${converted?.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${toCurrency}` });
  };

  const rate = (to.rate / from.rate);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <ArrowLeftRight className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Échanger des devises</h1>
          <p className="text-sm text-gray-500">Taux en temps réel</p>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-5 space-y-4">
          {/* From */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vous envoyez</label>
            <div className="flex gap-2">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="flex-shrink-0 border rounded-xl px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]"
              >
                {CURRENCIES.filter((c) => c.code !== toCurrency).map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-xl font-bold"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-400">{from.flag} {from.label}</p>
          </div>

          {/* Swap button */}
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
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex-shrink-0 border rounded-xl px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]"
              >
                {CURRENCIES.filter((c) => c.code !== fromCurrency).map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 flex items-center">
                <span className="text-xl font-bold text-[#003087]">
                  {converted != null ? converted.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
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
