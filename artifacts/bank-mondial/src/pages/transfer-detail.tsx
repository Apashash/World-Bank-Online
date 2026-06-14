import { useGetTransfer, useUpdateTransfer } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, ArrowLeft, ExternalLink, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTransferQueryKey } from "@workspace/api-client-react";

export default function TransferDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transfer, isLoading } = useGetTransfer(id, {
    query: { enabled: !!id, queryKey: getGetTransferQueryKey(id) }
  });

  const updateTransfer = useUpdateTransfer();

  const handleCopyLink = () => {
    if (transfer?.linkUrl) {
      navigator.clipboard.writeText(window.location.origin + transfer.linkUrl);
      toast({ title: "Lien copié dans le presse-papier" });
    }
  };

  const handleCancel = () => {
    if (confirm("Voulez-vous vraiment annuler ce virement ?")) {
      updateTransfer.mutate({ id, data: { status: "cancelled" } }, {
        onSuccess: () => {
          toast({ title: "Virement annulé" });
          queryClient.invalidateQueries({ queryKey: getGetTransferQueryKey(id) });
        }
      });
    }
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;
  if (!transfer) return <div className="p-8">Virement introuvable</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transfers"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Détail du virement</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Informations</CardTitle>
                <CardDescription>Réf: {transfer.reference}</CardDescription>
              </div>
              <Badge variant={transfer.status === 'completed' ? 'default' : transfer.status === 'cancelled' ? 'destructive' : 'secondary'}>
                {transfer.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Bénéficiaire</span>
              <span className="font-medium">{transfer.beneficiaryName}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-bold text-xl">{transfer.amount.toFixed(2)} {transfer.currency}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Date de création</span>
              <span>{format(new Date(transfer.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}</span>
            </div>
            {transfer.confirmedAt && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Date de confirmation</span>
                <span>{format(new Date(transfer.confirmedAt), "dd MMM yyyy HH:mm", { locale: fr })}</span>
              </div>
            )}
            {transfer.message && (
              <div className="py-2 border-b">
                <span className="text-muted-foreground block mb-1">Message</span>
                <span className="italic">{transfer.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lien de partage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-md text-xs font-mono break-all break-words">
                {window.location.origin}{transfer.linkUrl}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" /> Copier
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={transfer.linkUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {transfer.status === 'pending' && (
            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <Button variant="destructive" className="w-full" onClick={handleCancel} disabled={updateTransfer.isPending}>
                  <Ban className="mr-2 h-4 w-4" /> Annuler le virement
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
