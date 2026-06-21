import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";

const POLL_INTERVAL = 30_000;

async function fetchUnreadCount(): Promise<number> {
  const token = localStorage.getItem("auth_token");
  if (!token) return 0;
  try {
    const res = await fetch("/api/notifications/count", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    const n = await fetchUnreadCount();
    setCount(n);
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [refresh]);

  const handleClick = async () => {
    if (count === 0) return;
    setLoading(true);
    try {
      await apiPost("/api/notifications/mark-read", {});
      setCount(0);
      toast({ title: "Notifications lues", description: "Toutes les notifications ont été marquées comme lues." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer les notifications.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={count > 0 ? `${count} notification${count > 1 ? "s" : ""} non lue${count > 1 ? "s" : ""}` : "Aucune nouvelle notification"}
      className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition-colors disabled:opacity-60"
    >
      <Bell className="h-4 w-4 text-white/70" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none ring-1 ring-[#003087]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
