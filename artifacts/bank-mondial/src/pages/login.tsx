import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Globe, ShieldCheck, Zap } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return scrolled;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const scrolled = useScrolled();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("auth_token", res.token);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Erreur de connexion",
          description: err.message || "Identifiants invalides",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans overflow-x-hidden">

      {/* ── Header ── */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,1)",
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.08)" : "0 1px 0 rgba(0,0,0,0.06)",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <img src="/logo-banque-mondiale.png" alt="Banque Mondiale"
                className="h-9 w-9 sm:h-11 sm:w-11 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105" />
              <span className="font-black text-[11px] sm:text-[13px] leading-tight tracking-wider uppercase text-[#003087] whitespace-nowrap">
                BANQUE MONDIALE
              </span>
            </div>
          </Link>
          <Link href="/register">
            <button className="rounded-full font-bold text-sm px-4 sm:px-6 py-2 sm:py-2.5 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md">
              Ouvrir un compte
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-14 sm:pt-16">

        {/* ── Promo band ── */}
        <section className="px-6 py-6 sm:py-8"
          style={{ background: "linear-gradient(90deg, #c8a84b 0%, #a07830 50%, #c8a84b 100%)" }}>
          <FadeUp className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-gray-900 font-bold text-base sm:text-lg">Pas encore client ?</p>
              <p className="text-gray-800/70 text-sm">Jusqu'à <span className="font-black text-gray-900">250 €</span> offerts à l'ouverture</p>
            </div>
            <Link href="/register">
              <button className="shrink-0 rounded-full font-bold text-sm sm:text-base px-6 sm:px-8 py-3 bg-[#1a1a12] text-white hover:bg-[#2a2a1e] active:scale-95 transition-all duration-200 shadow-md">
                Ouvrir un compte
              </button>
            </Link>
          </FadeUp>
        </section>

        {/* ── Form section ── */}
        <section className="px-6 py-12 sm:py-16 bg-gray-50">
          <FadeUp className="w-full max-w-md mx-auto">

            {/* Back button */}
            <Link href="/">
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Retour à l'accueil
              </button>
            </Link>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Se connecter</h2>
              <p className="text-sm text-gray-400 mb-7">Entrez vos identifiants pour accéder à votre espace</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">Adresse email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input placeholder="jean.dupont@exemple.fr"
                            className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                            {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input type="password" placeholder="••••••••"
                            className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                            {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <button type="submit" disabled={loginMutation.isPending}
                    className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md mt-2">
                    {loginMutation.isPending ? "Connexion en cours…" : "Se connecter"}
                  </button>
                </form>
              </Form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Pas encore client ?{" "}
                  <Link href="/register" className="text-[#003087] font-bold hover:underline">
                    Ouvrir un compte
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6 max-w-xs mx-auto leading-relaxed">
              Vos données sont protégées conformément à la réglementation en vigueur.<br />
              Banque Mondiale — Établissement de crédit agréé.
            </p>
          </FadeUp>
        </section>

        {/* ── Features band ── */}
        <section className="px-6 py-12 sm:py-16"
          style={{ background: "linear-gradient(135deg, #2a2a1e 0%, #3d3520 50%, #1a1a12 100%)" }}>
          <FadeUp className="max-w-screen-md mx-auto">
            <p className="text-center text-white/50 text-xs tracking-widest uppercase mb-8">Pourquoi choisir Banque Mondiale</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: <Globe className="w-6 h-6 text-[#6DC142]" />, bg: "bg-[#6DC142]/15 border-[#6DC142]/20", title: "Paiements gratuits partout", desc: "Payez et retirez sans frais dans le monde entier" },
                { icon: <ShieldCheck className="w-6 h-6 text-amber-400" />, bg: "bg-amber-400/15 border-amber-400/20", title: "Assurances premium", desc: "Couverture voyage et assistance incluses" },
                { icon: <Zap className="w-6 h-6 text-blue-400" />, bg: "bg-blue-400/15 border-blue-400/20", title: "Virement instantané", desc: "Transférez de l'argent en quelques secondes" },
              ].map((item, i) => (
                <FadeUp key={i} delay={i * 100}
                  className="bg-white/8 rounded-2xl p-5 border border-white/10 backdrop-blur-sm text-center hover:bg-white/12 transition-colors">
                  <div className={`w-12 h-12 rounded-xl ${item.bg} border flex items-center justify-center mx-auto mb-3`}>
                    {item.icon}
                  </div>
                  <p className="text-white font-bold text-sm mb-2">{item.title}</p>
                  <p className="text-white/55 text-xs leading-relaxed">{item.desc}</p>
                </FadeUp>
              ))}
            </div>
          </FadeUp>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-white px-6 py-8 border-t border-gray-100">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-8 w-8 object-contain" />
                <span className="font-black text-[11px] tracking-wider uppercase text-[#003087]">BANQUE MONDIALE</span>
              </div>
            </Link>
            <p className="text-xs text-gray-400 text-center sm:text-right">
              © 2026 Banque Mondiale — Établissement de crédit agréé. Paris, France.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
