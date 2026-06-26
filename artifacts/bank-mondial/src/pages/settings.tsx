import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { COUNTRIES } from "@/data/countries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { User, Mail, Phone, Globe, Lock, CreditCard, Copy, Eye, EyeOff, Moon, Sun, ShieldOff, ShieldCheck, Bell, AlertTriangle, ArrowLeft } from "lucide-react";
import { apiPost } from "@/lib/api";
import { useTheme } from "@/hooks/use-theme";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Au moins 8 caractères"),
  confirmPassword: z.string().min(1, "Confirmation requise"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

function Avatar({ name }: { name?: string }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#6DC142] text-[#003087] font-bold text-2xl shadow-md">
      {initials}
    </div>
  );
}

function KycBadge({ status }: { status?: string }) {
  switch (status) {
    case "verified": return <Badge className="bg-green-100 text-green-700 border-green-200">Vérifié</Badge>;
    case "pending":  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">En cours</Badge>;
    case "rejected": return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeté</Badge>;
    default:         return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Non soumis</Badge>;
  }
}

function InfoRow({ label, value, mono = false, copyable = false }: { label: string; value?: string; mono?: boolean; copyable?: boolean }) {
  const { toast } = useToast();
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast({ title: "Copié !" });
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value ?? "—"}</span>
        {copyable && value && (
          <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function generateVirtualCard(userId?: number): { number: string; expiry: string; cvv: string } {
  const seed = userId ?? 1;
  const n = (seed * 7919 + 12345) % 10000;
  const a = (seed * 3571 + 54321) % 10000;
  const b = (seed * 1234 + 98765) % 10000;
  const c = (seed * 9876 + 11111) % 10000;
  const number = `${String(n).padStart(4, "0")} ${String(a).padStart(4, "0")} ${String(b).padStart(4, "0")} ${String(c).padStart(4, "0")}`;
  const month = ((seed % 12) + 1).toString().padStart(2, "0");
  const year = (28 + (seed % 5)).toString();
  const cvv = String(((seed * 421) % 900) + 100);
  return { number, expiry: `${month}/${year}`, cvv };
}

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState<string>("");
  const [alertLoading, setAlertLoading] = useState(false);

  const virtualCard = generateVirtualCard(user?.id);

  useEffect(() => {
    if (user) {
      setAlertThreshold(user.balanceAlertThreshold != null ? String(user.balanceAlertThreshold) : "");
    }
  }, [user]);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    setPwLoading(true);
    try {
      await apiPost(`/api/users/${user.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast({ title: "Mot de passe modifié", description: "Votre nouveau mot de passe est actif." });
      passwordForm.reset();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Mot de passe actuel incorrect.", variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (!user) return;
    setLockLoading(true);
    try {
      await apiPost(`/api/users/${user.id}/lock`, {});
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({
        title: user.status === "blocked" ? "Compte réactivé" : "Compte bloqué",
        description: user.status === "blocked"
          ? "Votre compte est de nouveau actif."
          : "Votre compte a été temporairement bloqué.",
      });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de modifier le statut.", variant: "destructive" });
    } finally {
      setLockLoading(false);
    }
  };

  const handleSaveAlert = async () => {
    if (!user) return;
    setAlertLoading(true);
    try {
      await apiPost(`/api/users/${user.id}`, { balanceAlertThreshold: alertThreshold === "" ? null : parseFloat(alertThreshold) }, "PATCH");
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Alerte mise à jour", description: alertThreshold === "" ? "Alerte de solde désactivée." : `Alerte configurée à ${alertThreshold} €.` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de mettre à jour l'alerte.", variant: "destructive" });
    } finally {
      setAlertLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isBlocked = user?.status === "blocked";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez votre profil et la sécurité de votre compte.</p>
        </div>
      </div>

      {/* ── Profile card ── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-5">
            <Avatar name={user?.fullName} />
            <div>
              <CardTitle className="text-lg">{user?.fullName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <KycBadge status={user?.kycStatus} />
                {user?.role === "admin" && (
                  <Badge className="bg-[#003087]/10 text-[#003087] border-[#003087]/20">Admin</Badge>
                )}
                {isBlocked && (
                  <Badge className="bg-red-100 text-red-700 border-red-200">Bloqué</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 pb-2">
          <InfoRow label="Client ID"   value={user?.clientId}      mono copyable />
          <InfoRow label="IBAN"        value={user?.iban ?? "—"}   mono copyable={!!user?.iban} />
          <InfoRow label="Solde"       value={`${Number(user?.balance ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${user?.currency ?? "EUR"}`} />
          <InfoRow label="Statut"      value={user?.status === "active" ? "Actif" : user?.status === "blocked" ? "Bloqué" : "En attente"} />
          <InfoRow label="Membre depuis" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
        </CardContent>
      </Card>

      {/* ── Thème ── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
              {theme === "dark" ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Thème d'affichage</CardTitle>
              <CardDescription>Basculez entre le mode clair et sombre.</CardDescription>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                theme === "dark" ? "bg-[#003087]" : "bg-gray-200"
              }`}
              aria-checked={theme === "dark"}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* ── Carte virtuelle ── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base">Carte virtuelle</CardTitle>
              <CardDescription>Numéro de carte à usage unique pour les achats en ligne.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #002060 0%, #003087 50%, #0050C8 100%)" }}
          >
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold tracking-widest text-white/60 uppercase">Banque Mondiale</span>
                <div className="flex gap-1">
                  <div className="h-5 w-5 rounded-full bg-white/30" />
                  <div className="h-5 w-5 rounded-full bg-white/20 -ml-2" />
                </div>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-lg font-semibold tracking-widest">
                  {showCardNumber ? virtualCard.number : "•••• •••• •••• " + virtualCard.number.slice(-4)}
                </span>
                <button onClick={() => setShowCardNumber(!showCardNumber)} className="text-white/60 hover:text-white transition-colors ml-2">
                  {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Titulaire</p>
                  <p className="text-sm font-semibold truncate max-w-[150px]">{user?.fullName?.toUpperCase()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Expiration</p>
                  <p className="text-sm font-semibold">{virtualCard.expiry}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">CVV</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold">{showCvv ? virtualCard.cvv : "•••"}</p>
                    <button onClick={() => setShowCvv(!showCvv)} className="text-white/60 hover:text-white">
                      {showCvv ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(virtualCard.number.replace(/\s/g, ""));
                toast({ title: "Numéro copié !" });
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copier le numéro
            </Button>
            <p className="text-[11px] text-muted-foreground self-center ml-2">Usage unique — ne partagez pas</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Blocage de compte ── */}
      <Card className={`border shadow-sm ${isBlocked ? "border-red-200 bg-red-50/30" : ""}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isBlocked ? "bg-red-50" : "bg-gray-50"}`}>
              {isBlocked ? <ShieldOff className="h-4 w-4 text-red-500" /> : <ShieldCheck className="h-4 w-4 text-gray-600" />}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{isBlocked ? "Compte bloqué" : "Blocage de compte"}</CardTitle>
              <CardDescription>
                {isBlocked
                  ? "Votre compte est temporairement bloqué. Cliquez pour le réactiver."
                  : "Verrouillez temporairement votre compte en un clic."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`flex items-start gap-3 rounded-xl p-3 mb-4 ${isBlocked ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${isBlocked ? "text-red-500" : "text-amber-500"}`} />
            <p className="text-xs text-gray-600 leading-relaxed">
              {isBlocked
                ? "Le compte est bloqué. Aucun virement ni opération ne peut être effectuée. Réactivez pour reprendre."
                : "Le blocage empêche tous les virements et retraits. Vous pouvez le réactiver à tout moment depuis cette page."}
            </p>
          </div>
          <Button
            onClick={handleLockToggle}
            disabled={lockLoading}
            variant={isBlocked ? "default" : "destructive"}
            className={isBlocked ? "bg-[#003087] hover:bg-[#002060]" : ""}
          >
            {lockLoading
              ? "En cours..."
              : isBlocked
              ? "Réactiver mon compte"
              : "Bloquer mon compte"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Alertes de solde ── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50">
              <Bell className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-base">Alerte de solde</CardTitle>
              <CardDescription>Recevez une notification si votre solde descend sous ce seuil.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Ex : 100.00"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            </div>
            <Button
              onClick={handleSaveAlert}
              disabled={alertLoading}
              className="bg-[#003087] hover:bg-[#002060] shrink-0"
            >
              {alertLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
          {user?.balanceAlertThreshold != null && (
            <p className="text-xs text-muted-foreground">
              Seuil actuel : <span className="font-semibold text-[#003087]">{Number(user.balanceAlertThreshold).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
            </p>
          )}
          {(user?.balanceAlertThreshold == null && alertThreshold === "") && (
            <p className="text-xs text-muted-foreground">Aucune alerte configurée. Laissez vide pour désactiver.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Informations personnelles (lecture seule) ── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Informations personnelles</CardTitle>
                <CardDescription>Données fournies à l'inscription — non modifiables.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
              <Lock className="h-3 w-3" />
              Verrouillé
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-1">
            {/* Nom */}
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Nom complet</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName ?? "—"}</p>
              </div>
              <Lock className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            </div>
            {/* Email */}
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Adresse email</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.email ?? "—"}</p>
              </div>
              <Lock className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            </div>
            {/* Téléphone */}
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Téléphone</p>
                <p className="text-sm font-semibold text-gray-800">{user?.phone ?? "—"}</p>
              </div>
              <Lock className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            </div>
            {/* Pays */}
            {(() => {
              const raw = user?.country ?? "";
              const match = COUNTRIES.find(c => c.code === raw) ?? COUNTRIES.find(c => c.name === raw);
              const flag = match?.flag ?? "🌍";
              const name = match?.name ?? (raw || "—");
              return (
                <div className="flex items-center gap-3 py-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 text-lg">
                    {flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Pays d'inscription</p>
                    <p className="text-sm font-semibold text-gray-800">{name}</p>
                  </div>
                  <Lock className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                </div>
              );
            })()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Pour modifier ces informations, veuillez contacter le support client.
          </p>
        </CardContent>
      </Card>

      {/* ── Mot de passe ── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
              <Lock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-base">Mot de passe</CardTitle>
              <CardDescription>Choisissez un mot de passe fort (min. 8 caractères).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe actuel</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9 pr-10" type={showCurrent ? "text" : "password"} placeholder="••••••••" {...field} />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input className="pr-10" type={showNew ? "text" : "password"} placeholder="••••••••" {...field} />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input className="pr-10" type={showConfirm ? "text" : "password"} placeholder="••••••••" {...field} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={pwLoading} className="bg-[#003087] hover:bg-[#002060]">
                  {pwLoading ? "Modification..." : "Changer le mot de passe"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
