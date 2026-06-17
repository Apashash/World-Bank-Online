import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return scrolled;
}

function IndividualIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="16" r="9" fill="#003087" />
      <ellipse cx="22" cy="36" rx="13" ry="8" fill="#6DC142" />
    </svg>
  );
}

function JointIcon() {
  return (
    <svg width="52" height="44" viewBox="0 0 52 44" fill="none" aria-hidden="true">
      <circle cx="17" cy="16" r="9" fill="#003087" />
      <circle cx="33" cy="16" r="9" fill="#003087" opacity="0.6" />
      <ellipse cx="20" cy="37" rx="15" ry="8" fill="#6DC142" />
    </svg>
  );
}

const ACCOUNT_TYPES = [
  {
    id: "individual",
    icon: <IndividualIcon />,
    title: "Compte individuel",
    description: "Vous êtes l'unique titulaire de ce compte.",
  },
  {
    id: "joint",
    icon: <JointIcon />,
    title: "Compte joint",
    description: "Vous êtes deux titulaires du compte.",
  },
];

export default function AccountTypeSelect() {
  const [selected, setSelected] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const scrolled = useScrolled();

  const handleNext = () => {
    if (!selected) return;
    setLocation(`/register?type=${selected}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .anim-up   { animation: slide-up 0.55s ease both; }
        .anim-up-2 { animation: slide-up 0.55s ease 0.1s both; }
        .anim-up-3 { animation: slide-up 0.55s ease 0.2s both; }
        @keyframes cta-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(109,193,66,0.4); } 50% { box-shadow:0 0 0 10px rgba(109,193,66,0); } }
        .cta-active { animation: cta-pulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,1)",
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.08)" : "0 1px 0 rgba(0,0,0,0.06)",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
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
          <Link href="/login">
            <button className="rounded-full font-semibold text-sm px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white active:scale-95 transition-all duration-200">
              Se connecter
            </button>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col pt-14 sm:pt-16">
        {/* Top accent band */}
        <div className="w-full h-1.5" style={{ background: "linear-gradient(90deg, #003087 0%, #6DC142 100%)" }} />

        <div className="flex-1 flex flex-col items-center justify-start px-5 py-10 sm:py-16 bg-gray-50">
          <div className="w-full max-w-sm sm:max-w-md">

            {/* Back link */}
            <div className="anim-up mb-8">
              <Link href="/">
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] transition-colors group">
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Retour à l'accueil
                </button>
              </Link>
            </div>

            {/* Title */}
            <div className="anim-up-2 mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#003087] leading-snug">
                Quel type de compte souhaitez-vous ouvrir&nbsp;?
              </h1>
            </div>

            {/* Options card */}
            <div className="anim-up-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {ACCOUNT_TYPES.map((type, idx) => (
                  <button
                    key={type.id}
                    onClick={() => setSelected(type.id)}
                    className={[
                      "w-full flex items-center gap-4 px-5 py-5 text-left transition-all duration-200 group",
                      idx < ACCOUNT_TYPES.length - 1 ? "border-b border-gray-100" : "",
                      selected === type.id
                        ? "bg-[#003087]/5 ring-inset ring-2 ring-[#003087]"
                        : "hover:bg-gray-50",
                    ].join(" ")}
                    type="button"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-12 flex items-center justify-center">
                      {type.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <p className={`font-bold text-base transition-colors duration-200 ${selected === type.id ? "text-[#003087]" : "text-gray-900"}`}>
                        {type.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
                    </div>

                    {/* Radio dot */}
                    <div className={[
                      "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      selected === type.id
                        ? "border-[#003087] bg-[#003087]"
                        : "border-gray-300 group-hover:border-[#003087]/50",
                    ].join(" ")}>
                      {selected === type.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Suivant */}
              <button
                onClick={handleNext}
                disabled={!selected}
                className={[
                  "w-full rounded-full font-bold text-base py-4 transition-all duration-200 mb-3",
                  selected
                    ? "cta-active bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] shadow-sm hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                ].join(" ")}
                type="button"
              >
                Suivant
              </button>

              {/* Retour */}
              <Link href="/">
                <button
                  className="w-full rounded-full font-bold text-base py-4 border-2 border-gray-200 text-gray-700 hover:border-[#003087] hover:text-[#003087] active:scale-[0.98] transition-all duration-200 bg-white"
                  type="button"
                >
                  Retour
                </button>
              </Link>
            </div>

            {/* Trust line */}
            <p className="text-xs text-gray-400 text-center mt-8 leading-relaxed">
              Vos données sont protégées conformément à la réglementation en vigueur.<br />
              Banque Mondiale — Établissement de crédit agréé.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
