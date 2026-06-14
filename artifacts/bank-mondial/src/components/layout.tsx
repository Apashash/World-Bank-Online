import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Send,
  ShieldCheck,
  Building,
  Menu,
  X,
  UserCog
} from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
    { label: "Admin - Vue d'ensemble", href: "/admin", icon: Building },
    { label: "Admin - Utilisateurs", href: "/admin/users", icon: UserCog },
    { label: "Admin - Virements", href: "/admin/transfers", icon: Send },
    { label: "Admin - KYC", href: "/admin/kyc", icon: ShieldCheck },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 shrink-0 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-sidebar-primary">
            <Building className="h-6 w-6" />
            Bank Mondial
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.startsWith(item.href) && (item.href !== "/dashboard" || location === "/dashboard")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            
            {user.role === "admin" && (
              <>
                <div className="mt-8 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  Administration
                </div>
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      location === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.fullName}</span>
              <span className="text-xs text-sidebar-foreground/60">{user.clientId}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Building className="h-5 w-5" />
            Bank Mondial
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 top-16 z-50 bg-card p-4 md:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                    location.startsWith(item.href) && (item.href !== "/dashboard" || location === "/dashboard")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-3 text-base"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Déconnexion
              </Button>
            </nav>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
