import { useState, useEffect } from "react";
import {
  useAdminListUsers,
  useAdminBlockUser,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Ban,
  Unlock,
  Plus,
  Minus,
  Send,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Clock,
  X,
  ShieldAlert,
  Trash2,
  Crown,
} from "lucide-react";
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

type AdminUser = {
  id: number;
  clientId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  balance: number;
  currency: string;
  status: string;
  role: string;
  kycStatus: string;
  referralCode: string;
  iban?: string | null;
  createdAt: string;
};

type UserTransfer = {
  id: number;
  beneficiaryName: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  blocked: "bg-red-100 text-red-700 border-red-200",
  suspended: "bg-amber-100 text-amber-700 border-amber-200",
};

const KYC_BADGE: Record<string, string> = {
  none: "bg-slate-100 text-slate-500 border-slate-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const TRANSFER_STATUS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-500",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [localUser, setLocalUser] = useState<AdminUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [debitReason, setDebitReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [userTransfers, setUserTransfers] = useState<UserTransfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data, isLoading, refetch } = useAdminListUsers({
    page: 1,
    limit: 200,
    search: search || undefined,
  });
  const blockUser = useAdminBlockUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const allUsers: AdminUser[] = Array.isArray(data?.users)
    ? (data.users as AdminUser[])
    : [];

  const users =
    statusFilter === "all"
      ? allUsers
      : allUsers.filter((u) => u.status === statusFilter);

  const openUser = (u: AdminUser) => {
    setSelectedUser(u);
    setLocalUser(u);
    setSheetOpen(true);
    setCreditAmount("");
    setCreditReason("");
    setDebitAmount("");
    setDebitReason("");
    setUserTransfers([]);
    setDeleteConfirm(false);
  };

  useEffect(() => {
    if (!selectedUser) return;
    setTransfersLoading(true);
    authFetch(`/api/admin/users/${selectedUser.id}/transfers`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setUserTransfers(Array.isArray(d) ? d : []);
        setTransfersLoading(false);
      })
      .catch(() => {
        setUserTransfers([]);
        setTransfersLoading(false);
      });
  }, [selectedUser?.id]);

  const handleCredit = async () => {
    if (!localUser || !creditAmount || !creditReason) return;
    setActionLoading(true);
    try {
      const r = await authFetch(`/api/admin/users/${localUser.id}/credit`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(creditAmount), reason: creditReason }),
      });
      const updated = await r.json();
      if (!r.ok) throw new Error(updated.error ?? "Erreur");
      setLocalUser(updated);
      setCreditAmount("");
      setCreditReason("");
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      toast({ title: `✅ +${creditAmount} ${localUser.currency} crédité sur le compte` });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const handleDebit = async () => {
    if (!localUser || !debitAmount || !debitReason) return;
    setActionLoading(true);
    try {
      const r = await authFetch(`/api/admin/users/${localUser.id}/debit`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(debitAmount), reason: debitReason }),
      });
      const updated = await r.json();
      if (!r.ok) throw new Error(updated.error ?? "Erreur");
      setLocalUser(updated);
      setDebitAmount("");
      setDebitReason("");
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      toast({ title: `✅ -${debitAmount} ${localUser.currency} débité du compte` });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const handleToggleRole = async () => {
    if (!localUser) return;
    setActionLoading(true);
    try {
      const newRole = localUser.role === "admin" ? "user" : "admin";
      const r = await authFetch(`/api/admin/users/${localUser.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      const updated = await r.json();
      if (!r.ok) throw new Error(updated.error ?? "Erreur");
      setLocalUser(updated);
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      toast({ title: newRole === "admin" ? "✅ Utilisateur promu Admin" : "✅ Droits admin retirés" });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!localUser) return;
    setActionLoading(true);
    try {
      const r = await authFetch(`/api/admin/users/${localUser.id}`, { method: "DELETE" });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error ?? "Erreur");
      setSheetOpen(false);
      setDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      toast({ title: `✅ Compte de ${localUser.fullName} supprimé` });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const handleToggleBlock = (u: AdminUser, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isBlocked = u.status === "blocked";
    blockUser.mutate(
      { id: u.id, data: { blocked: !isBlocked } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          if (localUser?.id === u.id) {
            const newStatus = isBlocked ? "active" : "blocked";
            setLocalUser((prev) => (prev ? { ...prev, status: newStatus } : prev));
          }
          toast({ title: isBlocked ? "Compte débloqué" : "Compte bloqué" });
        },
      }
    );
  };

  const activeCount = allUsers.filter((u) => u.status === "active").length;
  const blockedCount = allUsers.filter((u) => u.status === "blocked").length;
  const pendingKyc = allUsers.filter((u) => u.kycStatus === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {allUsers.length} compte{allUsers.length !== 1 ? "s" : ""} enregistré{allUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: allUsers.length, icon: Users, bg: "#0f172a", text: "#fff" },
          { label: "Actifs", value: activeCount, icon: UserCheck, bg: "#10b981", text: "#fff" },
          { label: "Bloqués", value: blockedCount, icon: UserX, bg: "#ef4444", text: "#fff" },
          { label: "KYC en attente", value: pendingKyc, icon: Clock, bg: "#f59e0b", text: "#fff" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: s.bg, color: s.text }}
          >
            <s.icon className="h-5 w-5 opacity-70 shrink-0" />
            <div>
              <p className="text-2xl font-black leading-none">{s.value}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, email, ID client..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-white">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="blocked">Bloqués</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500">Utilisateur</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Client ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Pays</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Statut</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">KYC</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 text-right">Solde</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Inscrit le</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-300" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-slate-400 text-sm">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                  onClick={() => openUser(u)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                        style={{ background: "#003087" }}
                      >
                        {u.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{u.fullName}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {u.clientId}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{u.country ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_BADGE[u.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}
                    >
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${KYC_BADGE[u.kycStatus] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}
                    >
                      {u.kycStatus === "verified" && <ShieldCheck className="h-3 w-3" />}
                      {u.kycStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-slate-900">{u.balance.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 ml-1">{u.currency}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant={u.status === "blocked" ? "default" : "destructive"}
                      className="h-7 w-7"
                      title={u.status === "blocked" ? "Débloquer" : "Bloquer"}
                      onClick={(e) => handleToggleBlock(u, e)}
                    >
                      {u.status === "blocked" ? (
                        <Unlock className="h-3.5 w-3.5" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:w-[500px] sm:max-w-[500px] p-0 flex flex-col overflow-hidden">
          {localUser && (
            <>
              <SheetHeader
                className="px-4 py-4 shrink-0"
                style={{
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  borderBottom: "none",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white font-black text-lg"
                    style={{ background: "#003087" }}
                  >
                    {localUser.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-white text-base font-bold truncate pr-8">
                      {localUser.fullName}
                    </SheetTitle>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{localUser.email}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[localUser.status] ?? "bg-slate-100 text-slate-500"}`}
                      >
                        {localUser.status}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${KYC_BADGE[localUser.kycStatus] ?? "bg-slate-100 text-slate-500"}`}
                      >
                        KYC {localUser.kycStatus}
                      </span>
                      {localUser.role === "admin" && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6DC142] text-white border border-[#5ab332]">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <SheetClose className="ml-auto shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="h-4 w-4 text-white" />
                  </SheetClose>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full rounded-none bg-white border-b border-slate-100 px-1 justify-start h-10 gap-0 shrink-0 overflow-x-auto flex-nowrap">
                  {[
                    { value: "info", label: "Infos" },
                    { value: "solde", label: "Solde" },
                    { value: "virements", label: "Virements" },
                    { value: "actions", label: "Actions" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none h-full px-3 text-xs font-medium whitespace-nowrap shrink-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#003087] data-[state=active]:text-[#003087]"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent
                  value="info"
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-0 m-0"
                >
                  {[
                    { label: "Client ID", value: localUser.clientId },
                    { label: "Téléphone", value: localUser.phone ?? "—" },
                    { label: "Pays", value: localUser.country ?? "—" },
                    { label: "Devise", value: localUser.currency },
                    { label: "IBAN", value: localUser.iban ?? "—" },
                    { label: "Code parrainage", value: localUser.referralCode },
                    { label: "Rôle", value: localUser.role },
                    {
                      label: "Inscrit le",
                      value: format(new Date(localUser.createdAt), "dd MMMM yyyy à HH:mm", {
                        locale: fr,
                      }),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0"
                    >
                      <span className="text-xs text-slate-400 font-medium">{row.label}</span>
                      <span className="text-sm text-slate-800 font-semibold text-right max-w-[60%] break-all font-mono">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent
                  value="solde"
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-5 m-0"
                >
                  <div
                    className="rounded-2xl p-5 text-white"
                    style={{
                      background: "linear-gradient(135deg, #003087 0%, #004ab3 100%)",
                    }}
                  >
                    <p className="text-xs opacity-60 mb-1">Solde actuel</p>
                    <p className="text-4xl font-black tracking-tight">
                      {localUser.balance.toFixed(2)}
                    </p>
                    <p className="text-sm opacity-50 mt-0.5">{localUser.currency}</p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
                    <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Créditer le compte
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Montant"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="bg-white text-sm"
                        min="0.01"
                        step="0.01"
                      />
                      <Input
                        placeholder="Motif"
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                        className="bg-white text-sm"
                      />
                    </div>
                    <Button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                      onClick={handleCredit}
                      disabled={!creditAmount || !creditReason || actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `Créditer +${creditAmount || "0"} ${localUser.currency}`
                      )}
                    </Button>
                  </div>

                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
                    <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                      <Minus className="h-4 w-4" /> Débiter le compte
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Montant"
                        value={debitAmount}
                        onChange={(e) => setDebitAmount(e.target.value)}
                        className="bg-white text-sm"
                        min="0.01"
                        step="0.01"
                      />
                      <Input
                        placeholder="Motif"
                        value={debitReason}
                        onChange={(e) => setDebitReason(e.target.value)}
                        className="bg-white text-sm"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full font-semibold"
                      onClick={handleDebit}
                      disabled={!debitAmount || !debitReason || actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `Débiter -${debitAmount || "0"} ${localUser.currency}`
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent
                  value="virements"
                  className="flex-1 overflow-y-auto px-6 py-5 m-0"
                >
                  {transfersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    </div>
                  ) : userTransfers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Send className="h-8 w-8 text-slate-200 mb-3" />
                      <p className="text-sm text-slate-400">Aucun virement</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userTransfers.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {t.beneficiaryName}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {format(new Date(t.createdAt), "dd/MM/yy HH:mm", { locale: fr })} ·{" "}
                              <span className="font-mono">{t.reference}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-bold text-slate-900">
                              {t.amount.toFixed(2)}{" "}
                              <span className="text-xs font-normal text-slate-400">
                                {t.currency}
                              </span>
                            </p>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TRANSFER_STATUS[t.status] ?? "bg-slate-100 text-slate-500"}`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="actions"
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-3 m-0"
                >
                  <p className="text-xs text-slate-400 mb-1">
                    Ces actions prennent effet immédiatement sur le compte de l'utilisateur.
                  </p>

                  {/* Accès */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Accès au compte</p>
                    <Button
                      variant={localUser.status === "blocked" ? "default" : "destructive"}
                      className="w-full font-semibold"
                      onClick={() => handleToggleBlock(localUser)}
                      disabled={blockUser.isPending || actionLoading}
                    >
                      {blockUser.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : localUser.status === "blocked" ? (
                        <Unlock className="h-4 w-4 mr-2" />
                      ) : (
                        <Ban className="h-4 w-4 mr-2" />
                      )}
                      {localUser.status === "blocked" ? "Débloquer le compte" : "Bloquer le compte"}
                    </Button>
                  </div>

                  {/* Rôle admin */}
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                      <Crown className="h-4 w-4" /> Rôle administrateur
                    </p>
                    <p className="text-xs text-amber-600">
                      {localUser.role === "admin"
                        ? "Cet utilisateur est actuellement administrateur."
                        : "Cet utilisateur est un client standard."}
                    </p>
                    <Button
                      className={`w-full font-semibold ${localUser.role === "admin" ? "bg-slate-600 hover:bg-slate-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}
                      onClick={handleToggleRole}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : localUser.role === "admin" ? (
                        <ShieldAlert className="h-4 w-4 mr-2" />
                      ) : (
                        <Crown className="h-4 w-4 mr-2" />
                      )}
                      {localUser.role === "admin" ? "Retirer les droits Admin" : "Nommer Administrateur"}
                    </Button>
                  </div>

                  {/* Suppression */}
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Supprimer le compte
                    </p>
                    <p className="text-xs text-red-500">
                      Supprime définitivement l'utilisateur, ses virements et toutes ses données. Action irréversible.
                    </p>
                    {!deleteConfirm ? (
                      <Button
                        variant="destructive"
                        className="w-full font-semibold"
                        onClick={() => setDeleteConfirm(true)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer le compte
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-red-700 text-center">
                          Confirmer la suppression de {localUser.fullName} ?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 text-sm"
                            onClick={() => setDeleteConfirm(false)}
                            disabled={actionLoading}
                          >
                            Annuler
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1 text-sm font-bold"
                            onClick={handleDeleteUser}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Oui, supprimer"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
