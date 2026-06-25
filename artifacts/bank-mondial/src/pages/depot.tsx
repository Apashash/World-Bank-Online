import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ChevronRight, CheckCircle2, CreditCard, Building, ArrowLeft, Lock, Zap, Clock, User, Hash, FileText, Calendar, Shield, Copy, Check } from "lucide-react";
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
          <p className="text-sm text-gray-500">Dépôt de {amount.toFixed(2)} {cur}</p>
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
              Payer {amount.toFixed(2)} {cur}
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

function formatIBAN(value: string): string {
  const clean = value.replace(/\s/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

function validateIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, "");
  return clean.length >= 15 && clean.length <= 34 && /^[A-Z]{2}[0-9]{2}/.test(clean);
}

function validateBIC(bic: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic.toUpperCase());
}

function generateRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "BMDWB";
  for (let i = 0; i < 9; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

type BankStep = "beneficiary" | "details" | "confirm" | "processing" | "success";

function BankTransferForm({ amount, currency: cur, onSuccess, onBack }: {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<BankStep>("beneficiary");
  const [benefName, setBenefName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [bankName, setBankName] = useState("");
  const [transferType, setTransferType] = useState<"sepa" | "instant">("instant");
  const [motif, setMotif] = useState("");
  const [execDate, setExecDate] = useState("immediate");
  const [customDate, setCustomDate] = useState("");
  const [saveBenef, setSaveBenef] = useState(false);
  const [ref] = useState(() => generateRef());
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  const ibanError = iban.length > 6 && !validateIBAN(iban);
  const bicError = bic.length > 3 && !validateBIC(bic);

  const canStep1 = benefName.trim().length > 1 && validateIBAN(iban) && (!bic || validateBIC(bic));
  const canStep2 = motif.trim().length > 0 && (execDate !== "scheduled" || customDate.length > 0);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(ref).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  useEffect(() => {
    if (step !== "processing") return;
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => { onSuccess(); setStep("success"); }, 400); }
      setProgress(Math.min(p, 100));
    }, 220);
    return () => clearInterval(iv);
  }, [step]);

  const today = new Date().toISOString().split("T")[0];

  const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-[#003087]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );

  if (step === "processing") {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative h-24 w-24">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
            <circle cx="48" cy="48" r="42" fill="none" stroke="#003087" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.2s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Building className="h-8 w-8 text-[#003087]" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-gray-900">Traitement en cours...</p>
          <p className="text-sm text-gray-500">Connexion sécurisée au réseau bancaire</p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          {[
            { label: "Vérification de l'IBAN", done: progress > 25 },
            { label: "Validation BIC/SWIFT", done: progress > 50 },
            { label: "Autorisation de transfert", done: progress > 75 },
            { label: "Confirmation réseau SEPA", done: progress >= 100 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${s.done ? "bg-[#6DC142] border-[#6DC142]" : "border-gray-300"}`}>
                {s.done && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={`text-sm transition-colors ${s.done ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-[#003087] to-[#004ab3] p-6 text-white text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-[#6DC142] flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Virement initié !</h2>
          <p className="text-blue-200 text-sm">Votre virement a été envoyé avec succès</p>
          <div className="bg-white/10 rounded-xl px-4 py-3 mt-2">
            <p className="text-xs text-blue-200 mb-1">Montant viré</p>
            <p className="text-3xl font-black">{amount.toFixed(2)} <span className="text-lg font-normal opacity-70">{cur}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-0">
          <Row icon={Hash} label="Référence" value={ref} />
          <Row icon={User} label="Bénéficiaire" value={benefName} />
          <Row icon={Building} label="IBAN destinataire" value={iban} />
          <Row icon={Calendar} label="Type de virement" value={transferType === "instant" ? "SEPA Instantané" : "SEPA Standard (J+1)"} />
          <Row icon={FileText} label="Motif" value={motif} />
        </div>

        <button
          onClick={handleCopyRef}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-[#003087] hover:text-[#003087] transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-[#6DC142]" /> : <Copy className="h-4 w-4" />}
          {copied ? "Référence copiée !" : "Copier la référence"}
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
          <Shield className="h-3.5 w-3.5" />
          Opération sécurisée — Banque Mondiale
        </div>

        <Button className="w-full bg-[#003087] hover:bg-[#002060]" onClick={onBack}>
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep("details")} className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Confirmer le virement</h1>
            <p className="text-sm text-gray-500">Vérifiez les informations avant d'envoyer</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] p-5 text-white space-y-1">
          <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Montant du virement</p>
          <p className="text-4xl font-black">{amount.toFixed(2)} <span className="text-xl font-normal opacity-50">{cur}</span></p>
          <div className="flex items-center gap-2 mt-2">
            {transferType === "instant"
              ? <><Zap className="h-3.5 w-3.5 text-[#6DC142]" /><span className="text-xs text-[#6DC142] font-semibold">SEPA Instantané — réception sous 10 secondes</span></>
              : <><Clock className="h-3.5 w-3.5 text-blue-300" /><span className="text-xs text-blue-300 font-semibold">SEPA Standard — réception J+1 ouvré</span></>
            }
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-0">
          <Row icon={User} label="Bénéficiaire" value={benefName} />
          <Row icon={Hash} label="IBAN" value={iban} />
          {bic && <Row icon={Hash} label="BIC / SWIFT" value={bic.toUpperCase()} />}
          {bankName && <Row icon={Building} label="Banque" value={bankName} />}
          <Row icon={FileText} label="Motif" value={motif} />
          <Row icon={Calendar} label="Exécution" value={execDate === "immediate" ? "Immédiate" : customDate} />
        </div>

        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Shield className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Important :</strong> Vérifiez soigneusement l'IBAN du bénéficiaire. Un virement envoyé vers un mauvais IBAN peut ne pas être récupérable.
          </p>
        </div>

        <Button
          className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold gap-2"
          onClick={() => setStep("processing")}
        >
          <Lock className="h-4 w-4" />
          Confirmer le virement de {amount.toFixed(2)} {cur}
        </Button>

        <p className="text-center text-xs text-gray-400">
          En confirmant, vous autorisez Banque Mondiale à exécuter ce virement conformément à vos instructions.
        </p>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep("beneficiary")} className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Détails du virement</h1>
            <p className="text-sm text-gray-500">Vers {benefName}</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {["Bénéficiaire", "Détails", "Confirmation"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 1 ? "bg-[#6DC142] text-white" : i === 1 ? "bg-[#003087] text-white" : "bg-gray-200 text-gray-400"}`}>{i + 1}</div>
              <span className={`text-[10px] font-medium flex-1 ${i === 1 ? "text-[#003087]" : "text-gray-400"}`}>{s}</span>
              {i < 2 && <div className={`h-px flex-1 max-w-[20px] ${i < 1 ? "bg-[#6DC142]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
          {/* Type de virement */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Type de virement</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "instant", label: "SEPA Instantané", sub: "Réception < 10 sec", icon: Zap, color: "#6DC142" },
                { id: "sepa", label: "SEPA Standard", sub: "Réception J+1 ouvré", icon: Clock, color: "#64748b" },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTransferType(opt.id as any)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${transferType === opt.id ? "border-[#003087] bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <opt.icon className="h-5 w-5" style={{ color: opt.color }} />
                  <span className="text-xs font-semibold text-gray-900">{opt.label}</span>
                  <span className="text-[10px] text-gray-400">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Motif */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Motif du virement <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Ex : loyer mai, remboursement, salaire..."
              value={motif}
              onChange={e => setMotif(e.target.value)}
              maxLength={140}
              className="h-11"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{motif.length}/140</p>
          </div>

          {/* Date d'exécution */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Date d'exécution</Label>
            <div className="flex gap-2">
              {[
                { id: "immediate", label: "Immédiate" },
                { id: "scheduled", label: "Planifiée" },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExecDate(opt.id)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${execDate === opt.id ? "border-[#003087] bg-blue-50 text-[#003087]" : "border-gray-200 text-gray-500"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {execDate === "scheduled" && (
              <input
                type="date"
                min={today}
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="mt-2 w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              />
            )}
          </div>

          {/* Save benef */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setSaveBenef(v => !v)}
              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${saveBenef ? "bg-[#003087] border-[#003087]" : "border-gray-300"}`}
            >
              {saveBenef && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm text-gray-700">Enregistrer ce bénéficiaire pour les prochains virements</span>
          </label>
        </div>

        <Button
          className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
          onClick={() => canStep2 ? setStep("confirm") : toast({ title: "Veuillez compléter le motif", variant: "destructive" })}
        >
          Vérifier le virement
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Virement bancaire</h1>
          <p className="text-sm text-gray-500">Montant : {amount.toFixed(2)} {cur}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {["Bénéficiaire", "Détails", "Confirmation"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-[#003087] text-white" : "bg-gray-200 text-gray-400"}`}>{i + 1}</div>
            <span className={`text-[10px] font-medium flex-1 ${i === 0 ? "text-[#003087]" : "text-gray-400"}`}>{s}</span>
            {i < 2 && <div className="h-px flex-1 max-w-[20px] bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        {/* Nom bénéficiaire */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
            <User className="h-3.5 w-3.5" /> Nom du bénéficiaire <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Prénom NOM"
            value={benefName}
            onChange={e => setBenefName(e.target.value)}
            className="h-11"
            autoComplete="name"
          />
        </div>

        {/* IBAN */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
            <Hash className="h-3.5 w-3.5" /> IBAN <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="FR76 3000 6000 0112 3456 7890 189"
            value={iban}
            onChange={e => setIban(formatIBAN(e.target.value))}
            className={`h-11 font-mono tracking-wider uppercase ${ibanError ? "border-red-400 focus:ring-red-400" : ""}`}
            maxLength={42}
            autoComplete="off"
          />
          {ibanError && <p className="text-xs text-red-500 mt-1">Format IBAN invalide</p>}
          {validateIBAN(iban) && <p className="text-xs text-[#6DC142] mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> IBAN valide</p>}
        </div>

        {/* BIC */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
            <Hash className="h-3.5 w-3.5" /> BIC / SWIFT <span className="text-gray-400 font-normal text-xs ml-1">(optionnel)</span>
          </Label>
          <Input
            placeholder="BNPAFRPPXXX"
            value={bic}
            onChange={e => setBic(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
            className={`h-11 font-mono uppercase tracking-widest ${bicError ? "border-red-400" : ""}`}
            autoComplete="off"
          />
          {bicError && <p className="text-xs text-red-500 mt-1">Format BIC invalide (8 ou 11 caractères)</p>}
        </div>

        {/* Banque */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
            <Building className="h-3.5 w-3.5" /> Nom de la banque <span className="text-gray-400 font-normal text-xs ml-1">(optionnel)</span>
          </Label>
          <Input
            placeholder="Ex : BNP Paribas, Société Générale..."
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <Lock className="h-4 w-4 text-[#003087] shrink-0" />
        <p className="text-xs text-[#003087]">Vos coordonnées bancaires sont chiffrées et sécurisées par Banque Mondiale.</p>
      </div>

      <Button
        className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
        onClick={() => canStep1 ? setStep("details") : toast({ title: "Veuillez compléter les champs obligatoires", variant: "destructive" })}
      >
        Continuer
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
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
  const [step, setStep] = useState<"form" | "card" | "bank" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const handleSubmitMain = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast({ title: "Montant invalide", description: "Veuillez saisir un montant valide.", variant: "destructive" });
      return;
    }
    if (method === "card") { setStep("card"); return; }
    if (method === "bank") { setStep("bank"); return; }
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
    } catch {}
    setStep("done");
  };

  const handleBankSuccess = async () => {
    const num = parseFloat(amount);
    try {
      const res = await apiPost<{ balance: number; deposited: number }>("/api/wallet/depot", {
        amount: num,
        description: description || "Virement bancaire entrant",
      });
      setNewBalance(res.balance);
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch {}
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

  if (step === "bank") {
    return (
      <BankTransferForm
        amount={parseFloat(amount)}
        currency={currency.code}
        onSuccess={handleBankSuccess}
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

        <Button
          type="submit"
          className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
          disabled={loading || !amount}
        >
          {loading
            ? "Traitement en cours..."
            : method === "card"
              ? "Continuer vers le paiement par carte"
              : "Continuer vers le virement bancaire"}
        </Button>
      </form>
    </div>
  );
}
