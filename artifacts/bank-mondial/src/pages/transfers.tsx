import { useListTransfers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Search, Plus, ExternalLink, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function Transfers() {
  const { data, isLoading } = useListTransfers({ page: 1, limit: 50 });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Virements</h1>
        <Button asChild>
          <Link href="/transfers/new">
            <Plus className="mr-2 h-4 w-4" /> Nouveau virement
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <CardTitle>Historique des virements</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead></TableHead>
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
                        {format(new Date(t.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>{t.beneficiaryName}</TableCell>
                      <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {t.amount.toFixed(2)} {t.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/transfers/${t.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
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
