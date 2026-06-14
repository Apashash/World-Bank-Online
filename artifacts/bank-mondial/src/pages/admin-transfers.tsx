import { useAdminListTransfers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function AdminTransfers() {
  const { data, isLoading } = useAdminListTransfers({ page: 1, limit: 100 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500 hover:bg-green-600">Complété</Badge>;
      case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">En attente</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
      case 'expired': return <Badge variant="secondary">Expiré</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Surveillance des virements</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tous les virements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Emetteur (ID)</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun virement trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.transfers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {format(new Date(t.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.userId}</TableCell>
                      <TableCell>{t.beneficiaryName}</TableCell>
                      <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {t.amount.toFixed(2)} {t.currency}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
