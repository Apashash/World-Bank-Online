import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";

function getSteps(isJoint: boolean) {
  return [
    {
      num: "Étape 1",
      title: "Vérification de votre identité",
      description: isJoint
        ? "Préparez votre pièce d'identité et celle de votre co-titulaire en cours de validité (carte d'identité/passeport zone euro, permis de conduire ou titre de séjour français).\nNous les vérifions à distance."
        : "Préparez votre pièce d'identité en cours de validité (carte d'identité/passeport zone euro, permis de conduire ou titre de séjour français).\nNous la vérifions à distance.",
    },
    {
      num: "Étape 2",
      title: "Vos informations personnelles",
      description: null,
    },
    {
      num: "Étape 3",
      title: "Vos options et services",
      description: null,
    },
    {
      num: "Étape 4",
      title: "Signature de votre contrat",
      description: null,
    },
  ];
}

export default function OpenAccountSteps() {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const type = params.get("type") ?? "individual";
  const card = params.get("card") ?? "fosfo";

  const isJoint = type === "joint";
  const steps = getSteps(isJoint);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-8 w-8 object-contain" />
        <span className="font-black text-[13px] tracking-wider uppercase text-[#003087]">BANQUE MONDIALE</span>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-7 pb-36">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 px-1">Votre compte en 4 étapes</h1>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => step.description ? setExpanded(expanded === idx ? null : idx) : undefined}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-5 text-left transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2"
                    style={{ background: "rgba(109,193,66,0.18)", color: "#3d8020" }}>
                    {step.num}
                  </span>
                  <h2 className="text-base font-bold text-gray-900">{step.title}</h2>
                </div>
                {step.description && (
                  expanded === idx
                    ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-3" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-3" />
                )}
              </div>
              {step.description && expanded === idx && (
                <p className="text-sm text-gray-500 mt-3 leading-relaxed whitespace-pre-line">
                  {step.description}
                </p>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#f5f5f0] px-5 py-4 space-y-3 border-t border-gray-200">
        <button
          onClick={() => setLocation(`/register?type=${type}&card=${card}`)}
          className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] transition-all duration-200"
        >
          Commencer
        </button>
        <button
          onClick={() => setLocation(`/open-account/offer?type=${type}`)}
          className="w-full rounded-full font-bold text-base py-4 border-2 border-gray-200 text-gray-700 hover:border-[#003087] hover:text-[#003087] active:scale-[0.98] transition-all duration-200 bg-white"
        >
          Retour
        </button>
      </div>
    </div>
  );
}
