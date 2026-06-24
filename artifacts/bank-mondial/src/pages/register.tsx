import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Eye, EyeOff, Search } from "lucide-react";
import { COUNTRIES } from "@/data/countries";

/* ─── Types ─── */
interface HolderData {
  civilite: "Madame" | "Monsieur" | "";
  prenom: string;
  nomNaissance: string;
  nomUsage: string;
  indicatif: string;
  phone: string;
  codePostal: string;
  certifie: boolean;
}

interface FormData {
  email: string;
  holder1: HolderData;
  holder2: HolderData;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

const EMPTY_HOLDER: HolderData = {
  civilite: "", prenom: "", nomNaissance: "", nomUsage: "",
  indicatif: "+33", phone: "", codePostal: "", certifie: false,
};


/* ─── Screen sequences ─── */
type ScreenName =
  | "email"
  | "joint-intro"
  | "identity-1"
  | "contact-1"
  | "joint-holder-intro"
  | "identity-2"
  | "contact-2"
  | "password"
  | "summary";

function getScreens(isJoint: boolean): ScreenName[] {
  if (isJoint) {
    return ["email", "joint-intro", "identity-1", "contact-1", "joint-holder-intro", "identity-2", "contact-2", "password", "summary"];
  }
  return ["email", "identity-1", "contact-1", "password", "summary"];
}

/* ─── Étape meta ─── */
function getEtapeMeta(screen: ScreenName, isJoint: boolean) {
  const map: Record<ScreenName, { etape: number; label: string }> = {
    "email":              { etape: 1, label: "Votre identité" },
    "joint-intro":        { etape: 1, label: "Votre identité" },
    "identity-1":         { etape: 1, label: "Votre identité" },
    "contact-1":          { etape: 2, label: isJoint ? "Vos coordonnées (1er titulaire)" : "Vos coordonnées" },
    "joint-holder-intro": { etape: 3, label: "Second titulaire" },
    "identity-2":         { etape: 3, label: "Votre co-titulaire" },
    "contact-2":          { etape: 3, label: "Coordonnées co-titulaire" },
    "password":           { etape: isJoint ? 4 : 3, label: "Mot de passe" },
    "summary":            { etape: 5, label: "Finaliser" },
  };
  return map[screen] ?? { etape: 1, label: "Votre identité" };
}

/* ─── Shared field styles ─── */
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all";

/* ─── Step header ─── */
function StepHeader({ screen, isJoint }: { screen: ScreenName; isJoint: boolean }) {
  const meta = getEtapeMeta(screen, isJoint);
  const total = isJoint ? 5 : 5;
  const pct = ((meta.etape - 1) / total) * 100 + 8;
  return (
    <div className="bg-white border-b border-gray-100 px-5 pt-4 pb-0">
      <div className="flex items-center gap-3 mb-3">
        <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-7 w-7 object-contain" />
        <span className="font-black text-[13px] tracking-wider uppercase text-[#003087]">BANQUE MONDIALE</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        Étape {meta.etape}/{total} – <strong className="text-gray-800">{meta.label}</strong>
      </p>
      <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#6DC142" }} />
      </div>
    </div>
  );
}

/* ─── Titulaire indicator (joint only) ─── */
function TitulaireBar({ which }: { which: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
      {[1, 2].map(n => (
        <div key={n} className="flex items-center gap-1.5">
          <div className={[
            "w-6 h-6 rounded-full flex items-center justify-center",
            n === which ? "bg-[#6DC142]/20" : "bg-gray-100",
          ].join(" ")}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <circle cx="12" cy="7" r="4" fill={n === which ? "#003087" : "#bbb"} />
              <ellipse cx="12" cy="17" rx="7" ry="4" fill={n === which ? "#6DC142" : "#ccc"} />
            </svg>
          </div>
          {n === which && <span className="text-xs font-semibold text-gray-700">
            {n === 1 ? "Titulaire principal" : "Co-titulaire"}
          </span>}
        </div>
      ))}
    </div>
  );
}

function FieldBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <p className="text-xs text-gray-400"><span className="text-red-500">*</span> : informations obligatoires</p>
      {children}
    </div>
  );
}

function NavButtons({
  onNext, onBack, nextLabel = "Suivant", nextDisabled = false, loading = false, hideBack = false,
}: {
  onNext: () => void; onBack: () => void; nextLabel?: string;
  nextDisabled?: boolean; loading?: boolean; hideBack?: boolean;
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
      {!hideBack && (
        <button
          onClick={onBack}
          className="w-full rounded-full font-bold text-base py-4 border-2 border-gray-200 text-gray-700 hover:border-[#003087] hover:text-[#003087] active:scale-[0.98] transition-all duration-200 bg-white"
        >
          Retour
        </button>
      )}
    </div>
  );
}

/* ─── Identity form (reused for holder 1 and 2) ─── */
function IdentityForm({
  data, onChange,
}: {
  data: HolderData;
  onChange: (key: keyof HolderData, val: string | boolean) => void;
}) {
  return (
    <FieldBlock>
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Civilité <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-2 gap-3">
          {(["Madame", "Monsieur"] as const).map(c => (
            <button key={c} onClick={() => onChange("civilite", c)}
              className={["flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-150",
                data.civilite === c
                  ? "border-[#003087] bg-[#003087]/5 text-[#003087]"
                  : "border-gray-200 text-gray-700 hover:border-gray-300",
              ].join(" ")}>
              <div className={["w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                data.civilite === c ? "border-[#003087]" : "border-gray-300"].join(" ")}>
                {data.civilite === c && <div className="w-2 h-2 rounded-full bg-[#003087]" />}
              </div>
              {c}
            </button>
          ))}
        </div>
      </div>
      <input type="text" placeholder="Prénom *" value={data.prenom}
        onChange={e => onChange("prenom", e.target.value)} className={inputCls} autoComplete="given-name" />
      <div>
        <input type="text" placeholder="Nom de naissance *" value={data.nomNaissance}
          onChange={e => onChange("nomNaissance", e.target.value)} className={inputCls} autoComplete="family-name" />
        <p className="text-xs text-gray-400 mt-1.5 px-1">Nom indiqué sur votre pièce d'identité.</p>
      </div>
      <input type="text" placeholder="Nom marital ou d'usage" value={data.nomUsage}
        onChange={e => onChange("nomUsage", e.target.value)} className={inputCls} autoComplete="additional-name" />
    </FieldBlock>
  );
}

/* ─── Contact form (reused for holder 1 and 2) ─── */
function ContactForm({
  data, email, onChangeHolder, onChangeEmail, showEmail,
}: {
  data: HolderData;
  email: string;
  onChangeHolder: (key: keyof HolderData, val: string | boolean) => void;
  onChangeEmail: (val: string) => void;
  showEmail: boolean;
}) {
  const [showIndicatif, setShowIndicatif] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showIndicatif) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showIndicatif]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowIndicatif(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search)
      )
    : COUNTRIES;

  const selectedCountry = COUNTRIES.find(c => c.dial === data.indicatif);

  return (
    <FieldBlock>
      {showEmail && (
        <div>
          <input type="email" placeholder="E-mail *" value={email}
            onChange={e => onChangeEmail(e.target.value)} className={inputCls} autoComplete="email" />
          <p className="text-xs text-gray-400 mt-1.5 px-1">
            Cet email vous servira pour le suivi de votre demande et la gestion de votre compte.
          </p>
        </div>
      )}

      <div>
        <div className="flex gap-2">
          <div className="relative shrink-0" ref={dropdownRef}>
            <button type="button" onClick={() => { setShowIndicatif(o => !o); setSearch(""); }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-3.5 text-sm text-gray-700 hover:border-gray-300 transition-all min-w-[96px]">
              <span className="text-base leading-none">{selectedCountry?.flag ?? "🌍"}</span>
              <span className="text-xs text-gray-600 font-medium">{data.indicatif}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            {showIndicatif && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-72"
                style={{ maxHeight: 320, display: "flex", flexDirection: "column" }}>
                {/* Search bar */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Rechercher un pays ou indicatif…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                  />
                </div>
                {/* List */}
                <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
                  {filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Aucun résultat</p>
                  ) : filtered.map(c => (
                    <button key={c.code} type="button"
                      onClick={() => { onChangeHolder("indicatif", c.dial); setShowIndicatif(false); setSearch(""); }}
                      className={["w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors",
                        data.indicatif === c.dial ? "bg-[#003087]/5" : ""].join(" ")}>
                      <span className="text-lg leading-none shrink-0">{c.flag}</span>
                      <span className={["text-sm flex-1 truncate", data.indicatif === c.dial ? "text-[#003087] font-semibold" : "text-gray-800"].join(" ")}>
                        {c.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0 font-mono">{c.dial}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input type="tel" placeholder="Téléphone portable" value={data.phone}
            onChange={e => onChangeHolder("phone", e.target.value)} className={`${inputCls} flex-1`} autoComplete="tel" />
        </div>
        <p className="text-xs text-gray-400 mt-1.5 px-1">
          Ce numéro vous permettra de signer électroniquement votre contrat et de sécuriser certaines opérations sensibles.
        </p>
      </div>

      <input type="text" placeholder="Code postal et ville d'habitation *" value={data.codePostal}
        onChange={e => onChangeHolder("codePostal", e.target.value)} className={inputCls} autoComplete="postal-code" />

      <label className="flex items-start gap-3 cursor-pointer" onClick={() => onChangeHolder("certifie", !data.certifie)}>
        <div
          className={["w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all mt-0.5",
            data.certifie ? "bg-[#6DC142] border-[#6DC142]" : "border-gray-300 bg-white"].join(" ")}>
          {data.certifie && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-sm text-gray-700 leading-snug">
          Je certifie avoir vérifié mon adresse email et confirme qu'elle est bien valide.<span className="text-red-500"> *</span>
        </span>
      </label>
    </FieldBlock>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function Register() {
  const [screenIdx, setScreenIdx] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    holder1: { ...EMPTY_HOLDER },
    holder2: { ...EMPTY_HOLDER },
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const type = params.get("type") ?? "individual";
  const card = params.get("card") ?? "fosfo";
  const isJoint = type === "joint";

  const screens = getScreens(isJoint);
  const currentScreen = screens[screenIdx];

  const { toast } = useToast();
  const registerMutation = useRegister();

  const setEmail = (v: string) => {
    setFormData(p => ({ ...p, email: v }));
    if (emailError) setEmailError("");
  };
  const setHolder1 = (key: keyof HolderData, val: string | boolean) =>
    setFormData(p => ({ ...p, holder1: { ...p.holder1, [key]: val } }));
  const setHolder2 = (key: keyof HolderData, val: string | boolean) =>
    setFormData(p => ({ ...p, holder2: { ...p.holder2, [key]: val } }));
  const set = (key: keyof Omit<FormData, "holder1" | "holder2">, val: string) =>
    setFormData(p => ({ ...p, [key]: val }));

  const goNext = () => setScreenIdx(i => Math.min(screens.length - 1, i + 1));
  const goBack = () => {
    if (screenIdx === 0) {
      setLocation(`/open-account/steps?type=${type}&card=${card}`);
    } else {
      setScreenIdx(i => i - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitError("");
    const h = formData.holder1;
    const fullName = [h.civilite, h.prenom, h.nomNaissance].filter(Boolean).join(" ");
    registerMutation.mutate(
      {
        data: {
          fullName,
          email: formData.email,
          phone: h.indicatif + h.phone,
          country: COUNTRIES.find(c => c.dial === h.indicatif)?.name ?? h.indicatif,
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
          const msg: string = err?.response?.data?.error ?? err?.message ?? "Une erreur est survenue";
          const isEmailTaken = msg.toLowerCase().includes("email") || msg.toLowerCase().includes("already");
          if (isEmailTaken) {
            setEmailError("Cette adresse email est déjà utilisée. Veuillez en choisir une autre.");
            setScreenIdx(0);
          } else {
            setSubmitError(msg);
            toast({ title: "Erreur d'inscription", description: msg, variant: "destructive" });
          }
        },
      }
    );
  };

  /* ─── SCREEN: email ─── */
  if (currentScreen === "email") {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen="email" isJoint={isJoint} />
        <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Saisissez votre adresse email</h2>
          <FieldBlock>
            <input
              type="email"
              placeholder="Votre adresse e-mail *"
              value={formData.email}
              onChange={e => setEmail(e.target.value)}
              className={[inputCls, emailError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""].join(" ")}
              autoComplete="email"
            />
            {emailError ? (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-red-600 leading-relaxed">{emailError}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 px-1">Votre email sera utilisé exclusivement pour le suivi de votre dossier</p>
            )}
          </FieldBlock>
        </main>
        <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!formData.email.includes("@") || !!emailError} />
      </div>
    );
  }

  /* ─── SCREEN: joint-intro ─── */
  if (currentScreen === "joint-intro") {
    return (
      <div className="min-h-screen flex flex-col bg-white font-sans">
        {/* Simple logo header */}
        <header className="px-5 pt-5 pb-3 flex items-center gap-3">
          <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-8 w-8 object-contain" />
          <span className="font-black text-[13px] tracking-wider uppercase text-[#003087]">BANQUE MONDIALE</span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-8 pb-36 text-center">
          {/* Two person icons */}
          <div className="flex items-end gap-4 mb-10">
            {/* First holder (active, green bg) */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: "rgba(109,193,66,0.18)" }}>
              <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14">
                <circle cx="24" cy="16" r="10" fill="#1a1a1a" />
                <ellipse cx="24" cy="38" rx="16" ry="10" fill="#1a1a1a" />
              </svg>
            </div>
            {/* Second holder (inactive, gray) */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ background: "#f0f0f0" }}>
              <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                <circle cx="24" cy="16" r="10" fill="#bbb" />
                <ellipse cx="24" cy="38" rx="16" ry="10" fill="#bbb" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            Commençons par les informations<br />du premier titulaire.
          </h2>
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-100">
          <button onClick={goNext}
            className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] transition-all duration-200">
            Suivant
          </button>
        </div>
      </div>
    );
  }

  /* ─── SCREEN: identity-1 ─── */
  if (currentScreen === "identity-1") {
    const ok = !!formData.holder1.civilite && !!formData.holder1.prenom && !!formData.holder1.nomNaissance;
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen="identity-1" isJoint={isJoint} />
        {isJoint && <TitulaireBar which={1} />}
        <main className="flex-1 px-4 pt-6 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Votre identité</h2>
          <IdentityForm data={formData.holder1} onChange={setHolder1} />
        </main>
        <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!ok} />
      </div>
    );
  }

  /* ─── SCREEN: contact-1 ─── */
  if (currentScreen === "contact-1") {
    const h = formData.holder1;
    const ok = !!formData.email && !!h.phone && !!h.codePostal && h.certifie;
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen="contact-1" isJoint={isJoint} />
        {isJoint && <TitulaireBar which={1} />}
        <main className="flex-1 px-4 pt-6 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Vos modes de contact</h2>
          <ContactForm
            data={h} email={formData.email}
            onChangeHolder={setHolder1} onChangeEmail={setEmail} showEmail={true}
          />
        </main>
        <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!ok} />
      </div>
    );
  }

  /* ─── SCREEN: joint-holder-intro ─── */
  if (currentScreen === "joint-holder-intro") {
    return (
      <div className="min-h-screen flex flex-col bg-white font-sans">
        <header className="px-5 pt-5 pb-3 flex items-center gap-3">
          <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-8 w-8 object-contain" />
          <span className="font-black text-[13px] tracking-wider uppercase text-[#003087]">BANQUE MONDIALE</span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-8 pb-36 text-center">
          <div className="flex items-end gap-4 mb-10">
            {/* First holder (done, smaller) */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ background: "#f0f0f0" }}>
              <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                <circle cx="24" cy="16" r="10" fill="#bbb" />
                <ellipse cx="24" cy="38" rx="16" ry="10" fill="#bbb" />
              </svg>
            </div>
            {/* Second holder (active, green bg) */}
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: "rgba(109,193,66,0.18)" }}>
              <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14">
                <circle cx="24" cy="16" r="10" fill="#1a1a1a" />
                <ellipse cx="24" cy="38" rx="16" ry="10" fill="#1a1a1a" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            Continuons avec les informations<br />du second titulaire.
          </h2>
        </main>

        <div className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-100 space-y-3">
          <button onClick={goNext}
            className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] transition-all duration-200">
            Suivant
          </button>
          <button onClick={goBack}
            className="w-full rounded-full font-bold text-base py-4 border-2 border-gray-200 text-gray-700 hover:border-[#003087] hover:text-[#003087] active:scale-[0.98] transition-all duration-200">
            Retour
          </button>
        </div>
      </div>
    );
  }

  /* ─── SCREEN: identity-2 ─── */
  if (currentScreen === "identity-2") {
    const ok = !!formData.holder2.civilite && !!formData.holder2.prenom && !!formData.holder2.nomNaissance;
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen="identity-2" isJoint={isJoint} />
        <TitulaireBar which={2} />
        <main className="flex-1 px-4 pt-6 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Identité du co-titulaire</h2>
          <IdentityForm data={formData.holder2} onChange={setHolder2} />
        </main>
        <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!ok} />
      </div>
    );
  }

  /* ─── SCREEN: contact-2 ─── */
  if (currentScreen === "contact-2") {
    const h = formData.holder2;
    const ok = !!h.phone && !!h.codePostal && h.certifie;
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen="contact-2" isJoint={isJoint} />
        <TitulaireBar which={2} />
        <main className="flex-1 px-4 pt-6 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Coordonnées du co-titulaire</h2>
          <ContactForm
            data={h} email=""
            onChangeHolder={setHolder2} onChangeEmail={() => {}} showEmail={false}
          />
        </main>
        <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!ok} />
      </div>
    );
  }

  /* ─── SCREEN: password ─── */
  if (currentScreen === "password") {
    const pwOk = formData.password.length >= 6;
    const confirmOk = formData.password === formData.confirmPassword;
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
        <StepHeader screen="password" isJoint={isJoint} />
        <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Créez votre mot de passe</h2>
          <FieldBlock>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Mot de passe * (min. 6 caractères)"
                value={formData.password} onChange={e => set("password", e.target.value)}
                className={`${inputCls} pr-12`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(o => !o)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} placeholder="Confirmer le mot de passe *"
                value={formData.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
                className={[inputCls, "pr-12", !confirmOk && formData.confirmPassword ? "border-red-300" : ""].join(" ")}
                autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(o => !o)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!confirmOk && formData.confirmPassword && (
              <p className="text-xs text-red-500 px-1">Les mots de passe ne correspondent pas.</p>
            )}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-300"
                      style={{ background: formData.password.length >= i * 3 ? (i <= 2 ? "#f59e0b" : "#6DC142") : "#e5e7eb" }} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {formData.password.length < 6 ? "Trop court" : formData.password.length < 9 ? "Acceptable" : formData.password.length < 12 ? "Bon" : "Excellent"}
                </p>
              </div>
            )}
          </FieldBlock>
        </main>
        <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!pwOk || !confirmOk || !formData.confirmPassword} />
      </div>
    );
  }

  /* ─── SCREEN: summary ─── */
  const h1 = formData.holder1;
  const h2 = formData.holder2;
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f0] font-sans">
      <StepHeader screen="summary" isJoint={isJoint} />
      <main className="flex-1 px-4 pt-7 pb-36 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 px-1">Finaliser votre inscription</h2>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Récapitulatif</p>
          {[
            { label: "Email", value: formData.email },
            { label: isJoint ? "Titulaire principal" : "Nom", value: [h1.civilite, h1.prenom, h1.nomNaissance].filter(Boolean).join(" ") || "—" },
            ...(isJoint ? [{ label: "Co-titulaire", value: [h2.civilite, h2.prenom, h2.nomNaissance].filter(Boolean).join(" ") || "—" }] : []),
            { label: "Téléphone", value: h1.indicatif + " " + (h1.phone || "—") },
            { label: "Carte choisie", value: card === "gold" ? "Gold CB Mastercard" : "Fosfo CB Mastercard" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-1 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-500 shrink-0">{label}</span>
              <span className="text-xs font-semibold text-gray-900 text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Code opération */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-xs text-gray-400"><span className="text-red-500">*</span> : informations obligatoires</p>
          <input type="text" placeholder="Code opération (optionnel)" value={formData.referralCode}
            onChange={e => set("referralCode", e.target.value)} className={inputCls} />
          <p className="text-xs text-gray-400 px-1">Si vous avez reçu un code de parrainage, saisissez-le ici.</p>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600 leading-relaxed">{submitError}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">
          Vos données sont protégées conformément à la réglementation en vigueur.<br />
          Banque Mondiale — Établissement de crédit agréé.
        </p>
      </main>
      <NavButtons onNext={handleSubmit} onBack={goBack} nextLabel="Créer mon compte" loading={registerMutation.isPending} />
    </div>
  );
}
