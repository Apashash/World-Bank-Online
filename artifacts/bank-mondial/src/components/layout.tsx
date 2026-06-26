import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Send,
  ShieldCheck,
  Menu,
  X,
  UserCog,
  Building2,
  Wallet,
  Download,
  QrCode,
  Landmark,
  Receipt,
  Home,
  ArrowLeftRight,
  LayoutGrid,
  BookUser,
  Headphones,
  CalendarClock,
  HandCoins,
  AlertTriangle,
  MessageCircle,
  BarChart2,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "./notification-bell";
import { CurrencySelector } from "./currency-selector";
import { fetchBlockStatus, redirectToBlockPage } from "@/lib/block-redirect";

function BanqueMondialeLogo({ size = "sm" }: { size?: "sm" | "lg" }) {
  const imgClass = size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const textClass = size === "lg" ? "text-sm" : "text-[11px]";
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo-banque-mondiale.png"
        alt="Banque Mondiale"
        className={`${imgClass} object-contain shrink-0`}
      />
      <span className={`font-black ${textClass} leading-tight tracking-wider uppercase text-white whitespace-nowrap`}>
        BANQUE MONDIALE
      </span>
    </div>
  );
}

const quickActions = [
  { icon: Wallet, label: "Dépôt", href: "/depot" },
  { icon: Send, label: "Envoyer", href: "/transfers/new" },
  { icon: Download, label: "Recevoir", href: "/recevoir" },
  { icon: QrCode, label: "QR", href: "/scanner-qr" },
  { icon: Landmark, label: "Retrait", href: "/retrait" },
  { icon: Receipt, label: "Factures", href: "/payer-factures" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const logoutMutation = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(false);

  const handleEnvoyer = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (checkingBlock) return;
    setCheckingBlock(true);
    const status = await fetchBlockStatus();
    setCheckingBlock(false);
    if (status.blocked) {
      redirectToBlockPage("operation", status.reason, status.whatsapp);
      return;
    }
    setIsMobileMenuOpen(false);
    setLocation("/transfers/new");
  };

  useEffect(() => {
    const handler = () => setIsMobileMenuOpen(true);
    window.addEventListener("openMobileMenu", handler);
    return () => window.removeEventListener("openMobileMenu", handler);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        setLocation("/login");
      },
    });
  };

  const navItems = [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { label: "Virements", href: "/transfers", icon: Send },
    { label: "Bénéficiaires", href: "/beneficiaries", icon: BookUser },
    { label: "Planifiés", href: "/scheduled-transfers", icon: CalendarClock },
    { label: "Demandes de fonds", href: "/fund-requests", icon: HandCoins },
    { label: "Sous-comptes", href: "/sub-accounts", icon: Users },
    { label: "Parrainage", href: "/referrals", icon: CreditCard },
    { label: "Analyses", href: "/analyses", icon: BarChart2 },
    { label: "KYC & Sécurité", href: "/kyc", icon: ShieldCheck },
    { label: "Support", href: "/support", icon: Headphones },
    { label: "Paramètres", href: "/settings", icon: Settings },
  ];

  const adminNavItems = [
    { label: "Vue d'ensemble", href: "/admin", icon: Building2 },
    { label: "Alertes", href: "/admin/alerts", icon: AlertTriangle },
    { label: "Utilisateurs", href: "/admin/users", icon: UserCog },
    { label: "Virements", href: "/admin/transfers", icon: Send },
    { label: "KYC", href: "/admin/kyc", icon: ShieldCheck },
    { label: "Support", href: "/admin/support", icon: MessageCircle },
    { label: "Taux de change", href: "/admin/exchange-rates", icon: ArrowLeftRight },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-12 w-12 object-contain animate-pulse" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* ── Sidebar Desktop ── */}
      <aside
        className="hidden w-64 flex-col md:flex"
        style={{
          background: "linear-gradient(180deg, #002060 0%, #003087 60%, #004ab3 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-white/10">
          <Link href="/dashboard">
            <BanqueMondialeLogo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <CurrencySelector />
            <NotificationBell />
          </div>
        </div>

        {/* Nav */}
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 gap-4">

          {/* Quick Actions Grid */}
          <div>
            <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
              Actions rapides
            </p>
            <div className="grid grid-cols-4 gap-1">
              {quickActions.map(({ icon: Icon, label, href }) => {
                const active = location === href || (href !== "/dashboard" && location.startsWith(href) && href !== "/transfers" && href.length > 1);
                const isEnvoyer = label === "Envoyer";
                const inner = (
                  <div
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl cursor-pointer transition-all ${
                      active ? "bg-white/20" : "hover:bg-white/10"
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${active ? "bg-white/20" : "bg-white/10"}`}>
                      <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-[9px] font-medium text-white/70 text-center leading-tight">
                      {isEnvoyer && checkingBlock ? "..." : label}
                    </span>
                  </div>
                );
                return isEnvoyer ? (
                  <button key={href} onClick={handleEnvoyer} className="w-full text-left">
                    {inner}
                  </button>
                ) : (
                  <Link key={href} href={href}>{inner}</Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Main Nav */}
          <nav className="flex-1 space-y-0.5">
            {navItems.map((item) => {
              const active =
                location.startsWith(item.href) &&
                (item.href !== "/dashboard" || location === "/dashboard");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}

            {user.role === "admin" && (
              <>
                <div className="pt-2">
                  <Link
                    href="/admin"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      location.startsWith("/admin")
                        ? "text-white shadow-sm"
                        : "text-white hover:opacity-90"
                    }`}
                    style={{
                      background: location.startsWith("/admin")
                        ? "linear-gradient(135deg, #6DC142 0%, #4da830 100%)"
                        : "linear-gradient(135deg, #6DC142cc 0%, #4da830cc 100%)",
                    }}
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    Panneau Admin
                  </Link>
                </div>

                {location.startsWith("/admin") && (
                  <>
                    <div className="mt-3 mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
                      Administration
                    </div>
                    {adminNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          location === item.href
                            ? "bg-white/15 text-white shadow-sm"
                            : "text-white/65 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                    <div className="pt-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                        Retour au tableau de bord
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6DC142] text-[#003087] font-bold text-sm">
              {user.fullName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">{user.fullName}</span>
              <span className="text-xs text-white/50 truncate">{user.clientId}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header — fixed so it never scrolls away */}
        <header
          className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 md:hidden"
          style={{ background: "linear-gradient(90deg, #002060 0%, #003087 100%)" }}
        >
          <Link href="/dashboard">
            <BanqueMondialeLogo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <CurrencySelector />
            <NotificationBell />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>
        {/* Spacer to push content below the fixed mobile header */}
        <div className="h-14 shrink-0 md:hidden" />

        {/* Mobile Menu overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 top-14 bottom-[62px] z-50 md:hidden flex flex-col overflow-y-auto"
            style={{ background: "linear-gradient(180deg, #002060 0%, #003087 100%)" }}
          >
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Actions rapides</p>
              <div className="grid grid-cols-4 gap-2">
                {quickActions.map(({ icon: Icon, label, href }) => {
                  const isEnvoyer = label === "Envoyer";
                  const inner = (
                    <div className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                      <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] font-medium text-white/70 text-center leading-tight">
                        {isEnvoyer && checkingBlock ? "..." : label}
                      </span>
                    </div>
                  );
                  return isEnvoyer ? (
                    <button key={href} onClick={handleEnvoyer} className="w-full text-left">
                      {inner}
                    </button>
                  ) : (
                    <Link key={href} href={href} onClick={() => setIsMobileMenuOpen(false)}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 mx-4 my-2" />

            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Navigation</p>
              <div className="grid grid-cols-4 gap-2">
                {navItems.map((item) => {
                  const active =
                    location.startsWith(item.href) &&
                    (item.href !== "/dashboard" || location === "/dashboard");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`flex flex-col items-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${active ? "bg-white/15" : "hover:bg-white/10"}`}>
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center ${active ? "bg-[#6DC142]/30" : "bg-white/10"}`}>
                          <item.icon
                            className="h-5 w-5"
                            style={{ color: active ? "#6DC142" : "white" }}
                            strokeWidth={active ? 2.2 : 1.5}
                          />
                        </div>
                        <span
                          className="text-[10px] font-medium text-center leading-tight"
                          style={{ color: active ? "#6DC142" : "rgba(255,255,255,0.7)" }}
                        >
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {user.role === "admin" && (
                <div className="mt-3">
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all"
                      style={{ background: "linear-gradient(135deg, #6DC142 0%, #4da830 100%)" }}
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      Panneau Admin
                    </div>
                  </Link>
                </div>
              )}
            </div>
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6DC142] text-[#003087] font-bold">
                  {user.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="text-xs text-white/50">{user.clientId}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 rounded-xl px-4 py-3 text-base text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-8 md:p-8">
          {children}
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-pb"
          style={{ background: "#001a4d", borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="grid grid-cols-5 h-[62px]">
            {[
              { icon: Home,          label: "Accueil",  href: "/dashboard" },
              { icon: Wallet,        label: "Dépôt",    href: "/depot" },
              { icon: Landmark,      label: "Retrait",  href: "/retrait" },
              { icon: Receipt,        label: "Facture",  href: "/payer-factures" },
            ].map(({ icon: Icon, label, href }) => {
              const active = location === href || (href !== "/dashboard" && location.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-0.5 relative">
                    {active && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                        style={{ width: 28, height: 3, background: "#6DC142" }}
                      />
                    )}
                    <div
                      className="flex items-center justify-center rounded-xl transition-all duration-200"
                      style={{
                        width: 38, height: 28,
                        background: active ? "rgba(109,193,66,0.18)" : "transparent",
                      }}
                    >
                      <Icon
                        className="transition-all duration-200"
                        style={{
                          width: 18, height: 18,
                          color: active ? "#6DC142" : "rgba(255,255,255,0.5)",
                          strokeWidth: active ? 2.2 : 1.6,
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-semibold leading-none tracking-wide transition-all duration-200"
                      style={{ color: active ? "#6DC142" : "rgba(255,255,255,0.45)" }}
                    >
                      {label}
                    </span>
                  </div>
                </Link>
              );
            })}
            {/* Bouton Plus → ouvre le menu latéral */}
            <button
              className="flex flex-col items-center justify-center h-full gap-0.5 relative w-full"
              onClick={() => setIsMobileMenuOpen(v => !v)}
            >
              {isMobileMenuOpen && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                  style={{ width: 28, height: 3, background: "#6DC142" }}
                />
              )}
              <div
                className="flex items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  width: 38, height: 28,
                  background: isMobileMenuOpen ? "rgba(109,193,66,0.18)" : "transparent",
                }}
              >
                <LayoutGrid
                  className="transition-all duration-200"
                  style={{
                    width: 18, height: 18,
                    color: isMobileMenuOpen ? "#6DC142" : "rgba(255,255,255,0.5)",
                    strokeWidth: isMobileMenuOpen ? 2.2 : 1.6,
                  }}
                />
              </div>
              <span
                className="text-[9px] font-semibold leading-none tracking-wide transition-all duration-200"
                style={{ color: isMobileMenuOpen ? "#6DC142" : "rgba(255,255,255,0.45)" }}
              >
                Plus
              </span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
