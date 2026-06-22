import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, UserX, ShieldAlert, RefreshCw, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";

function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Transfer = { id: number; beneficiaryName: string; amount: number; currency: string; status: string; createdAt: string; userId: number };
type User = { id: number; fullName: string; email: string; status: string; kycStatus: string; createdAt: string };
type KYC = { id: number; userId: number; status: string; createdAt: string };

type AlertItem = {
  type: "stale_transfer" | "blocked_user" | "pending_kyc" | "high_volume";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  createdAt: string;
  link?: string;
};

const SEVERITY_CONFIG = {
  high: { cls: "border-red-200 bg-red-50", dot: "bg-red-500", label: "Critique" },
  medium: { cls: "border-amber-200 bg-amber-50", dot: "bg-amber-500", label: "Attention" },
  low: { cls: "border-blue-200 bg-blue-50", dot: "bg-blue-400", label: "Info" },
};

const TYPE_ICONS: Record<AlertItem["type"], React.ReactNode> = {
  stale_transfer: <Clock className="h-5 w-5 text-amber-500" />,
  blocked_user: <UserX className="h-5 w-5 text-red-500" />,
  pending_kyc: <ShieldAlert className="h-5 w-5 text-blue-500" />,
  high_volume: <TrendingUp className="h-5 w-5 text-purple-500" />,
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const buildAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [trRes, usRes, kycRes] = await Promise.all([
        fetch("/api/admin/transfers?limit=100", { headers: authHeaders() }),
        fetch("/api/admin/users?limit=200", { headers: authHeaders() }),
        fetch("/api/admin/kyc", { headers: authHeaders() }),
      ]);

      const trData = trRes.ok ? await trRes.json() : { transfers: [] };
      const usData = usRes.ok ? await usRes.json() : { users: [] };
      const kycData = kycRes.ok ? await kycRes.json() : [];

      const transfers: Transfer[] = Array.isArray(trData.transfers) ? trData.transfers : [];
      const users: User[] = Array.isArray(usData.users) ? usData.users : [];
      const kycs: KYC[] = Array.isArray(kycData) ? kycData : [];

      const newAlerts: AlertItem[] = [];

      // Stale pending transfers (>12h)
      const stale = transfers.filter(
        (t) => t.status === "pending" && differenceInHours(new Date(), new Date(t.createdAt)) >= 12
      );
      if (stale.length > 0) {
        newAlerts.push({
          type: "stale_transfer",
          severity: stale.length > 5 ? "high" : "medium",
          title: `${stale.length} virement${stale.length > 1 ? "s" : ""} en attente depuis +12h`,
          description: stale.slice(0, 3).map((t) => `${t.beneficiaryName} (${t.amount} ${t.currency})`).join(", ") + (stale.length > 3 ? ` et ${stale.length - 3} autre(s)` : ""),
          createdAt: stale[0].createdAt,
          link: "/admin/transfers",
        });
      }

      // Blocked users created recently (last 24h)
      const recentBlocked = users.filter(
        (u) => u.status === "blocked" && differenceInHours(new Date(), new Date(u.createdAt)) <= 48
      );
      if (recentBlocked.length > 0) {
        newAlerts.push({
          type: "blocked_user",
          severity: "high",
          title: `${recentBlocked.length} compte${recentBlocked.length > 1 ? "s" : ""} bloqué${recentBlocked.length > 1 ? "s" : ""} récemment`,
          description: recentBlocked.slice(0, 3).map((u) => u.fullName).join(", "),
          createdAt: recentBlocked[0].createdAt,
          link: "/admin/users",
        });
      }

      // Pending KYC
      const pendingKyc = kycs.filter((k) => k.status === "pending");
      if (pendingKyc.length > 0) {
        newAlerts.push({
          type: "pending_kyc",
          severity: pendingKyc.length > 3 ? "medium" : "low",
          title: `${pendingKyc.length} dossier${pendingKyc.length > 1 ? "s" : ""} KYC en attente de révision`,
          description: "Des utilisateurs attendent la validation de leur identité.",
          createdAt: new Date().toISOString(),
          link: "/admin/kyc",
        });
      }

      // High volume transfers today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransfers = transfers.filter((t) => new Date(t.createdAt) >= today);
      const todayVolume = todayTransfers.reduce((s, t) => s + t.amount, 0);
      if (todayVolume > 50000) {
        newAlerts.push({
          type: "high_volume",
          severity: "medium",
          title: `Volume élevé aujourd'hui : ${todayVolume.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
          description: `${todayTransfers.length} virement${todayTransfers.length > 1 ? "s" : ""} traité${todayTransfers.length > 1 ? "s" : ""} aujourd'hui.`,
          createdAt: new Date().toISOString(),
          link: "/admin/transfers",
        });
      }

      // Sort by severity
      const order = { high: 0, medium: 1, low: 2 };
      newAlerts.sort((a, b) => order[a.severity] - order[b.severity]);
      setAlerts(newAlerts);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { buildAlerts(); }, [buildAlerts]);

  const visible = alerts.filter((a) => !dismissed.has(a.title));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alertes opérationnelles</h1>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : {formatDistanceToNow(lastRefresh, { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={buildAlerts} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl border animate-pulse bg-gray-50" />)}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-7 w-7 text-green-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Tout est en ordre</p>
            <p className="text-sm text-muted-foreground mt-1">Aucune anomalie détectée sur la plateforme.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            return (
              <div key={alert.title} className={`rounded-xl border p-4 ${cfg.cls}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{TYPE_ICONS[alert.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${cfg.dot}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {alert.link && (
                      <a href={alert.link} className="text-xs font-semibold text-[#003087] hover:underline">
                        Voir →
                      </a>
                    )}
                    <button
                      onClick={() => setDismissed((s) => new Set([...s, alert.title]))}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dismissed.size > 0 && (
        <div className="text-center">
          <button onClick={() => setDismissed(new Set())} className="text-xs text-gray-400 hover:text-gray-600 underline">
            Afficher les {dismissed.size} alerte{dismissed.size > 1 ? "s" : ""} masquée{dismissed.size > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
