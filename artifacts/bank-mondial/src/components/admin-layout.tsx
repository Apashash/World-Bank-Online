import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Send,
  ShieldCheck,
  AlertTriangle,
  ArrowLeftRight,
  MessageCircle,
  ArrowLeft,
  Shield,
  Menu,
  X,
} from "lucide-react";

const adminNav = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Utilisateurs", href: "/admin/users", icon: Users, exact: false },
  { label: "Virements", href: "/admin/transfers", icon: Send, exact: false },
  { label: "KYC", href: "/admin/kyc", icon: ShieldCheck, exact: false },
  { label: "Alertes", href: "/admin/alerts", icon: AlertTriangle, exact: false },
  { label: "Taux de change", href: "/admin/exchange-rates", icon: ArrowLeftRight, exact: false },
  { label: "Support", href: "/admin/support", icon: MessageCircle, exact: false },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      setLocation("/dashboard");
    }
  }, [isLoading, user, setLocation]);


  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (isLoading || !user) return null;

  const currentNav = adminNav.find((n) =>
    n.exact ? location === n.href : location.startsWith(n.href)
  );

  const SidebarContent = () => (
    <>
      <div
        className="flex items-center gap-3 px-5 py-[18px] shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "#6DC142" }}
        >
          <Shield className="h-4 w-4 text-white" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight">Banque Mondiale</p>
          <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#6DC142" }}>
            Admin Panel
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {adminNav.map((item) => {
          const active = item.exact
            ? location === item.href
            : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-[10px] text-[13px] font-medium cursor-pointer transition-all"
                style={{
                  background: active ? "rgba(255,255,255,0.10)" : "transparent",
                  color: active ? "#ffffff" : "rgba(148,163,184,1)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.color = "#e2e8f0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.color = "rgba(148,163,184,1)";
                  }
                }}
              >
                <item.icon
                  className="h-4 w-4 shrink-0"
                  strokeWidth={active ? 2.2 : 1.8}
                  style={{ color: active ? "#6DC142" : undefined }}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#6DC142" }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="rounded-xl px-3 py-3" style={{ background: "rgba(255,255,255,0.05)" }}>
          <p className="text-[10px] mb-0.5" style={{ color: "rgba(100,116,139,1)" }}>
            Administrateur
          </p>
          <p className="text-[13px] font-semibold text-white truncate">{user.fullName}</p>
          <p className="text-[11px] truncate" style={{ color: "rgba(100,116,139,1)" }}>
            {user.email}
          </p>
        </div>
        <Link href="/dashboard">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium cursor-pointer transition-all"
            style={{ color: "rgba(148,163,184,1)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLDivElement).style.color = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "transparent";
              (e.currentTarget as HTMLDivElement).style.color = "rgba(148,163,184,1)";
            }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Retour utilisateur
          </div>
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#f1f5f9" }}>
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside
        className="hidden lg:flex w-[220px] shrink-0 flex-col"
        style={{ background: "#0f172a" }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar (overlay drawer) ── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col lg:hidden"
            style={{ background: "#0f172a" }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-12 shrink-0 items-center border-b border-slate-200 bg-white px-4 gap-3">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            style={{ background: "#f1f5f9" }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-4 w-4 text-slate-600" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: "#6DC142" }} />
            <span className="text-sm text-slate-400 hidden sm:inline">Administration</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-sm font-semibold text-slate-800 truncate">
              {currentNav?.label ?? "Panneau Admin"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
