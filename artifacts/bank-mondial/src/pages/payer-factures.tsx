import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, CheckCircle2, Zap, Phone, Wifi, Droplets, Flame, Tv, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDashboardSummaryQueryKey, useGetDashboardSummary } from "@workspace/api-client-react";

const BILLERS = [
  { id: "EDF", label: "EDF", category: "Électricité", icon: Zap, color: "bg-yellow-50 text-yellow-600" },
  { id: "ENGIE", label: "ENGIE", category: "Gaz & Électricité", icon: Flame, color: "bg-orange-50 text-orange-600" },
  { id: "Orange", label: "Orange", category: "Téléphonie", icon: Phone, color: "bg-orange-50 text-orange-600" },
  { id: "Free", label: "Free", category: "Internet", icon: Wifi, color: "bg-red-50 text-red-600" },
  { id: "Eau de Paris", label: "Eau de Paris", category: "Eau", icon: Droplets, color: "bg-blue-50 text-blue-600" },
  { id: "Canal+", label: "Canal+", category: "TV & Streaming", icon: Tv, color: "bg-gray-50 text-gray-600" },
];

export default function PayerFactures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: summary } = useGetDashboardSummary();
  const [biller, setBiller] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const balance = summary?.balance ?? 0;
  const selectedBiller = BILLERS.find((b) => b.id === biller);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!biller || !reference || !num || num <= 0) {
      toast({ title: "Champs manquants", description: "Remplissez tous les champs.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ balance: number; paid: number }>("/api/wallet/payer-factures", {
        amount: num,
        biller,
        reference,
      });
      setNewBalance(res.balance);
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setDone(true);
    } catch (err: any) {
      if (err.message === "Solde insuffisant") {
        toast({
          title: "Solde insuffisant",
          description: `Votre solde est de ${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 text-[#6DC142] mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Facture payée !</h2>
        <p className="text-gray-500">
          Paiement de <span className="font-bold text-[#003087]">{parseFloat(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</span> à <span className="font-bold">{selectedBiller?.label}</span> effectué.
        </p>
        {newBalance !== null && (
          <p className="text-sm text-gray-400">Nouveau solde : <span className="font-semibold text-gray-700">{newBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</span></p>
        )}
        <p className="text-xs text-gray-400">Réf. : {reference}</p>
        <Button className="bg-[#003087] hover:bg-[#002060]" onClick={() => { setDone(false); setBiller(null); setReference(""); setAmount(""); }}>
          Payer une autre facture
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
          <Receipt className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payer factures</h1>
          <p className="text-sm text-gray-500">Solde disponible : <span className="font-semibold text-[#003087]">{balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Choisir le fournisseur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {BILLERS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBiller(b.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    biller === b.id ? "border-[#003087] bg-blue-50" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${b.color}`}>
                    <b.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{b.label}</span>
                  <span className="text-[10px] text-gray-500">{b.category}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {biller && (
          <>
            <Card className="border shadow-sm">
              <CardContent className="pt-5 space-y-4">
                <div>
                  <Label htmlFor="reference">Numéro de facture / Référence client</Label>
                  <Input
                    id="reference"
                    className="mt-2 font-mono"
                    placeholder="Ex : 00123456789"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Montant à payer</Label>
                  <div className="relative mt-2">
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-14"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">EUR</span>
                  </div>
                  {amount && parseFloat(amount) > balance && (
                    <p className="text-xs text-red-500 mt-1 font-medium">⚠ Solde insuffisant — disponible : {balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
              disabled={loading || !amount || parseFloat(amount) > balance}
            >
              {loading ? "Traitement..." : `Payer ${amount ? `${parseFloat(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR à ${selectedBiller?.label}` : "la facture"}`}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
