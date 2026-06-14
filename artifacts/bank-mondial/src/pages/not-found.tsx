import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <header className="w-full bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-11 w-11 object-contain shrink-0" />
              <span className="font-black text-[12px] leading-tight tracking-wider uppercase text-[#003087] whitespace-nowrap">
                BANQUE MONDIALE
              </span>
            </div>
          </Link>
        </div>
      </header>

      <div
        className="w-full py-12 px-6 flex flex-col items-center text-center"
        style={{
          background: "linear-gradient(135deg, #2a2a1e 0%, #3d3520 30%, #4a3f28 55%, #2e2a1a 80%, #1a1a12 100%)",
        }}
      >
        <p className="text-white/40 text-lg font-light mb-1">Erreur</p>
        <h1
          className="font-bold leading-none mb-3"
          style={{
            fontSize: "7rem",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,255,255,0.45)",
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <p className="text-white/70 text-base">Page introuvable</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <img src="/logo-banque-mondiale.png" alt="Banque Mondiale" className="h-14 w-14 object-contain mx-auto mb-4 opacity-60" />
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Link href="/">
            <button className="w-full rounded-full font-bold text-base py-4 bg-[#6DC142] text-[#1a2e10] hover:bg-[#5BAF32] transition-all">
              Retour à l'accueil
            </button>
          </Link>
          <div className="mt-4">
            <Link href="/dashboard" className="text-[#003087] text-sm font-semibold hover:underline">
              Aller au tableau de bord →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
