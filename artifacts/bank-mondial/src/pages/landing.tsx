import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { Info, ChevronDown } from "lucide-react";

/* ─── Scroll-triggered fade-up hook ─── */
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

/* ─── Animated counter ─── */
function useCounter(target: number, running: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [running, target, duration]);
  return value;
}

/* ─── Header ─── */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,1)",
        boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.08)" : "0 1px 0 rgba(0,0,0,0.06)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <img
              src="/logo-banque-mondiale.png"
              alt="Banque Mondiale"
              className="h-9 w-9 sm:h-11 sm:w-11 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-black text-[11px] sm:text-[13px] leading-tight tracking-wider uppercase text-[#003087] whitespace-nowrap">
              BANQUE MONDIALE
            </span>
          </div>
        </Link>
        <Link href="/register">
          <button className="rounded-full font-bold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md">
            Ouvrir un compte
          </button>
        </Link>
      </div>
    </header>
  );
}

/* ─── Green CTA button ─── */
function Cta({ label = "Ouvrir un compte", className = "" }: { label?: string; className?: string }) {
  return (
    <Link href="/register">
      <button
        className={`rounded-full font-bold bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-95 transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${className}`}
      >
        {label}
      </button>
    </Link>
  );
}

/* ─── Animated section wrapper ─── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const [activeCard, setActiveCard] = useState<"gold" | "fosfo">("gold");
  const [showConditions, setShowConditions] = useState(true);
  const [showComparatif, setShowComparatif] = useState(false);

  /* hero counters */
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHeroVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const counter250 = useCounter(250, heroVisible, 1400);
  const { ref: mobilityRef, visible: mobilityVisible } = useInView(0.2);
  const counter90 = useCounter(90, mobilityVisible, 1000);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-x-hidden">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-15deg) translateX(-30px); }
          50% { transform: translateY(-10px) rotate(-15deg) translateX(-30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(5deg) translateX(20px); }
          50% { transform: translateY(-14px) rotate(5deg) translateX(20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(109,193,66,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(109,193,66,0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes number-glow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.85; }
        }
        .card-float-1 { animation: float 4s ease-in-out infinite; }
        .card-float-2 { animation: float2 4s ease-in-out infinite 0.6s; }
        .hero-title { animation: slide-in-left 0.8s ease 0.1s both; }
        .hero-sub  { animation: slide-in-up 0.7s ease 0.4s both; }
        .hero-btn  { animation: slide-in-up 0.7s ease 0.65s both; }
        .num-stroke { animation: number-glow 3s ease-in-out infinite; }
        .cta-pulse { animation: pulse-glow 2.5s ease-in-out infinite; }
      `}</style>

      <Header />

      <main className="flex-1 pt-14 sm:pt-16">

        {/* ══════════════════════════════════════════
            SECTION 1 — Hero
        ══════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative flex items-center justify-center min-h-[580px] sm:min-h-[640px] px-6 py-16 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2a2a1e 0%, #3d3520 30%, #4a3f28 55%, #2e2a1a 80%, #1a1a12 100%)" }}
        >
          {/* Shimmer diagonal band */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(115deg, rgba(255,220,100,0.07) 0%, rgba(255,255,255,0.035) 40%, transparent 60%)" }}
          />
          {/* Radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(200,168,75,0.12) 0%, transparent 70%)" }} />

          <div className="relative z-10 text-white w-full max-w-lg mx-auto lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            {/* Left col */}
            <div>
              <h1
                className="hero-title text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Votre compte est déjà rentable.
              </h1>

              <div className="hero-sub">
                <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/60 mb-1">JUSQU'À</p>
                <div className="flex items-end gap-2 mb-0">
                  <span
                    className="num-stroke font-bold leading-none select-none"
                    style={{
                      fontSize: "clamp(5rem, 18vw, 9rem)",
                      color: "transparent",
                      WebkitTextStroke: "1.5px rgba(255,255,255,0.55)",
                      letterSpacing: "-4px",
                      lineHeight: 1,
                    }}
                  >
                    {counter250}
                  </span>
                  <span className="text-white/60 text-4xl font-light mb-4">€</span>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-white -mt-2 mb-6">offerts</p>

                <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-5 max-w-sm">
                  Pour une 1<sup>re</sup> ouverture de compte avec carte Gold CB Mastercard et 5 paiements en 90 jours (160€), complétée d'une 1<sup>re</sup> mobilité bancaire (+ 90€ offerts).
                </p>

                <button className="flex items-center gap-1.5 text-sm text-white/55 mb-8 hover:text-white/90 transition-colors">
                  Voir conditions <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="hero-btn flex flex-col sm:flex-row gap-3">
                <Cta className="cta-pulse w-full sm:w-auto text-base px-8 py-4 font-bold" />
                <p className="text-[10px] text-white/35 sm:hidden text-center mt-1">Valable du 18/05/2026 au 30/06/2026</p>
              </div>
              <p className="hidden sm:block text-[10px] text-white/35 mt-3">Valable du 18/05/2026 au 30/06/2026</p>
            </div>

            {/* Right col — cards floating (desktop only) */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-64">
                <img
                  src="/card-gold.jpeg"
                  alt="Gold CB Mastercard"
                  className="card-float-1 absolute w-60 rounded-2xl shadow-2xl"
                  style={{ bottom: 0, left: "50%", zIndex: 1 }}
                />
                <img
                  src="/card-fosfo.jpeg"
                  alt="Fosfo CB Mastercard"
                  className="card-float-2 absolute w-60 rounded-2xl shadow-2xl"
                  style={{ bottom: "30px", left: "50%", zIndex: 2 }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 2 — Gold CB Mastercard hero
        ══════════════════════════════════════════ */}
        <section
          className="relative flex flex-col justify-end min-h-[480px] sm:min-h-[540px] overflow-hidden"
          style={{ background: "linear-gradient(180deg, #c8a84b 0%, #a07830 35%, #7a5c20 65%, #4a3810 100%)" }}
        >
          <FadeUp className="w-full flex items-end justify-center pt-16 pb-4 px-6">
            <div className="relative flex items-end justify-center" style={{ height: "220px", width: "300px" }}>
              <img src="/card-gold.jpeg" alt="Gold" className="card-float-1 absolute w-56 sm:w-64 rounded-2xl shadow-2xl"
                style={{ bottom: 0, left: "50%" }} />
              <img src="/card-gold.jpeg" alt="Gold 2" className="card-float-2 absolute w-56 sm:w-64 rounded-2xl shadow-2xl"
                style={{ bottom: "24px", left: "50%" }} />
            </div>
          </FadeUp>

          <FadeUp delay={150} className="relative z-10 text-white text-center px-6 pb-12 pt-4">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>
              Gold CB<br />Mastercard
            </h2>
            <p className="text-white/75 text-base sm:text-lg mb-8">Choisissez la carte qui vaut de l'or</p>
            <div className="max-w-xs mx-auto">
              <Cta className="w-full text-base py-4 font-bold" />
            </div>
          </FadeUp>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 3 — Gold 0€/mois
        ══════════════════════════════════════════ */}
        <section
          className="px-6 py-12 sm:py-16"
          style={{ background: "linear-gradient(180deg, #4a3810 0%, #8b7040 40%, #a08050 60%, #3a2c18 100%)" }}
        >
          <FadeUp className="max-w-lg mx-auto text-white">
            <div className="flex items-end gap-1 mb-0">
              <span className="font-bold leading-none" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(5rem, 18vw, 8rem)" }}>
                0
              </span>
              <span className="text-3xl font-light mb-4">€</span>
            </div>
            <p className="text-white/75 text-xl -mt-2 mb-1">/mois</p>
            <button className="flex items-center gap-1.5 text-sm text-white/50 mb-8 hover:text-white transition-colors">
              Voir conditions <Info className="w-3.5 h-3.5" />
            </button>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 mb-8 border border-white/10">
              <p className="font-bold text-base sm:text-lg mb-5 text-center">
                À partir de 2 200 € net de revenus mensuels
              </p>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-white/85">
                {[
                  "Une carte à débit immédiat ou différé (dès 6 mois d'ancienneté)",
                  "Des assurances et assistances premium pour les voyages et pour le reste ¹",
                  "Des plafonds de paiement et de retrait étendus",
                  "Paiements et retraits gratuits partout dans le monde ²",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#6DC142] text-lg mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Cta className="w-full text-base py-4 font-bold" />
          </FadeUp>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 — Fosfo CB Mastercard
        ══════════════════════════════════════════ */}
        <section
          className="px-6 py-14 sm:py-20"
          style={{ background: "linear-gradient(180deg, #1a3a2e 0%, #234d3c 50%, #152e25 100%)" }}
        >
          <FadeUp className="max-w-lg mx-auto text-white">
            <h2 className="text-4xl sm:text-5xl font-bold mb-2 text-center" style={{ fontFamily: "Georgia, serif" }}>
              Fosfo CB<br />Mastercard
            </h2>
            <p className="text-white/65 text-center text-base sm:text-lg mb-10">Jouez la carte de la facilité</p>
          </FadeUp>

          <FadeUp delay={120} className="max-w-lg mx-auto text-white">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/55 text-center mb-1">JUSQU'À</p>
            <div className="flex items-end justify-center gap-2 mb-0">
              <span
                className="num-stroke font-bold leading-none select-none"
                style={{
                  fontSize: "clamp(5rem, 18vw, 9rem)",
                  color: "transparent",
                  WebkitTextStroke: "1.5px rgba(255,255,255,0.5)",
                  letterSpacing: "-4px",
                  lineHeight: 1,
                }}
              >
                140
              </span>
              <span className="text-white/55 text-4xl font-light mb-4">€</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-white text-center -mt-2 mb-6">offerts</p>

            <p className="text-sm sm:text-base text-white/65 text-center leading-relaxed mb-5 max-w-sm mx-auto">
              Pour une 1<sup>re</sup> ouverture d'un compte avec une carte Fosfo CB Mastercard et 5 paiements dans les 90 jours (50 € offerts), complétée d'une 1<sup>re</sup> mobilité bancaire (+ 90 € offerts).
            </p>

            <button className="flex items-center gap-1.5 text-sm text-white/50 mx-auto mb-5 hover:text-white transition-colors">
              Voir conditions <Info className="w-3.5 h-3.5" />
            </button>

            <div className="text-center mb-8 bg-white/8 rounded-2xl py-4 px-5 border border-white/10">
              <p className="text-sm text-white/60 mb-1">Avec le code opération : <span className="text-white font-bold">FTN0626</span></p>
              <p className="text-sm text-white/50">Valable du 18.05.2026 au 30.06.2026</p>
            </div>

            <Cta className="w-full text-base py-4 font-bold" />
          </FadeUp>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5 — Comparer les cartes
        ══════════════════════════════════════════ */}
        <section className="bg-white px-6 py-14 sm:py-20">
          <FadeUp className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-gray-300 text-2xl sm:text-3xl font-light">Comparer</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 -mt-1">les cartes</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-8">
              {[
                { name: "Fosfo CB Mastercard", sub: "Jouez la carte de la facilité", img: "/card-fosfo.jpeg", cond: "Sans conditions de revenus" },
                { name: "Gold CB Mastercard", sub: "Choisissez la carte qui vaut de l'or", img: "/card-gold.jpeg", cond: "À partir de 2 200 € net/mois" },
              ].map((card, i) => (
                <div key={i} className="text-center group">
                  <p className="font-bold text-gray-800 text-sm sm:text-base mb-1">{card.name}</p>
                  <p className="text-gray-400 text-xs sm:text-sm mb-4">{card.sub}</p>
                  <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-md mx-auto w-32 sm:w-44 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
                    <img src={card.img} alt={card.name} className="w-full object-cover" />
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-3 leading-tight">{card.cond}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowComparatif(!showComparatif)}
              className="w-full border-2 border-gray-200 rounded-full py-3.5 text-sm sm:text-base font-semibold text-gray-600 flex items-center justify-center gap-2 hover:border-[#6DC142] hover:text-[#3a8020] transition-all duration-200 mb-6"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showComparatif ? "rotate-180" : ""}`} />
              Voir le comparatif
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showComparatif ? "rotate-180" : ""}`} />
            </button>

            <div
              style={{
                maxHeight: showComparatif ? "600px" : "0",
                overflow: "hidden",
                transition: "max-height 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div className="mb-8 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                  <div className="p-3 sm:p-4" />
                  <div className="p-3 sm:p-4 text-center border-l border-gray-200">
                    <p className="font-bold text-gray-800 text-xs sm:text-sm">Fosfo CB</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">Mastercard</p>
                  </div>
                  <div className="p-3 sm:p-4 text-center border-l border-gray-200 bg-amber-50">
                    <p className="font-bold text-amber-800 text-xs sm:text-sm">Gold CB</p>
                    <p className="text-[10px] sm:text-xs text-amber-500">Mastercard</p>
                  </div>
                </div>
                {[
                  { label: "Cotisation mensuelle", fosfo: "0 €", gold: "0 €" },
                  { label: "Conditions de revenus", fosfo: "Aucune", gold: "2 200 € net/mois" },
                  { label: "Type de débit", fosfo: "Immédiat", gold: "Immédiat ou différé" },
                  { label: "Paiements monde entier", fosfo: "Gratuits ²", gold: "Gratuits ²" },
                  { label: "Retraits monde entier", fosfo: "Gratuits ²", gold: "Gratuits ²" },
                  { label: "Plafonds de paiement", fosfo: "Standard", gold: "Étendus" },
                  { label: "Assurances voyages", fosfo: "Basiques", gold: "Premium ¹" },
                  { label: "Prime d'ouverture", fosfo: "50 €", gold: "160 €" },
                  { label: "+ Mobilité bancaire", fosfo: "+ 90 €", gold: "+ 90 €" },
                  { label: "Total offert", fosfo: "140 €", gold: "250 €", highlight: true },
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-3 border-b border-gray-100 last:border-0 ${row.highlight ? "bg-green-50" : ""}`}>
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium leading-tight">{row.label}</div>
                    <div className={`p-3 sm:p-4 text-center text-xs sm:text-sm border-l border-gray-100 ${row.highlight ? "font-bold text-[#3a8020]" : "text-gray-700"}`}>{row.fosfo}</div>
                    <div className={`p-3 sm:p-4 text-center text-xs sm:text-sm border-l border-gray-100 bg-amber-50/40 ${row.highlight ? "font-bold text-[#3a8020]" : "text-gray-700"}`}>{row.gold}</div>
                  </div>
                ))}
              </div>
            </div>

            <Cta className="w-full text-base py-4 font-bold" />
          </FadeUp>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 6 — Mobilité bancaire 90€
        ══════════════════════════════════════════ */}
        <section className="bg-gray-50 px-6 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto">
            <FadeUp>
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl mb-10 transition-transform duration-500 hover:scale-[1.01]">
                <img src="/mobility-iban.jpeg" alt="Mobilité bancaire" className="w-full object-cover" />
              </div>
            </FadeUp>

            <div ref={mobilityRef}>
              <FadeUp delay={100} className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="font-bold leading-none text-gray-900" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(4rem, 15vw, 7rem)" }}>
                    {counter90}
                  </span>
                  <span className="text-3xl sm:text-4xl text-gray-400 mb-4">€</span>
                </div>
                <p className="text-gray-600 text-base sm:text-lg">offerts, directement inclus dans votre prime.</p>
              </FadeUp>

              <FadeUp delay={200} className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
                  Demandez votre mobilité bancaire
                </h2>
                <Cta className="w-full sm:w-auto text-base px-10 py-4 font-bold" />
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 7 — Sauter le pas
        ══════════════════════════════════════════ */}
        <section
          className="px-6 py-14 sm:py-20"
          style={{ background: "linear-gradient(180deg, #c8a84b 0%, #b89040 40%, #a07830 70%, #c8a84b 100%)" }}
        >
          <FadeUp className="max-w-lg mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4" style={{ fontFamily: "Georgia, serif" }}>
              <span className="text-white/55 font-light block">Sauter le pas n'a jamais</span>
              <span className="text-gray-900">été aussi facile.</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-800/75 text-center leading-relaxed mb-8 max-w-sm mx-auto">
              Jusqu'à 250 € offerts pour ouverture de compte avec une carte Gold Mastercard.
              Cumul de 160 € (Carte Gold) + 90 € (Mobilité bancaire).
            </p>

            {/* Toggle */}
            <div className="bg-black/15 rounded-full p-1 flex mb-6 backdrop-blur-sm">
              {(["gold", "fosfo"] as const).map((card) => (
                <button
                  key={card}
                  onClick={() => setActiveCard(card)}
                  className={`flex-1 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-250 ${
                    activeCard === card ? "bg-white text-gray-900 shadow-md" : "text-gray-800/70 hover:text-gray-900"
                  }`}
                >
                  {card === "gold" ? "Carte Gold" : "Carte Fosfo"}
                </button>
              ))}
            </div>

            {/* Card detail — animated swap */}
            <div
              className="rounded-2xl p-5 sm:p-6 mb-8 border border-white/20 transition-all duration-400"
              style={{
                background: activeCard === "gold" ? "rgba(180,140,50,0.65)" : "rgba(25,65,50,0.85)",
                backdropFilter: "blur(8px)",
              }}
            >
              <p className="font-bold text-base sm:text-lg text-white text-center mb-4">
                {activeCard === "gold"
                  ? "Ouvrez votre compte avec une carte Gold CB Mastercard"
                  : "Ouvrez votre compte avec une carte Fosfo CB Mastercard"}
              </p>
              <img
                src={activeCard === "gold" ? "/card-gold.jpeg" : "/card-fosfo.jpeg"}
                alt={activeCard}
                className="w-44 sm:w-52 rounded-2xl mx-auto mb-5 shadow-xl transition-all duration-400"
              />
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/90">
                {(activeCard === "gold" ? [
                  "160 € offerts pour 5 paiements en 90 jours",
                  "+ 90 € offerts pour mobilité bancaire",
                  "À partir de 2 200 € net/mois",
                ] : [
                  "50 € offerts pour 5 paiements en 90 jours",
                  "+ 90 € offerts pour mobilité bancaire",
                  "Sans conditions de revenus",
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#6DC142] text-lg shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Cta className="w-full text-base py-4 font-bold" />
          </FadeUp>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 8 — Conditions légales
        ══════════════════════════════════════════ */}
        <section className="bg-white px-6 py-10 sm:py-14">
          <FadeUp className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-600 mb-5 hover:text-gray-900 transition-colors group"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showConditions ? "rotate-180" : ""}`} />
              Conditions de l'offre
            </button>

            <div
              style={{
                maxHeight: showConditions ? "2000px" : "0",
                overflow: "hidden",
                transition: "max-height 0.6s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div className="space-y-4 text-xs sm:text-sm text-gray-500 leading-relaxed pb-6">
                {[
                  ["1", "Voir détails, limites et conditions dans la notice d'information d'assurance et d'assistance."],
                  ["2", "Hors frais de conversion monétaire et frais éventuels prélevés par l'établissement propriétaire du distributeur."],
                  ["3", "L'accès à ce service est réservé aux clients titulaires d'un compte bancaire associé à l'une des cartes bancaires visées dans les conditions tarifaires en vigueur."],
                  ["4", "Sous réserve d'acceptation de la demande et que le compte de dépôt associé soit ouvert depuis plus de 6 mois."],
                  ["5", "Code secret personnalisable effectif lors d'une souscription sur le site."],
                  ["6", "La Banque Mondiale se réserve la faculté, pour les clients détenteurs d'une carte bancaire, d'octroyer un découvert autorisé dont le montant est de 200 € maximum."],
                  ["7", "Dans la limite des plafonds de la carte bancaire et sous réserve de compatibilité du terminal de paiement."],
                  ["8", "Sous réserve de compatibilité de la banque du destinataire avec le service de virement instantané et dans la limite de vos plafonds de virement."],
                  ["9", "Sous réserve d'acceptation de la demande."],
                ].map(([num, text]) => (
                  <p key={num}><span className="text-[#5BAF32] font-bold">({num})</span> {text}</p>
                ))}
                <p>
                  <span className="text-[#5BAF32] font-bold">(10)</span> Du 18 Mai 2026 au 30 Juin 2026 inclus, jusqu'à 250 euros offerts sous réserve de satisfaire aux conditions suivantes :
                  <br /><br />— 160 euros offerts pour la première ouverture d'un compte avec une carte Gold CB Mastercard suivie de 5 paiements dans un délai de 90 jours maximum.
                  <br /><br />OU<br /><br />— 50 euros offerts pour la première ouverture d'un compte avec une carte Fosfo CB Mastercard suivie de 5 paiements dans un délai de 90 jours maximum.
                  <br /><br />ET<br /><br />— 90 euros offerts pour toute première utilisation du service d'aide à la mobilité bancaire.
                  <br /><br />Offres réservées aux personnes physiques majeures n'ayant jamais été détentrices de compte chez Banque Mondiale. Code opération : "FTN0626". Dossier complet à recevoir au plus tard le 14/07/2026.
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 text-center">
              <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-12 w-12 object-contain mx-auto mb-3 opacity-50" />
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Banque Mondiale. Établissement de crédit agréé. Siège social : Paris, France.
              </p>
            </div>
          </FadeUp>
        </section>
      </main>

      {/* ── Sticky bottom CTA ── */}
      <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="max-w-screen-xl mx-auto">
          <Cta className="w-full sm:w-auto sm:px-12 text-base py-4 font-bold sm:mx-auto sm:block" />
        </div>
      </div>
    </div>
  );
}
