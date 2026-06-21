import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Share2, CheckCheck, QrCode } from "lucide-react";
import { useGetMe, useGetDashboardSummary } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Recevoir() {
  const { data: user } = useGetMe();
  const { data: summary } = useGetDashboardSummary();
  const { toast } = useToast();
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedBic, setCopiedBic] = useState(false);

  const iban = summary?.iban || "FR76 3000 6000 0112 3456 7890 189";
  const bic = "BNPAFRPPXXX";

  const copy = (text: string, which: "iban" | "bic") => {
    navigator.clipboard.writeText(text);
    if (which === "iban") {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } else {
      setCopiedBic(true);
      setTimeout(() => setCopiedBic(false), 2000);
    }
    toast({ title: "Copié !", description: `${which.toUpperCase()} copié dans le presse-papier.` });
  };

  const share = async () => {
    const text = `Voici mes coordonnées bancaires :\nNom : ${user?.fullName}\nIBAN : ${iban}\nBIC : ${bic}`;
    if (navigator.share) {
      await navigator.share({ title: "Coordonnées bancaires", text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Coordonnées copiées", description: "Partagez-les comme vous le souhaitez." });
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Download className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recevoir de l'argent</h1>
          <p className="text-sm text-gray-500">Partagez vos coordonnées bancaires</p>
        </div>
      </div>

      {/* QR Code placeholder */}
      <Card className="border shadow-sm text-center">
        <CardContent className="pt-8 pb-8">
          <div className="inline-flex items-center justify-center h-40 w-40 border-2 border-dashed border-[#003087]/30 rounded-2xl bg-blue-50 mx-auto">
            <div className="text-center space-y-2">
              <QrCode className="h-12 w-12 text-[#003087] mx-auto" />
              <p className="text-xs text-gray-500 font-medium">QR Code IBAN</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Faites scanner ce code pour recevoir un virement</p>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Coordonnées bancaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Titulaire</p>
            <p className="text-sm font-semibold text-gray-900">{user?.fullName || "—"}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">IBAN</p>
                <p className="text-sm font-mono font-semibold text-gray-900 break-all">{iban}</p>
              </div>
              <button
                onClick={() => copy(iban, "iban")}
                className="shrink-0 p-2 rounded-lg hover:bg-white transition-colors"
              >
                {copiedIban ? <CheckCheck className="h-4 w-4 text-[#6DC142]" /> : <Copy className="h-4 w-4 text-gray-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">BIC / SWIFT</p>
                <p className="text-sm font-mono font-semibold text-gray-900">{bic}</p>
              </div>
              <button
                onClick={() => copy(bic, "bic")}
                className="shrink-0 p-2 rounded-lg hover:bg-white transition-colors"
              >
                {copiedBic ? <CheckCheck className="h-4 w-4 text-[#6DC142]" /> : <Copy className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Banque</p>
            <p className="text-sm font-semibold text-gray-900">Banque Mondiale</p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={share}
        className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Partager mes coordonnées
      </Button>
    </div>
  );
}
