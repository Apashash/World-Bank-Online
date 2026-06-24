import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminListUsers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, User, Users, CreditCard, Smartphone, Wallet, CheckCircle2, Copy, Share2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { CURRENCY_LABELS, convertFromEur, formatCurrencyAmount } from "@/lib/currency";

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

const PAYMENT_METHOD_OPTIONS = [
  { id: "card", label: "Carte bancaire", icon: CreditCard, color: "#003087" },
  { id: "paypal", label: "PayPal", icon: Wallet, color: "#0070BA" },
  { id: "mobile_money", label: "Mobile Money", icon: Smartphone, color: "#1DB954" },
];

const TRANSACTION_TYPES = [
  { value: "virement", label: "↗ Virement" },
  { value: "dépôt", label: "⬇ Dépôt" },
  { value: "retrait", label: "⬆ Retrait" },
  { value: "facture", label: "📄 Facture" },
];

const COUNTRIES = [
  "Afghanistan","Afrique du Sud","Algérie","Allemagne","Angola","Arabie Saoudite","Argentine","Australie",
  "Autriche","Belgique","Bénin","Brésil","Burkina Faso","Burundi","Cameroun","Canada","Cap-Vert",
  "Centrafrique","Chili","Chine","Colombie","Comores","Congo","Côte d'Ivoire","Croatie","Cuba","Danemark",
  "Djibouti","Égypte","Émirats arabes unis","Espagne","Estonie","Éthiopie","Finlande","France","Gabon",
  "Gambie","Ghana","Grèce","Guinée","Guinée-Bissau","Guinée équatoriale","Haïti","Hongrie","Inde",
  "Indonésie","Irak","Irlande","Israël","Italie","Jamaïque","Japon","Jordanie","Kazakhstan","Kenya",
  "Koweït","Liban","Libéria","Libye","Luxembourg","Madagascar","Malawi","Mali","Maroc","Mauritanie",
  "Mexique","Monaco","Mozambique","Namibie","Niger","Nigéria","Norvège","Nouvelle-Zélande","Oman",
  "Ouganda","Pakistan","Palestine","Pays-Bas","Pérou","Philippines","Pologne","Portugal","Qatar",
  "République démocratique du Congo","Roumanie","Royaume-Uni","Russie","Rwanda","Sénégal","Serbie",
  "Sierra Leone","Singapour","Somalie","Soudan","Sri Lanka","Suède","Suisse","Syrie","Tanzanie","Tchad",
  "Thaïlande","Togo","Tunisie","Turquie","Ukraine","Uruguay","Venezuela","Vietnam","Yémen","Zambie","Zimbabwe",
];

type AdminUser = { id: number; fullName: string; email: string; currency: string; balance: number; clientId: string };
type GeneratedResult = { id: number; token: string; reference: string; beneficiaryName: string; amount: number; displayCurrency: string };

function SectionCard({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100" style={{ backgroundColor: color + "0D" }}>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AdminTransferNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: usersData } = useAdminListUsers({ page: 1, limit: 500 });
  const users: AdminUser[] = Array.isArray(usersData?.users) ? (usersData.users as AdminUser[]) : [];

  const [creating, setCreating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedResult | null>(null);

  const [form, setForm] = useState({
    userId: "",
    transactionType: "virement",
    // Sender
    senderFirstName: "", senderLastName: "", senderCountry: "", senderCity: "",
    // Receiver
    receiverFirstName: "", receiverLastName: "", receiverEmail: "", receiverCountry: "", receiverCity: "",
    // Amount & currency
    amountEur: "", displayCurrency: "EUR",
    // Payment methods
    paymentMethods: [] as string[],
    // Block & WhatsApp
    blockReason: "", whatsappNumber: "",
    // Optional
    message: "",
  });

  const set = (key: string, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }));

  const selectedUser = users.find((u) => String(u.id) === form.userId);
  const convertedAmount = form.amountEur && form.displayCurrency !== "EUR"
    ? convertFromEur(Number(form.amountEur), form.displayCurrency)
    : null;

  const toggleMethod = (id: string) => {
    set("paymentMethods", form.paymentMethods.includes(id)
      ? form.paymentMethods.filter((m) => m !== id)
      : [...form.paymentMethods, id]);
  };

  const isValid = form.userId && form.receiverFirstName && form.receiverLastName &&
    form.amountEur && Number(form.amountEur) > 0 &&
    form.paymentMethods.length > 0 && form.blockReason && form.whatsappNumber;

  const handleCreate = async () => {
    if (!isValid) return;
    setCreating(true);
    try {
      const receiverName = `${form.receiverFirstName} ${form.receiverLastName}`.trim();
      const r = await authFetch("/api/admin/transfers/create", {
        method: "POST",
        body: JSON.stringify({
          userId: Number(form.userId),
          beneficiaryName: receiverName,
          amount: Number(form.amountEur),
          currency: "EUR",
          message: form.message || undefined,
          transactionType: form.transactionType,
          senderFirstName: form.senderFirstName,
          senderLastName: form.senderLastName,
          senderCountry: form.senderCountry,
          senderCity: form.senderCity,
          receiverFirstName: form.receiverFirstName,
          receiverLastName: form.receiverLastName,
          receiverEmail: form.receiverEmail,
          receiverCountry: form.receiverCountry,
          receiverCity: form.receiverCity,
          displayCurrency: form.displayCurrency,
          paymentMethods: form.paymentMethods,
          blockReason: form.blockReason,
          whatsappNumber: form.whatsappNumber,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error ?? "Erreur lors de la création");
      setGenerated(result);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const fullLink = generated ? `${window.location.origin}/t/${generated.token}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    toast({ title: "Lien copié !" });
  };

  // ── Success screen ──
  if (generated) {
    const convAmt = generated.displayCurrency !== "EUR"
      ? convertFromEur(generated.amount, generated.displayCurrency)
      : null;

    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/transfers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900">Virement créé</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Lien de virement généré !</h2>
            <p className="text-sm text-slate-500 mt-1">Partagez ce lien avec le receveur</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Lien de paiement</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 font-mono truncate">
                  {fullLink}
                </div>
                <button onClick={handleCopy}
                  className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <Copy className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Référence</p>
                <p className="font-mono text-xs font-semibold text-slate-800 break-all">{generated.reference}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Montant EUR</p>
                <p className="font-bold text-slate-900">{generated.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
              {convAmt !== null && (
                <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-blue-400 mb-0.5">Affiché en {generated.displayCurrency}</p>
                  <p className="font-bold text-blue-800">{formatCurrencyAmount(convAmt, generated.displayCurrency)}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Partager via
              </p>
              <div className="flex gap-2">
                {[
                  { label: "WhatsApp", color: "#25D366", char: "W", href: `https://wa.me/?text=${encodeURIComponent(`Virement – Confirmez ici : ${fullLink}`)}` },
                  { label: "Telegram", color: "#229ED9", char: "T", href: `https://t.me/share/url?url=${encodeURIComponent(fullLink)}` },
                  { label: "Email", color: "#6b7280", char: "✉", href: `mailto:?subject=Virement ${generated.reference}&body=${encodeURIComponent(`Lien : ${fullLink}`)}` },
                ].map((sl) => (
                  <a key={sl.label} href={sl.href} target="_blank" rel="noreferrer"
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: sl.color }}>
                    {sl.char}
                  </a>
                ))}
                <button onClick={handleCopy}
                  className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setLocation("/admin/transfers")}>
            Voir les virements
          </Button>
          <Button className="flex-1 text-white" style={{ background: "#003087" }}
            onClick={() => { setGenerated(null); setForm({ userId: "", transactionType: "virement", senderFirstName: "", senderLastName: "", senderCountry: "", senderCity: "", receiverFirstName: "", receiverLastName: "", receiverEmail: "", receiverCountry: "", receiverCity: "", amountEur: "", displayCurrency: "EUR", paymentMethods: [], blockReason: "", whatsappNumber: "", message: "" }); }}>
            Nouveau virement
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/transfers"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nouveau virement admin</h1>
          <p className="text-sm text-slate-400">Créez un lien de virement complet pour un client</p>
        </div>
      </div>

      {/* Compte émetteur */}
      <SectionCard icon={User} title="Compte émetteur" color="#003087">
        <div className="space-y-3">
          <Field label="Sélectionner un utilisateur" required>
            <Select value={form.userId} onValueChange={(v) => set("userId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un compte..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{u.fullName}</span>
                      <span className="text-xs text-slate-400">{u.balance?.toFixed(2)} {u.currency} · {u.clientId}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {selectedUser && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-[#003087] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {selectedUser.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.fullName}</p>
                <p className="text-xs text-slate-400">{selectedUser.email} · Solde : <span className="font-semibold text-slate-600">{selectedUser.balance?.toFixed(2)} {selectedUser.currency}</span></p>
              </div>
            </div>
          )}

          <Field label="Type d'opération">
            <div className="grid grid-cols-4 gap-2">
              {TRANSACTION_TYPES.map((t) => (
                <label key={t.value}
                  className={`flex items-center justify-center gap-1.5 cursor-pointer text-xs px-2 py-2 rounded-lg border transition-all ${form.transactionType === t.value ? "border-[#003087] bg-[#003087]/5 text-[#003087] font-semibold" : "border-slate-200 text-slate-600"}`}>
                  <input type="radio" className="hidden" value={t.value} checked={form.transactionType === t.value} onChange={() => set("transactionType", t.value)} />
                  {t.label}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Expéditeur */}
      <SectionCard icon={User} title="Informations de l'expéditeur" color="#0ea5e9">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <Input placeholder="Prénom" value={form.senderFirstName} onChange={(e) => set("senderFirstName", e.target.value)} />
          </Field>
          <Field label="Nom">
            <Input placeholder="Nom de famille" value={form.senderLastName} onChange={(e) => set("senderLastName", e.target.value)} />
          </Field>
          <Field label="Pays">
            <Select value={form.senderCountry} onValueChange={(v) => set("senderCountry", v)}>
              <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ville">
            <Input placeholder="Ville" value={form.senderCity} onChange={(e) => set("senderCity", e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* Receveur */}
      <SectionCard icon={Users} title="Informations du receveur" color="#7c3aed">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" required>
            <Input placeholder="Prénom" value={form.receiverFirstName} onChange={(e) => set("receiverFirstName", e.target.value)} />
          </Field>
          <Field label="Nom" required>
            <Input placeholder="Nom de famille" value={form.receiverLastName} onChange={(e) => set("receiverLastName", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" placeholder="email@exemple.com" value={form.receiverEmail} onChange={(e) => set("receiverEmail", e.target.value)} className="col-span-2" />
          </Field>
          <Field label="Pays">
            <Select value={form.receiverCountry} onValueChange={(v) => set("receiverCountry", v)}>
              <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ville">
            <Input placeholder="Ville" value={form.receiverCity} onChange={(e) => set("receiverCity", e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* Montant */}
      <SectionCard icon={Wallet} title="Montant et devise d'affichage" color="#059669">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant en EUR (€)" required>
            <Input type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amountEur} onChange={(e) => set("amountEur", e.target.value)} />
          </Field>
          <Field label="Devise d'affichage">
            <Select value={form.displayCurrency} onValueChange={(v) => set("displayCurrency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {convertedAmount !== null && (
          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">Affiché au receveur en {form.displayCurrency}</span>
            <span className="text-sm font-bold text-emerald-800">{formatCurrencyAmount(convertedAmount, form.displayCurrency)}</span>
          </div>
        )}
      </SectionCard>

      {/* Moyens de paiement */}
      <SectionCard icon={CreditCard} title="Moyens de paiement activés" color="#f59e0b">
        <div className="space-y-2">
          {PAYMENT_METHOD_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const checked = form.paymentMethods.includes(opt.id);
            return (
              <label key={opt.id}
                className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border transition-all ${checked ? "border-[#003087] bg-[#003087]/5" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="checkbox" className="accent-[#003087] h-4 w-4 shrink-0"
                  checked={checked} onChange={() => toggleMethod(opt.id)} />
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: opt.color + "20" }}>
                  <Icon className="h-4 w-4" style={{ color: opt.color }} />
                </div>
                <span className={`text-sm font-medium ${checked ? "text-[#003087]" : "text-slate-700"}`}>{opt.label}</span>
              </label>
            );
          })}
          {form.paymentMethods.length === 0 && (
            <p className="text-xs text-red-400 font-medium">Sélectionnez au moins un moyen de paiement</p>
          )}
        </div>
      </SectionCard>

      {/* Config retrait */}
      <SectionCard icon={Smartphone} title="Configuration du retrait" color="#ef4444">
        <div className="space-y-3">
          <Field label="Raison de blocage du retrait" required>
            <textarea
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003087]/30"
              rows={3}
              placeholder="Ex: Document d'identité requis pour débloquer les fonds..."
              value={form.blockReason}
              onChange={(e) => set("blockReason", e.target.value)}
            />
            <p className="text-[11px] text-slate-400">Ce message s'affiche au receveur lorsqu'il tente d'effectuer le retrait.</p>
          </Field>
          <Field label="Numéro WhatsApp admin (avec indicatif)" required>
            <Input placeholder="+33612345678" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
            <p className="text-[11px] text-slate-400 mt-1">Le receveur contactera ce numéro pour débloquer ses fonds.</p>
          </Field>
        </div>
      </SectionCard>

      {/* Message optionnel */}
      <SectionCard icon={Send} title="Message (optionnel)" color="#6b7280">
        <Field label="Message pour le receveur">
          <textarea
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003087]/30"
            rows={2}
            placeholder="Message personnalisé..."
            maxLength={250}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
          />
          <div className="text-right text-[11px] text-slate-400">{form.message.length}/250</div>
        </Field>
      </SectionCard>

      {/* Submit */}
      <button
        onClick={handleCreate}
        disabled={!isValid || creating}
        className="w-full h-13 py-3.5 rounded-xl text-white font-bold text-base shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: isValid ? "#003087" : "#94a3b8", cursor: isValid ? "pointer" : "not-allowed" }}
      >
        {creating ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Création en cours…</>
        ) : (
          <><Send className="h-5 w-5" /> Générer le lien de virement</>
        )}
      </button>
    </div>
  );
}
