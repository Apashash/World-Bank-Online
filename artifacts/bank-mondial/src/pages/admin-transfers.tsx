import { useState } from "react";
import { useAdminListTransfers, useAdminListUsers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Send, Loader2, RefreshCw, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

const STATUS_TABS = [
  { label: "Tous", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "Complétés", value: "completed" },
  { label: "Annulés", value: "cancelled" },
  { label: "Expirés", value: "expired" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  completed: "Complété",
  cancelled: "Annulé",
  expired: "Expiré",
};

type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  currency: string;
  balance: number;
  clientId: string;
};

const CURRENCIES = ["EUR", "USD", "GBP", "XOF", "MAD", "CHF", "CAD"];

export default function AdminTransfers() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    beneficiaryName: "",
    amount: "",
    currency: "EUR",
    message: "",
  });
  const [creating, setCreating] = useState(false);

  const { data, isLoading, refetch } = useAdminListTransfers({ page: 1, limit: 500 });
  const { data: usersData } = useAdminListUsers({ page: 1, limit: 500 });
  const { toast } = useToast();

  const allTransfers = Array.isArray(data?.transfers) ? data.transfers : [];
  const filtered =
    statusFilter === "all"
      ? allTransfers
      : allTransfers.filter((t) => t.status === statusFilter);
  const users: AdminUser[] = Array.isArray(usersData?.users)
    ? (usersData.users as AdminUser[])
    : [];

  const totalVolume = allTransfers.reduce((s, t) => s + t.amount, 0);
  const pendingCount = allTransfers.filter((t) => t.status === "pending").length;
  const completedCount = allTransfers.filter((t) => t.status === "completed").length;

  const selectedUserObj = users.find((u) => String(u.id) === form.userId);

  const handleCreate = async () => {
    if (!form.userId || !form.beneficiaryName || !form.amount) return;
    setCreating(true);
    try {
      const r = await authFetch("/api/admin/transfers/create", {
        method: "POST",
        body: JSON.stringify({
          userId: Number(form.userId),
          beneficiaryName: form.beneficiaryName,
          amount: Number(form.amount),
          currency: form.currency,
          message: form.message || undefined,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error ?? "Erreur lors de la création");
      toast({
        title: `Virement créé : ${form.amount} ${form.currency} → ${form.beneficiaryName}`,
      });
      setCreateOpen(false);
      setForm({ userId: "", beneficiaryName: "", amount: "", currency: "EUR", message: "" });
      refetch();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Virements</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {allTransfers.length} virement{allTransfers.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 text-white"
            style={{ background: "#003087" }}
          >
            <Plus className="h-4 w-4" />
            Nouveau virement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Volume total",
            value: `${totalVolume.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR`,
            icon: TrendingUp,
            color: "#003087",
          },
          {
            label: "En attente",
            value: pendingCount,
            icon: Clock,
            color: "#f59e0b",
          },
          {
            label: "Complétés",
            value: completedCount,
            icon: CheckCircle2,
            color: "#10b981",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${s.color}15` }}
            >
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-tight">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? allTransfers.length
              : allTransfers.filter((t) => t.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              style={
                statusFilter === tab.value
                  ? { background: "#003087", color: "#fff", borderColor: "#003087" }
                  : {
                      background: "#fff",
                      color: "#64748b",
                      borderColor: "#e2e8f0",
                    }
              }
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1.5 opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500">Date</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Émetteur</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Bénéficiaire</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Référence</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Statut</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-right">
                Montant
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-300" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                  Aucun virement dans cette catégorie
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-xs text-slate-500">
                    {format(new Date(t.createdAt), "dd/MM/yy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    <span className="font-mono text-xs">#{t.userId}</span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {t.beneficiaryName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {t.reference}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[t.status] ?? "bg-slate-100 text-slate-500"}`}
                    >
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-slate-900">{t.amount.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 ml-1">{t.currency}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "#003087" }}
              >
                <Send className="h-4 w-4 text-white" />
              </div>
              Créer un virement administrateur
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Compte émetteur
              </label>
              <Select
                value={form.userId}
                onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.fullName}</span>
                        <span className="text-xs text-slate-400">
                          {u.balance.toFixed(2)} {u.currency} · {u.clientId}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUserObj && (
                <p className="text-xs text-slate-400">
                  Solde disponible :{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedUserObj.balance.toFixed(2)} {selectedUserObj.currency}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Nom du bénéficiaire
              </label>
              <Input
                placeholder="Jean Dupont"
                value={form.beneficiaryName}
                onChange={(e) => setForm((f) => ({ ...f, beneficiaryName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Montant</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Devise</label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Message <span className="text-slate-400">(optionnel)</span>
              </label>
              <Input
                placeholder="Objet du virement..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.userId || !form.beneficiaryName || !form.amount || creating}
              style={{ background: "#003087" }}
              className="text-white hover:opacity-90"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Créer le virement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
