import { Link } from "wouter";
import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

function FortuneoLogo() {
  return (
    <div className="flex items-center gap-2">
      <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-8 w-8 object-contain shrink-0" />
      <span
        className="font-black text-[11px] leading-tight tracking-wider uppercase text-[#003087] whitespace-nowrap"
      >
        BANQUE MONDIALE
      </span>
    </div>
  );
}

function OpenAccountBtn({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/register">
      <button
        className={`rounded-full font-semibold text-sm px-5 py-2.5 transition-all ${
          dark
            ? "bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32]"
            : "bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32]"
        } ${className}`}
      >
        Ouvrir un compte
      </button>
    </Link>
  );
}

export default function Landing() {
  const [activeCard, setActiveCard] = useState<"gold" | "fosfo">("gold");
  const [showConditions, setShowConditions] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <FortuneoLogo />
          <OpenAccountBtn />
        </div>
      </header>

      <main className="flex-1 pt-14">

        {/* SECTION 1 — Hero: Votre compte est déjà rentable */}
        <section
          className="relative flex flex-col justify-center px-6 py-12 min-h-[540px]"
          style={{
            background: "linear-gradient(135deg, #2a2a1e 0%, #3d3520 30%, #4a3f28 55%, #2e2a1a 80%, #1a1a12 100%)",
          }}
        >
          {/* Sheen overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(115deg, rgba(255,220,100,0.08) 0%, rgba(255,255,255,0.04) 40%, transparent 60%)",
            }}
          />
          <div className="relative z-10 text-white max-w-sm mx-auto w-full">
            <h1 className="text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "'Georgia', serif" }}>
              Votre compte est déjà rentable.
            </h1>

            <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-1">JUSQU'À</p>
            <div className="flex items-end gap-1 mb-1">
              <span
                className="font-bold leading-none"
                style={{
                  fontSize: "7rem",
                  color: "transparent",
                  WebkitTextStroke: "1.5px rgba(255,255,255,0.55)",
                  letterSpacing: "-4px",
                  lineHeight: 1,
                }}
              >
                250
              </span>
              <span className="text-white/70 text-3xl font-light mb-4">€</span>
            </div>
            <p className="text-3xl font-bold text-white -mt-2 mb-5">offerts</p>

            <p className="text-sm text-white/75 leading-relaxed mb-5">
              pour une 1<sup>re</sup> ouverture de compte avec carte Gold CB Mastercard et 5 paiements en 90 jours (160€), complétée d'une 1<sup>re</sup> mobilité bancaire (+ 90€ offerts)
            </p>

            <button className="flex items-center gap-1.5 text-sm text-white/70 mb-8 hover:text-white transition-colors">
              Voir conditions <Info className="w-4 h-4" />
            </button>

            <OpenAccountBtn className="w-full text-base py-4 text-center block font-bold" />

            <p className="text-[10px] text-white/40 text-center mt-3">
              Valable du 18/05/2026 au 30/06/2026
            </p>
          </div>
        </section>

        {/* SECTION 2 — Gold CB Mastercard Hero */}
        <section
          className="relative flex flex-col justify-end min-h-[500px] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #c8a84b 0%, #a07830 30%, #7a5c20 60%, #4a3810 100%)",
          }}
        >
          <div className="w-full flex items-center justify-center pt-16 pb-6 px-6">
            <div className="relative flex items-end justify-center" style={{ height: "200px", width: "280px" }}>
              <img
                src="/card-gold.jpeg"
                alt="Gold CB Mastercard"
                className="absolute w-52 object-contain drop-shadow-2xl rounded-xl"
                style={{ bottom: 0, left: "50%", transform: "translateX(-50%) rotate(-15deg) translateX(-30px)", zIndex: 1 }}
              />
              <img
                src="/card-gold.jpeg"
                alt="Gold CB Mastercard 2"
                className="absolute w-52 object-contain drop-shadow-2xl rounded-xl"
                style={{ bottom: "20px", left: "50%", transform: "translateX(-50%) rotate(5deg) translateX(20px)", zIndex: 2 }}
              />
            </div>
          </div>
          <div className="relative z-10 text-white text-center px-6 pb-10">
            <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              Gold CB<br />Mastercard
            </h2>
            <p className="text-white/80 text-base mb-8">Choisissez la carte qui vaut de l'or</p>
            <OpenAccountBtn className="w-full text-base py-4 font-bold" />
          </div>
        </section>

        {/* SECTION 3 — Gold Card: 0€/mois + features */}
        <section
          className="px-6 py-10"
          style={{
            background: "linear-gradient(180deg, #4a3810 0%, #6b5530 20%, #8b7040 40%, #a08050 60%, #7a6035 80%, #3a2c18 100%)",
          }}
        >
          <div className="max-w-sm mx-auto text-white">
            <div className="flex items-end gap-1 mb-0">
              <span
                className="font-bold text-[6rem] leading-none"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                0
              </span>
              <span className="text-3xl font-light mb-3">€</span>
            </div>
            <p className="text-white/80 text-lg -mt-1 mb-1">/mois</p>
            <button className="flex items-center gap-1.5 text-sm text-white/60 mb-6 hover:text-white transition-colors">
              Voir conditions <Info className="w-3.5 h-3.5" />
            </button>

            <div className="bg-white/10 rounded-2xl p-5 mb-6">
              <p className="font-bold text-base mb-4 text-center">
                A partir de 2 200 € net de revenus mensuels
              </p>
              <ul className="space-y-3 text-sm text-white/90">
                {[
                  "Une carte à débit immédiat ou différé (dès 6 mois d'ancienneté)",
                  "Des assurances et assistances premium pour les voyages et pour le reste ¹",
                  "Des plafonds de paiement et de retrait étendus",
                  "Paiements et retraits gratuits partout dans le monde ²",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#6DC142] mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <OpenAccountBtn className="w-full text-base py-4 font-bold" />
          </div>
        </section>

        {/* SECTION 4 — Fosfo CB Mastercard */}
        <section
          className="px-6 py-12"
          style={{
            background: "linear-gradient(180deg, #1a3a2e 0%, #1f4535 25%, #234d3c 50%, #1a3a2e 75%, #152e25 100%)",
          }}
        >
          <div className="max-w-sm mx-auto text-white">
            <h2 className="text-4xl font-bold mb-2 text-center" style={{ fontFamily: "'Georgia', serif" }}>
              Fosfo CB<br />Mastercard
            </h2>
            <p className="text-white/70 text-center mb-8">Jouez la carte de la facilité</p>

            <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 text-center mb-1">JUSQU'À</p>
            <div className="flex items-end justify-center gap-1 mb-0">
              <span
                className="font-bold leading-none"
                style={{
                  fontSize: "7rem",
                  color: "transparent",
                  WebkitTextStroke: "1.5px rgba(255,255,255,0.50)",
                  letterSpacing: "-4px",
                  lineHeight: 1,
                }}
              >
                140
              </span>
              <span className="text-white/60 text-3xl font-light mb-4">€</span>
            </div>
            <p className="text-3xl font-bold text-white text-center -mt-2 mb-5">offerts</p>

            <p className="text-sm text-white/70 text-center leading-relaxed mb-5">
              pour une 1<sup>re</sup> ouverture d'un compte avec une carte Fosfo CB Mastercard et 5 paiements dans les 90 jours (50 € offerts), complétée d'une 1<sup>re</sup> mobilité bancaire (+ 90 € offerts).
            </p>

            <button className="flex items-center gap-1.5 text-sm text-white/60 mx-auto mb-4 hover:text-white transition-colors">
              Voir conditions <Info className="w-3.5 h-3.5" />
            </button>

            <div className="text-center mb-8">
              <p className="text-sm text-white/60">Avec le code opération : <span className="text-white font-semibold">FTN0626</span></p>
              <p className="text-sm text-white/60">Valable du 18.05.2026 au 30.06.2026</p>
            </div>

            <OpenAccountBtn className="w-full text-base py-4 font-bold" />
          </div>
        </section>

        {/* SECTION 5 — Comparer les cartes */}
        <section className="bg-white px-6 py-12">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-8">
              <p className="text-gray-400 text-2xl font-light">Comparer</p>
              <h2 className="text-3xl font-bold text-gray-900">les cartes</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-sm mb-1">Fosfo CB Mastercard</p>
                <p className="text-gray-400 text-xs mb-3">Jouez la carte de la facilité</p>
                <div className="rounded-xl overflow-hidden shadow-md mx-auto w-32">
                  <img src="/card-fosfo.jpeg" alt="Fosfo CB Mastercard" className="w-full object-cover" />
                </div>
                <p className="text-gray-600 text-xs mt-3">Sans conditions de revenus</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-sm mb-1">Gold CB Mastercard</p>
                <p className="text-gray-400 text-xs mb-3">Choisissez la carte qui vaut de l'or</p>
                <div className="rounded-xl overflow-hidden shadow-md mx-auto w-32">
                  <img src="/card-gold.jpeg" alt="Gold CB Mastercard" className="w-full object-cover" />
                </div>
                <p className="text-gray-600 text-xs mt-3">A partir de 2 200 € net de revenus mensuels</p>
              </div>
            </div>

            <button className="w-full border border-gray-300 rounded-full py-3.5 text-sm font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors mb-8">
              <ChevronDown className="w-4 h-4" /> Voir le comparatif <ChevronDown className="w-4 h-4" />
            </button>

            <OpenAccountBtn className="w-full text-base py-4 font-bold" />
          </div>
        </section>

        {/* SECTION 6 — Mobilité bancaire 90€ */}
        <section className="bg-gray-50 px-6 py-12">
          <div className="max-w-sm mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
              <img src="/mobility-iban.jpeg" alt="Mobilité bancaire" className="w-full object-cover" />
            </div>

            <div className="text-center mb-6">
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-[5rem] font-bold leading-none text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
                  90
                </span>
                <span className="text-3xl text-gray-500 mb-3">€</span>
              </div>
              <p className="text-gray-600 text-base">offerts, directement inclus dans votre prime.</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Demandez votre mobilité bancaire
            </h2>

            <OpenAccountBtn className="w-full text-base py-4 font-bold" />

            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              Pour vos opérations récurrentes (prélèvements loyer, internet, impôts…) et virements récurrents chez Fortuneo.
            </p>
          </div>
        </section>

        {/* SECTION 7 — Sauter le pas */}
        <section
          className="px-6 py-12"
          style={{
            background: "linear-gradient(180deg, #c8a84b 0%, #b89040 30%, #a07830 60%, #c8a84b 100%)",
          }}
        >
          <div className="max-w-sm mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4" style={{ fontFamily: "'Georgia', serif" }}>
              <span className="text-white/60 font-light">Sauter le pas n'a jamais</span>
              <br />
              <span className="text-gray-900">été aussi facile.</span>
            </h2>

            <p className="text-sm text-gray-800/80 text-center leading-relaxed mb-6">
              Jusqu'à 250 € offerts pour ouverture de compte avec une carte Gold Mastercard.
              <br />
              Cumul de 160 € (Carte Gold) + 90 € (Mobilité bancaire).
            </p>

            {/* Toggle Carte Gold / Carte Fosfo */}
            <div className="bg-white/20 rounded-full p-1 flex mb-6">
              <button
                onClick={() => setActiveCard("gold")}
                className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                  activeCard === "gold"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-800/70"
                }`}
              >
                Carte Gold
              </button>
              <button
                onClick={() => setActiveCard("fosfo")}
                className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                  activeCard === "fosfo"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-800/70"
                }`}
              >
                Carte Fosfo
              </button>
            </div>

            {/* Card detail box */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: activeCard === "gold"
                  ? "rgba(190,150,60,0.7)"
                  : "rgba(30,70,55,0.85)",
              }}
            >
              {activeCard === "gold" ? (
                <div className="text-white">
                  <p className="font-bold text-base text-center mb-3">
                    Ouvrez votre compte bancaire avec une carte Gold CB Mastercard
                  </p>
                  <img src="/card-gold.jpeg" alt="Gold" className="w-40 rounded-xl mx-auto mb-4 shadow-lg" />
                  <ul className="space-y-2 text-sm text-white/90">
                    <li className="flex items-start gap-2"><span className="text-[#6DC142]">•</span> 160 € offerts pour 5 paiements en 90 jours</li>
                    <li className="flex items-start gap-2"><span className="text-[#6DC142]">•</span> + 90 € offerts pour mobilité bancaire</li>
                    <li className="flex items-start gap-2"><span className="text-[#6DC142]">•</span> À partir de 2 200 € net/mois</li>
                  </ul>
                </div>
              ) : (
                <div className="text-white">
                  <p className="font-bold text-base text-center mb-3">
                    Ouvrez votre compte bancaire avec une carte Fosfo CB Mastercard
                  </p>
                  <img src="/card-fosfo.jpeg" alt="Fosfo" className="w-40 rounded-xl mx-auto mb-4 shadow-lg" />
                  <ul className="space-y-2 text-sm text-white/90">
                    <li className="flex items-start gap-2"><span className="text-[#6DC142]">•</span> 50 € offerts pour 5 paiements en 90 jours</li>
                    <li className="flex items-start gap-2"><span className="text-[#6DC142]">•</span> + 90 € offerts pour mobilité bancaire</li>
                    <li className="flex items-start gap-2"><span className="text-[#6DC142]">•</span> Sans conditions de revenus</li>
                  </ul>
                </div>
              )}
            </div>

            <OpenAccountBtn className="w-full text-base py-4 font-bold" />
          </div>
        </section>

        {/* SECTION 8 — Conditions légales */}
        <section className="bg-white px-6 py-10">
          <div className="max-w-sm mx-auto">
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4 hover:text-gray-900 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showConditions ? "rotate-180" : ""}`} />
              Conditions de l'offre
            </button>

            {showConditions && (
              <div className="space-y-4 text-xs text-gray-500 leading-relaxed">
                <p><span className="text-[#5BAF32] font-semibold">(1)</span> Voir détails, limites et conditions dans la notice d'information d'assurance et d'assistance.</p>
                <p><span className="text-[#5BAF32] font-semibold">(2)</span> Hors frais de conversion monétaire et frais éventuels prélevés par l'établissement propriétaire du distributeur.</p>
                <p><span className="text-[#5BAF32] font-semibold">(3)</span> L'accès à ce service est réservé aux clients titulaires d'un compte bancaire associé à l'une des cartes bancaires visées dans les conditions tarifaires en vigueur.</p>
                <p><span className="text-[#5BAF32] font-semibold">(4)</span> Sous réserve d'acceptation de la demande et que le compte de dépôt associé soit ouvert depuis plus de 6 mois.</p>
                <p><span className="text-[#5BAF32] font-semibold">(5)</span> Code secret personnalisable effectif lors d'une souscription sur le site.</p>
                <p><span className="text-[#5BAF32] font-semibold">(6)</span> Fortuneo se réserve la faculté, pour les clients détenteurs d'une carte bancaire, d'octroyer un découvert autorisé dont le montant est de 200 € maximum.</p>
                <p><span className="text-[#5BAF32] font-semibold">(7)</span> Dans la limite des plafonds de la carte bancaire et sous réserve de compatibilité du terminal de paiement.</p>
                <p><span className="text-[#5BAF32] font-semibold">(8)</span> Sous réserve de compatibilité de la banque du destinataire avec le service de virement instantané et dans la limite de vos plafonds de virement.</p>
                <p><span className="text-[#5BAF32] font-semibold">(9)</span> Sous réserve d'acceptation de la demande.</p>
                <p>
                  <span className="text-[#5BAF32] font-semibold">(10)</span> Du 18 Mai 2026 au 30 Juin 2026 inclus, jusqu'à 250 euros offerts par Fortuneo sous réserve de satisfaire aux conditions suivantes :
                  <br /><br />
                  - 160 euros offerts pour la première ouverture d'un compte avec une carte Gold CB Mastercard suivie de 5 paiements dans un délai de 90 jours maximum.
                  <br /><br />
                  OU
                  <br /><br />
                  - 50 euros offerts pour la première ouverture d'un compte avec une carte Fosfo CB Mastercard suivie de 5 paiements dans un délai de 90 jours maximum.
                  <br /><br />
                  ET
                  <br /><br />
                  - 90 euros offerts pour toute première utilisation du service d'aide à la mobilité bancaire neoChange.
                  <br /><br />
                  Offres réservées aux personnes physiques majeures, hors salariés, n'ayant jamais été détentrices de compte chez Fortuneo. Code opération : "FTN0626". Dossier complet à recevoir au plus tard le 14/07/2026.
                </p>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-10 w-10 mx-auto mb-3 opacity-60" />
              <p className="text-xs text-gray-400">
                Banque Mondiale. Établissement de crédit agréé. Siège social : Paris, France.
              </p>
            </div>
          </div>
        </section>

        {/* Sticky bottom CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 shadow-lg">
          <div className="max-w-sm mx-auto">
            <OpenAccountBtn className="w-full text-base py-4 font-bold" />
          </div>
        </div>
      </main>
    </div>
  );
}
