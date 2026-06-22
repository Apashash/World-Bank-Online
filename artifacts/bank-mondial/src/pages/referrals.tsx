import { useGetReferralStats, useListReferrals, useGetMe, useListTransfers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift, Copy, Link2, Award, ShieldCheck, Send, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

function getLevel(count: number): { label: string; color: string; next: number | null; emoji: string } {
  if (count >= 10) return { label: "Gold", color: "#F59E0B", next: null, emoji: "🥇" };
  if (count >= 5)  return { label: "Silver", color: "#6B7280", next: 10, emoji: "🥈" };
  return { label: "Bronze", color: "#B45309", next: 5, emoji: "🥉" };
}

type Badge = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  color: string;
};

export default function Referrals() {
  const { data: stats, isLoading: isLoadingStats } = useGetReferralStats();
  const { data: referrals, isLoading: isLoadingReferrals } = useListReferrals();
  const { data: user } = useGetMe();
  const { data: transfersData } = useListTransfers({ page: 1, limit: 1 });
  const { toast } = useToast();

  const referralCode = user?.referralCode || "";
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  const level = getLevel(stats?.totalReferrals ?? 0);

  const totalReferrals = stats?.totalReferrals ?? 0;
  const hasTransfer = (transfersData?.total ?? 0) > 0;
  const kycVerified = user?.kycStatus === "verified";

  const badges: Badge[] = [
    {
      id: "first_transfer",
      label: "Premier virement",
      description: "Effectuez votre premier virement",
      icon: <Send className="h-5 w-5" />,
      unlocked: hasTransfer,
      color: "#003087",
    },
    {
      id: "kyc_verified",
      label: "Identité vérifiée",
      description: "Complétez la vérification KYC",
      icon: <ShieldCheck className="h-5 w-5" />,
      unlocked: kycVerified,
      color: "#6DC142",
    },
    {
      id: "first_referral",
      label: "Premier filleul",
      description: "Parrainez votre premier utilisateur",
      icon: <Users className="h-5 w-5" />,
      unlocked: totalReferrals >= 1,
      color: "#8B5CF6",
    },
    {
      id: "five_referrals",
      label: "5 filleuls",
      description: "Parrainez 5 utilisateurs (niveau Silver)",
      icon: <Star className="h-5 w-5" />,
      unlocked: totalReferrals >= 5,
      color: "#6B7280",
    },
    {
      id: "ten_referrals",
      label: "10 filleuls",
      description: "Parrainez 10 utilisateurs (niveau Gold)",
      icon: <Award className="h-5 w-5" />,
      unlocked: totalReferrals >= 10,
      color: "#F59E0B",
    },
    {
      id: "rewards_earned",
      label: "Gains parrainage",
      description: "Recevez vos premières récompenses",
      icon: <Gift className="h-5 w-5" />,
      unlocked: (stats?.totalRewards ?? 0) > 0,
      color: "#EC4899",
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Code copié !" });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Lien copié !" });
  };

  const shareWhatsApp = () => {
    const text = `Rejoins Banque Mondiale avec mon code parrain ${referralCode} et profite d'une offre exclusive ! 🎁\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Système de parrainage</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Code + Link */}
        <div className="space-y-4">
          {/* Referral code */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Votre code parrain</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                  <span className="font-mono font-bold text-[#003087] text-lg tracking-widest">{referralCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title="Copier le code"
                >
                  <Copy className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Referral link */}
          <Card className="border shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Votre lien de parrainage</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 overflow-hidden">
                  <span className="text-xs text-blue-700 font-mono truncate block">{referralLink}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="h-10 w-10 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors shrink-0"
                  title="Copier le lien"
                >
                  <Copy className="h-4 w-4 text-blue-600" />
                </button>
              </div>
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                <span className="text-base">💬</span>
                Partager sur WhatsApp
              </button>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border shadow-sm">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{totalReferrals}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Filleuls</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-[#003087]">{(stats?.totalRewards ?? 0).toFixed(0)} €</div>
                <p className="text-xs text-muted-foreground mt-0.5">Gains</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-xl font-bold" style={{ color: level.color }}>{level.emoji} {level.label}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Niveau</p>
              </CardContent>
            </Card>
          </div>

          {/* Level progress */}
          {level.next && (
            <Card className="border shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progression vers {level.next >= 10 ? "Gold" : "Silver"}</span>
                  <span className="text-xs font-semibold text-gray-700">{totalReferrals}/{level.next}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (totalReferrals / level.next) * 100)}%`,
                      backgroundColor: level.color,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Encore {level.next - totalReferrals} filleul(s) pour atteindre le niveau supérieur
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Recent referrals */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#003087]" />
              Vos filleuls récents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5">
            {isLoadingReferrals ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
            ) : !Array.isArray(referrals) || referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Aucun filleul pour l'instant</p>
                  <p className="text-xs text-muted-foreground mt-1">Partagez votre lien pour commencer à gagner des récompenses.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.slice(0, 8).map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] font-bold text-sm shrink-0">
                        {ref.referredUserName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ref.referredUserName}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          ref.status === "rewarded"
                            ? "bg-green-100 text-green-700"
                            : ref.status === "confirmed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {ref.status === "rewarded" ? "Prime versée" : ref.status === "confirmed" ? "Confirmé" : "En attente"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {ref.reward ? (
                        <span className="text-sm font-bold text-[#003087]">{ref.reward.toFixed(2)} €</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(ref.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalReferrals > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    {totalReferrals}
                  </div>
                  <p className="text-xs text-muted-foreground">Filleuls total</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-sm font-bold text-[#003087]">
                    <Gift className="h-3.5 w-3.5" />
                    {(stats?.totalRewards ?? 0).toFixed(2)} €
                  </div>
                  <p className="text-xs text-muted-foreground">Gains totaux</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Badges & récompenses ── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-[#003087]" />
              Badges & Récompenses
            </CardTitle>
            <span className="text-xs font-semibold text-muted-foreground bg-gray-100 px-2.5 py-1 rounded-full">
              {unlockedCount}/{badges.length} obtenus
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`relative rounded-xl border p-3 text-center transition-all ${
                  badge.unlocked
                    ? "border-transparent shadow-sm"
                    : "border-gray-200 bg-gray-50/50 opacity-50"
                }`}
                style={badge.unlocked ? { backgroundColor: `${badge.color}10`, borderColor: `${badge.color}30` } : {}}
              >
                {badge.unlocked && (
                  <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#6DC142] flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">✓</span>
                  </div>
                )}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: badge.unlocked ? `${badge.color}20` : "#f3f4f6", color: badge.unlocked ? badge.color : "#9ca3af" }}
                >
                  {badge.icon}
                </div>
                <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5">{badge.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border shadow-sm bg-[#003087]/5 border-[#003087]/20">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-bold text-[#003087] mb-3">Comment ça marche ?</p>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            {[
              { step: "1", title: "Partagez votre code", desc: "Copiez votre code ou lien de parrainage et envoyez-le à vos proches." },
              { step: "2", title: "Ils s'inscrivent", desc: "Votre filleul crée son compte en utilisant votre code de parrainage." },
              { step: "3", title: "Vous gagnez", desc: "Recevez jusqu'à 150 € pour chaque filleul qui active son compte." },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-[#003087] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
