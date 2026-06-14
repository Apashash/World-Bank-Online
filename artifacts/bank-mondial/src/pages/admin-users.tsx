import { useAdminListUsers, useAdminBlockUser, useAdminUpdateBalance, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Ban, Unlock, Edit, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminListUsers({ page: 1, limit: 50, search: search || undefined });
  const blockUser = useAdminBlockUser();
  const updateBalance = useAdminUpdateBalance();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  const handleToggleBlock = (userId: number, currentStatus: string) => {
    const isBlocked = currentStatus === "blocked";
    blockUser.mutate({ id: userId, data: { blocked: !isBlocked } }, {
      onSuccess: () => {
        toast({ title: isBlocked ? "Utilisateur débloqué" : "Utilisateur bloqué" });
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      }
    });
  };

  const handleUpdateBalance = () => {
    if (!selectedUser) return;
    updateBalance.mutate({ id: selectedUser, data: { balance: Number(balanceAmount), reason: balanceReason } }, {
      onSuccess: () => {
        toast({ title: "Solde mis à jour" });
        setIsBalanceDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        setBalanceAmount("");
        setBalanceReason("");
      }
    });
  };

  const openBalanceDialog = (userId: number, currentBalance: number) => {
    setSelectedUser(userId);
    setBalanceAmount(currentBalance.toString());
    setIsBalanceDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex gap-2 w-full max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom, email..." 
                className="pl-8" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                  <TableHead>Client</TableHead>
                  <TableHead>Identité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="text-sm font-mono text-muted-foreground">{u.clientId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{u.fullName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? 'default' : u.status === 'blocked' ? 'destructive' : 'secondary'}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.kycStatus === 'verified' ? 'outline' : 'secondary'} className={u.kycStatus === 'verified' ? 'border-green-500 text-green-600' : ''}>
                          {u.kycStatus === 'verified' && <ShieldCheck className="mr-1 h-3 w-3" />}
                          {u.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {u.balance.toFixed(2)} {u.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" title="Modifier le solde" onClick={() => openBalanceDialog(u.id, u.balance)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant={u.status === 'blocked' ? 'default' : 'destructive'} 
                            size="icon" 
                            title={u.status === 'blocked' ? 'Débloquer' : 'Bloquer'}
                            onClick={() => handleToggleBlock(u.id, u.status)}
                          >
                            {u.status === 'blocked' ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
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

      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le solde</DialogTitle>
            <DialogDescription>Cette action créera une entrée de régularisation dans l'historique de l'utilisateur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau solde</label>
              <Input type="number" step="0.01" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motif de la régularisation</label>
              <Input placeholder="Ex: Correction de solde, Prime bienvenue..." value={balanceReason} onChange={(e) => setBalanceReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateBalance} disabled={!balanceAmount || !balanceReason || updateBalance.isPending}>
              {updateBalance.isPending ? "Mise à jour..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
