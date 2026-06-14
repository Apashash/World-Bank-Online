import { useListSubAccounts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Plus, Shield, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function SubAccounts() {
  const { data: subAccounts, isLoading } = useListSubAccounts();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Sous-comptes</h1>
        <Button asChild>
          <Link href="/sub-accounts/new">
            <Plus className="mr-2 h-4 w-4" /> Nouveau sous-compte
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes délégués</CardTitle>
          <CardDescription>Gérez les accès de vos collaborateurs ou membres de famille.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!subAccounts || subAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun sous-compte configuré.
                    </TableCell>
                  </TableRow>
                ) : (
                  subAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        {account.fullName}
                      </TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>
                        {format(new Date(account.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                          {account.status === 'active' ? 'Actif' : 'Suspendu'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {account.permissions.map(p => (
                            <Badge key={p} variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" /> {p}
                            </Badge>
                          ))}
                        </div>
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
