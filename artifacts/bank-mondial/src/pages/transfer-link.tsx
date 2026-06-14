import { useGetTransferByToken, useConfirmTransfer } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileDown, ShieldAlert, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function TransferLink() {
  const params = useParams();
  const token = params.token as string;

  const { data: transfer, isLoading, error } = useGetTransferByToken(token, {
    query: { enabled: !!token }
  });

  const confirmTransfer = useConfirmTransfer();

  const handleConfirm = () => {
    confirmTransfer.mutate({ token }, {
      onSuccess: () => {
        // Will refresh the query since we might invalidate or just refetch
        window.location.reload();
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30">Chargement...</div>;
  }

  if (error || !transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center py-8">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="mb-2">Lien invalide ou expiré</CardTitle>
          <CardDescription>Ce virement n'est plus accessible ou n'existe pas.</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6 border-b">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
            <ArrowRight className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Virement reçu</CardTitle>
          <CardDescription>
            {transfer.status === "completed" ? "Ce virement a été confirmé" : "Un virement est en attente de confirmation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Bénéficiaire</span>
            <span className="font-medium">{transfer.beneficiaryName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-bold text-xl">{transfer.amount.toFixed(2)} {transfer.currency}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Référence</span>
            <span className="font-medium text-xs font-mono bg-muted px-2 py-1 rounded">{transfer.reference}</span>
          </div>
          {transfer.message && (
            <div className="py-2 border-b">
              <span className="text-muted-foreground block mb-1">Message</span>
              <span className="font-medium italic">"{transfer.message}"</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Date d'émission</span>
            <span className="font-medium text-sm">
              {format(new Date(transfer.createdAt), "dd MMMM yyyy", { locale: fr })}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t bg-muted/10 p-6">
          {transfer.status === "pending" ? (
            <Button className="w-full h-12 text-lg" onClick={handleConfirm} disabled={confirmTransfer.isPending}>
              {confirmTransfer.isPending ? "Confirmation..." : "Confirmer la réception"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-medium w-full justify-center py-3 bg-green-50 rounded-md">
              <CheckCircle2 className="h-5 w-5" /> Virement confirmé
            </div>
          )}
          <Button variant="outline" className="w-full">
            <FileDown className="mr-2 h-4 w-4" />
            Télécharger le reçu
          </Button>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-primary hover:underline font-medium">
              Découvrir Bank Mondial
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
