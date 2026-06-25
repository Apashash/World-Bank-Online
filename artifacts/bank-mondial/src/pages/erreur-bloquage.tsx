import { useLocation } from "wouter";
import { MessageCircle, Lock, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErreurBloquage() {
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason") || "Vos opérations sont temporairement suspendues. Veuillez contacter le service client.";
  const whatsapp = params.get("whatsapp") || "";
  const type = params.get("type") || "retrait";

  const label = type === "virement" ? "Virement bloqué" : "Retrait bloqué";
  const sublabel = type === "virement"
    ? "Votre virement est temporairement suspendu"
    : "Votre retrait est temporairement suspendu";

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        type === "virement"
          ? "Bonjour, je souhaite débloquer mon virement sur Banque Mondiale."
          : "Bonjour, je souhaite débloquer mon retrait sur Banque Mondiale."
      )}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div className="h-7 w-px bg-gray-200" />
        <span className="text-sm font-semibold text-gray-700">Banque Mondiale</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
            <p className="text-sm text-gray-500">{sublabel}</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-red-100/60 border-b border-red-200">
              <div className="h-9 w-9 rounded-full bg-red-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800">Opération refusée</p>
                <p className="text-xs text-red-600">Action requise de votre part</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Raison</p>
              <p className="text-sm text-red-800 leading-relaxed">{reason}</p>
            </div>
          </div>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-3 text-white no-underline transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
            >
              <MessageCircle className="h-6 w-6" />
              Contacter le service client
            </a>
          ) : (
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center">
              <p className="text-sm text-gray-500">
                Pour débloquer votre compte, contactez le service client Banque Mondiale.
              </p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full h-11 border-gray-200 text-gray-600"
            onClick={() => setLocation("/dashboard")}
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
