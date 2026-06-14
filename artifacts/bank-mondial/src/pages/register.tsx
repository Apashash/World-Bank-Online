import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(5, "Numéro de téléphone requis"),
  country: z.string().min(2, "Pays requis"),
  password: z.string().min(6, "Mot de passe trop court"),
  referralCode: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", country: "FR", password: "", referralCode: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("auth_token", res.token);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Erreur d'inscription",
          description: err.message || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-11 w-11 object-contain shrink-0" />
              <span className="font-black text-[12px] leading-tight tracking-wider uppercase text-[#003087] whitespace-nowrap">
                BANQUE MONDIALE
              </span>
            </div>
          </Link>
          <Link href="/login">
            <button className="rounded-full font-semibold text-sm px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
              Se connecter
            </button>
          </Link>
        </div>
      </header>

      {/* Hero band */}
      <div
        className="w-full py-10 px-6 flex flex-col items-center text-center"
        style={{
          background: "linear-gradient(135deg, #2a2a1e 0%, #3d3520 30%, #4a3f28 55%, #2e2a1a 80%, #1a1a12 100%)",
        }}
      >
        <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-14 w-14 object-contain mb-3" />
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>
          BANQUE MONDIALE
        </h1>
        <p className="text-white/60 text-sm">Ouvrez votre compte en quelques minutes</p>

        {/* Promo pill */}
        <div className="mt-4 bg-white/10 rounded-full px-4 py-2 text-sm text-white/80 font-medium">
          Jusqu'à <span className="text-[#6DC142] font-bold">250 €</span> offerts pour votre 1<sup>re</sup> ouverture
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold text-sm">Nom et Prénom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jean Dupont"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold text-sm">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="jean.dupont@exemple.fr"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold text-sm">Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+33 6 12 34 56 78"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold text-sm">Pays</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FR"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold text-sm">Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="referralCode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold text-sm">
                    Code de parrainage <span className="text-gray-400 font-normal">(optionnel)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FTN0626"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {registerMutation.isPending ? "Création en cours..." : "Ouvrir mon compte"}
              </button>
            </form>
          </Form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Déjà client ?{" "}
              <Link href="/login" className="text-[#003087] font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 max-w-xs leading-relaxed">
          Vos données sont protégées conformément à la réglementation en vigueur. Banque Mondiale — Établissement de crédit agréé.
        </p>
      </div>
    </div>
  );
}
