import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Mail, Phone, Globe, Lock, Tag } from "lucide-react";

const registerSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(5, "Numéro de téléphone requis"),
  country: z.string().min(2, "Pays requis"),
  password: z.string().min(6, "Mot de passe trop court"),
  referralCode: z.string().optional(),
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

function useInView(threshold = 0.12) {
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

const FIELD_ICON: Record<string, React.ReactNode> = {
  fullName: <User className="w-4 h-4 text-gray-400" />,
  email: <Mail className="w-4 h-4 text-gray-400" />,
  phone: <Phone className="w-4 h-4 text-gray-400" />,
  country: <Globe className="w-4 h-4 text-gray-400" />,
  password: <Lock className="w-4 h-4 text-gray-400" />,
  referralCode: <Tag className="w-4 h-4 text-gray-400" />,
};

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const scrolled = useScrolled();

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
    <div className="min-h-screen flex flex-col bg-white font-sans overflow-x-hidden">
      <style>{`
        @keyframes slide-left { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slide-up   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes card-bob   { 0%,100% { transform:translateY(0) rotate(-8deg); } 50% { transform:translateY(-10px) rotate(-8deg); } }
        @keyframes card-bob2  { 0%,100% { transform:translateY(0) rotate(6deg); } 50% { transform:translateY(-14px) rotate(6deg); } }
        @keyframes pulse-glow { 0%,100% { box-shadow:0 0 0 0 rgba(109,193,66,0.4); } 50% { box-shadow:0 0 0 10px rgba(109,193,66,0); } }
        .anim-left  { animation: slide-left 0.75s ease both; }
        .anim-up    { animation: slide-up  0.65s ease both; }
        .anim-up-2  { animation: slide-up  0.65s ease 0.15s both; }
        .anim-up-3  { animation: slide-up  0.65s ease 0.3s both; }
        .bob1 { animation: card-bob  4s ease-in-out infinite; }
        .bob2 { animation: card-bob2 4s ease-in-out infinite 0.7s; }
        .cta-pulse { animation: pulse-glow 2.5s ease-in-out infinite; }
      `}</style>

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
          <Link href="/login">
            <button className="rounded-full font-semibold text-sm px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white active:scale-95 transition-all duration-200">
              Se connecter
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-14 sm:pt-16">

        {/* ── Hero section — dark golden gradient ── */}
        <section className="relative flex flex-col lg:flex-row items-center justify-center min-h-[460px] sm:min-h-[520px] px-6 py-16 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2a2a1e 0%, #3d3520 30%, #4a3f28 55%, #2e2a1a 80%, #1a1a12 100%)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(115deg, rgba(255,220,100,0.07) 0%, rgba(255,255,255,0.03) 40%, transparent 60%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[320px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(200,168,75,0.12) 0%, transparent 70%)" }} />

          {/* Left — text */}
          <div className="relative z-10 text-white text-center lg:text-left max-w-lg lg:flex-1">
            <div className="anim-left">
              <div className="inline-flex items-center gap-2 bg-[#6DC142]/20 rounded-full px-4 py-1.5 mb-6 text-xs sm:text-sm text-[#6DC142] font-bold border border-[#6DC142]/30">
                Jusqu'à 250 € offerts
              </div>
            </div>
            <img src="/logo-banque-mondiale.png" alt="Banque Mondiale"
              className="anim-up h-16 w-16 sm:h-20 sm:w-20 object-contain mb-4 mx-auto lg:mx-0" />
            <h1 className="anim-up-2 text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight"
              style={{ fontFamily: "Georgia, serif" }}>
              Ouvrez votre compte<br />en quelques minutes
            </h1>
            <p className="anim-up-3 text-white/60 text-sm sm:text-base max-w-sm mx-auto lg:mx-0 mb-6">
              Rejoignez Banque Mondiale et profitez d'une carte Mastercard, d'assurances premium et de paiements gratuits partout dans le monde.
            </p>

            {/* Promo pills */}
            <div className="anim-up-3 flex flex-wrap gap-2 justify-center lg:justify-start">
              {["160 € avec carte Gold", "50 € avec carte Fosfo", "+ 90 € mobilité bancaire"].map((label, i) => (
                <span key={i} className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/75 border border-white/15">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right — floating cards (desktop) */}
          <div className="hidden lg:flex flex-1 items-center justify-center mt-8 lg:mt-0">
            <div className="relative w-72 h-52">
              <img src="/card-gold.jpeg" alt="Gold"
                className="bob1 absolute w-52 rounded-2xl shadow-2xl"
                style={{ bottom: 0, left: "30px", zIndex: 1 }} />
              <img src="/card-fosfo.jpeg" alt="Fosfo"
                className="bob2 absolute w-52 rounded-2xl shadow-2xl"
                style={{ bottom: "28px", left: "70px", zIndex: 2 }} />
            </div>
          </div>
        </section>

        {/* ── Steps band ── */}
        <section className="px-6 py-10 sm:py-12"
          style={{ background: "linear-gradient(90deg, #c8a84b 0%, #a07830 50%, #c8a84b 100%)" }}>
          <FadeUp className="max-w-screen-md mx-auto">
            <p className="text-center text-gray-900/60 text-xs tracking-widest uppercase mb-6">Ouverture en 3 étapes</p>
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
              {[
                { step: "01", label: "Remplissez le formulaire" },
                { step: "02", label: "Choisissez votre carte" },
                { step: "03", label: "Recevez vos 250 €" },
              ].map((s, i) => (
                <FadeUp key={i} delay={i * 100}>
                  <p className="text-4xl sm:text-5xl font-black text-gray-900/20 leading-none mb-1">{s.step}</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">{s.label}</p>
                </FadeUp>
              ))}
            </div>
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Créer mon compte</h2>
              <p className="text-sm text-gray-400 mb-7">Inscription gratuite, sans engagement</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {[
                    { name: "fullName" as const, label: "Nom et Prénom", placeholder: "Jean Dupont", type: "text" },
                    { name: "email" as const, label: "Adresse email", placeholder: "jean.dupont@exemple.fr", type: "email" },
                    { name: "phone" as const, label: "Téléphone", placeholder: "+33 6 12 34 56 78", type: "tel" },
                    { name: "country" as const, label: "Pays", placeholder: "FR", type: "text" },
                    { name: "password" as const, label: "Mot de passe", placeholder: "••••••••", type: "password" },
                  ].map(({ name, label, placeholder, type }) => (
                    <FormField key={name} control={form.control} name={name} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-sm">{label}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                              {FIELD_ICON[name]}
                            </span>
                            <Input type={type} placeholder={placeholder}
                              className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                              {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}

                  <FormField control={form.control} name="referralCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">
                        Code opération <span className="text-gray-400 font-normal">(optionnel)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{FIELD_ICON.referralCode}</span>
                          <Input placeholder="FTN0626"
                            className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#6DC142] focus:ring-[#6DC142]/20"
                            {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <button type="submit" disabled={registerMutation.isPending}
                    className="cta-pulse w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-lg mt-2">
                    {registerMutation.isPending ? "Création en cours…" : "Ouvrir mon compte gratuitement"}
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

            <p className="text-xs text-gray-400 text-center mt-6 max-w-xs mx-auto leading-relaxed">
              Vos données sont protégées conformément à la réglementation en vigueur.<br />
              Banque Mondiale — Établissement de crédit agréé.
            </p>
          </FadeUp>
        </section>

        {/* ── Cards showcase ── */}
        <section className="px-6 py-12 sm:py-16"
          style={{ background: "linear-gradient(180deg, #1a3a2e 0%, #234d3c 50%, #152e25 100%)" }}>
          <FadeUp className="max-w-screen-md mx-auto text-center mb-10">
            <p className="text-white/50 text-xs tracking-widest uppercase mb-2">Nos cartes</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
              Choisissez votre carte
            </h2>
          </FadeUp>
          <div className="max-w-screen-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                img: "/card-gold.jpeg",
                name: "Gold CB Mastercard",
                tag: "160 € offerts",
                tagColor: "bg-amber-400/20 text-amber-300 border-amber-400/30",
                desc: "À partir de 2 200 € net/mois",
                perks: ["Assurances premium", "Débit différé", "Plafonds étendus"],
                gradient: "from-amber-900/60 to-amber-800/40",
              },
              {
                img: "/card-fosfo.jpeg",
                name: "Fosfo CB Mastercard",
                tag: "50 € offerts",
                tagColor: "bg-[#6DC142]/20 text-[#6DC142] border-[#6DC142]/30",
                desc: "Sans conditions de revenus",
                perks: ["Sans justificatif", "Débit immédiat", "Paiements gratuits"],
                gradient: "from-teal-900/60 to-teal-800/40",
              },
            ].map((card, i) => (
              <FadeUp key={i} delay={i * 100}
                className={`rounded-2xl p-5 border border-white/10 bg-gradient-to-b ${card.gradient} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-base">{card.name}</p>
                    <p className="text-white/55 text-xs mt-0.5">{card.desc}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${card.tagColor}`}>{card.tag}</span>
                </div>
                <img src={card.img} alt={card.name} className="w-full rounded-xl shadow-lg mb-4 object-cover" />
                <ul className="space-y-1.5">
                  {card.perks.map((p, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-white/75">
                      <span className="text-[#6DC142]">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </FadeUp>
            ))}
          </div>
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
