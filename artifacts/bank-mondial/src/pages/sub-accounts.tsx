import { useListSubAccounts, useUpdateSubAccount, useDeleteSubAccount, getListSubAccountsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Plus, User, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function getRole(permissions: string[]): string {
  if (permissions.includes("create_transfers")) return "Agent";
  if (permissions.includes("read_transfers")) return "Comptable";
  return "Support";
}

function getRoleStyle(role: string) {
  switch (role) {
    case "Agent": return "bg-blue-100 text-blue-700 border-blue-200";
    case "Comptable": return "bg-purple-100 text-purple-700 border-purple-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getPermissionLabel(p: string) {
  switch (p) {
    case "read_balance": return "Lecture solde";
    case "read_transfers": return "Lecture + Rapports";
    case "create_transfers": return "Virements seulement";
    default: return p;
  }
}

export default function SubAccounts() {
  const { data: subAccounts, isLoading } = useListSubAccounts();
  const updateSubAccount = useUpdateSubAccount();
  const deleteSubAccount = useDeleteSubAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    updateSubAccount.mutate(
      { id, data: { status: newStatus as "active" | "suspended" } },
      {
        onSuccess: () => {
          toast({ title: `Sous-compte ${newStatus === "active" ? "activé" : "suspendu"}` });
          queryClient.invalidateQueries({ queryKey: getListSubAccountsQueryKey() });
        },
        onError: () => {
          toast({ title: "Erreur", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteSubAccount.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Sous-compte supprimé" });
          queryClient.invalidateQueries({ queryKey: getListSubAccountsQueryKey() });
        },
        onError: () => {
          toast({ title: "Erreur lors de la suppression", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Sous-comptes</h1>
        </div>
        <Button asChild className="bg-[#003087] hover:bg-[#002060]">
          <Link href="/sub-accounts/new">
            <Plus className="mr-2 h-4 w-4" /> Créer un sous-compte
          </Link>
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Comptes délégués</CardTitle>
          <CardDescription>Gérez les accès de vos collaborateurs ou membres de famille.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Nom</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Rôle</TableHead>
                  <TableHead className="font-semibold text-gray-700">Permissions</TableHead>
                  <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(subAccounts) || subAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <User className="h-8 w-8 text-gray-300" />
                        <p>Aucun sous-compte configuré.</p>
                        <Link href="/sub-accounts/new">
                          <Button variant="outline" size="sm" className="mt-1">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Créer un sous-compte
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  subAccounts.map((account) => {
                    const role = getRole(account.permissions);
                    return (
                      <TableRow key={account.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] font-bold text-sm shrink-0">
                              {account.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{account.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{account.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleStyle(role)}`}>
                            {role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {account.permissions.map((p) => (
                              <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {getPermissionLabel(p)}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={account.status === "active" ? "default" : "secondary"}
                            className={account.status === "active" ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"}
                          >
                            {account.status === "active" ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={account.status === "active" ? "Suspendre" : "Activer"}
                              onClick={() => handleToggleStatus(account.id, account.status)}
                              disabled={updateSubAccount.isPending}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer le sous-compte ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Vous allez supprimer le sous-compte de <strong>{account.fullName}</strong>. Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(account.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
