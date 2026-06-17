import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Eye, EyeOff, Globe, ShieldCheck, Zap } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (res: any) => {
          localStorage.setItem("auth_token", res.token);
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "Identifiants invalides";
          setError(msg === "Invalid credentials" ? "Email ou mot de passe incorrect." : msg);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <img src="/logo-banque-mondiale.png" alt="Banque Mondiale"
                className="h-9 w-9 sm:h-11 sm:w-11 object-contain shrink-0" />
              <span className="font-black text-[11px] sm:text-[13px] leading-tight tracking-wider uppercase text-[#003087] whitespace-nowrap">
                BANQUE MONDIALE
              </span>
            </div>
          </Link>
          <Link href="/open-account">
            <button className="rounded-full font-bold text-sm px-4 sm:px-6 py-2 sm:py-2.5 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-95 transition-all duration-200">
              Ouvrir un compte
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-14 sm:pt-16">

        {/* Promo band */}
        <section className="px-6 py-5 sm:py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
          style={{ background: "linear-gradient(90deg, #c8a84b 0%, #a07830 50%, #c8a84b 100%)" }}>
          <div>
            <p className="text-gray-900 font-bold text-base sm:text-lg">Pas encore client ?</p>
            <p className="text-gray-800/70 text-sm">Jusqu'à <span className="font-black text-gray-900">250 €</span> offerts à l'ouverture</p>
          </div>
          <Link href="/open-account">
            <button className="shrink-0 rounded-full font-bold text-sm sm:text-base px-6 sm:px-8 py-3 bg-[#1a1a12] text-white hover:bg-[#2a2a1e] active:scale-95 transition-all duration-200 shadow-md">
              Ouvrir un compte
            </button>
          </Link>
        </section>

        {/* Form section */}
        <section className="px-5 py-12 sm:py-16 bg-[#f5f5f0]">
          <div className="w-full max-w-md mx-auto">

            <Link href="/">
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Retour à l'accueil
              </button>
            </Link>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Se connecter</h2>
              <p className="text-sm text-gray-400 mb-7">Entrez vos identifiants pour accéder à votre espace</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    placeholder="jean.dupont@exemple.fr"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    className={inputCls}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      className={`${inputCls} pr-12`}
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" onClick={() => setShowPw(o => !o)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loginMutation.isPending ? "Connexion en cours…" : "Se connecter"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Pas encore client ?{" "}
                  <Link href="/open-account" className="text-[#003087] font-bold hover:underline">
                    Ouvrir un compte
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6 max-w-xs mx-auto leading-relaxed">
              Vos données sont protégées conformément à la réglementation en vigueur.<br />
              Banque Mondiale — Établissement de crédit agréé.
            </p>
          </div>
        </section>

        {/* Features band */}
        <section className="px-6 py-12 sm:py-16"
          style={{ background: "linear-gradient(135deg, #2a2a1e 0%, #3d3520 50%, #1a1a12 100%)" }}>
          <div className="max-w-screen-md mx-auto">
            <p className="text-center text-white/50 text-xs tracking-widest uppercase mb-8">Pourquoi choisir Banque Mondiale</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: <Globe className="w-6 h-6 text-[#6DC142]" />, bg: "rgba(109,193,66,0.15)", title: "Paiements gratuits partout", desc: "Payez et retirez sans frais dans le monde entier" },
                { icon: <ShieldCheck className="w-6 h-6 text-amber-400" />, bg: "rgba(251,191,36,0.15)", title: "Assurances premium", desc: "Couverture voyage et assistance incluses" },
                { icon: <Zap className="w-6 h-6 text-blue-400" />, bg: "rgba(96,165,250,0.15)", title: "Virement instantané", desc: "Transférez de l'argent en quelques secondes" },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl p-5 border border-white/10 text-center"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: item.bg }}>
                    {item.icon}
                  </div>
                  <p className="text-white font-bold text-sm mb-2">{item.title}</p>
                  <p className="text-white/55 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
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
