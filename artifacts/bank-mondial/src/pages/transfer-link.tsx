import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, ShieldAlert, FileDown, AlertCircle, Clock } from "lucide-react";
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
  { key: "sent",      label: "Envoyé" },
  { key: "received",  label: "Réception" },
  { key: "withdraw",  label: "Retrait" },
  { key: "confirmed", label: "Confirmé" },
];

function getActiveStep(status: string) {
  if (status === "completed") return 4;
  if (status === "expired" || status === "cancelled") return 0;
  return 1;
}

function StatusBar({ status }: { status: string }) {
  const activeStep = getActiveStep(status);
  const isCompleted = status === "completed";
  const activeColor = isCompleted ? "#16a34a" : "#003087";
  const activeBg = isCompleted ? "#dcfce7" : "#dbeafe";

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum <= activeStep;
        const current = stepNum === activeStep + (activeStep < 4 && !isCompleted ? 0 : 0);
        const isCurrent = !isCompleted && stepNum === 2 && status !== "expired" && status !== "cancelled";

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-500"
                style={{
                  backgroundColor: done ? activeColor : "#ffffff",
                  borderColor: done ? activeColor : isCurrent ? activeColor : "#d1d5db",
                  boxShadow: isCurrent ? `0 0 0 4px ${isCompleted ? "#bbf7d0" : "#bfdbfe"}` : "none",
                }}
              >
                {done ? (
                  <CheckCircle2
                    className="h-5 w-5"
                    style={{ color: "#ffffff" }}
                  />
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{ color: isCurrent ? activeColor : "#9ca3af" }}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
              <span
                className="text-[11px] font-semibold whitespace-nowrap"
                style={{ color: done ? activeColor : isCurrent ? activeColor : "#6b7280" }}
              >
                {step.label}
              </span>
              {isCurrent && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 -mt-0.5">
                  En attente
                </span>
              )}
              {isCompleted && stepNum === 4 && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 -mt-0.5">
                  Confirmé
                </span>
              )}
            </div>

            {/* Connector bar */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-1 h-[3px] rounded-full overflow-hidden bg-gray-200 mb-5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: stepNum <= activeStep ? "100%" : "0%",
                    backgroundColor: activeColor,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f4f8" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-[3px] border-[#003087] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Chargement du virement…</p>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f0f4f8" }}>
        <div className="w-full max-w-sm text-center bg-white rounded-2xl shadow-lg p-8">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h2>
          <p className="text-gray-500 text-sm mb-6">Ce virement n'est plus accessible ou n'existe pas.</p>
          <Link href="/">
            <Button variant="outline" className="w-full">Retourner à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = transfer.status === "completed";
  const isExpired = transfer.status === "expired";
  const isCancelled = transfer.status === "cancelled";
  const isPending = !isCompleted && !isExpired && !isCancelled;

  const statusForBar = isCompleted ? "completed" : isExpired || isCancelled ? "cancelled" : "pending";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f4f8" }}>

      {/* Header */}
      <header className="bg-[#003087] shadow-lg">
        <div className="max-w-xl mx-auto px-5 h-16 flex items-center gap-3">
          <img
            src="/logo-banque-mondiale.png"
            alt="Banque Mondiale"
            className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow"
          />
          <div>
            <p className="text-white font-black text-sm tracking-widest uppercase leading-tight">Banque Mondiale</p>
            <p className="text-white/55 text-[10px] tracking-wide font-medium">Transaction sécurisée · SSL 256-bit</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
            <span className="text-[10px] text-green-300 font-semibold">Sécurisé</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-4 max-w-xl mx-auto w-full">

        {/* Hero card */}
        <div className="w-full rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #003087 0%, #0050c8 100%)" }}>
          {/* Amount section */}
          <div className="px-6 pt-7 pb-5 text-center">
            <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] mb-3">Montant du virement</p>
            <p className="text-5xl font-black text-white leading-none">
              {Number(transfer.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
              <span className="text-2xl font-bold text-white/70 ml-2">{transfer.currency}</span>
            </p>
            <div className="mt-3 flex flex-col gap-0.5">
              <p className="text-white/65 text-xs">
                De : <span className="text-white font-semibold">{transfer.senderName || "Expéditeur"}</span>
              </p>
              <p className="text-white/65 text-xs">
                Pour : <span className="text-white font-semibold">{transfer.beneficiaryName}</span>
              </p>
            </div>
          </div>

          {/* Status bar section — white background for readability */}
          <div className="mx-4 mb-5 bg-white rounded-xl px-5 py-5 shadow-inner">
            <StatusBar status={statusForBar} />
          </div>
        </div>

        {/* Global status pill */}
        <div className="flex justify-center">
          {isCompleted ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700 text-sm font-bold">Virement confirmé avec succès</span>
            </div>
          ) : isExpired || isCancelled ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-5 py-2 shadow-sm">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600 text-sm font-bold">{isExpired ? "Virement expiré" : "Virement annulé"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-5 py-2 shadow-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-amber-700 text-sm font-bold">En attente de confirmation</span>
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {transfer.message && (
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Message de l'expéditeur</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-sm text-gray-700 italic leading-relaxed">"{transfer.message}"</p>
              </div>
            </div>
          )}

          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">Détails de la transaction</p>
            <div className="space-y-0">
              {[
                { label: "Référence", value: transfer.reference, mono: true },
                { label: "Date d'émission", value: format(new Date(transfer.createdAt), "dd MMMM yyyy, HH:mm", { locale: fr }) },
                ...(transfer.expiresAt ? [{ label: "Expire le", value: format(new Date(transfer.expiresAt), "dd MMMM yyyy", { locale: fr }) }] : []),
                ...(isCompleted && transfer.confirmedAt ? [{ label: "Confirmé le", value: format(new Date(transfer.confirmedAt), "dd MMMM yyyy, HH:mm", { locale: fr }) }] : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500 font-medium">{row.label}</span>
                  <span className={`text-xs font-semibold text-gray-900 text-right max-w-[55%] ${(row as any).mono ? "font-mono text-[11px] break-all" : ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          {isPending && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full h-14 rounded-2xl text-white font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #003087 0%, #0050c8 100%)" }}
            >
              {confirming ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirmation en cours…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmer la réception
                </>
              )}
            </button>
          )}

          {isCompleted && (
            <div className="w-full h-14 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-bold text-base">Virement confirmé</span>
            </div>
          )}

          <button className="w-full h-12 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <FileDown className="h-4 w-4 text-gray-500" />
            Télécharger le reçu (PDF)
          </button>
        </div>

        {/* Security badge */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-[#003087]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Transaction 100% sécurisée</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Vos données sont chiffrées et protégées par la Banque Mondiale. Aucune information bancaire n'est partagée.</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          © {new Date().getFullYear()} La Banque Mondiale · Tous droits réservés
        </p>
      </main>
    </div>
  );
}
