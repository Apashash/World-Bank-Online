import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ChevronRight, CheckCircle2, CreditCard, Building, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useCurrency } from "@/contexts/currency-context";

const QUICK_AMOUNTS_EUR = [50, 100, 200, 500, 1000];

const METHODS = [
  { id: "card", label: "Carte bancaire", icon: CreditCard, detail: "Visa / Mastercard" },
  { id: "bank", label: "Virement bancaire", icon: Building, detail: "SEPA instantané" },
];

const ALL_COUNTRIES = [
  "Afghanistan","Afrique du Sud","Albanie","Algérie","Allemagne","Andorre","Angola","Antigua-et-Barbuda",
  "Arabie saoudite","Argentine","Arménie","Australie","Autriche","Azerbaïdjan","Bahamas","Bahreïn",
  "Bangladesh","Barbade","Bélarus","Belgique","Belize","Bénin","Bhoutan","Bolivie","Bosnie-Herzégovine",
  "Botswana","Brésil","Brunéi","Bulgarie","Burkina Faso","Burundi","Cabo Verde","Cambodge","Cameroun",
  "Canada","Centrafrique","Chili","Chine","Chypre","Colombie","Comores","Congo","Corée du Nord",
  "Corée du Sud","Costa Rica","Côte d'Ivoire","Croatie","Cuba","Danemark","Djibouti","Dominique",
  "Égypte","Émirats arabes unis","Équateur","Érythrée","Espagne","Eswatini","Estonie","Éthiopie",
  "Fidji","Finlande","France","Gabon","Gambie","Géorgie","Ghana","Grèce","Grenade","Guatemala",
  "Guinée","Guinée-Bissau","Guinée équatoriale","Guyana","Haïti","Honduras","Hongrie","Inde",
  "Indonésie","Irak","Iran","Irlande","Islande","Israël","Italie","Jamaïque","Japon","Jordanie",
  "Kazakhstan","Kenya","Kirghizistan","Kiribati","Kosovo","Koweït","Laos","Lesotho","Lettonie",
  "Liban","Libéria","Libye","Liechtenstein","Lituanie","Luxembourg","Macédoine du Nord","Madagascar",
  "Malaisie","Malawi","Maldives","Mali","Malte","Maroc","Marshall","Maurice","Mauritanie","Mexique",
  "Micronésie","Moldavie","Monaco","Mongolie","Monténégro","Mozambique","Myanmar","Namibie","Nauru",
  "Népal","Nicaragua","Niger","Nigeria","Norvège","Nouvelle-Zélande","Oman","Ouganda","Ouzbékistan",
  "Pakistan","Palaos","Palestine","Panama","Papouasie-Nouvelle-Guinée","Paraguay","Pays-Bas","Pérou",
  "Philippines","Pologne","Portugal","Qatar","République démocratique du Congo","République dominicaine",
  "Roumanie","Royaume-Uni","Russie","Rwanda","Saint-Kitts-et-Nevis","Saint-Marin","Saint-Vincent-et-les-Grenadines",
  "Sainte-Lucie","Salomon","Salvador","Samoa","São Tomé-et-Príncipe","Sénégal","Serbie","Seychelles",
  "Sierra Leone","Singapour","Slovaquie","Slovénie","Somalie","Soudan","Soudan du Sud","Sri Lanka",
  "Suède","Suisse","Suriname","Syrie","Tadjikistan","Tanzanie","Tchad","Thaïlande","Timor oriental",
  "Togo","Tonga","Trinité-et-Tobago","Tunisie","Turkménistan","Türkiye","Tuvalu","Ukraine","Uruguay",
  "Vanuatu","Vatican","Venezuela","Vietnam","Yémen","Zambie","Zimbabwe",
];

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unionpay" | "unknown";

const BRANDS_CYCLE: CardBrand[] = ["visa", "mastercard", "amex", "discover", "unionpay"];

function detectBrand(num: string): CardBrand {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  if (/^62/.test(n)) return "unionpay";
  return "unknown";
}

function formatCardNumber(value: string, brand: CardBrand): string {
  const digits = value.replace(/\D/g, "");
  if (brand === "amex") {
    return digits.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3").replace(/(\d{4})(\d{1,6})/, "$1 $2").replace(/(\d{4} \d{6})(\d{1,5})/, "$1 $2");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function CardBrandIcon({ brand, size = 40 }: { brand: CardBrand; size?: number }) {
  if (brand === "visa") {
    return (
      <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 780 500" fill="none">
        <rect width="780" height="500" rx="40" fill="#1A1F71"/>
        <text x="390" y="340" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="280" fill="white" letterSpacing="-10">VISA</text>
      </svg>
    );
  }
  if (brand === "mastercard") {
    return (
      <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 152 95">
        <circle cx="60" cy="47.5" r="40" fill="#EB001B"/>
        <circle cx="92" cy="47.5" r="40" fill="#F79E1B"/>
        <path d="M76 15a40 40 0 0 1 0 65 40 40 0 0 1 0-65z" fill="#FF5F00"/>
      </svg>
    );
  }
  if (brand === "amex") {
    return (
      <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 780 500" fill="none">
        <rect width="780" height="500" rx="40" fill="#007BC1"/>
        <text x="390" y="330" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="180" fill="white" letterSpacing="5">AMEX</text>
      </svg>
    );
  }
  if (brand === "discover") {
    return (
      <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 780 500" fill="none">
        <rect width="780" height="500" rx="40" fill="#FFFFFF" stroke="#e2e8f0" strokeWidth="10"/>
        <text x="280" y="330" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="140" fill="#231F20">DISCOVER</text>
        <circle cx="600" cy="250" r="130" fill="#F76F20"/>
      </svg>
    );
  }
  if (brand === "unionpay") {
    return (
      <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 780 500" fill="none">
        <rect width="780" height="500" rx="40" fill="#CF0A2C"/>
        <text x="390" y="330" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="160" fill="white">UnionPay</text>
      </svg>
    );
  }
  return (
    <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 40 26" fill="none">
      <rect x="0.5" y="0.5" width="39" height="25" rx="3.5" fill="white" stroke="#D1D5DB"/>
      <rect x="0" y="7" width="40" height="6" fill="#9CA3AF"/>
    </svg>
  );
}

function CVCIcon() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
      <rect x="0.5" y="0.5" width="35" height="27" rx="3.5" fill="white" stroke="#D1D5DB"/>
      <rect x="0" y="5" width="36" height="5" fill="#9CA3AF"/>
      <rect x="20" y="14" width="12" height="9" rx="2" fill="#E5E7EB"/>
      <text x="26" y="22" textAnchor="middle" fontSize="6" fill="#374151" fontFamily="monospace" fontWeight="bold">123</text>
    </svg>
  );
}

function CardForm({ amount, currency: cur, onSuccess, onBack }: {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("Cameroun");
  const [saveInfo, setSaveInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const brand = cardNumber.replace(/\s/g, "").length > 0 ? detectBrand(cardNumber) : "unknown";
  const isEmpty = cardNumber.replace(/\s/g, "").length === 0;

  useEffect(() => {
    if (isEmpty) {
      intervalRef.current = setInterval(() => {
        setCycleIndex(i => (i + 1) % BRANDS_CYCLE.length);
      }, 1500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isEmpty]);

  const displayBrand: CardBrand = isEmpty ? BRANDS_CYCLE[cycleIndex] : brand;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, brand === "amex" ? 15 : 16);
    const b = detectBrand(raw);
    setCardNumber(formatCardNumber(raw, b));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
    setExpiry(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 13) {
      toast({ title: "Numéro de carte invalide", variant: "destructive" }); return;
    }
    if (expiry.length < 5) {
      toast({ title: "Date d'expiration invalide", variant: "destructive" }); return;
    }
    if (cvc.length < 3) {
      toast({ title: "Code CVC invalide", variant: "destructive" }); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Carte bancaire</h1>
          <p className="text-sm text-gray-500">Dépôt de {amount.toFixed(2)} {currency}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          {/* Card Number */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Numéro de carte</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1234 1234 1234 1234"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="pr-16 h-12 text-base font-mono tracking-widest"
                autoComplete="cc-number"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-500">
                <CardBrandIcon brand={displayBrand} size={42} />
              </div>
            </div>
          </div>

          {/* Expiry + CVC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Date d'expiration</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="MM / YY"
                value={expiry}
                onChange={handleExpiryChange}
                className="h-12 text-base font-mono"
                autoComplete="cc-exp"
                maxLength={5}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Code de sécurité</Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="CVC"
                  value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, brand === "amex" ? 4 : 3))}
                  className="h-12 text-base font-mono pr-12"
                  autoComplete="cc-csc"
                  maxLength={4}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <CVCIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Country */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Pays / Territoire</Label>
            <div className="relative">
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full h-12 px-3 pr-10 rounded-md border border-input bg-background text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[#003087] focus:border-transparent"
              >
                {ALL_COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Legal */}
        <p className="text-xs text-gray-400 leading-relaxed px-1">
          En fournissant vos informations de carte, vous autorisez Banque Mondiale à débiter votre carte pour ce paiement conformément à ses conditions d'utilisation.
        </p>

        {/* Save info */}
        <label className="flex items-start gap-3 cursor-pointer px-1">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={e => setSaveInfo(e.target.checked)}
              className="sr-only"
            />
            <div
              onClick={() => setSaveInfo(v => !v)}
              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${saveInfo ? "bg-[#003087] border-[#003087]" : "border-gray-300 bg-white"}`}
            >
              {saveInfo && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          </div>
          <span className="text-sm text-gray-700">Sauvegarder mes informations pour un paiement plus rapide</span>
        </label>

        <Button
          type="submit"
          className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold gap-2"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15"/></svg>
              Traitement en cours...
            </span>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Payer {amount.toFixed(2)} {currency}
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          Paiement sécurisé par chiffrement SSL 256 bits
        </div>
      </form>
    </div>
  );
}

export default function Depot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatAmount, convertAmount, currency } = useCurrency();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"form" | "card" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const handleSubmitMain = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast({ title: "Montant invalide", description: "Veuillez saisir un montant valide.", variant: "destructive" });
      return;
    }
    if (method === "card") {
      setStep("card");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ balance: number; deposited: number }>("/api/wallet/depot", {
        amount: num,
        description: description || undefined,
      });
      setNewBalance(res.balance);
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setStep("done");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCardSuccess = async () => {
    const num = parseFloat(amount);
    try {
      const res = await apiPost<{ balance: number; deposited: number }>("/api/wallet/depot", {
        amount: num,
        description: description || "Dépôt carte bancaire",
      });
      setNewBalance(res.balance);
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch {
    }
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-[#6DC142]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Dépôt effectué !</h2>
        <p className="text-gray-500">
          <span className="font-bold text-[#003087]">{formatAmount(parseFloat(amount), "EUR")}</span> ont été ajoutés à votre compte.
        </p>
        {newBalance !== null && (
          <p className="text-sm text-gray-400">
            Nouveau solde : <span className="font-semibold text-gray-700">{formatAmount(newBalance, "EUR")}</span>
          </p>
        )}
        <Button className="bg-[#003087] hover:bg-[#002060] mt-4" onClick={() => { setStep("form"); setAmount(""); setDescription(""); }}>
          Nouveau dépôt
        </Button>
      </div>
    );
  }

  if (step === "card") {
    return (
      <CardForm
        amount={parseFloat(amount)}
        currency={currency.code}
        onSuccess={handleCardSuccess}
        onBack={() => setStep("form")}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépôt</h1>
          <p className="text-sm text-gray-500">Alimentez votre compte</p>
        </div>
      </div>

      <form onSubmit={handleSubmitMain} className="space-y-5">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Montant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-bold h-14 pr-16 text-center"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                {currency.code}
              </span>
            </div>
            {amount && parseFloat(amount) > 0 && currency.code !== "EUR" && (
              <p className="text-xs text-gray-400 text-center">
                ≈ {(parseFloat(amount) / currency.rateFromEUR).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR débité
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS_EUR.map((a) => {
                const converted = convertAmount(a, "EUR");
                const isLarge = currency.rateFromEUR > 100;
                const label = isLarge
                  ? `${Math.round(converted).toLocaleString("fr-FR")} ${currency.symbol}`
                  : `${converted.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency.symbol}`;
                const eurValue = String(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(eurValue)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      amount === eurValue
                        ? "bg-[#003087] text-white border-[#003087]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#003087] hover:text-[#003087]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Méthode de dépôt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  method === m.id ? "border-[#003087] bg-blue-50" : "border-gray-100 hover:border-gray-300"
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${method === m.id ? "bg-[#003087]" : "bg-gray-100"}`}>
                  <m.icon className={`h-5 w-5 ${method === m.id ? "text-white" : "text-gray-500"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.detail}</p>
                </div>
                {method === m.id && <ChevronRight className="h-4 w-4 text-[#003087]" />}
              </button>
            ))}
          </CardContent>
        </Card>

        {method === "bank" && (
          <Card className="border shadow-sm">
            <CardContent className="pt-5">
              <Label htmlFor="desc" className="text-sm font-medium">Description (optionnel)</Label>
              <Input
                id="desc"
                className="mt-2"
                placeholder="Ex : épargne mensuelle..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
          disabled={loading || !amount}
        >
          {loading
            ? "Traitement en cours..."
            : method === "card"
              ? `Continuer vers le paiement`
              : `Déposer ${amount ? formatAmount(parseFloat(amount), "EUR") : ""}`}
        </Button>
      </form>
    </div>
  );
}
