import { useState } from "react";
import { useAdminListTransfers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, RefreshCw, TrendingUp, Clock, CheckCircle2, ExternalLink, Unlock, Lock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

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

export default function AdminTransfers() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [unlocking, setUnlocking] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "one"; id: number; label: string } | { type: "all"; status: string; count: number } | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useAdminListTransfers({ page: 1, limit: 500 });

  const allTransfers = Array.isArray(data?.transfers) ? data.transfers : [];
  const filtered =
    statusFilter === "all"
      ? allTransfers
      : allTransfers.filter((t) => t.status === statusFilter);

  const totalVolume = allTransfers.reduce((s, t) => s + t.amount, 0);
  const pendingCount = allTransfers.filter((t) => t.status === "pending").length;
  const completedCount = allTransfers.filter((t) => t.status === "completed").length;

  const handleUnlock = async (id: number) => {
    setUnlocking(id);
    try {
      const r = await authFetch(`/api/admin/transfers/${id}/unlock`, { method: "POST" });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error ?? "Erreur");
      toast({ title: "Retrait débloqué — le receveur peut maintenant procéder." });
      refetch();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setUnlocking(null);
  };

  const handleDeleteOne = async (id: number) => {
    setDeletingId(id);
    try {
      const r = await authFetch(`/api/admin/transfers/${id}`, { method: "DELETE" });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error ?? "Erreur"); }
      toast({ title: "Virement supprimé." });
      refetch();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const handleDeleteAll = async (status: string) => {
    setDeletingAll(true);
    try {
      const url = status === "all" ? "/api/admin/transfers" : `/api/admin/transfers?status=${status}`;
      const r = await authFetch(url, { method: "DELETE" });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error ?? "Erreur"); }
      toast({ title: "Virements supprimés." });
      refetch();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setDeletingAll(false);
    setConfirmDelete(null);
  };

  const openDeleteAll = () => {
    const status = statusFilter;
    const count = status === "all" ? allTransfers.length : filtered.length;
    setConfirmDelete({ type: "all", status, count });
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
            variant="outline"
            size="sm"
            onClick={openDeleteAll}
            disabled={filtered.length === 0 || deletingAll}
            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Tout supprimer
          </Button>
          <Button
            size="sm"
            asChild
            className="gap-1.5 text-white"
            style={{ background: "#003087" }}
          >
            <Link href="/admin/transfers/new">
              <Plus className="h-4 w-4" />
              Nouveau virement
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            label: "Volume EUR",
            value: totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume.toFixed(0),
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
            className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg mb-2"
              style={{ background: `${s.color}15` }}
            >
              <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
            </div>
            <p className="text-lg font-bold text-slate-900 leading-tight truncate">{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
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

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm overflow-x-auto">
        <Table className="min-w-[750px]">
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500">Date</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Émetteur</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Bénéficiaire</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Référence</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Statut</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-right">Montant</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-center">Verrou</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-center">Lien</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-center">Suppr.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-300" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-slate-400 text-sm">
                  Aucun virement dans cette catégorie
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t: any) => (
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
                  <TableCell className="text-center">
                    {t.blockReason ? (
                      t.adminUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          <Unlock className="h-3 w-3" /> Débloqué
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUnlock(t.id)}
                          disabled={unlocking === t.id}
                          title="Confirmer le déblocage du retrait"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {unlocking === t.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                          Débloquer
                        </button>
                      )
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.token && (
                      <a
                        href={`/t/${t.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-[#003087] hover:bg-blue-50 transition-colors"
                        title="Ouvrir le lien de virement"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => setConfirmDelete({ type: "one", id: t.id, label: t.beneficiaryName })}
                      disabled={deletingId === t.id}
                      title="Supprimer ce virement"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deletingId === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {confirmDelete?.type === "one" ? "Supprimer ce virement ?" : "Supprimer tous les virements ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === "one" ? (
                <>
                  Le virement vers <strong>{confirmDelete.label}</strong> sera définitivement supprimé. Cette action est irréversible.
                </>
              ) : (
                <>
                  {confirmDelete?.count} virement{(confirmDelete?.count ?? 0) > 1 ? "s" : ""}{" "}
                  {confirmDelete?.status !== "all" ? `avec le statut « ${STATUS_LABEL[confirmDelete?.status ?? ""] ?? confirmDelete?.status} »` : "au total"}{" "}
                  seront définitivement supprimés. Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null || deletingAll}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletingId !== null || deletingAll}
              onClick={() => {
                if (!confirmDelete) return;
                if (confirmDelete.type === "one") {
                  handleDeleteOne(confirmDelete.id);
                } else {
                  handleDeleteAll(confirmDelete.status);
                }
              }}
            >
              {(deletingId !== null || deletingAll) ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Suppression...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Supprimer définitivement</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
