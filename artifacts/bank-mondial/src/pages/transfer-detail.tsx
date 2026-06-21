import { useGetTransfer, useUpdateTransfer, getGetTransferQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, ArrowLeft, ExternalLink, Ban, Share2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> Complété
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-200">
          <XCircle className="h-3.5 w-3.5" /> Annulé
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200">
          <Clock className="h-3.5 w-3.5" /> Expiré
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-200">
          <Clock className="h-3.5 w-3.5" /> En attente
        </span>
      );
  }
}

export default function TransferDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transfer, isLoading } = useGetTransfer(id, {
    query: { enabled: !!id, queryKey: getGetTransferQueryKey(id) }
  });

  const updateTransfer = useUpdateTransfer();

  const fullLink = transfer ? `${window.location.origin}${transfer.linkUrl}` : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullLink);
    toast({ title: "Lien copié !" });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Virement introuvable</p>
      </div>
    );
  }

  const shareLinks = [
    {
      label: "WhatsApp",
      color: "#25D366",
      icon: "W",
      href: `https://wa.me/?text=${encodeURIComponent(`Virement de ${transfer.amount.toFixed(2)} ${transfer.currency} - Confirmez ici : ${fullLink}`)}`,
    },
    {
      label: "Facebook",
      color: "#1877F2",
      icon: "f",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullLink)}`,
    },
    {
      label: "Telegram",
      color: "#229ED9",
      icon: "T",
      href: `https://t.me/share/url?url=${encodeURIComponent(fullLink)}`,
    },
    {
      label: "Email",
      color: "#6b7280",
      icon: "✉",
      href: `mailto:?subject=${encodeURIComponent(`Virement ${transfer.reference}`)}&body=${encodeURIComponent(`Confirmez la réception du virement de ${transfer.amount.toFixed(2)} ${transfer.currency}.\n\nLien : ${fullLink}`)}`,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transfers"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Détail du virement</h1>
          <StatusBadge status={transfer.status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main info */}
        <Card className="md:col-span-2 border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">Informations</CardTitle>
                <CardDescription className="font-mono text-xs mt-0.5">{transfer.reference}</CardDescription>
              </div>
              <span className="text-2xl font-bold text-[#003087]">
                {transfer.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {transfer.currency}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { label: "Bénéficiaire", value: transfer.beneficiaryName },
              { label: "Date de création", value: format(new Date(transfer.createdAt), "dd MMM yyyy HH:mm", { locale: fr }) },
              ...(transfer.confirmedAt
                ? [{ label: "Date de confirmation", value: format(new Date(transfer.confirmedAt), "dd MMM yyyy HH:mm", { locale: fr }) }]
                : []),
              ...(transfer.expiresAt
                ? [{ label: "Date d'expiration", value: format(new Date(transfer.expiresAt), "dd MMM yyyy", { locale: fr }) }]
                : []),
              { label: "Type d'accès", value: transfer.accessType === "public" ? "Public" : transfer.accessType === "private" ? "Privé" : "Limité" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium text-gray-900">{row.value}</span>
              </div>
            ))}
            {transfer.message && (
              <div className="py-3 border-t border-gray-100">
                <span className="text-sm text-muted-foreground block mb-1.5">Message</span>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm italic text-gray-700">"{transfer.message}"</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link panel */}
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Lien de partage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs font-mono text-blue-700 break-all">
                {fullLink}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 text-xs" onClick={handleCopyLink}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copier
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                  <a href={transfer.linkUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>

              <div className="pt-1">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Share2 className="h-3 w-3" /> Partager via
                </p>
                <div className="flex gap-2">
                  {shareLinks.map((sl) => (
                    <a
                      key={sl.label}
                      href={sl.href}
                      target="_blank"
                      rel="noreferrer"
                      title={sl.label}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: sl.color }}
                    >
                      {sl.icon}
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {transfer.status === "pending" && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
              disabled={updateTransfer.isPending}
            >
              <Ban className="mr-2 h-4 w-4" />
              Annuler le virement
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
