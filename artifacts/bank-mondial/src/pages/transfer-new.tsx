import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTransfer, getListTransfersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCurrency } from "@/contexts/currency-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Copy, Share2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

const transferSchema = z.object({
  beneficiaryName: z.string().min(2, "Nom requis"),
  amount: z.coerce.number().positive("Montant invalide"),
  currency: z.string().min(3),
  message: z.string().max(250).optional(),
  accessType: z.enum(["public", "private", "limited"]),
  expiresAt: z.string().optional(),
  category: z.string().optional(),
  transactionType: z.enum(["virement", "dépôt", "retrait", "facture"]).default("virement"),
});

type GeneratedTransfer = {
  id: number;
  token: string;
  reference: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
  expiresAt: string | null;
  linkUrl: string;
};

export default function TransferNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTransfer = useCreateTransfer();
  const { formatAmount } = useCurrency();
  const [generated, setGenerated] = useState<GeneratedTransfer | null>(null);

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      beneficiaryName: "",
      amount: undefined as any,
      currency: "EUR",
      message: "",
      accessType: "public",
      expiresAt: "",
      category: "",
      transactionType: "virement" as const,
    },
  });

  const messageValue = form.watch("message") || "";

  const onSubmit = (data: z.infer<typeof transferSchema>) => {
    const payload = { ...data, category: data.category || undefined, transactionType: data.transactionType } as any;
    createTransfer.mutate({ data: payload }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListTransfersQueryKey() });
        setGenerated(res as GeneratedTransfer);
      },
      onError: (err: any) => {
        toast({
          title: "Erreur",
          description: err.message || "Impossible de créer le virement",
          variant: "destructive",
        });
      }
    });
  };

  const fullLink = generated ? `${window.location.origin}/t/${generated.token}` : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullLink);
    toast({ title: "Lien copié !" });
  };

  const shareLinks = generated ? [
    {
      label: "WhatsApp",
      color: "#25D366",
      icon: "W",
      href: `https://wa.me/?text=${encodeURIComponent(`Virement de ${formatAmount(generated.amount, generated.currency)} - Confirmez ici : ${fullLink}`)}`,
    },
    {
      label: "Facebook",
      color: "#1877F2",
      icon: "f",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullLink)}`,
    },
    {
      label: "Telegram",
      color: "#229ED9",
      icon: "T",
      href: `https://t.me/share/url?url=${encodeURIComponent(fullLink)}&text=${encodeURIComponent(`Virement de ${formatAmount(generated.amount, generated.currency)}`)}`,
    },
    {
      label: "Email",
      color: "#6b7280",
      icon: "✉",
      href: `mailto:?subject=${encodeURIComponent(`Virement ${generated.reference}`)}&body=${encodeURIComponent(`Bonjour,\n\nVeuillez confirmer la réception du virement de ${formatAmount(generated.amount, generated.currency)}.\n\nLien : ${fullLink}\n\nRéférence : ${generated.reference}`)}`,
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transfers"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau virement</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Détails du virement</CardTitle>
            <CardDescription>Remplissez les informations pour générer un lien de virement sécurisé.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="transactionType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'opération</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "virement", label: "↗ Virement", color: "blue" },
                        { value: "dépôt", label: "⬇ Dépôt", color: "green" },
                        { value: "retrait", label: "⬆ Retrait", color: "orange" },
                        { value: "facture", label: "📄 Facture", color: "purple" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 cursor-pointer text-xs px-3 py-2.5 rounded-lg border transition-all ${
                            field.value === opt.value
                              ? "border-[#003087] bg-[#003087]/5 text-[#003087] font-semibold"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <input type="radio" className="accent-[#003087]" value={opt.value} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="beneficiaryName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du bénéficiaire</FormLabel>
                    <FormControl><Input placeholder="Entrez le nom du bénéficiaire" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Entrez le montant" className="flex-1" {...field} />
                      </FormControl>
                      <FormField control={form.control} name="currency" render={({ field: cf }) => (
                        <Select onValueChange={cf.onChange} defaultValue={cf.value}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />


                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une catégorie (optionnel)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="logement">🏠 Logement</SelectItem>
                        <SelectItem value="alimentation">🍔 Alimentation</SelectItem>
                        <SelectItem value="santé">❤️ Santé</SelectItem>
                        <SelectItem value="transport">🚗 Transport</SelectItem>
                        <SelectItem value="loisirs">🎉 Loisirs</SelectItem>
                        <SelectItem value="éducation">📚 Éducation</SelectItem>
                        <SelectItem value="autres">📦 Autres</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message personnalisé</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Écrivez votre message ici..."
                        maxLength={250}
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <div className="text-[11px] text-muted-foreground text-right">{messageValue.length}/250</div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="expiresAt" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'expiration</FormLabel>
                    <FormControl>
                      <Input type="date" placeholder="Sélectionnez la date d'expiration" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="accessType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'accès</FormLabel>
                    <div className="flex gap-3">
                      {[
                        { value: "public", label: "Public" },
                        { value: "private", label: "Privé (lien protégé)" },
                        { value: "limited", label: "Limité (accès restreint)" },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-1.5 cursor-pointer text-xs px-3 py-2 rounded-lg border transition-all ${field.value === opt.value ? "border-[#003087] bg-[#003087]/5 text-[#003087] font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                          <input
                            type="radio"
                            className="accent-[#003087]"
                            value={opt.value}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#003087] hover:bg-[#002060] text-white h-11"
                    disabled={createTransfer.isPending}
                  >
                    {createTransfer.isPending ? "Génération..." : "Générer le lien"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Result panel */}
        {generated ? (
          <div className="space-y-4">
            {/* Success + Link */}
            <Card className="border shadow-sm">
              <CardContent className="pt-6 pb-5">
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-gray-900">Lien généré avec succès !</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Voici votre lien de virement</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 font-mono truncate">
                      {fullLink}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="shrink-0 h-9 px-3 border-blue-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5" /> Partager le lien
                  </p>
                  <div className="flex gap-2">
                    {shareLinks.map((sl) => (
                      <a
                        key={sl.label}
                        href={sl.href}
                        target="_blank"
                        rel="noreferrer"
                        title={sl.label}
                        className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: sl.color }}
                      >
                        {sl.icon}
                      </a>
                    ))}
                    <button
                      onClick={handleCopyLink}
                      title="Copier"
                      className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer details */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Informations du virement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pb-5">
                {[
                  { label: "Référence", value: generated.reference },
                  { label: "Montant", value: formatAmount(generated.amount, generated.currency) },
                  { label: "Bénéficiaire", value: generated.beneficiaryName },
                  {
                    label: "Expiration",
                    value: generated.expiresAt
                      ? format(new Date(generated.expiresAt), "dd/MM/yyyy", { locale: fr })
                      : "Aucune",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-gray-900">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation(`/transfers/${generated.id}`)}
              >
                Voir le détail
              </Button>
              <Button
                className="flex-1 bg-[#003087] hover:bg-[#002060]"
                onClick={() => { setGenerated(null); form.reset(); }}
              >
                Nouveau virement
              </Button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 min-h-[400px]">
            <div className="text-center text-muted-foreground px-8">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-7 w-7 text-gray-400" />
              </div>
              <p className="font-medium text-gray-600 mb-1">Lien de virement</p>
              <p className="text-sm text-gray-400">Remplissez le formulaire et cliquez sur<br />"Générer le lien" pour obtenir votre lien de virement sécurisé.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
