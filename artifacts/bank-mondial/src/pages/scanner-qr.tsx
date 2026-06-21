import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Camera, KeyboardIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ScannerQR() {
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({ title: "Code requis", description: "Veuillez saisir un code QR.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    // If it looks like a transfer token, redirect
    if (code.startsWith("http")) {
      const url = new URL(code);
      setLocation(url.pathname);
    } else {
      toast({ title: "QR Code traité", description: `Code reconnu : ${code}` });
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <QrCode className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scanner QR</h1>
          <p className="text-sm text-gray-500">Scannez un code pour payer ou recevoir</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setMode("scan")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "scan" ? "bg-white shadow text-[#003087]" : "text-gray-500"
          }`}
        >
          <Camera className="h-4 w-4" />
          Caméra
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "manual" ? "bg-white shadow text-[#003087]" : "text-gray-500"
          }`}
        >
          <KeyboardIcon className="h-4 w-4" />
          Saisie manuelle
        </button>
      </div>

      {mode === "scan" ? (
        <Card className="border shadow-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-5">
              <div className="relative h-56 w-56">
                <div className="absolute inset-0 border-2 border-dashed border-[#003087]/30 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <QrCode className="h-20 w-20 text-[#003087]/20" />
                </div>
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-[#003087] rounded-tl-lg" />
                <div className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-[#003087] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-[#003087] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-[#003087] rounded-br-lg" />
              </div>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Pointez votre caméra vers un QR code de paiement ou d'identification bancaire
              </p>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                onClick={() => toast({ title: "Caméra", description: "Fonctionnalité disponible sur mobile." })}
              >
                <Camera className="h-4 w-4 mr-2" />
                Activer la caméra
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entrer le code manuellement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="code">Code QR ou lien de paiement</Label>
                <Input
                  id="code"
                  className="mt-2 font-mono"
                  placeholder="https://... ou code de paiement"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Button
            type="submit"
            className="w-full h-12 bg-[#003087] hover:bg-[#002060] text-base font-semibold"
            disabled={loading || !code.trim()}
          >
            {loading ? "Vérification..." : "Valider le code"}
            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </form>
      )}

      <Card className="border border-blue-100 bg-blue-50/50 shadow-none">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#003087] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#003087]">Paiement sécurisé</p>
              <p className="text-xs text-gray-600 mt-0.5">Tous les QR codes sont vérifiés avant traitement. Ne scannez jamais un code de source inconnue.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
