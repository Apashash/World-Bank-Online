import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ChevronRight, CheckCircle2, CreditCard, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getDashboardSummaryQueryKey } from "@workspace/api-client-react";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const METHODS = [
  { id: "card", label: "Carte bancaire", icon: CreditCard, detail: "Visa / Mastercard" },
  { id: "bank", label: "Virement bancaire", icon: Building, detail: "SEPA instantané" },
];

export default function Depot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast({ title: "Montant invalide", description: "Veuillez saisir un montant valide.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ balance: number; deposited: number }>("/api/wallet/depot", {
        amount: num,
        description: description || undefined,
      });
      setNewBalance(res.balance);
      queryClient.invalidateQueries({ queryKey: getDashboardSummaryQueryKey() });
      setDone(true);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-[#6DC142]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Dépôt effectué !</h2>
        <p className="text-gray-500">
          <span className="font-bold text-[#003087]">{parseFloat(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</span> ont été ajoutés à votre compte.
        </p>
        {newBalance !== null && (
          <p className="text-sm text-gray-400">Nouveau solde : <span className="font-semibold text-gray-700">{newBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</span></p>
        )}
        <Button className="bg-[#003087] hover:bg-[#002060] mt-4" onClick={() => { setDone(false); setAmount(""); setDescription(""); }}>
          Nouveau dépôt
        </Button>
      </div>
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

      <form onSubmit={handleSubmit} className="space-y-5">
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
                className="text-2xl font-bold h-14 pr-14 text-center"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-400">EUR</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    amount === String(a)
                      ? "bg-[#003087] text-white border-[#003087]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#003087] hover:text-[#003087]"
                  }`}
                >
                  {a} €
                </button>
              ))}
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

        <Button
          type="submit"
          className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
          disabled={loading || !amount}
        >
          {loading ? "Traitement en cours..." : `Déposer ${amount ? `${parseFloat(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR` : ""}`}
        </Button>
      </form>
    </div>
  );
}
