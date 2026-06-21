import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, ShieldAlert, FileDown, AlertCircle } from "lucide-react";
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

function getBankApiUrl() {
  return (import.meta as any).env?.VITE_API_BASE_URL || "/api";
}

export default function TransferLink() {
  const params = useParams();
  const token = params.token as string;
  const [transfer, setTransfer] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

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
      setConfirmed(true);
    } catch {
      setConfirmed(false);
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
      {/* Header */}
      <header className="h-14 flex items-center px-6 bg-[#003087] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#003087] font-black text-xs">BM</span>
          </div>
          <span className="text-white font-black text-sm tracking-wider uppercase">LA BANQUE MONDIALE</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center p-4 py-8">
        <div className="w-full max-w-2xl space-y-4">
          {/* Status badge */}
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
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-green-200">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Virement disponible
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Message + Details */}
            <Card className="border shadow-sm">
              <CardContent className="pt-5 pb-5 space-y-4">
                {transfer.message && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Message de l'expéditeur</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 italic leading-relaxed">
                      "{transfer.message}"
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Détails du virement</p>
                  <div className="space-y-2">
                    {[
                      { label: "Référence", value: transfer.reference },
                      { label: "Montant", value: `${Number(transfer.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${transfer.currency}` },
                      { label: "Envoyé par", value: transfer.senderName || "—" },
                      {
                        label: "Date",
                        value: format(new Date(transfer.createdAt), "dd/MM/yyyy HH:mm", { locale: fr }),
                      },
                      ...(transfer.expiresAt
                        ? [{
                            label: "Expiration",
                            value: format(new Date(transfer.expiresAt), "dd/MM/yyyy", { locale: fr }),
                          }]
                        : []),
                      ...(isCompleted && transfer.confirmedAt
                        ? [{
                            label: "Confirmé le",
                            value: format(new Date(transfer.confirmedAt), "dd/MM/yyyy HH:mm", { locale: fr }),
                          }]
                        : []),
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className={`font-medium ${row.label === "Montant" ? "text-[#003087] font-bold text-base" : "text-gray-900"}`}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Secure badge + Actions */}
            <div className="space-y-4">
              <Card className="border shadow-sm">
                <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-3">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-[#003087]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Transaction sécurisée</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Vos informations sont protégées et cryptées par Banque Mondiale.
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
                  <div className="w-full h-12 flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-semibold">
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

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground pb-4">
            © {new Date().getFullYear()} La Banque Mondiale — Tous droits réservés
          </p>
        </div>
      </main>
    </div>
  );
}
