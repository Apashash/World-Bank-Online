import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ChevronLeft, ChevronRight, Gift, Globe, CreditCard, Shield } from "lucide-react";
import BankCard from "@/components/BankCard";

const OFFERS = [
  {
    id: "fosfo",
    variant: "fosfo" as const,
    name: "Fosfo CB Mastercard",
    price: "Gratuit",
    priceNote: "sans conditions de revenus",
    bonus: "Jusqu'à 50 € offerts",
    bonusNote: "dont 5% de cashback pendant 3 mois",
    tag: null,
    perks: [
      { icon: <Globe className="w-5 h-5 text-[#003087]" />, label: "Paiements partout dans le monde", sub: "Gratuits" },
      { icon: <CreditCard className="w-5 h-5 text-[#003087]" />, label: "Retraits gratuits en devises à l'étranger", sub: "Jusqu'à 3/an" },
      { icon: <CreditCard className="w-5 h-5 text-[#003087]" />, label: "Retraits en euros", sub: "Gratuits" },
      { icon: <Shield className="w-5 h-5 text-[#003087]" />, label: "Plafond de paiements", sub: "1 500 € sur 30 jours" },
    ],
  },
  {
    id: "gold",
    variant: "gold" as const,
    name: "Gold CB Mastercard",
    price: "Gratuit",
    priceNote: "à partir de 2 200 € net/mois",
    bonus: "Jusqu'à 160 € offerts",
    bonusNote: "dont 5% de cashback pendant 3 mois",
    tag: "Spécial voyageur",
    perks: [
      { icon: <Globe className="w-5 h-5 text-[#003087]" />, label: "Paiements partout dans le monde", sub: "Gratuits" },
      { icon: <CreditCard className="w-5 h-5 text-[#003087]" />, label: "Retraits gratuits en devises à l'étranger", sub: "Illimités" },
      { icon: <CreditCard className="w-5 h-5 text-[#003087]" />, label: "Retraits en euros", sub: "Gratuits" },
      { icon: <Shield className="w-5 h-5 text-[#003087]" />, label: "Assurances voyages premium", sub: "Incluses" },
      { icon: <Shield className="w-5 h-5 text-[#003087]" />, label: "Plafond de paiements", sub: "5 000 € sur 30 jours" },
    ],
  },
];

export default function OpenAccountOffer() {
  const [active, setActive] = useState(0);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const type = params.get("type") ?? "individual";

  const offer = OFFERS[active];
  const prev = () => setActive(i => Math.max(0, i - 1));
  const next = () => setActive(i => Math.min(OFFERS.length - 1, i + 1));

  const handleChoose = () => {
    setLocation(`/open-account/steps?type=${type}&card=${offer.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
      <style>{`
        @keyframes fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fade-in 0.3s ease both; }
      `}</style>

      {/* Minimal header — logo only */}
      <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-8 w-8 object-contain" />
        <span className="font-black text-[13px] tracking-wider uppercase text-[#003087]">BANQUE MONDIALE</span>
      </header>

      <main className="flex-1 flex flex-col pb-32">
        {/* Title */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Choisissez l'offre qui vous correspond</h1>
        </div>

        {/* Card carousel */}
        <div className="relative flex items-center justify-center py-4 overflow-hidden" style={{ minHeight: 220 }}>
          <div className="flex items-center gap-3 w-full px-4" style={{ maxWidth: 480 }}>
            {/* Previous card (faded) */}
            {active > 0 ? (
              <button onClick={prev} className="shrink-0 opacity-50 hover:opacity-70 transition-opacity" style={{ width: "28%" }}>
                <BankCard variant={OFFERS[active - 1].variant} className="w-full" />
              </button>
            ) : (
              <div className="shrink-0" style={{ width: "28%" }} />
            )}

            {/* Active card */}
            <div className="flex-1 fade-in" key={active}>
              <BankCard variant={offer.variant} className="w-full" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.25)" }} />
            </div>

            {/* Next card (faded) */}
            {active < OFFERS.length - 1 ? (
              <button onClick={next} className="shrink-0 opacity-50 hover:opacity-70 transition-opacity" style={{ width: "28%" }}>
                <BankCard variant={OFFERS[active + 1].variant} className="w-full" />
              </button>
            ) : (
              <div className="shrink-0" style={{ width: "28%" }} />
            )}
          </div>
        </div>

        {/* Navigation dots + arrows */}
        <div className="flex items-center justify-center gap-5 py-3">
          <button
            onClick={prev}
            disabled={active === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ background: active === 0 ? "#e5e5e0" : "#6DC142" }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: active === 0 ? "#aaa" : "#1a2e10" }} />
          </button>
          <div className="flex items-center gap-2">
            {OFFERS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="rounded-full transition-all duration-200"
                style={{ width: i === active ? 10 : 8, height: i === active ? 10 : 8, background: i === active ? "#003087" : "#ccc" }}
              />
            ))}
          </div>
          <button
            onClick={next}
            disabled={active === OFFERS.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ background: active === OFFERS.length - 1 ? "#e5e5e0" : "#6DC142" }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: active === OFFERS.length - 1 ? "#aaa" : "#1a2e10" }} />
          </button>
        </div>

        {/* Special tag */}
        {offer.tag && (
          <div className="flex justify-center mb-2">
            <span className="inline-flex items-center gap-1.5 bg-[#003087] text-white text-xs font-bold px-4 py-1.5 rounded-full">
              ✈ {offer.tag}
            </span>
          </div>
        )}

        {/* Offer details card */}
        <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden fade-in" key={`detail-${active}`}>
          {/* Offer header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-base font-bold text-gray-900">{offer.name}</span>
              </div>
              <span className="text-sm text-gray-500">{offer.price} <span className="text-gray-400 text-xs">— {offer.priceNote}</span></span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

          {/* Bonus highlight */}
          <div className="mx-4 mt-4 mb-2 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(109,193,66,0.12)" }}>
            <Gift className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#5BAF32" }} />
            <p className="text-sm text-gray-900">
              <strong>{offer.bonus}</strong> dont <strong>5% de cashback</strong> pendant 3 mois<sup>1</sup>
            </p>
          </div>

          {/* Perks list */}
          <ul className="px-4 py-3 space-y-0 divide-y divide-gray-50">
            {offer.perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-4 py-3.5">
                <div className="shrink-0 w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
                  {perk.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{perk.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6DC142", fontWeight: 600 }}>{perk.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#f5f5f0] px-5 py-4 space-y-3 border-t border-gray-200">
        <button
          onClick={handleChoose}
          className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] transition-all duration-200"
        >
          Choisir {offer.name.split(" ")[0]}
        </button>
        <button
          onClick={() => setLocation(`/open-account`)}
          className="w-full rounded-full font-bold text-base py-4 border-2 border-gray-200 text-gray-700 hover:border-[#003087] hover:text-[#003087] active:scale-[0.98] transition-all duration-200 bg-white"
        >
          Retour
        </button>
      </div>
    </div>
  );
}
