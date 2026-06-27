import { useAdminListKyc, useAdminReviewKyc, getAdminListKycQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AdminKyc() {
  const { data: kycResponse, isLoading } = useAdminListKyc();
  const kycs = Array.isArray(kycResponse) ? kycResponse : (kycResponse as any)?.kycs ?? [];
  const reviewKyc = useAdminReviewKyc();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedKycId, setSelectedKycId] = useState<number | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (id: number) => {
    reviewKyc.mutate({ id, data: { status: "verified" } }, {
      onSuccess: () => {
        toast({ title: "KYC approuvé" });
        queryClient.invalidateQueries({ queryKey: getAdminListKycQueryKey() });
      }
    });
  };

  const handleReject = () => {
    if (!selectedKycId) return;
    reviewKyc.mutate({ id: selectedKycId, data: { status: "rejected", rejectionReason } }, {
      onSuccess: () => {
        toast({ title: "KYC rejeté" });
        setIsRejectDialogOpen(false);
        setRejectionReason("");
        queryClient.invalidateQueries({ queryKey: getAdminListKycQueryKey() });
      }
    });
  };

  const openRejectDialog = (id: number) => {
    setSelectedKycId(id);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Révision KYC</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dossiers en attente de vérification</CardTitle>
          <CardDescription>Validez ou rejetez les documents soumis par les utilisateurs.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur (ID)</TableHead>
                  <TableHead>Type document</TableHead>
                  <TableHead>Date soumission</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!kycs || kycs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun dossier KYC à réviser.
                    </TableCell>
                  </TableRow>
                ) : (
                  kycs.map((kyc) => (
                    <TableRow key={kyc.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        User #{kyc.userId}
                      </TableCell>
                      <TableCell>
                        {kyc.documentType === 'id_card' ? 'Carte d\'identité' : kyc.documentType === 'passport' ? 'Passeport' : 'Permis'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(kyc.submittedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={kyc.status === 'pending' ? 'outline' : kyc.status === 'verified' ? 'default' : 'destructive'} 
                               className={kyc.status === 'pending' ? 'text-amber-600 border-amber-600' : ''}>
                          {kyc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {kyc.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(kyc.id)} disabled={reviewKyc.isPending}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Valider
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => openRejectDialog(kyc.id)} disabled={reviewKyc.isPending}>
                              <XCircle className="h-4 w-4 mr-1" /> Rejeter
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le dossier KYC</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motif du rejet (visible par l'utilisateur)</label>
              <Input 
                placeholder="Ex: Pièce d'identité illisible, date expirée..." 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || reviewKyc.isPending}>
              {reviewKyc.isPending ? "Traitement..." : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
