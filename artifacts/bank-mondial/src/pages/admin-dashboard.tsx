import { useState, useEffect } from "react";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Send, ShieldAlert, TrendingUp, UserPlus, CheckCircle, Clock, XCircle, BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type DayPoint = {
  date: string;
  label: string;
  transfers: number;
  volume: number;
  confirmedTransfers: number;
  newUsers: number;
};

type StatusEntry = { status: string; count: number };
type CurrencyEntry = { currency: string; volume: number };

type ChartData = {
  days: DayPoint[];
  statusBreakdown: StatusEntry[];
  currencyVolume: CurrencyEntry[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  expired: "Expiré",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  cancelled: "#ef4444",
  expired: "#9ca3af",
};

const CURRENCY_COLORS = ["#003087", "#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd"];

const RANGE_OPTIONS = [
  { label: "7 j", days: 7 },
  { label: "14 j", days: 14 },
  { label: "30 j", days: 30 },
];

function fmtVolume(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toFixed(0);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-white px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name} :</span>
          <span className="font-semibold text-gray-900">
            {typeof p.value === "number" && p.name.toLowerCase().includes("volume")
              ? fmtVolume(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-48 rounded-xl bg-gray-50 animate-pulse flex items-center justify-center">
      <BarChart3 className="h-8 w-8 text-gray-200" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [range, setRange] = useState(14);

  useEffect(() => {
    setChartsLoading(true);
    const token = localStorage.getItem("auth_token");
    fetch(`/api/admin/charts?days=${range}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => { setCharts(d); setChartsLoading(false); })
      .catch(() => setChartsLoading(false));
  }, [range]);

  const statCards = [
    {
      label: "Total Utilisateurs",
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.activeUsers ?? 0} actifs`,
      icon: <Users className="h-4 w-4 text-[#003087]" />,
      bg: "bg-[#003087]/10",
    },
    {
      label: "Virements",
      value: stats?.totalTransfers ?? 0,
      sub: null,
      icon: <Send className="h-4 w-4 text-blue-500" />,
      bg: "bg-blue-500/10",
    },
    {
      label: "Volume Global",
      value: fmtVolume(stats?.totalVolume ?? 0),
      sub: "toutes devises",
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      bg: "bg-emerald-500/10",
    },
    {
      label: "KYC en attente",
      value: stats?.pendingKyc ?? 0,
      sub: "dossiers à réviser",
      icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
      bg: "bg-amber-500/10",
    },
    {
      label: "Sous-comptes",
      value: stats?.totalSubAccounts ?? 0,
      sub: null,
      icon: <UserPlus className="h-4 w-4 text-purple-500" />,
      bg: "bg-purple-500/10",
    },
    {
      label: "Comptes bloqués",
      value: stats?.blockedUsers ?? 0,
      sub: null,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tableau de bord administrateur</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                  {s.icon}
                </div>
              </div>
              <div className={`text-2xl font-bold ${statsLoading ? "blur-sm animate-pulse" : ""}`}>
                {s.value}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500">Période :</span>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.days}
              onClick={() => setRange(o.days)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                range === o.days
                  ? "bg-[#003087] text-white border-[#003087]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#003087]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts row 1 — Virements par jour + Volume */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Send className="h-4 w-4 text-[#003087]" />
              Virements par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts?.days ?? []} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="transfers" name="Virements" fill="#003087" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confirmedTransfers" name="Confirmés" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Volume journalier
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts?.days ?? []}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtVolume} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    name="Volume"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#volGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 — Nouveaux utilisateurs + Statuts + Devises */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-purple-500" />
              Nouveaux utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts?.days ?? []}>
                  <defs>
                    <linearGradient id="usrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="Inscriptions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#usrGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Statuts des virements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? <ChartSkeleton /> : !charts?.statusBreakdown?.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={charts.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {charts.statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#9ca3af"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [val, STATUS_LABELS[name] ?? name]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span className="text-xs">{STATUS_LABELS[v] ?? v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Volume par devise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? <ChartSkeleton /> : !charts?.currencyVolume?.length ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={charts.currencyVolume}
                    dataKey="volume"
                    nameKey="currency"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {charts.currencyVolume.map((entry, i) => (
                      <Cell key={entry.currency} fill={CURRENCY_COLORS[i % CURRENCY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [fmtVolume(val), "Volume"]} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span className="text-xs font-semibold">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick summary bar */}
      {charts && !chartsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Virements (période)",
              value: charts.days.reduce((s, d) => s + d.transfers, 0),
              icon: <Send className="h-3.5 w-3.5 text-[#003087]" />,
            },
            {
              label: "Confirmés (période)",
              value: charts.days.reduce((s, d) => s + d.confirmedTransfers, 0),
              icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
            },
            {
              label: "Volume (période)",
              value: fmtVolume(charts.days.reduce((s, d) => s + d.volume, 0)),
              icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />,
            },
            {
              label: "Inscriptions (période)",
              value: charts.days.reduce((s, d) => s + d.newUsers, 0),
              icon: <UserPlus className="h-3.5 w-3.5 text-purple-500" />,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-white px-4 py-3 flex items-center gap-3">
              <div className="shrink-0">{item.icon}</div>
              <div>
                <div className="text-lg font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
