import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, User, Mail, Phone, CreditCard, StickyNote, X, Check, BookUser, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Beneficiary = {
  id: number;
  name: string;
  iban?: string | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  createdAt: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function api(method: string, path: string, body?: object) {
  const r = await fetch(path, { method, headers: authHeaders(), body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function BeneficiaryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Beneficiary>;
  onSave: (data: Partial<Beneficiary>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ name: initial?.name ?? "", iban: initial?.iban ?? "", email: initial?.email ?? "", phone: initial?.phone ?? "", note: initial?.note ?? "" });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Nom complet *" value={form.name} onChange={set("name")} required />
        </div>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="IBAN" value={form.iban} onChange={set("iban")} />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" type="email" placeholder="Email" value={form.email} onChange={set("email")} />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Téléphone" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="relative md:col-span-2">
          <StickyNote className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Note (optionnel)" value={form.note} onChange={set("note")} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}><X className="h-4 w-4 mr-1" />Annuler</Button>
        <Button type="submit" size="sm" disabled={saving} className="bg-[#003087] hover:bg-[#003087]/90 text-white">
          <Check className="h-4 w-4 mr-1" />{saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

export default function Beneficiaries() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("GET", "/api/beneficiaries");
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Partial<Beneficiary>) => {
    try {
      const row = await api("POST", "/api/beneficiaries", data);
      setItems((p) => [row, ...p]);
      setShowForm(false);
      toast({ title: "Bénéficiaire ajouté" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const handleUpdate = async (data: Partial<Beneficiary>) => {
    if (!editing) return;
    try {
      const row = await api("PATCH", `/api/beneficiaries/${editing.id}`, data);
      setItems((p) => p.map((b) => (b.id === editing.id ? row : b)));
      setEditing(null);
      toast({ title: "Bénéficiaire modifié" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api("DELETE", `/api/beneficiaries/${id}`);
      setItems((p) => p.filter((b) => b.id !== id));
      toast({ title: "Bénéficiaire supprimé" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087]/10 shrink-0">
            <BookUser className="h-5 w-5 text-[#003087]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bénéficiaires</h1>
            <p className="text-sm text-muted-foreground">{items.length} contact{items.length !== 1 ? "s" : ""} enregistré{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {!showForm && !editing && (
          <Button onClick={() => setShowForm(true)} className="bg-[#003087] hover:bg-[#003087]/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4 text-gray-700">Nouveau bénéficiaire</p>
          <BeneficiaryForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border bg-white animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <BookUser className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Aucun bénéficiaire</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez vos contacts fréquents pour accélérer vos virements.</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-[#003087] hover:bg-[#003087]/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Ajouter un bénéficiaire
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border bg-white p-4 shadow-sm">
              {editing?.id === b.id ? (
                <div>
                  <p className="text-sm font-semibold mb-3 text-gray-700">Modifier le bénéficiaire</p>
                  <BeneficiaryForm initial={b} onSave={handleUpdate} onCancel={() => setEditing(null)} />
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003087]/10 text-[#003087] font-bold text-sm">
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{b.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {b.iban && <span className="text-xs text-gray-500 font-mono">{b.iban}</span>}
                      {b.email && <span className="text-xs text-gray-500">{b.email}</span>}
                      {b.phone && <span className="text-xs text-gray-500">{b.phone}</span>}
                      {b.note && <span className="text-xs text-gray-400 italic">{b.note}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
