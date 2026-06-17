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
} from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const logoutMutation = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { label: "Sous-comptes", href: "/sub-accounts", icon: Users },
    { label: "Parrainage", href: "/referrals", icon: CreditCard },
    { label: "KYC & Sécurité", href: "/kyc", icon: ShieldCheck },
    { label: "Paramètres", href: "/settings", icon: Settings },
  ];

  const adminNavItems = [
    { label: "Admin — Vue d'ensemble", href: "/admin", icon: Building2 },
    { label: "Admin — Utilisateurs", href: "/admin/users", icon: UserCog },
    { label: "Admin — Virements", href: "/admin/transfers", icon: Send },
    { label: "Admin — KYC", href: "/admin/kyc", icon: ShieldCheck },
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
        <div className="flex h-16 shrink-0 items-center px-5 border-b border-white/10">
          <Link href="/dashboard">
            <BanqueMondialeLogo size="sm" />
          </Link>
        </div>

        {/* Nav */}
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
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
                <div className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/35">
                  Administration
                </div>
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      location === item.href
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6DC142] text-[#003087] font-bold text-sm">
              {user.fullName.charAt(0).toUpperCase()}
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
        {/* Mobile Header */}
        <header
          className="flex h-14 shrink-0 items-center justify-between px-4 md:hidden"
          style={{ background: "linear-gradient(90deg, #002060 0%, #003087 100%)" }}
        >
          <Link href="/dashboard">
            <BanqueMondialeLogo size="sm" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Menu overlay */}
        {isMobileMenuOpen && (
          <div
            className="absolute inset-0 top-14 z-50 md:hidden flex flex-col"
            style={{ background: "linear-gradient(180deg, #002060 0%, #003087 100%)" }}
          >
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    location.startsWith(item.href) &&
                    (item.href !== "/dashboard" || location === "/dashboard")
                      ? "bg-white/15 text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6DC142] text-[#003087] font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
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
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
