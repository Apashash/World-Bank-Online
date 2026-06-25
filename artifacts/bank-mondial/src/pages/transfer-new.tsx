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
import { CheckCircle2, Copy, Share2, ArrowLeft, User, Users, CreditCard, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";
import { CURRENCY_LABELS, convertFromEur, formatCurrencyAmount } from "@/lib/currency";

const PAYMENT_METHOD_OPTIONS = [
  { id: "card", label: "Carte bancaire", icon: CreditCard, color: "#003087" },
  { id: "paypal", label: "PayPal", icon: Wallet, color: "#0070BA" },
  { id: "mobile_money", label: "Mobile Money", icon: Smartphone, color: "#1DB954" },
];

const COUNTRIES = [
  "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Angola", "Arabie Saoudite",
  "Argentine", "Australie", "Autriche", "Azerbaïdjan", "Bahreïn", "Bangladesh", "Belgique", "Bénin",
  "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Bulgarie", "Burkina Faso", "Burundi",
  "Cameroun", "Canada", "Cap-Vert", "Centrafrique", "Chili", "Chine", "Chypre", "Colombie",
  "Comores", "Congo", "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Croatie", "Cuba",
  "Danemark", "Djibouti", "Égypte", "Émirats arabes unis", "Équateur", "Espagne", "Estonie",
  "Éthiopie", "Finlande", "France", "Gabon", "Gambie", "Ghana", "Grèce", "Guatemala",
  "Guinée", "Guinée-Bissau", "Guinée équatoriale", "Haïti", "Honduras", "Hongrie",
  "Îles Maurice", "Inde", "Indonésie", "Irak", "Iran", "Irlande", "Islande", "Israël", "Italie",
  "Jamaïque", "Japon", "Jordanie", "Kazakhstan", "Kenya", "Kosovo", "Koweït", "Laos", "Lesotho",
  "Lettonie", "Liban", "Libéria", "Libye", "Lituanie", "Luxembourg", "Macédoine du Nord",
  "Madagascar", "Malawi", "Mali", "Malte", "Maroc", "Mauritanie", "Mexique", "Moldavie",
  "Monaco", "Mongolie", "Monténégro", "Mozambique", "Namibie", "Niger", "Nigéria", "Norvège",
  "Nouvelle-Zélande", "Oman", "Ouganda", "Pakistan", "Palestine", "Panama", "Paraguay", "Pays-Bas",
  "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "République démocratique du Congo",
  "Roumanie", "Royaume-Uni", "Russie", "Rwanda", "Sénégal", "Serbie", "Sierra Leone", "Singapour",
  "Slovaquie", "Slovénie", "Somalie", "Soudan", "Sri Lanka", "Suède", "Suisse", "Syrie",
  "Tanzanie", "Tchad", "Thaïlande", "Togo", "Tunisie", "Turquie", "Ukraine", "Uruguay",
  "Venezuela", "Vietnam", "Yémen", "Zambie", "Zimbabwe",
];

const transferSchema = z.object({
  transactionType: z.enum(["virement", "compte_bm"]).default("virement"),
  // Sender
  senderFirstName: z.string().min(1, "Prénom requis"),
  senderLastName: z.string().min(1, "Nom requis"),
  senderCountry: z.string().min(1, "Pays requis"),
  senderCity: z.string().min(1, "Ville requise"),
  // Receiver
  receiverFirstName: z.string().min(1, "Prénom requis"),
  receiverLastName: z.string().min(1, "Nom requis"),
  receiverEmail: z.string().email("Email invalide"),
  receiverCountry: z.string().min(1, "Pays requis"),
  receiverCity: z.string().min(1, "Ville requise"),
  // Amount & currency
  amountEur: z.coerce.number().positive("Montant invalide"),
  displayCurrency: z.string().min(3),
  // Payment methods
  paymentMethods: z.array(z.string()).min(1, "Sélectionnez au moins un moyen de paiement"),
  // Block reason & WhatsApp
  blockReason: z.string().min(1, "Raison de blocage requise"),
  whatsappNumber: z.string().min(5, "Numéro WhatsApp requis"),
  // Optional
  message: z.string().max(250).optional(),
  accessType: z.enum(["public", "private", "limited"]).default("public"),
  expiresAt: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof transferSchema>;

type GeneratedTransfer = {
  id: number;
  token: string;
  reference: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
  displayCurrency: string;
  expiresAt: string | null;
  linkUrl: string;
};

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <div className="h-7 w-7 rounded-lg bg-[#003087]/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-[#003087]" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

export default function TransferNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTransfer = useCreateTransfer();
  const [generated, setGenerated] = useState<GeneratedTransfer | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transactionType: "virement",
      senderFirstName: "",
      senderLastName: "",
      senderCountry: "",
      senderCity: "",
      receiverFirstName: "",
      receiverLastName: "",
      receiverEmail: "",
      receiverCountry: "",
      receiverCity: "",
      amountEur: undefined as any,
      displayCurrency: "EUR",
      paymentMethods: [],
      blockReason: "",
      whatsappNumber: "",
      message: "",
      accessType: "public",
      expiresAt: "",
      category: "",
    },
  });

  const watchedAmount = form.watch("amountEur");
  const watchedCurrency = form.watch("displayCurrency");
  const watchedMethods = form.watch("paymentMethods");
  const messageValue = form.watch("message") || "";

  const convertedAmount = watchedAmount && watchedCurrency
    ? convertFromEur(Number(watchedAmount), watchedCurrency)
    : null;

  const onSubmit = (data: FormValues) => {
    const receiverName = `${data.receiverFirstName} ${data.receiverLastName}`.trim();
    const payload = {
      beneficiaryName: receiverName,
      amount: data.amountEur,
      currency: "EUR",
      message: data.message || undefined,
      accessType: data.accessType,
      expiresAt: data.expiresAt || undefined,
      category: data.category || undefined,
      transactionType: data.transactionType,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      senderCountry: data.senderCountry,
      senderCity: data.senderCity,
      receiverFirstName: data.receiverFirstName,
      receiverLastName: data.receiverLastName,
      receiverEmail: data.receiverEmail,
      receiverCountry: data.receiverCountry,
      receiverCity: data.receiverCity,
      displayCurrency: data.displayCurrency,
      paymentMethods: data.paymentMethods,
      blockReason: data.blockReason,
      whatsappNumber: data.whatsappNumber,
    };

    createTransfer.mutate({ data: payload as any }, {
      onSuccess: (res: unknown) => {
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

  if (generated) {
    const convAmount = convertFromEur(generated.amount, generated.displayCurrency);
    return (
      <div className="space-y-6 max-w-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setGenerated(null); form.reset(); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Virement créé</h1>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="pt-6 pb-5">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-bold text-gray-900 text-lg">Lien généré avec succès !</p>
              <p className="text-sm text-gray-500 mt-1">Partagez ce lien avec le destinataire</p>
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Lien de virement</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 font-mono truncate">
                  {fullLink}
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0 h-9 px-3 border-blue-200">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Référence</p>
                <p className="font-mono text-xs font-semibold text-gray-800 break-all">{generated.reference}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Montant (EUR)</p>
                <p className="font-bold text-gray-900">{generated.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
              {generated.displayCurrency !== "EUR" && (
                <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-blue-400 mb-0.5">Affiché en {generated.displayCurrency}</p>
                  <p className="font-bold text-blue-800">{formatCurrencyAmount(convAmount, generated.displayCurrency)}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Partager via
              </p>
              <div className="flex gap-2">
                {[
                  { label: "WhatsApp", color: "#25D366", char: "W", href: `https://wa.me/?text=${encodeURIComponent(`Virement – Confirmez ici : ${fullLink}`)}` },
                  { label: "Telegram", color: "#229ED9", char: "T", href: `https://t.me/share/url?url=${encodeURIComponent(fullLink)}` },
                  { label: "Email", color: "#6b7280", char: "✉", href: `mailto:?subject=${encodeURIComponent(`Virement ${generated.reference}`)}&body=${encodeURIComponent(`Bonjour,\n\nVeuillez confirmer la réception du virement.\n\nLien : ${fullLink}\n\nRéférence : ${generated.reference}`)}` },
                ].map((sl) => (
                  <a key={sl.label} href={sl.href} target="_blank" rel="noreferrer" title={sl.label}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: sl.color }}>
                    {sl.char}
                  </a>
                ))}
                <button onClick={handleCopyLink} title="Copier"
                  className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setLocation(`/transfers/${generated.id}`)}>
            Voir le détail
          </Button>
          <Button className="flex-1 bg-[#003087] hover:bg-[#002060]" onClick={() => { setGenerated(null); form.reset(); }}>
            Nouveau virement
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transfers"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau virement</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Transaction Type */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <FormField control={form.control} name="transactionType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Type d'opération</FormLabel>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {[
                      { value: "virement", label: "↗ Virement", sub: "Envoi vers un compte bancaire externe" },
                      { value: "compte_bm", label: "🌍 Via un compte Banque Mondiale", sub: "Transfert entre comptes Banque Mondiale" },
                    ].map((opt) => (
                      <label key={opt.value}
                        className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 transition-all ${
                          field.value === opt.value
                            ? "border-[#003087] bg-[#003087]/5 text-[#003087]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}>
                        <input type="radio" className="accent-[#003087] h-4 w-4 shrink-0" value={opt.value} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                        <div>
                          <p className={`text-sm font-semibold ${field.value === opt.value ? "text-[#003087]" : "text-gray-800"}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Sender Info */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <SectionTitle icon={User} title="Informations de l'expéditeur" />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="senderFirstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl><Input placeholder="Prénom" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="senderLastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl><Input placeholder="Nom de famille" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="senderCountry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="senderCity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl><Input placeholder="Ville" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Receiver Info */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <SectionTitle icon={Users} title="Informations du receveur" />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="receiverFirstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl><Input placeholder="Prénom" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="receiverLastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl><Input placeholder="Nom de famille" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="receiverEmail" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@exemple.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="receiverCountry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="receiverCity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl><Input placeholder="Ville" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Amount & Currency */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <SectionTitle icon={Wallet} title="Montant et devise" />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amountEur" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant en EUR (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="displayCurrency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise d'affichage</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                          <SelectItem key={code} value={code}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              {convertedAmount !== null && watchedCurrency !== "EUR" && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-blue-600 font-medium">Montant affiché au receveur</span>
                  <span className="text-sm font-bold text-blue-800">{formatCurrencyAmount(convertedAmount, watchedCurrency)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <SectionTitle icon={CreditCard} title="Moyens de paiement activés" />
              <FormField control={form.control} name="paymentMethods" render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {PAYMENT_METHOD_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const checked = Array.isArray(field.value) && field.value.includes(opt.id);
                      return (
                        <label key={opt.id}
                          className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border transition-all ${
                            checked ? "border-[#003087] bg-[#003087]/5" : "border-gray-200 hover:border-gray-300"
                          }`}>
                          <input
                            type="checkbox"
                            className="accent-[#003087] h-4 w-4"
                            checked={checked}
                            onChange={(e) => {
                              const current = Array.isArray(field.value) ? field.value : [];
                              if (e.target.checked) {
                                field.onChange([...current, opt.id]);
                              } else {
                                field.onChange(current.filter((v) => v !== opt.id));
                              }
                            }}
                          />
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: opt.color + "20" }}>
                            <Icon className="h-4 w-4" style={{ color: opt.color }} />
                          </div>
                          <span className={`text-sm font-medium ${checked ? "text-[#003087]" : "text-gray-700"}`}>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Block Reason & WhatsApp */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <SectionTitle icon={Smartphone} title="Configuration retrait" />
              <div className="space-y-4">
                <FormField control={form.control} name="blockReason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raison de blocage du retrait</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Document d'identité requis avant déblocage des fonds..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">Ce message sera affiché au receveur quand il tentera d'effectuer le retrait.</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro WhatsApp admin (avec indicatif)</FormLabel>
                    <FormControl><Input placeholder="+33612345678" {...field} /></FormControl>
                    <p className="text-[11px] text-muted-foreground">Le receveur contactera ce numéro pour débloquer ses fonds.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Optional fields */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Options supplémentaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Choisir une catégorie (optionnel)" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        { value: "logement", label: "🏠 Logement" },
                        { value: "alimentation", label: "🍔 Alimentation" },
                        { value: "santé", label: "❤️ Santé" },
                        { value: "transport", label: "🚗 Transport" },
                        { value: "loisirs", label: "🎉 Loisirs" },
                        { value: "éducation", label: "📚 Éducation" },
                        { value: "autres", label: "📦 Autres" },
                      ].map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message personnalisé</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Message pour le receveur..." maxLength={250} className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <div className="text-[11px] text-muted-foreground text-right">{messageValue.length}/250</div>
                </FormItem>
              )} />
              <FormField control={form.control} name="expiresAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'expiration</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="accessType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'accès</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "public", label: "Public" },
                      { value: "private", label: "Privé" },
                      { value: "limited", label: "Limité" },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-1.5 cursor-pointer text-xs px-3 py-2 rounded-lg border transition-all ${field.value === opt.value ? "border-[#003087] bg-[#003087]/5 text-[#003087] font-medium" : "border-gray-200 text-gray-600"}`}>
                        <input type="radio" className="accent-[#003087]" value={opt.value} checked={field.value === opt.value} onChange={() => field.onChange(opt.value)} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-[#003087] hover:bg-[#002060] text-white h-12 text-base font-semibold"
            disabled={createTransfer.isPending}
          >
            {createTransfer.isPending ? "Génération en cours…" : "Générer le lien de virement"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
