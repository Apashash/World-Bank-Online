import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, UserPlus, Loader2, ChevronDown, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

const COUNTRIES = [
  "Afghanistan","Afrique du Sud","Albanie","Algérie","Allemagne","Angola","Arabie Saoudite",
  "Argentine","Australie","Autriche","Azerbaïdjan","Bahreïn","Bangladesh","Belgique","Bénin",
  "Bolivie","Brésil","Bulgarie","Burkina Faso","Burundi","Cameroun","Canada","Cap-Vert",
  "Centrafrique","Chili","Chine","Colombie","Comores","Congo","Corée du Sud","Costa Rica",
  "Côte d'Ivoire","Croatie","Cuba","Danemark","Djibouti","Égypte","Émirats arabes unis",
  "Équateur","Espagne","Estonie","Éthiopie","Finlande","France","Gabon","Gambie","Ghana",
  "Grèce","Guatemala","Guinée","Guinée-Bissau","Haïti","Honduras","Hongrie","Inde",
  "Indonésie","Irak","Iran","Irlande","Islande","Israël","Italie","Jamaïque","Japon",
  "Jordanie","Kazakhstan","Kenya","Koweït","Liban","Libéria","Libye","Luxembourg",
  "Madagascar","Malawi","Mali","Maroc","Mauritanie","Mexique","Moldavie","Monaco",
  "Mongolie","Mozambique","Namibie","Niger","Nigéria","Norvège","Nouvelle-Zélande","Oman",
  "Ouganda","Pakistan","Palestine","Panama","Paraguay","Pays-Bas","Pérou","Philippines",
  "Pologne","Portugal","Qatar","République démocratique du Congo","Roumanie","Royaume-Uni",
  "Russie","Rwanda","Sénégal","Serbie","Sierra Leone","Singapour","Slovaquie","Slovénie",
  "Somalie","Soudan","Sri Lanka","Suède","Suisse","Syrie","Tanzanie","Tchad","Thaïlande",
  "Togo","Tunisie","Turquie","Ukraine","Uruguay","Venezuela","Vietnam","Yémen","Zambie","Zimbabwe",
];

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#003087]"
      >
        <span>{value}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 h-9 rounded-md border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-[#003087]">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Rechercher un pays..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          {/* List */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">Aucun résultat</li>
            ) : (
              filtered.map((c) => (
                <li
                  key={c}
                  onMouseDown={() => { onChange(c); setOpen(false); setSearch(""); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                >
                  {c === value && <Check className="h-3.5 w-3.5 text-[#003087] shrink-0" />}
                  <span className={c === value ? "font-medium text-[#003087]" : ""}>{c}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AdminCreateUser() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "France",
    password: "",
    initialBalance: "",
    currency: "EUR",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, email, phone, country, password } = form;
    if (!fullName || !email || !phone || !country || !password) {
      toast({ title: "Tous les champs obligatoires doivent être remplis", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await authFetch("/api/admin/users/create", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          password: form.password,
          initialBalance: form.initialBalance || undefined,
          currency: form.currency,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Erreur lors de la création");
      toast({ title: `✅ Compte créé pour ${data.fullName} — ID: ${data.clientId}` });
      navigate("/admin/users");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#003087] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-[#003087]" />
          Créer un compte utilisateur
        </h1>
        <p className="text-sm text-slate-400 mt-1">Remplissez les informations pour ouvrir un nouveau compte.</p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nom complet *</label>
          <Input placeholder="Jean Dupont" value={form.fullName} onChange={set("fullName")} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email *</label>
          <Input type="email" placeholder="jean.dupont@email.com" value={form.email} onChange={set("email")} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Téléphone *</label>
          <Input type="tel" placeholder="+33 6 12 34 56 78" value={form.phone} onChange={set("phone")} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pays *</label>
          <CountrySelect
            value={form.country}
            onChange={(v) => setForm((f) => ({ ...f, country: v }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mot de passe *</label>
          <Input type="password" placeholder="Mot de passe sécurisé" value={form.password} onChange={set("password")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Solde initial</label>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.initialBalance} onChange={set("initialBalance")} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Devise</label>
            <select
              className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]"
              value={form.currency}
              onChange={set("currency")}
            >
              {["EUR","USD","GBP","CHF","CAD","MAD","XOF","XAF","DZD","TND"].map((cur) => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/admin/users")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-[#003087] hover:bg-[#002066] text-white font-bold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Créer le compte
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
