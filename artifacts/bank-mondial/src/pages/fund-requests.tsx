import { useState, useEffect, useCallback } from "react";
import { HandCoins, Plus, Copy, Check, Clock, XCircle, Banknote, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type FundRequest = {
  id: number;
  toEmail: string;
  amount: number;
  currency: string;
  message?: string | null;
  token: string;
  status: "pending" | "paid" | "cancelled" | "expired";
  expiresAt?: string | null;
  createdAt: string;
  link?: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "XOF"];

const STATUS_CONFIG = {
  pending: { label: "En attente", icon: <Clock className="h-3.5 w-3.5" />, cls: "text-amber-600 bg-amber-50 border-amber-200" },
  paid: { label: "Payée", icon: <Check className="h-3.5 w-3.5" />, cls: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Annulée", icon: <XCircle className="h-3.5 w-3.5" />, cls: "text-gray-500 bg-gray-50 border-gray-200" },
  expired: { label: "Expirée", icon: <XCircle className="h-3.5 w-3.5" />, cls: "text-red-500 bg-red-50 border-red-200" },
};

export default function FundRequests() {
  const [items, setItems] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ toEmail: "", amount: "", currency: "EUR", message: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/fund-requests", { headers: authHeaders() });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.toEmail || !form.amount) return;
    setSaving(true);
    try {
      const r = await fetch("/api/fund-requests", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ toEmail: form.toEmail, amount: parseFloat(form.amount), currency: form.currency, message: form.message || undefined }),
      });
      if (!r.ok) throw new Error("Erreur");
      const row = await r.json();
      setItems((p) => [row, ...p]);
      setShowForm(false);
      setForm({ toEmail: "", amount: "", currency: "EUR", message: "" });
      toast({ title: "Demande envoyée", description: "Le lien de paiement est prêt à partager." });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleCancel = async (id: number) => {
    await fetch(`/api/fund-requests/${id}`, { method: "DELETE", headers: authHeaders() });
    setItems((p) => p.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r)));
    toast({ title: "Demande annulée" });
  };

  const copyLink = (item: FundRequest) => {
    const link = `${window.location.origin}/fund-request/${item.token}`;
    navigator.clipboard.writeText(link);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087]/10">
            <HandCoins className="h-5 w-5 text-[#003087]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Demandes de fonds</h1>
            <p className="text-sm text-muted-foreground">Envoyez un lien de paiement à vos contacts</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-[#003087] hover:bg-[#003087]/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Nouvelle demande
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4 text-gray-700">Nouvelle demande de fonds</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9" type="email" placeholder="Email du payeur *" value={form.toEmail} onChange={set("toEmail")} required />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input className="pl-9" type="number" placeholder="Montant *" min="0.01" step="0.01" value={form.amount} onChange={set("amount")} required />
                </div>
                <select value={form.currency} onChange={set("currency")} className="rounded-lg border border-gray-200 px-3 text-sm bg-white">
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Input placeholder="Motif / message (optionnel)" value={form.message} onChange={set("message")} className="md:col-span-2" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-[#003087] hover:bg-[#003087]/90 text-white">
                {saving ? "Création..." : "Créer le lien de demande"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl border bg-white animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <HandCoins className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Aucune demande</p>
            <p className="text-sm text-muted-foreground mt-1">Créez un lien de paiement à envoyer à vos contacts.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const cfg = STATUS_CONFIG[item.status];
            return (
              <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003087]/10">
                    <HandCoins className="h-5 w-5 text-[#003087]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{item.toEmail}</p>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#003087] mt-0.5">
                      {item.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {item.currency}
                    </p>
                    {item.message && <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr })}
                      {item.expiresAt && ` · expire ${formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true, locale: fr })}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {item.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => copyLink(item)}
                        >
                          {copied === item.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === item.id ? "Copié" : "Lien"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleCancel(item.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
