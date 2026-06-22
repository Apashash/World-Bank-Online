import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart2, TrendingDown, Tag } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  logement: "#003087",
  alimentation: "#6DC142",
  santé: "#F59E0B",
  transport: "#3B82F6",
  loisirs: "#EC4899",
  éducation: "#8B5CF6",
  autres: "#9CA3AF",
};

const CATEGORY_LABELS: Record<string, string> = {
  logement: "Logement",
  alimentation: "Alimentation",
  santé: "Santé",
  transport: "Transport",
  loisirs: "Loisirs",
  éducation: "Éducation",
  autres: "Autres",
};

type CategoryBreakdown = {
  category: string;
  total: number;
  count: number;
  currency: string;
};

type AnalyticsData = {
  breakdown: CategoryBreakdown[];
  total: number;
  currency: string;
};

const BUDGET_DEFAULTS: Record<string, number> = {
  logement: 800,
  alimentation: 400,
  santé: 150,
  transport: 200,
  loisirs: 200,
  éducation: 100,
  autres: 150,
};

export default function Analyses() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Record<string, number>>(BUDGET_DEFAULTS);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("bm_budgets");
    if (saved) {
      try { setBudgets(JSON.parse(saved)); } catch {}
    }

    const token = localStorage.getItem("auth_token");
    fetch("/api/analytics/categories", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveBudget = (cat: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const next = { ...budgets, [cat]: num };
      setBudgets(next);
      localStorage.setItem("bm_budgets", JSON.stringify(next));
    }
    setEditingBudget(null);
  };

  const chartData =
    data?.breakdown.map((b) => ({
      name: CATEGORY_LABELS[b.category] ?? b.category,
      value: b.total,
      category: b.category,
    })) ?? [];

  const currency = data?.currency ?? "EUR";

  const allCategories = Object.keys(BUDGET_DEFAULTS);
  const allBreakdown = allCategories.map((cat) => {
    const found = data?.breakdown.find((b) => b.category === cat);
    return {
      category: cat,
      total: found?.total ?? 0,
      count: found?.count ?? 0,
    };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <BarChart2 className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analyses & Budget</h1>
          <p className="text-sm text-muted-foreground">Répartition de vos dépenses par catégorie</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-7 w-7 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.breakdown.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="h-6 w-6 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">Aucune dépense catégorisée</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez des virements avec une catégorie pour voir vos analyses ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#003087]" />
                Répartition des dépenses
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total : {data.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {currency}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] ?? "#9CA3AF"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, _: any, props: any) => [
                      `${Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${currency}`,
                      props.payload?.name,
                    ]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "#6b7280" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Progress */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-[#003087]" />
                Budget mensuel
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Cliquez sur un budget pour le modifier</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {allBreakdown.map((item) => {
                const budget = budgets[item.category] ?? 0;
                const pct = budget > 0 ? Math.min(100, (item.total / budget) * 100) : 0;
                const over = budget > 0 && item.total > budget;
                const color = CATEGORY_COLORS[item.category] ?? "#9CA3AF";
                const isEditing = editingBudget === item.category;

                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </span>
                        {over && (
                          <span className="text-[10px] text-red-500 font-semibold">Dépassé !</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-semibold ${over ? "text-red-500" : "text-gray-700"}`}>
                          {item.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        {isEditing ? (
                          <input
                            autoFocus
                            type="number"
                            className="w-16 text-xs border rounded px-1 py-0.5 text-right"
                            value={tempBudget}
                            onChange={(e) => setTempBudget(e.target.value)}
                            onBlur={() => saveBudget(item.category, tempBudget)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveBudget(item.category, tempBudget);
                              if (e.key === "Escape") setEditingBudget(null);
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setEditingBudget(item.category);
                              setTempBudget(String(budget));
                            }}
                            className="text-[#003087] font-semibold hover:underline"
                          >
                            {budget.toLocaleString("fr-FR")} {currency}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? "#EF4444" : color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category breakdown table */}
      {data && data.breakdown.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Détail par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.breakdown
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((item) => {
                  const pct = data.total > 0 ? ((item.total / data.total) * 100).toFixed(1) : "0";
                  return (
                    <div
                      key={item.category}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0"
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] ?? "#9CA3AF" }}
                      />
                      <span className="text-sm font-medium text-gray-800 flex-1">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.count} virement(s)</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                      <span className="text-sm font-bold text-gray-900 w-28 text-right">
                        {item.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {item.currency}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
