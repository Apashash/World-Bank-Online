import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Info, ChevronDown, X } from "lucide-react";
import BankCard from "@/components/BankCard";
import heroImage from "@assets/IMG_3956_1781683455055.jpeg";

/* ═══════════════════════════════════════════
   ANIMATION HOOKS
═══════════════════════════════════════════ */

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    let obs: IntersectionObserver;
    try {
      obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
        { threshold }
      );
      obs.observe(el);
    } catch { setVisible(true); return; }
    return () => obs?.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCounter(target: number, running: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [running, target, duration]);
  return value;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? scrolled / total : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return progress;
}

function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const fn = () => setOffset(window.scrollY * speed);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [speed]);
  return offset;
}

/* ═══════════════════════════════════════════
   REVEAL COMPONENT — directional animations
═══════════════════════════════════════════ */
type RevealDir = "up" | "down" | "left" | "right" | "zoom" | "fade";
function Reveal({
  children, delay = 0, className = "", dir = "up", threshold = 0.12,
}: {
  children: React.ReactNode; delay?: number; className?: string;
  dir?: RevealDir; threshold?: number;
}) {
  const { ref, visible } = useInView(threshold);
  const from: Record<RevealDir, string> = {
    up:    "opacity:0;transform:translateY(40px)",
    down:  "opacity:0;transform:translateY(-30px)",
    left:  "opacity:0;transform:translateX(-50px)",
    right: "opacity:0;transform:translateX(50px)",
    zoom:  "opacity:0;transform:scale(0.88)",
    fade:  "opacity:0",
  };
  const to: Record<RevealDir, string> = {
    up:    "opacity:1;transform:translateY(0)",
    down:  "opacity:1;transform:translateY(0)",
    left:  "opacity:1;transform:translateX(0)",
    right: "opacity:1;transform:translateX(0)",
    zoom:  "opacity:1;transform:scale(1)",
    fade:  "opacity:1",
  };
  const style = visible
    ? { ...parseCss(to[dir]), transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms` }
    : { ...parseCss(from[dir]), transition: "none" };
  return <div ref={ref} className={className} style={style}>{children}</div>;
}
function parseCss(s: string): React.CSSProperties {
  const obj: Record<string, string> = {};
  s.split(";").forEach(p => { const [k, v] = p.split(":"); if (k && v) obj[k.trim()] = v.trim(); });
  return obj as React.CSSProperties;
}

/* ─── Stagger list ─── */
function StaggerList({ items, renderItem, className = "", itemClass = "", baseDelay = 0 }: {
  items: string[]; renderItem: (item: string, i: number) => React.ReactNode;
  className?: string; itemClass?: string; baseDelay?: number;
}) {
  const { ref, visible } = useInView(0.1);
  return (
    <ul ref={ref} className={className}>
      {items.map((item, i) => (
        <li key={i} className={itemClass} style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-20px)",
          transition: `opacity 0.5s ease ${baseDelay + i * 100}ms, transform 0.5s ease ${baseDelay + i * 100}ms`,
        }}>
          {renderItem(item, i)}
        </li>
      ))}
    </ul>
  );
}

/* ═══════════════════════════════════════════
   ANNOUNCEMENT BANNER
═══════════════════════════════════════════ */
function AnnouncementBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-center text-sm"
      style={{ background: "#1c1c1c", color: "rgba(255,255,255,0.75)" }}>
      <span>
        80 € offerts pour votre première ouverture d'un compte de dépôt avec carte Gold CB Mastercard.{" "}
        <button className="underline underline-offset-2 hover:text-white transition-colors">
          Voir conditions
        </button>{" "}
        <Info className="inline w-3.5 h-3.5 align-middle opacity-60" />
      </span>
      <button onClick={onClose} className="ml-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HEADER
═══════════════════════════════════════════ */
function Header({ bannerVisible }: { bannerVisible: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const bannerH = bannerVisible ? "40px" : "0px";
  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300" style={{ top: bannerH }}>
      <div className="w-full transition-all duration-300" style={{
        background: scrolled ? "rgba(10,10,10,0.97)" : "#0a0a0a",
        boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.4)" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <img src="/logo-banque-mondiale.png" alt="Banque Mondiale"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105" />
              <span className="font-black text-[11px] sm:text-[13px] leading-tight tracking-wider uppercase text-white whitespace-nowrap">
                BANQUE MONDIALE
              </span>
            </div>
          </Link>
          <Link href="/open-account">
            <button className="rounded-full font-bold text-sm px-5 py-2 bg-[#6DC142] text-[#0a1a04] hover:bg-[#5BAF32] active:scale-95 transition-all duration-200">
              Ouvrir un compte
            </button>
          </Link>
          <button onClick={() => setMenuOpen(o => !o)} className="ml-3 text-white opacity-70 hover:opacity-100 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect y="4" width="22" height="2" rx="1" fill="currentColor"/>
              <rect y="10" width="22" height="2" rx="1" fill="currentColor"/>
              <rect y="16" width="22" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function Cta({ label = "Ouvrir un compte", className = "" }: { label?: string; className?: string }) {
  return (
    <Link href="/open-account">
      <button className={`rounded-full font-bold bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-95 transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 cta-pulse ${className}`}>
        {label}
      </button>
    </Link>
  );
}

/* ═══════════════════════════════════════════
   MOBILITY MOCKUP — replaces the old image
═══════════════════════════════════════════ */
function MobilityMockup() {
  return (
    <div className="w-full select-none" style={{
      background: "linear-gradient(145deg, #0d2e1a 0%, #1a5c34 40%, #6DC142 100%)",
      padding: "clamp(28px, 8vw, 56px) clamp(20px, 6vw, 48px)",
      minHeight: "320px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div className="w-full max-w-xs mx-auto flex flex-col gap-3">
        {/* Card 1 — Banque traditionnelle */}
        <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">Banque traditionnelle</p>
            <p className="text-xs text-gray-400 mt-0.5">IBAN •••• •••• •••• 8878</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Card 2 — Banque Mondiale */}
        <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">Banque Mondiale</p>
            <p className="text-xs text-gray-400 mt-0.5">IBAN •••• •••• •••• 8878</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE
═══════════════════════════════════════════ */
export default function Landing() {
  const [activeCard, setActiveCard] = useState<"gold" | "fosfo">("gold");
  const [showConditions, setShowConditions] = useState(true);
  const [showComparatif, setShowComparatif] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);
  const scrollProgress = useScrollProgress();
  const parallaxY = useParallax(0.18);

  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setHeroVisible(true); return; }
    let obs: IntersectionObserver;
    try {
      obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHeroVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
      obs.observe(el);
    } catch { setHeroVisible(true); return; }
    return () => obs?.disconnect();
  }, []);

  const counter250 = useCounter(250, heroVisible, 1600);
  const { ref: mobilityRef, visible: mobilityVisible } = useInView(0.2);
  const counter90 = useCounter(90, mobilityVisible, 1100);

  const topOffset = bannerVisible ? "94px" : "56px";

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-x-hidden">
      <style>{`
        @keyframes float1  { 0%,100%{transform:translateY(0) rotate(-15deg) translateX(-30px)} 50%{transform:translateY(-12px) rotate(-15deg) translateX(-30px)} }
        @keyframes float2  { 0%,100%{transform:translateY(0) rotate(5deg) translateX(20px)} 50%{transform:translateY(-16px) rotate(5deg) translateX(20px)} }
        @keyframes bob1    { 0%,100%{transform:translateY(0) rotate(-8deg)} 50%{transform:translateY(-10px) rotate(-8deg)} }
        @keyframes bob2    { 0%,100%{transform:translateY(0) rotate(6deg)} 50%{transform:translateY(-14px) rotate(6deg)} }
        @keyframes num-pulse { 0%,100%{opacity:.55} 50%{opacity:.9} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(109,193,66,.4)} 50%{box-shadow:0 0 0 14px rgba(109,193,66,0)} }
        @keyframes hero-title { from{opacity:0;transform:translateX(-44px)} to{opacity:1;transform:translateX(0)} }
        @keyframes hero-sub   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer-bg { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(300%) skewX(-15deg)} }
        @keyframes spin-slow  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .card-float-1 { animation:float1 4s ease-in-out infinite }
        .card-float-2 { animation:float2 4s ease-in-out infinite .7s }
        .bob1 { animation:bob1 4s ease-in-out infinite }
        .bob2 { animation:bob2 4s ease-in-out infinite .7s }
        .num-pulse { animation:num-pulse 3s ease-in-out infinite }
        .cta-pulse { animation:pulse-glow 2.5s ease-in-out infinite }
        .anim-title { animation:hero-title .85s cubic-bezier(.22,1,.36,1) .1s both }
        .anim-sub1  { animation:hero-sub  .75s cubic-bezier(.22,1,.36,1) .35s both }
        .anim-sub2  { animation:hero-sub  .75s cubic-bezier(.22,1,.36,1) .55s both }
        .anim-sub3  { animation:hero-sub  .75s cubic-bezier(.22,1,.36,1) .75s both }
        .shimmer-btn::after { content:''; position:absolute; top:0; left:0; width:40%; height:100%; background:rgba(255,255,255,.25); animation:shimmer-bg 3s ease-in-out infinite 1s; border-radius:inherit }
      `}</style>

      {/* ── Scroll progress bar ── */}
      <div className="fixed top-0 left-0 z-[60] h-[3px] bg-[#6DC142] transition-all duration-100"
        style={{ width: `${scrollProgress * 100}%` }} />

      {/* ── Fixed announcement banner ── */}
      {bannerVisible && (
        <div className="fixed top-0 left-0 w-full z-[55]">
          <AnnouncementBanner onClose={() => setBannerVisible(false)} />
        </div>
      )}

      <Header bannerVisible={bannerVisible} />

      <main className="flex-1" style={{ paddingTop: topOffset }}>

        {/* ══════════════════════════════════════════
            SECTION 1 — HERO PHOTO
        ══════════════════════════════════════════ */}
        <section ref={heroRef} className="relative flex items-end overflow-hidden"
          style={{ minHeight: "calc(100svh - 94px)" }}>
          {/* Photo background with parallax */}
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Banque Mondiale"
              className="w-full h-full object-cover object-top"
              style={{ transform: `translateY(${parallaxY * 0.5}px)`, transformOrigin: "center top" }}
            />
            {/* Gradient overlay — sky stays clear, bottom goes dark */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.1) 68%, transparent 100%)"
            }} />
          </div>

          {/* Text overlay at bottom */}
          <div className="relative z-10 w-full px-6 pb-10 sm:pb-14 max-w-xl">
            <h1 className="anim-title text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-white mb-7">
              La banque en ligne qui va vous faire aimer les chiffres
            </h1>
            <div className="anim-sub1">
              <Cta className="shimmer-btn relative overflow-hidden w-full sm:w-auto text-base px-8 py-4" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 2 — Gold hero
        ══════════════════════════════════════════ */}
        <section className="relative flex flex-col justify-end min-h-[500px] sm:min-h-[560px] overflow-hidden"
          style={{ background: "linear-gradient(180deg, #c8a84b 0%, #a07830 35%, #7a5c20 65%, #4a3810 100%)" }}>

          <Reveal dir="zoom" className="w-full flex items-end justify-center pt-16 pb-4 px-6">
            <div className="relative flex items-end justify-center" style={{ height: "230px", width: "300px" }}>
              <BankCard variant="gold" className="card-float-1 absolute w-56 sm:w-64"
                style={{ bottom: 0, left: "50%", zIndex: 1 }} />
              <BankCard variant="gold" className="card-float-2 absolute w-56 sm:w-64"
                style={{ bottom: "24px", left: "50%", zIndex: 2 }} />
            </div>
          </Reveal>

          <div className="relative z-10 text-white text-center px-6 pb-12 pt-4">
            <Reveal dir="up" delay={100}>
              <h2 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>
                Gold CB<br />Mastercard
              </h2>
              <p className="text-white/75 text-base sm:text-lg mb-8">Choisissez la carte qui vaut de l'or</p>
              <div className="max-w-xs mx-auto">
                <Cta className="w-full text-base py-4" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 3 — Gold 0€/mois + features
        ══════════════════════════════════════════ */}
        <section className="px-6 py-14 sm:py-20"
          style={{ background: "linear-gradient(180deg, #4a3810 0%, #8b7040 40%, #a08050 60%, #3a2c18 100%)" }}>
          <div className="max-w-lg mx-auto text-white">
            <Reveal dir="left">
              <div className="flex items-end gap-1 mb-0">
                <span className="font-bold leading-none" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(5rem,18vw,8rem)" }}>0</span>
                <span className="text-3xl font-light mb-4">€</span>
              </div>
              <p className="text-white/75 text-xl -mt-2 mb-1">/mois</p>
              <button className="flex items-center gap-1.5 text-sm text-white/50 mb-8 hover:text-white transition-colors">
                Voir conditions <Info className="w-3.5 h-3.5" />
              </button>
            </Reveal>

            <Reveal dir="right" delay={80}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 mb-8 border border-white/10">
                <p className="font-bold text-base sm:text-lg mb-5 text-center">À partir de 2 200 € net de revenus mensuels</p>
                <StaggerList
                  items={[
                    "Une carte à débit immédiat ou différé (dès 6 mois d'ancienneté)",
                    "Des assurances et assistances premium pour les voyages et pour le reste ¹",
                    "Des plafonds de paiement et de retrait étendus",
                    "Paiements et retraits gratuits partout dans le monde ²",
                  ]}
                  className="space-y-3 sm:space-y-4 text-sm sm:text-base text-white/85"
                  baseDelay={100}
                  renderItem={(item) => (
                    <span className="flex items-start gap-3">
                      <span className="text-[#6DC142] text-lg mt-0.5 shrink-0">•</span>
                      <span>{item}</span>
                    </span>
                  )}
                />
              </div>
            </Reveal>

            <Reveal dir="up" delay={160}>
              <Cta className="w-full text-base py-4" />
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 — Fosfo CB Mastercard
        ══════════════════════════════════════════ */}
        <section className="px-6 py-14 sm:py-20 overflow-hidden"
          style={{ background: "linear-gradient(180deg, #1a3a2e 0%, #234d3c 50%, #152e25 100%)" }}>
          <div className="max-w-lg mx-auto text-white">
            <Reveal dir="right">
              <h2 className="text-4xl sm:text-5xl font-bold mb-2 text-center" style={{ fontFamily: "Georgia, serif" }}>
                Fosfo CB<br />Mastercard
              </h2>
              <p className="text-white/65 text-center text-base sm:text-lg mb-10">Jouez la carte de la facilité</p>
            </Reveal>

            <Reveal dir="zoom" delay={100}>
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/55 text-center mb-1">JUSQU'À</p>
              <div className="flex items-end justify-center gap-2 mb-0">
                <span className="num-pulse font-bold leading-none select-none"
                  style={{ fontSize: "clamp(5rem,18vw,9rem)", color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,0.5)", letterSpacing: "-4px", lineHeight: 1 }}>
                  140
                </span>
                <span className="text-white/55 text-4xl font-light mb-4">€</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white text-center -mt-2 mb-6">offerts</p>
            </Reveal>

            <Reveal dir="up" delay={150}>
              <p className="text-sm sm:text-base text-white/65 text-center leading-relaxed mb-5 max-w-sm mx-auto">
                Pour une 1<sup>re</sup> ouverture d'un compte avec une carte Fosfo CB Mastercard et 5 paiements dans les 90 jours (50 € offerts), complétée d'une mobilité bancaire (+ 90 € offerts).
              </p>
              <button className="flex items-center gap-1.5 text-sm text-white/50 mx-auto mb-5 hover:text-white transition-colors">
                Voir conditions <Info className="w-3.5 h-3.5" />
              </button>
              <div className="text-center mb-8 bg-white/8 rounded-2xl py-4 px-5 border border-white/10">
                <p className="text-sm text-white/60 mb-1">Code opération : <span className="text-white font-bold">FTN0626</span></p>
                <p className="text-sm text-white/50">Valable du 18.05.2026 au 30.06.2026</p>
              </div>
              <Cta className="w-full text-base py-4" />
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5 — Comparer les cartes
        ══════════════════════════════════════════ */}
        <section className="bg-white px-6 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto">
            <Reveal dir="up" className="text-center mb-10">
              <p className="text-gray-200 text-2xl sm:text-3xl font-light">Comparer</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 -mt-1">les cartes</h2>
            </Reveal>

            {/* Card thumbnails — staggered left/right */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-8">
              <Reveal dir="left" delay={0} className="text-center group">
                <p className="font-bold text-gray-800 text-sm sm:text-base mb-1">Fosfo CB Mastercard</p>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">Jouez la carte de la facilité</p>
                <BankCard variant="fosfo" className="mx-auto w-32 sm:w-44 transition-all duration-400 group-hover:scale-105 group-hover:rotate-1" />
                <p className="text-gray-500 text-xs sm:text-sm mt-3">Sans conditions de revenus</p>
              </Reveal>
              <Reveal dir="right" delay={0} className="text-center group">
                <p className="font-bold text-gray-800 text-sm sm:text-base mb-1">Gold CB Mastercard</p>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">Choisissez la carte qui vaut de l'or</p>
                <BankCard variant="gold" className="mx-auto w-32 sm:w-44 transition-all duration-400 group-hover:scale-105 group-hover:-rotate-1" />
                <p className="text-gray-500 text-xs sm:text-sm mt-3">À partir de 2 200 € net/mois</p>
              </Reveal>
            </div>

            <Reveal dir="up" delay={100}>
              <button
                onClick={() => setShowComparatif(!showComparatif)}
                className="w-full border-2 border-gray-200 rounded-full py-3.5 text-sm sm:text-base font-semibold text-gray-600 flex items-center justify-center gap-2 hover:border-[#6DC142] hover:text-[#3a8020] transition-all duration-200 mb-6">
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showComparatif ? "rotate-180" : ""}`} />
                Voir le comparatif
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showComparatif ? "rotate-180" : ""}`} />
              </button>

              <div style={{ maxHeight: showComparatif ? "700px" : "0", overflow: "hidden", transition: "max-height 0.55s cubic-bezier(0.4,0,0.2,1)" }}>
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
              <Cta className="w-full text-base py-4" />
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 6 — Mobilité bancaire 90€
        ══════════════════════════════════════════ */}
        <section className="bg-gray-50 px-6 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto">
            <Reveal dir="zoom">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl mb-10 transition-transform duration-500 hover:scale-[1.015]">
                <MobilityMockup />
              </div>
            </Reveal>

            <div ref={mobilityRef}>
              <Reveal dir="up" delay={80} className="text-center mb-6">
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="font-bold leading-none text-gray-900"
                    style={{ fontFamily: "Georgia, serif", fontSize: "clamp(4rem,15vw,7rem)" }}>
                    {counter90}
                  </span>
                  <span className="text-3xl sm:text-4xl text-gray-400 mb-4">€</span>
                </div>
                <p className="text-gray-600 text-base sm:text-lg">offerts, directement inclus dans votre prime.</p>
              </Reveal>

              <Reveal dir="up" delay={180} className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
                  Demandez votre mobilité bancaire
                </h2>
                <Cta className="w-full sm:w-auto text-base px-10 py-4" />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 7 — Sauter le pas
        ══════════════════════════════════════════ */}
        <section className="px-6 py-14 sm:py-20 overflow-hidden"
          style={{ background: "linear-gradient(180deg, #c8a84b 0%, #b89040 40%, #a07830 70%, #c8a84b 100%)" }}>
          <div className="max-w-lg mx-auto">
            <Reveal dir="up">
              <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4" style={{ fontFamily: "Georgia, serif" }}>
                <span className="text-white/50 font-light block">Sauter le pas n'a jamais</span>
                <span className="text-gray-900">été aussi facile.</span>
              </h2>
              <p className="text-sm sm:text-base text-gray-800/70 text-center leading-relaxed mb-8 max-w-sm mx-auto">
                Jusqu'à 250 € offerts. Cumul de 160 € (Carte Gold) + 90 € (Mobilité bancaire).
              </p>
            </Reveal>

            <Reveal dir="up" delay={120}>
              {/* Toggle */}
              <div className="bg-black/15 rounded-full p-1 flex mb-6 backdrop-blur-sm">
                {(["gold", "fosfo"] as const).map((card) => (
                  <button key={card} onClick={() => setActiveCard(card)}
                    className={`flex-1 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 ${activeCard === card ? "bg-white text-gray-900 shadow-md" : "text-gray-800/70 hover:text-gray-900"}`}>
                    {card === "gold" ? "Carte Gold" : "Carte Fosfo"}
                  </button>
                ))}
              </div>

              {/* Card detail */}
              <div className="rounded-2xl p-5 sm:p-6 mb-8 border border-white/20 transition-all duration-500"
                style={{
                  background: activeCard === "gold" ? "rgba(180,140,50,0.65)" : "rgba(25,65,50,0.85)",
                  backdropFilter: "blur(8px)",
                }}>
                <p className="font-bold text-base sm:text-lg text-white text-center mb-4">
                  {activeCard === "gold"
                    ? "Ouvrez votre compte avec une carte Gold CB Mastercard"
                    : "Ouvrez votre compte avec une carte Fosfo CB Mastercard"}
                </p>
                <BankCard variant={activeCard} className="w-44 sm:w-52 mx-auto mb-5 transition-all duration-500" />
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
              <Cta className="w-full text-base py-4" />
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 8 — Conditions légales
        ══════════════════════════════════════════ */}
        <section className="bg-white px-6 py-10 sm:py-14">
          <Reveal dir="up" className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-600 mb-5 hover:text-gray-900 transition-colors">
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showConditions ? "rotate-180" : ""}`} />
              Conditions de l'offre
            </button>

            <div style={{ maxHeight: showConditions ? "2200px" : "0", overflow: "hidden", transition: "max-height 0.6s cubic-bezier(0.4,0,0.2,1)" }}>
              <div className="space-y-4 text-xs sm:text-sm text-gray-500 leading-relaxed pb-6">
                {[
                  ["1", "Voir détails, limites et conditions dans la notice d'information d'assurance et d'assistance."],
                  ["2", "Hors frais de conversion monétaire et frais éventuels prélevés par l'établissement propriétaire du distributeur."],
                  ["3", "L'accès à ce service est réservé aux clients titulaires d'un compte bancaire associé à l'une des cartes bancaires visées dans les conditions tarifaires en vigueur."],
                  ["4", "Sous réserve d'acceptation de la demande et que le compte de dépôt associé soit ouvert depuis plus de 6 mois."],
                  ["5", "Code secret personnalisable effectif lors d'une souscription sur le site."],
                  ["6", "La Banque Mondiale se réserve la faculté d'octroyer un découvert autorisé dont le montant est de 200 € maximum."],
                  ["7", "Dans la limite des plafonds de la carte bancaire et sous réserve de compatibilité du terminal de paiement."],
                  ["8", "Sous réserve de compatibilité de la banque du destinataire avec le service de virement instantané."],
                  ["9", "Sous réserve d'acceptation de la demande."],
                ].map(([num, text]) => (
                  <p key={num}><span className="text-[#5BAF32] font-bold">({num})</span> {text}</p>
                ))}
                <p>
                  <span className="text-[#5BAF32] font-bold">(10)</span> Du 18 Mai 2026 au 30 Juin 2026 inclus, jusqu'à 250 euros offerts sous réserve des conditions suivantes :
                  <br /><br />— 160 euros offerts pour la 1re ouverture d'un compte avec une carte Gold CB Mastercard suivie de 5 paiements dans un délai de 90 jours.
                  <br /><br />OU<br /><br />— 50 euros offerts pour la 1re ouverture d'un compte avec une carte Fosfo CB Mastercard suivie de 5 paiements dans un délai de 90 jours.
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
          </Reveal>
        </section>
      </main>

      {/* ── Sticky bottom CTA ── */}
      <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="max-w-screen-xl mx-auto">
          <Cta className="w-full sm:w-auto sm:px-12 text-base py-4 sm:mx-auto sm:block" />
        </div>
      </div>
    </div>
  );
}
