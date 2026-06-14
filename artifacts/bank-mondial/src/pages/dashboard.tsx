import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Clock, Euro } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activities, isLoading: isLoadingActivity } = useGetRecentActivity();

  if (isLoadingSummary || isLoadingActivity) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Solde actuel</CardTitle>
            <Euro className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summary?.balance.toFixed(2)} {summary?.currency}</div>
            <p className="text-xs opacity-80 mt-1">IBAN: {summary?.iban || "Non assigné"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total envoyé</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalAmountSent.toFixed(2)} {summary?.currency}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.totalTransfersSent} virements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total reçu</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalAmountReceived.toFixed(2)} {summary?.currency}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.totalTransfersReceived} virements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingTransfers}</div>
            <p className="text-xs text-muted-foreground mt-1">Virements en cours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities?.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  {activity.amount && (
                    <div className={`text-sm font-medium ${activity.type === 'transfer_sent' ? 'text-destructive' : 'text-green-600'}`}>
                      {activity.type === 'transfer_sent' ? '-' : '+'}{activity.amount.toFixed(2)} {activity.currency}
                    </div>
                  )}
                </div>
              ))}
              {activities?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">Aucune activité récente.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
