import { useGetMe, useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
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
import { User, Mail, Phone, Globe, Lock, CreditCard, ShieldCheck, Copy, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { apiPost } from "@/lib/api";

const profileSchema = z.object({
  fullName: z.string().min(2, "Nom requis (min. 2 caractères)"),
  phone: z.string().min(5, "Numéro requis"),
  country: z.string().min(2, "Pays requis"),
});

const emailSchema = z.object({
  email: z.string().email("Email invalide"),
});

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

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "", country: "" },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ fullName: user.fullName || "", phone: user.phone || "", country: user.country || "" });
      emailForm.reset({ email: user.email || "" });
    }
  }, [user]);

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    updateUser.mutate({ id: user.id, data }, {
      onSuccess: () => {
        toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Erreur", description: err.message || "Impossible de mettre à jour.", variant: "destructive" });
      },
    });
  };

  const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
    if (!user) return;
    setEmailLoading(true);
    try {
      await apiPost(`/api/users/${user.id}`, data, "PATCH");
      toast({ title: "Email mis à jour", description: "Votre adresse email a été modifiée." });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Cet email est peut-être déjà utilisé.", variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez votre profil et la sécurité de votre compte.</p>
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

      {/* ── Informations personnelles ── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Informations personnelles</CardTitle>
              <CardDescription>Nom, téléphone et pays.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Jean Dupont" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={profileForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="+33 6 00 00 00 00" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="France" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updateUser.isPending} className="bg-[#003087] hover:bg-[#002060]">
                  {updateUser.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Email ── */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <Mail className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Adresse email</CardTitle>
              <CardDescription>Utilisée pour la connexion et les notifications.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField control={emailForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" type="email" placeholder="vous@exemple.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={emailLoading} className="bg-[#003087] hover:bg-[#002060]">
                  {emailLoading ? "Mise à jour..." : "Changer l'email"}
                </Button>
              </div>
            </form>
          </Form>
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
