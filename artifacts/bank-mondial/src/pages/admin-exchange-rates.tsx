import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, Plus, Trash2, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ExchangeRate = {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  updatedAt: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "XOF", "MAD", "TND", "CAD", "JPY", "CNY"];

export default function AdminExchangeRates() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromCurrency: "EUR", toCurrency: "USD", rate: "" });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [testFrom, setTestFrom] = useState("EUR");
  const [testTo, setTestTo] = useState("USD");
  const [testAmount, setTestAmount] = useState("100");
  const [testResult, setTestResult] = useState<{ result: number; rate: number } | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/exchange-rates", { headers: authHeaders() });
    if (r.ok) setRates(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rate) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/exchange-rates", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ fromCurrency: form.fromCurrency, toCurrency: form.toCurrency, rate: parseFloat(form.rate) }),
      });
      if (!r.ok) throw new Error();
      await load();
      setShowForm(false);
      setForm({ fromCurrency: "EUR", toCurrency: "USD", rate: "" });
      toast({ title: "Taux enregistré" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/exchange-rates/${id}`, { method: "DELETE", headers: authHeaders() });
    setRates((p) => p.filter((r) => r.id !== id));
    toast({ title: "Taux supprimé" });
  };

  const handleSeed = async () => {
    setSeeding(true);
    const r = await fetch("/api/admin/exchange-rates/seed", { method: "POST", headers: authHeaders() });
    const d = await r.json();
    await load();
    toast({ title: d.message });
    setSeeding(false);
  };

  const handleTest = async () => {
    const r = await fetch(`/api/exchange-rates/convert?from=${testFrom}&to=${testTo}&amount=${testAmount}`, { headers: authHeaders() });
    if (r.ok) setTestResult(await r.json());
    else { setTestResult(null); toast({ title: "Taux introuvable pour cette paire", variant: "destructive" }); }
  };

  // Group by from currency
  const grouped = rates.reduce<Record<string, ExchangeRate[]>>((acc, r) => {
    (acc[r.fromCurrency] = acc[r.fromCurrency] ?? []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087]/10">
            <ArrowLeftRight className="h-5 w-5 text-[#003087]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Taux de change</h1>
            <p className="text-sm text-muted-foreground">{rates.length} paire{rates.length !== 1 ? "s" : ""} configurée{rates.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {rates.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding} className="gap-1.5">
              <Zap className="h-4 w-4" />{seeding ? "Initialisation..." : "Initialiser les taux"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-[#003087] hover:bg-[#003087]/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Simulateur */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" /> Simulateur de conversion
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Montant</label>
            <Input type="number" value={testAmount} onChange={(e) => setTestAmount(e.target.value)} className="w-28" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">De</label>
            <select value={testFrom} onChange={(e) => setTestFrom(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Vers</label>
            <select value={testTo} onChange={(e) => setTestTo(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Button onClick={handleTest} variant="outline" className="gap-1.5">
            <ArrowLeftRight className="h-4 w-4" /> Convertir
          </Button>
          {testResult && (
            <div className="ml-2 rounded-lg bg-[#003087]/5 px-4 py-2 text-sm">
              <span className="font-bold text-[#003087] text-lg">{testResult.result.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
              <span className="text-gray-500 ml-1">{testTo}</span>
              <span className="text-xs text-gray-400 ml-2">(taux : {testResult.rate})</span>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4 text-gray-700">Nouveau taux / Modifier</p>
          <form onSubmit={handleSave} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">De</label>
              <select value={form.fromCurrency} onChange={set("fromCurrency")} className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Vers</label>
              <select value={form.toCurrency} onChange={set("toCurrency")} className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Taux (1 {form.fromCurrency} = X {form.toCurrency})</label>
              <Input type="number" step="0.00000001" min="0.00000001" placeholder="ex: 1.08" value={form.rate} onChange={set("rate")} required className="w-40" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving} className="bg-[#003087] hover:bg-[#003087]/90 text-white">
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-32 rounded-xl border animate-pulse bg-gray-50" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ArrowLeftRight className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Aucun taux configuré</p>
            <p className="text-sm text-muted-foreground mt-1">Cliquez sur "Initialiser les taux" pour commencer avec des valeurs par défaut.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([from, group]) => (
            <div key={from} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#003087]/5 border-b">
                <p className="font-semibold text-[#003087] text-sm">1 {from} = ...</p>
              </div>
              <div className="divide-y">
                {group.map((rate) => (
                  <div key={rate.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-8">{rate.toCurrency}</span>
                      <span className="font-mono font-semibold text-gray-900">{parseFloat(rate.rate).toFixed(6)}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(new Date(rate.updatedAt), "dd MMM HH:mm", { locale: fr })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(rate.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
