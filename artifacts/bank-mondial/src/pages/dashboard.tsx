import { useGetDashboardSummary, useGetRecentActivity, useGetReferralStats, useListTransfers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Users, Coins, Bell, Wallet, Send, Download, QrCode, Landmark, Receipt, ArrowLeftRight, LayoutGrid, User } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useGetMe } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Link } from "wouter";

type Beneficiary = { id: number; name: string; iban?: string | null };

function useRecentBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    fetch("/api/beneficiaries?limit=3", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setBeneficiaries(data.slice(0, 3));
      })
      .catch(() => {});
  }, []);
  return beneficiaries;
}

function buildWeeklyChart(transfers: any[]) {
  const weeks = [0, 1, 2, 3].reverse().map((i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const label = `Semaine ${4 - i}`;
    const items = (transfers || []).filter((t) => {
      const d = new Date(t.createdAt);
      return d >= weekStart && d <= weekEnd;
    });
    const sent = items.reduce((s, t) => s + t.amount, 0);
    const received = items.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount * 0.3, 0);
    return { label, sent: Math.round(sent), received: Math.round(received) };
  });
  return weeks;
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { data: referralStats } = useGetReferralStats();
  const { data: transfersData } = useListTransfers({ page: 1, limit: 100 });
  const { data: user } = useGetMe();
  const { formatAmount, currency } = useCurrency();
  const [period, setPeriod] = useState("30");
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 5;

  const chartData = buildWeeklyChart(transfersData?.transfers || []);
  const recentBeneficiaries = useRecentBeneficiaries();

  const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
    transfer_sent:         { label: "Virement envoyé", className: "bg-red-100 text-red-700 border-red-200",       dot: "bg-red-500" },
    transfer_confirmed:    { label: "Reçu",            className: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
    deposit:               { label: "Dépôt",           className: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    withdrawal:            { label: "Retrait",         className: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
    bill_payment:          { label: "Facture",         className: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
    sub_account_created:   { label: "Sous-compte",     className: "bg-blue-100 text-blue-700 border-blue-200",     dot: "bg-blue-400" },
    referral_registered:   { label: "Parrainage",      className: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-400" },
  };

  const getActivityConfig = (type: string) => ACTIVITY_TYPE_CONFIG[type] ?? { label: type, className: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

  const getActivityIcon = (type: string) => {
    const cfg = getActivityConfig(type);
    return <div className={`h-2 w-2 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#6DC142] flex items-center justify-center text-white font-bold text-sm">
            {user?.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700">
            Bonjour, {user?.fullName?.split(" ")[0]}
          </span>
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#003087] text-white border-none shadow-md">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/70 uppercase tracking-wide">Solde total</span>
              <Coins className="h-4 w-4 text-white/50" />
            </div>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? "—" : formatAmount(summary?.balance ?? 0, "EUR")}
            </div>
            <p className="text-[10px] text-white/50 mt-1 font-mono truncate">{summary?.iban || "IBAN non assigné"}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Virements envoyés</span>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{summary?.totalTransfersSent ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatAmount(summary?.totalAmountSent ?? 0, summary?.currency || "EUR")}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Virements reçus</span>
              <ArrowDownRight className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{summary?.totalTransfersReceived ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatAmount(summary?.totalAmountReceived ?? 0, summary?.currency || "EUR")}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filleuls</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{referralStats?.totalReferrals ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatAmount(referralStats?.totalRewards ?? 0, "EUR")} gagnés</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Wallet, label: "Dépôt", href: "/depot" },
              { icon: Send, label: "Envoyer", href: "/transfers/new" },
              { icon: Download, label: "Recevoir", href: "/recevoir" },
              { icon: ArrowLeftRight, label: "Virement", href: "/virements" },
              { icon: QrCode, label: "Scanner QR", href: "/scanner-qr" },
              { icon: Landmark, label: "Retrait", href: "/retrait" },
              { icon: Receipt, label: "Payer factures", href: "/payer-factures" },
              { icon: LayoutGrid, label: "Plus", href: "/plus" },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href}>
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icon className="h-6 w-6 text-[#003087]" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Beneficiaries shortcuts */}
      {recentBeneficiaries.length > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Bénéficiaires récents</p>
              <Link href="/beneficiaries" className="text-xs text-[#003087] font-medium hover:underline">Voir tout</Link>
            </div>
            <div className="flex gap-4">
              {recentBeneficiaries.map((b) => (
                <Link key={b.id} href="/transfers/new">
                  <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                    <div className="h-12 w-12 rounded-full bg-[#003087]/10 flex items-center justify-center group-hover:bg-[#003087]/20 transition-colors">
                      <User className="h-5 w-5 text-[#003087]" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium text-center max-w-[60px] truncate">{b.name.split(" ")[0]}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Aperçu des transactions</CardTitle>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003087" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6DC142" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6DC142" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(value: any, name: string) => [
                    formatAmount(Number(value), "EUR"),
                    name === "sent" ? "Envoyé" : "Reçu",
                  ]}
                />
                <Area type="monotone" dataKey="sent" stroke="#003087" strokeWidth={2} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="received" stroke="#6DC142" strokeWidth={2} fill="url(#colorReceived)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full bg-[#003087]" /> Envoyé
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full bg-[#6DC142]" /> Reçu
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Activités récentes</CardTitle>
              {Array.isArray(activities) && activities.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {activityPage * ACTIVITY_PAGE_SIZE + 1}–{Math.min((activityPage + 1) * ACTIVITY_PAGE_SIZE, activities.length)} sur {activities.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4">
            <div className="space-y-4">
              {isLoadingActivity ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
              ) : !Array.isArray(activities) || activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente.</p>
              ) : (
                activities
                  .slice(activityPage * ACTIVITY_PAGE_SIZE, (activityPage + 1) * ACTIVITY_PAGE_SIZE)
                  .map((activity) => {
                    const cfg = getActivityConfig(activity.type);
                    const isDebit = activity.type === "transfer_sent" || activity.type === "withdrawal";
                    return (
                      <div key={activity.id} className="flex gap-3 items-start">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 leading-snug truncate">{activity.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </p>
                        </div>
                        {activity.amount != null && (
                          <div className={`text-xs font-bold shrink-0 ${isDebit ? "text-red-500" : "text-green-600"}`}>
                            {isDebit ? "-" : "+"}{formatAmount(Number(activity.amount), activity.currency)}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Pagination controls */}
            {Array.isArray(activities) && activities.length > ACTIVITY_PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
                  disabled={activityPage === 0}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Précédent
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.ceil(activities.length / ACTIVITY_PAGE_SIZE) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivityPage(i)}
                      className={`w-6 h-6 rounded-full text-[11px] font-semibold transition-all ${
                        i === activityPage
                          ? "bg-[#003087] text-white"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setActivityPage((p) => Math.min(Math.ceil(activities.length / ACTIVITY_PAGE_SIZE) - 1, p + 1))}
                  disabled={(activityPage + 1) * ACTIVITY_PAGE_SIZE >= activities.length}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Suivant →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
