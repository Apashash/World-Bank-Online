import { useGetReferralStats, useListReferrals, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Gift, CheckCircle, Copy } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Referrals() {
  const { data: stats, isLoading: isLoadingStats } = useGetReferralStats();
  const { data: referrals, isLoading: isLoadingReferrals } = useListReferrals();
  const { data: user } = useGetMe();
  const { toast } = useToast();

  const handleCopyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast({ title: "Code de parrainage copié" });
    }
  };

  if (isLoadingStats || isLoadingReferrals) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Programme de parrainage</h1>

      <Card className="bg-primary text-primary-foreground border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Parrainez vos proches</h2>
              <p className="text-primary-foreground/80 max-w-xl">
                Invitez vos amis à rejoindre Bank Mondial et gagnez jusqu'à 150€ pour chaque filleul validé. Votre filleul recevra également une prime de bienvenue.
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl text-center min-w-[250px]">
              <div className="text-sm font-medium opacity-80 mb-2">Votre code parrain</div>
              <div className="text-2xl font-mono font-bold tracking-wider mb-3">{user?.referralCode}</div>
              <Button onClick={handleCopyCode} variant="secondary" className="w-full">
                <Copy className="h-4 w-4 mr-2" /> Copier le code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filleuls totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filleuls confirmés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmedReferrals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gains validés</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{(stats?.totalRewards || 0).toFixed(2)} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gains en attente</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.pendingRewards || 0).toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique de vos parrainages</CardTitle>
          <CardDescription>Suivez l'évolution du statut de vos filleuls.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filleul</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Prime associée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!referrals || referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Vous n'avez pas encore parrainé d'amis.
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.referredUserName}</TableCell>
                    <TableCell>
                      {format(new Date(ref.createdAt), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ref.status === 'rewarded' ? 'default' : ref.status === 'confirmed' ? 'outline' : 'secondary'}>
                        {ref.status === 'rewarded' ? 'Prime versée' : ref.status === 'confirmed' ? 'Confirmé' : 'En attente d\'activation'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {ref.reward ? `${ref.reward.toFixed(2)} €` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
