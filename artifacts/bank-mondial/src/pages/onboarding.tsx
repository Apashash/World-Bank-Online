import { useState } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { CheckCircle, ChevronRight, Wallet, Send, Users, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
  color: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    icon: <ShieldCheck className="h-7 w-7" />,
    title: "Vérifiez votre identité (KYC)",
    description: "Soumettez vos documents pour activer toutes les fonctionnalités de votre compte.",
    action: "Commencer la vérification",
    href: "/kyc",
    color: "text-blue-600 bg-blue-50",
  },
  {
    id: 2,
    icon: <Wallet className="h-7 w-7" />,
    title: "Effectuez votre premier dépôt",
    description: "Alimentez votre compte pour pouvoir envoyer des virements.",
    action: "Faire un dépôt",
    href: "/depot",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    id: 3,
    icon: <Send className="h-7 w-7" />,
    title: "Envoyez votre premier virement",
    description: "Générez un lien de paiement sécurisé et partagez-le.",
    action: "Créer un virement",
    href: "/transfers/new",
    color: "text-purple-600 bg-purple-50",
  },
  {
    id: 4,
    icon: <Users className="h-7 w-7" />,
    title: "Invitez vos proches",
    description: "Partagez votre code de parrainage et gagnez des récompenses.",
    action: "Voir le parrainage",
    href: "/referrals",
    color: "text-amber-600 bg-amber-50",
  },
];

function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const completeOnboarding = async () => {
    setCompleting(true);
    await fetch(`/api/users/${user?.id}/onboarding`, {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
    setLocation("/dashboard");
  };

  const goToAction = () => {
    setLocation(step.href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002060] via-[#003087] to-[#004ab3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 mx-auto mb-4">
            <Star className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bienvenue !</h1>
          <p className="text-white/70 mt-2">
            {user?.fullName ? `Bonjour ${user.fullName.split(" ")[0]}, ` : ""}suivez ces étapes pour bien démarrer.
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all ${i === currentStep ? "bg-white w-8" : i < currentStep ? "bg-white/60 w-4" : "bg-white/20 w-4"}`}
            />
          ))}
        </div>

        {/* Step card */}
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.color} mb-5`}>
            {step.icon}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Étape {currentStep + 1} / {STEPS.length}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h2>
          <p className="text-gray-500 leading-relaxed mb-8">{step.description}</p>

          <div className="space-y-3">
            <Button
              className="w-full bg-[#003087] hover:bg-[#003087]/90 text-white rounded-xl py-6 text-base font-semibold gap-2"
              onClick={goToAction}
            >
              {step.action} <ChevronRight className="h-5 w-5" />
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCurrentStep((p) => p - 1)}>
                  Précédent
                </Button>
              )}
              {!isLast ? (
                <Button variant="ghost" className="flex-1 rounded-xl text-gray-500" onClick={() => setCurrentStep((p) => p + 1)}>
                  Passer cette étape
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl text-gray-500"
                  onClick={completeOnboarding}
                  disabled={completing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Steps overview */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`rounded-xl p-3 text-center transition-all ${i === currentStep ? "bg-white/20" : i < currentStep ? "bg-white/10" : "bg-white/5 opacity-60"}`}
            >
              <div className="flex justify-center mb-1 text-white">{s.icon}</div>
              <p className="text-[9px] font-semibold text-white/70 leading-tight">{s.title.split(" ").slice(0, 2).join(" ")}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
