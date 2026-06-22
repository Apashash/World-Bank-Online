import { useState, useEffect, useCallback } from "react";
import { CalendarClock, Plus, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ScheduledTransfer = {
  id: number;
  beneficiaryName: string;
  amount: number;
  currency: string;
  message?: string | null;
  scheduledAt: string;
  status: "pending" | "executed" | "cancelled" | "failed";
  createdAt: string;
};

function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "XOF"];

const STATUS_CONFIG = {
  pending: { label: "Planifié", icon: <Clock className="h-3.5 w-3.5" />, cls: "text-amber-600 bg-amber-50 border-amber-200" },
  executed: { label: "Exécuté", icon: <CheckCircle className="h-3.5 w-3.5" />, cls: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Annulé", icon: <XCircle className="h-3.5 w-3.5" />, cls: "text-gray-500 bg-gray-50 border-gray-200" },
  failed: { label: "Échoué", icon: <AlertCircle className="h-3.5 w-3.5" />, cls: "text-red-600 bg-red-50 border-red-200" },
};

function toLocalDatetimeValue(d: Date) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function ScheduledTransfers() {
  const [items, setItems] = useState<ScheduledTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ beneficiaryName: "", amount: "", currency: "EUR", message: "", scheduledAt: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const minDate = toLocalDatetimeValue(new Date(Date.now() + 5 * 60000));

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/scheduled-transfers", { headers: authHeaders() });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.beneficiaryName || !form.amount || !form.scheduledAt) return;
    setSaving(true);
    try {
      const r = await fetch("/api/scheduled-transfers", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          beneficiaryName: form.beneficiaryName,
          amount: parseFloat(form.amount),
          currency: form.currency,
          message: form.message || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Erreur");
      }
      const row = await r.json();
      setItems((p) => [row, ...p]);
      setShowForm(false);
      setForm({ beneficiaryName: "", amount: "", currency: "EUR", message: "", scheduledAt: "" });
      toast({ title: "Virement planifié" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleCancel = async (id: number) => {
    const r = await fetch(`/api/scheduled-transfers/${id}`, { method: "DELETE", headers: authHeaders() });
    if (r.ok) {
      setItems((p) => p.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t)));
      toast({ title: "Virement annulé" });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087]/10">
            <CalendarClock className="h-5 w-5 text-[#003087]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Virements planifiés</h1>
            <p className="text-sm text-muted-foreground">Programmez un virement à une date future</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-[#003087] hover:bg-[#003087]/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Planifier
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4 text-gray-700">Nouveau virement planifié</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Nom du bénéficiaire *" value={form.beneficiaryName} onChange={set("beneficiaryName")} required />
              <div className="flex gap-2">
                <Input type="number" placeholder="Montant *" min="0.01" step="0.01" value={form.amount} onChange={set("amount")} required className="flex-1" />
                <select value={form.currency} onChange={set("currency")} className="rounded-lg border border-gray-200 px-3 text-sm bg-white">
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Date et heure d'exécution *</label>
                <Input type="datetime-local" min={minDate} value={form.scheduledAt} onChange={set("scheduledAt")} required />
              </div>
              <Input placeholder="Message (optionnel)" value={form.message} onChange={set("message")} className="md:col-span-2" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-[#003087] hover:bg-[#003087]/90 text-white">
                {saving ? "Planification..." : "Planifier le virement"}
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
            <CalendarClock className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Aucun virement planifié</p>
            <p className="text-sm text-muted-foreground mt-1">Programmez un virement pour qu'il s'exécute automatiquement.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => {
            const cfg = STATUS_CONFIG[t.status];
            return (
              <div key={t.id} className="rounded-xl border bg-white p-4 shadow-sm flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003087]/10">
                  <CalendarClock className="h-5 w-5 text-[#003087]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{t.beneficiaryName}</p>
                    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                      {cfg.icon}{cfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#003087] mt-0.5">
                    {t.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {t.currency}
                  </p>
                  {t.message && <p className="text-xs text-gray-500 mt-0.5">{t.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Prévu le {format(new Date(t.scheduledAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                {t.status === "pending" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => handleCancel(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
