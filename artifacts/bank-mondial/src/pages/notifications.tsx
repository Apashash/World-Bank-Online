import { useState, useEffect, useCallback } from "react";
import {
  Bell, CheckCheck, ArrowUpRight, ArrowDownLeft, CircleCheck,
  UserPlus, ShieldCheck, LogIn, Users, Wallet, Landmark,
  Receipt, RefreshCw, Send, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";

interface Notification {
  id: number;
  type: string;
  description: string;
  amount: string | null;
  currency: string | null;
  createdAt: string;
  isRead: boolean;
}

const FILTERS = [
  { key: "all",      label: "Toutes",    types: [] },
  { key: "transfers",label: "Virements", types: ["transfer_sent", "transfer_received", "transfer_confirmed"] },
  { key: "money",    label: "Dépôts & Retraits", types: ["deposit", "withdrawal"] },
  { key: "bills",    label: "Factures",  types: ["bill_payment"] },
  { key: "system",   label: "Système",   types: ["login", "kyc_updated", "sub_account_created", "referral_joined"] },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

async function fetchNotifications(types: string[]): Promise<Notification[]> {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];
  const params = types.length > 0 ? `?types=${types.join(",")}&limit=50` : "?limit=50";
  const res = await fetch(`/api/notifications${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function typeIcon(type: string) {
  switch (type) {
    case "transfer_sent":       return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    case "transfer_received":   return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    case "transfer_confirmed":  return <CircleCheck className="h-4 w-4 text-blue-500" />;
    case "sub_account_created": return <Users className="h-4 w-4 text-purple-500" />;
    case "kyc_updated":         return <ShieldCheck className="h-4 w-4 text-orange-500" />;
    case "login":               return <LogIn className="h-4 w-4 text-gray-500" />;
    case "referral_joined":     return <UserPlus className="h-4 w-4 text-indigo-500" />;
    case "deposit":             return <Wallet className="h-4 w-4 text-green-600" />;
    case "withdrawal":          return <Landmark className="h-4 w-4 text-amber-600" />;
    case "bill_payment":        return <Receipt className="h-4 w-4 text-rose-500" />;
    default:                    return <Bell className="h-4 w-4 text-gray-400" />;
  }
}

function typeBg(type: string) {
  switch (type) {
    case "transfer_sent":       return "bg-red-50";
    case "transfer_received":   return "bg-green-50";
    case "transfer_confirmed":  return "bg-blue-50";
    case "sub_account_created": return "bg-purple-50";
    case "kyc_updated":         return "bg-orange-50";
    case "login":               return "bg-gray-100";
    case "referral_joined":     return "bg-indigo-50";
    case "deposit":             return "bg-green-50";
    case "withdrawal":          return "bg-amber-50";
    case "bill_payment":        return "bg-rose-50";
    default:                    return "bg-gray-50";
  }
}

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const { toast } = useToast();

  const currentTypes = FILTERS.find((f) => f.key === activeFilter)?.types ?? [];

  const load = useCallback(async (types: string[]) => {
    setLoading(true);
    const data = await fetchNotifications(types);
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load([...currentTypes]);
  }, [activeFilter]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingRead(true);
    try {
      await apiPost("/api/notifications/mark-read", {});
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({ title: "Toutes les notifications marquées comme lues" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer comme lues.", variant: "destructive" });
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087]/10">
            <Bell className="h-5 w-5 text-[#003087]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => load([...currentTypes])}
            title="Rafraîchir"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleMarkAllRead}
              disabled={markingRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              activeFilter === f.key
                ? "bg-[#003087] text-white border-[#003087]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#003087]/40 hover:text-[#003087]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-white animate-pulse">
              <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-1/3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Bell className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Aucune notification</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeFilter === "all"
                ? "Vos activités apparaîtront ici."
                : "Aucune notification dans cette catégorie."}
            </p>
          </div>
          {activeFilter !== "all" && (
            <Button variant="outline" size="sm" onClick={() => setActiveFilter("all")}>
              Voir toutes les notifications
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                notif.isRead
                  ? "bg-white border-gray-100"
                  : "bg-blue-50/60 border-blue-100"
              }`}
            >
              {/* Icon */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${typeBg(notif.type)}`}>
                {typeIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-snug ${notif.isRead ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                    {notif.description}
                  </p>
                  {!notif.isRead && (
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  {notif.amount && notif.currency && (
                    <span className={`text-xs font-semibold ${
                      ["transfer_received", "deposit"].includes(notif.type)
                        ? "text-green-600"
                        : "text-[#003087]"
                    }`}>
                      {["transfer_sent", "withdrawal", "bill_payment"].includes(notif.type) ? "−" : "+"}
                      {Number(notif.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {notif.currency}
                    </span>
                  )}
                  <span
                    className="text-xs text-muted-foreground"
                    title={format(new Date(notif.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                  >
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
