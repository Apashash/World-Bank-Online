import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, ShieldAlert, FileDown, AlertCircle, Send, ArrowDownToLine, Banknote, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";

type TransferData = {
  id: number;
  token: string;
  reference: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  senderName: string | null;
};

const STEPS = [
  { key: "sent",     label: "Envoyé",    icon: Send },
  { key: "received", label: "Réception", icon: ArrowDownToLine },
  { key: "withdraw", label: "Retrait",   icon: Banknote },
  { key: "confirmed",label: "Confirmé",  icon: BadgeCheck },
];

function getActiveStep(status: string): number {
  if (status === "completed") return 4;
  if (status === "expired" || status === "cancelled") return 1;
  return 2;
}

function StatusBar({ status }: { status: string }) {
  const activeStep = getActiveStep(status);
  return (
    <div className="w-full px-2 py-5">
      <div className="flex items-center justify-between relative">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const done = stepNum < activeStep;
          const current = stepNum === activeStep;
          const pending = stepNum > activeStep;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {i < STEPS.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-[3px] z-0"
                  style={{ background: done ? "#003087" : "#e5e7eb" }}
                />
              )}
              <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? "bg-[#003087] border-[#003087]" :
                  current ? "bg-white border-[#003087] shadow-md" :
                  "bg-white border-gray-200"}`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : (
                  <Icon className={`h-4 w-4 ${current ? "text-[#003087]" : "text-gray-300"}`} strokeWidth={1.8} />
                )}
                {current && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#003087] animate-ping opacity-75" />
                )}
              </div>
              <span className={`mt-2 text-[10px] font-semibold text-center leading-tight
                ${done ? "text-[#003087]" : current ? "text-[#003087]" : "text-gray-400"}`}>
                {step.label}
              </span>
              {current && status !== "expired" && status !== "cancelled" && (
                <span className="mt-0.5 text-[9px] font-bold text-amber-500 uppercase tracking-wide">
                  En attente
                </span>
              )}
              {done && stepNum === 4 && (
                <span className="mt-0.5 text-[9px] font-bold text-green-600 uppercase tracking-wide">
                  Confirmé
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TransferLink() {
  const params = useParams();
  const token = params.token as string;
  const [transfer, setTransfer] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/transfers/link/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setTransfer(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setConfirming(true);
    try {
      const r = await fetch(`/api/transfers/link/${token}/confirm`, { method: "POST" });
      if (!r.ok) throw new Error("Error");
      const data = await r.json();
      setTransfer(data);
    } catch {
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement du virement...</p>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h2>
          <p className="text-muted-foreground text-sm mb-6">Ce virement n'est plus accessible ou n'existe pas.</p>
          <Link href="/">
            <Button variant="outline">Retourner à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = transfer.status === "completed";
  const isExpired = transfer.status === "expired";
  const isCancelled = transfer.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo */}
      <header className="bg-[#003087] shadow-sm">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-3">
          <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-9 w-9 rounded-lg object-contain bg-white p-0.5" />
          <div>
            <span className="text-white font-black text-sm tracking-wider uppercase block leading-tight">Banque Mondiale</span>
            <span className="text-white/60 text-[10px] tracking-wide">Transaction sécurisée</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 py-6">
        <div className="w-full max-w-2xl space-y-4">

          {/* Amount hero */}
          <Card className="border-none shadow-md bg-[#003087] text-white overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center gap-1">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Montant du virement</p>
                <p className="text-4xl font-black">
                  {Number(transfer.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  <span className="text-xl ml-2 font-bold text-white/80">{transfer.currency}</span>
                </p>
                <p className="text-white/60 text-xs mt-1">De : <span className="text-white font-semibold">{transfer.senderName || "Expéditeur"}</span></p>
                <p className="text-white/60 text-xs">Pour : <span className="text-white font-semibold">{transfer.beneficiaryName}</span></p>
              </div>

              {/* Status Bar */}
              <div className="mt-5 bg-white/10 rounded-xl px-4 py-2">
                <StatusBar status={isCompleted ? "completed" : isExpired || isCancelled ? "cancelled" : "pending"} />
              </div>
            </CardContent>
          </Card>

          {/* Global status badge */}
          <div className="flex justify-center">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Virement confirmé
              </span>
            ) : isExpired || isCancelled ? (
              <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-red-200">
                <AlertCircle className="h-3.5 w-3.5" /> {isExpired ? "Virement expiré" : "Virement annulé"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-amber-200">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                En attente de confirmation
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Details */}
            <Card className="border shadow-sm">
              <CardContent className="pt-5 pb-5 space-y-4">
                {transfer.message && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Message</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 italic leading-relaxed">
                      "{transfer.message}"
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Détails</p>
                  <div className="space-y-0">
                    {[
                      { label: "Référence", value: transfer.reference },
                      { label: "Date", value: format(new Date(transfer.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }) },
                      ...(transfer.expiresAt ? [{ label: "Expiration", value: format(new Date(transfer.expiresAt), "dd/MM/yyyy", { locale: fr }) }] : []),
                      ...(isCompleted && transfer.confirmedAt ? [{ label: "Confirmé le", value: format(new Date(transfer.confirmedAt), "dd/MM/yyyy HH:mm", { locale: fr }) }] : []),
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium text-gray-900 text-right text-xs max-w-[60%] break-all">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Actions */}
            <div className="space-y-4">
              <Card className="border shadow-sm">
                <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-[#003087]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Transaction sécurisée</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Vos données sont protégées et chiffrées par Banque Mondiale.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {!isCompleted && !isExpired && !isCancelled ? (
                  <Button
                    className="w-full h-12 text-base bg-[#003087] hover:bg-[#002060] text-white"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Confirmation...
                      </span>
                    ) : (
                      "Confirmer la réception"
                    )}
                  </Button>
                ) : isCompleted ? (
                  <div className="w-full h-12 flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-semibold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> Virement confirmé
                  </div>
                ) : null}

                <Button variant="outline" className="w-full h-11">
                  <FileDown className="mr-2 h-4 w-4" />
                  Télécharger le reçu (PDF)
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-4">
            © {new Date().getFullYear()} La Banque Mondiale — Tous droits réservés
          </p>
        </div>
      </main>
    </div>
  );
}
