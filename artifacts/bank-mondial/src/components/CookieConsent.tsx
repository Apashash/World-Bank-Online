import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "bm_cookie_consent";

type ConsentState = {
  accepted: boolean;
  analytics: boolean;
  personalisation: boolean;
  advertising: boolean;
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ background: on ? "#6DC142" : "#d1d5db" }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: on ? "translateX(24px)" : "translateX(0)" }}
      />
    </button>
  );
}

type Panel = "main" | "settings";

export default function CookieConsent({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void } = {}) {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState<Panel>("main");
  const [prefs, setPrefs] = useState<ConsentState>({
    accepted: false,
    analytics: false,
    personalisation: false,
    advertising: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (forceOpen) { setVisible(true); setPanel("main"); }
  }, [forceOpen]);

  function acceptAll() {
    const consent: ConsentState = { accepted: true, analytics: true, personalisation: true, advertising: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
    onClose?.();
  }

  function continueWithout() {
    const consent: ConsentState = { accepted: false, analytics: false, personalisation: false, advertising: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
    onClose?.();
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, accepted: true }));
    setVisible(false);
    onClose?.();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90svh", display: "flex", flexDirection: "column" }}
      >
        {panel === "main" ? (
          <>
            {/* Main consent panel */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
              <div className="flex justify-end mb-2">
                <button
                  onClick={continueWithout}
                  className="text-sm underline underline-offset-2 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Continuer sans accepter
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Nous respectons votre vie privée
              </h2>

              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Banque Mondiale et ses{" "}
                <button className="text-[#6DC142] underline underline-offset-2 font-medium">partenaires</button>{" "}
                utilisent des cookies et technologies similaires pour assurer le bon fonctionnement du site, détecter et corriger des bugs, personnaliser votre expérience de navigation sur le site, réaliser des statistiques et des études d'audience ou d'usage et présenter des publicités personnalisées.
              </p>

              <p className="text-sm text-gray-700 leading-relaxed">
                Pour en savoir plus, rendez-vous sur notre{" "}
                <button className="text-[#6DC142] underline underline-offset-2 font-medium">politique de gestion de cookies</button>.
                <br />
                Vous pouvez modifier votre choix à tout moment depuis le lien{" "}
                <button className="text-[#6DC142] underline underline-offset-2 font-medium">Paramétrer les Cookies</button>{" "}
                situé en bas de page du site.
              </p>
            </div>

            <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
              <button
                onClick={acceptAll}
                className="w-full rounded-full py-3.5 font-semibold text-[#0a1a04] text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#6DC142" }}
              >
                Accepter
              </button>
              <button
                onClick={() => setPanel("settings")}
                className="w-full rounded-full py-3.5 font-semibold text-gray-700 text-base border border-gray-200 bg-gray-100 hover:bg-gray-200 transition-all duration-200 active:scale-[0.98]"
              >
                Paramétrer les cookies
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Settings panel */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
              <div className="flex items-start justify-between mb-5">
                <h2 className="text-3xl font-bold text-gray-900 leading-tight pr-4">
                  Paramétrer les cookies
                </h2>
                <button
                  onClick={() => setPanel("main")}
                  className="text-gray-400 hover:text-gray-600 transition-colors mt-1 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Nous utilisons des cookies et des technologies similaires pour faire fonctionner le site internet de Banque Mondiale (cookies/technologies nécessaires), pour faire des études statistiques et des mesures d'audience (cookies/technologies statistiques), pour personnaliser votre navigation (cookies/technologies personnalisation) et pour vous présenter des publicités personnalisées (cookies/technologies publicitaires). Vous pouvez manifester votre consentement ou votre refus aux différentes technologies en fonction de leur finalité en utilisant les curseurs ci-dessous.
              </p>

              <h3 className="text-lg font-bold text-gray-900 mb-4">Cookies</h3>

              <div className="space-y-5">
                {/* Nécessaires — always on */}
                <div className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-gray-800">Nécessaires</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full" style={{ background: "#6DC142" }}>On</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ces cookies/technologies similaires sont utilisés pour assurer le bon fonctionnement du site internet. Ils ne peuvent pas être désactivés.
                  </p>
                </div>

                {/* Analytics */}
                <div className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-gray-800">Statistiques & Audience</span>
                    <Toggle on={prefs.analytics} onChange={v => setPrefs(p => ({ ...p, analytics: v }))} />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ces cookies nous permettent de mesurer l'audience et d'améliorer nos services.
                  </p>
                </div>

                {/* Personalisation */}
                <div className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-gray-800">Personnalisation</span>
                    <Toggle on={prefs.personalisation} onChange={v => setPrefs(p => ({ ...p, personalisation: v }))} />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ces cookies permettent de personnaliser votre expérience de navigation sur le site.
                  </p>
                </div>

                {/* Advertising */}
                <div className="pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-gray-800">Publicités personnalisées</span>
                    <Toggle on={prefs.advertising} onChange={v => setPrefs(p => ({ ...p, advertising: v }))} />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ces cookies permettent de vous présenter des publicités adaptées à vos centres d'intérêt.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              <button
                onClick={saveSettings}
                className="w-full sm:w-auto float-right rounded-full py-3 px-8 font-semibold text-[#0a1a04] text-base transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#6DC142" }}
              >
                Enregistrer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
