import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

/* ─── Types ─── */
interface FormData {
  email: string;
  civilite: "Madame" | "Monsieur" | "";
  prenom: string;
  nomNaissance: string;
  nomUsage: string;
  indicatif: string;
  phone: string;
  codePostal: string;
  certifie: boolean;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

const INDICATIFS = [
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+352", label: "🇱🇺 +352" },
  { code: "+212", label: "🇲🇦 +212" },
  { code: "+216", label: "🇹🇳 +216" },
  { code: "+213", label: "🇩🇿 +213" },
  { code: "+225", label: "🇨🇮 +225" },
  { code: "+221", label: "🇸🇳 +221" },
  { code: "+1", label: "🇺🇸 +1" },
];

/* ─── Step meta ─── */
const ETAPES = [
  { etape: 1, total: 5, label: "Votre identité" },      // screens 0,1,2
  { etape: 2, total: 5, label: "Votre identité" },      // screen 1
  { etape: 2, total: 5, label: "Vos coordonnées" },     // screen 2
  { etape: 3, total: 5, label: "Mot de passe" },        // screen 3
  { etape: 4, total: 5, label: "Code opération" },      // screen 4
];

/* ─── Shared field styles ─── */
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all";

/* ─── Reusable components ─── */
function StepHeader({ screen }: { screen: number }) {
  const meta = ETAPES[Math.min(screen, ETAPES.length - 1)];
  const progress = ((meta.etape - 1) / meta.total) * 100 + (screen % 3) * (100 / meta.total / 3);
  return (
    <div className="bg-white border-b border-gray-100 px-5 pt-4 pb-0">
      <div className="flex items-center gap-3 mb-3">
        <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-7 w-7 object-contain" />
        <span className="font-black text-[13px] tracking-wider uppercase text-[#003087]">BANQUE MONDIALE</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        Étape {meta.etape}/{meta.total} – <strong className="text-gray-800">{meta.label}</strong>
      </p>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(8, progress)}%`, background: "#6DC142" }}
        />
      </div>
    </div>
  );
}

function FieldBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <p className="text-xs text-gray-400">
        <span className="text-red-500">*</span> : informations obligatoires
      </p>
      {children}
    </div>
  );
}

function NavButtons({
  onNext, onBack, nextLabel = "Suivant", nextDisabled = false, loading = false,
}: {
  onNext: () => void; onBack: () => void; nextLabel?: string;
  nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#f5f5f0] px-5 py-4 space-y-3 border-t border-gray-200">
      <button
        onClick={onNext}
        disabled={nextDisabled || loading}
        className={[
          "w-full rounded-full font-bold text-base py-4 transition-all duration-200",
          nextDisabled || loading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98]",
        ].join(" ")}
      >
        {loading ? "Création en cours…" : nextLabel}
      </button>
      <button
        onClick={onBack}
        className="w-full rounded-full font-bold text-base py-4 border-2 border-gray-200 text-gray-700 hover:border-[#003087] hover:text-[#003087] active:scale-[0.98] transition-all duration-200 bg-white"
      >
        Retour
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function Register() {
  const [screen, setScreen] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showIndicatif, setShowIndicatif] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    civilite: "",
    prenom: "",
    nomNaissance: "",
    nomUsage: "",
    indicatif: "+33",
    phone: "",
    codePostal: "",
    certifie: false,
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const type = params.get("type") ?? "individual";
  const card = params.get("card") ?? "fosfo";

  const { toast } = useToast();
  const registerMutation = useRegister();

  const set = (key: keyof FormData, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const goBack = () => {
    if (screen === 0) {
      setLocation(`/open-account/steps?type=${type}&card=${card}`);
    } else {
      setScreen(s => s - 1);
    }
  };

  /* ── SUBMIT ── */
  const handleSubmit = () => {
    const fullName = [
      formData.civilite,
      formData.prenom,
      formData.nomNaissance,
    ].filter(Boolean).join(" ");

    registerMutation.mutate(
      {
        data: {
          fullName,
          email: formData.email,
          phone: formData.indicatif + formData.phone,
          country: formData.codePostal.startsWith("97") ? "DOM" : "FR",
          password: formData.password,
          referralCode: formData.referralCode || undefined,
        },
      },
      {
        onSuccess: (res: any) => {
          localStorage.setItem("auth_token", res.token);
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({
            title: "Erreur d'inscription",
            description: err.message || "Une erreur est survenue",
            variant: "destructive",
          });
        },
      }
    );
  };

  /* ─────────────────────────
     SCREEN 0 — Email
  ───────────────────────── */
  if (screen === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen={0} />
        <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Saisissez votre adresse email</h2>
          <FieldBlock>
            <input
              type="email"
              placeholder="Votre adresse e-mail *"
              value={formData.email}
              onChange={e => set("email", e.target.value)}
              className={inputCls}
              autoComplete="email"
            />
            <p className="text-xs text-gray-400 px-1">
              Votre email sera utilisé exclusivement pour le suivi de votre dossier
            </p>
          </FieldBlock>
        </main>
        <NavButtons
          onNext={() => setScreen(1)}
          onBack={goBack}
          nextDisabled={!formData.email.includes("@")}
        />
      </div>
    );
  }

  /* ─────────────────────────
     SCREEN 1 — Identité
  ───────────────────────── */
  if (screen === 1) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen={1} />
        <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Votre identité</h2>
          <FieldBlock>
            {/* Civilité */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Civilité <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["Madame", "Monsieur"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => set("civilite", c)}
                    className={[
                      "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-150",
                      formData.civilite === c
                        ? "border-[#003087] bg-[#003087]/5 text-[#003087]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <div className={[
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      formData.civilite === c ? "border-[#003087]" : "border-gray-300",
                    ].join(" ")}>
                      {formData.civilite === c && <div className="w-2 h-2 rounded-full bg-[#003087]" />}
                    </div>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Prénom */}
            <input
              type="text"
              placeholder="Prénom *"
              value={formData.prenom}
              onChange={e => set("prenom", e.target.value)}
              className={inputCls}
              autoComplete="given-name"
            />

            {/* Nom de naissance */}
            <div>
              <input
                type="text"
                placeholder="Nom de naissance *"
                value={formData.nomNaissance}
                onChange={e => set("nomNaissance", e.target.value)}
                className={inputCls}
                autoComplete="family-name"
              />
              <p className="text-xs text-gray-400 mt-1.5 px-1">Nom indiqué sur votre pièce d'identité.</p>
            </div>

            {/* Nom marital */}
            <input
              type="text"
              placeholder="Nom marital ou d'usage"
              value={formData.nomUsage}
              onChange={e => set("nomUsage", e.target.value)}
              className={inputCls}
              autoComplete="additional-name"
            />
          </FieldBlock>
        </main>
        <NavButtons
          onNext={() => setScreen(2)}
          onBack={goBack}
          nextDisabled={!formData.civilite || !formData.prenom || !formData.nomNaissance}
        />
      </div>
    );
  }

  /* ─────────────────────────
     SCREEN 2 — Contact
  ───────────────────────── */
  if (screen === 2) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen={2} />
        <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Vos modes de contact</h2>
          <FieldBlock>
            {/* Email (prefilled) */}
            <div>
              <input
                type="email"
                placeholder="E-mail *"
                value={formData.email}
                onChange={e => set("email", e.target.value)}
                className={inputCls}
                autoComplete="email"
              />
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                Cet email vous servira pour le suivi de votre demande et la gestion de votre compte.
              </p>
            </div>

            {/* Phone with indicatif */}
            <div>
              <div className="flex gap-2">
                {/* Indicatif dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowIndicatif(o => !o)}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-3.5 text-sm text-gray-700 hover:border-gray-300 transition-all min-w-[88px]"
                  >
                    <span className="text-xs font-medium">Indicatif</span>
                    <span className="text-xs text-gray-500">{formData.indicatif}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </button>
                  {showIndicatif && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden min-w-[140px]">
                      {INDICATIFS.map(ind => (
                        <button
                          key={ind.code}
                          type="button"
                          onClick={() => { set("indicatif", ind.code); setShowIndicatif(false); }}
                          className={[
                            "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors",
                            formData.indicatif === ind.code ? "text-[#003087] font-semibold" : "text-gray-700",
                          ].join(" ")}
                        >
                          {ind.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="Téléphone portable"
                  value={formData.phone}
                  onChange={e => set("phone", e.target.value)}
                  className={`${inputCls} flex-1`}
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                Ce numéro vous permettra de signer électroniquement votre contrat et de sécuriser certaines opérations sensibles.
              </p>
            </div>

            {/* Code postal */}
            <input
              type="text"
              placeholder="Code postal et ville d'habitation *"
              value={formData.codePostal}
              onChange={e => set("codePostal", e.target.value)}
              className={inputCls}
              autoComplete="postal-code"
            />

            {/* Certification checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => set("certifie", !formData.certifie)}
                className={[
                  "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all mt-0.5",
                  formData.certifie ? "bg-[#6DC142] border-[#6DC142]" : "border-gray-300 bg-white",
                ].join(" ")}
              >
                {formData.certifie && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700 leading-snug">
                Je certifie avoir vérifié mon adresse email et confirme qu'elle est bien valide.
                <span className="text-red-500"> *</span>
              </span>
            </label>
          </FieldBlock>
        </main>
        <NavButtons
          onNext={() => setScreen(3)}
          onBack={goBack}
          nextDisabled={!formData.email || !formData.phone || !formData.codePostal || !formData.certifie}
        />
      </div>
    );
  }

  /* ─────────────────────────
     SCREEN 3 — Mot de passe
  ───────────────────────── */
  if (screen === 3) {
    const pwOk = formData.password.length >= 6;
    const confirmOk = formData.password === formData.confirmPassword;
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen={3} />
        <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Créez votre mot de passe</h2>
          <FieldBlock>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe * (min. 6 caractères)"
                value={formData.password}
                onChange={e => set("password", e.target.value)}
                className={`${inputCls} pr-12`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(o => !o)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirmer le mot de passe *"
                value={formData.confirmPassword}
                onChange={e => set("confirmPassword", e.target.value)}
                className={[inputCls, "pr-12", !confirmOk && formData.confirmPassword ? "border-red-300 focus:border-red-400" : ""].join(" ")}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(o => !o)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!confirmOk && formData.confirmPassword && (
              <p className="text-xs text-red-500 px-1">Les mots de passe ne correspondent pas.</p>
            )}

            {/* Strength indicator */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-300"
                      style={{
                        background: formData.password.length >= i * 3
                          ? i <= 2 ? "#f59e0b" : "#6DC142"
                          : "#e5e7eb",
                      }} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {formData.password.length < 6 ? "Trop court" :
                   formData.password.length < 9 ? "Acceptable" :
                   formData.password.length < 12 ? "Bon" : "Excellent"}
                </p>
              </div>
            )}
          </FieldBlock>
        </main>
        <NavButtons
          onNext={() => setScreen(4)}
          onBack={goBack}
          nextDisabled={!pwOk || !confirmOk || !formData.confirmPassword}
        />
      </div>
    );
  }

  /* ─────────────────────────
     SCREEN 4 — Code promo + submit
  ───────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
      <StepHeader screen={4} />
      <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 px-1">Finaliser votre inscription</h2>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Récapitulatif</p>
          {[
            { label: "Email", value: formData.email },
            { label: "Nom", value: [formData.civilite, formData.prenom, formData.nomNaissance].filter(Boolean).join(" ") || "—" },
            { label: "Téléphone", value: formData.indicatif + " " + (formData.phone || "—") },
            { label: "Carte choisie", value: card === "gold" ? "Gold CB Mastercard" : "Fosfo CB Mastercard" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-1 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-500 shrink-0">{label}</span>
              <span className="text-xs font-semibold text-gray-900 text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Code opération */}
        <FieldBlock>
          <input
            type="text"
            placeholder="Code opération (optionnel)"
            value={formData.referralCode}
            onChange={e => set("referralCode", e.target.value)}
            className={inputCls}
          />
          <p className="text-xs text-gray-400 px-1">Si vous avez reçu un code de parrainage, saisissez-le ici.</p>
        </FieldBlock>

        <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">
          Vos données sont protégées conformément à la réglementation en vigueur.
          Banque Mondiale — Établissement de crédit agréé.
        </p>
      </main>
      <NavButtons
        onNext={handleSubmit}
        onBack={goBack}
        nextLabel="Créer mon compte"
        loading={registerMutation.isPending}
      />
    </div>
  );
}
