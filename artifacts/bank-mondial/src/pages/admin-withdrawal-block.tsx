import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, ShieldCheck, MessageCircle, Lock, Save, ArrowLeft, Phone } from "lucide-react";
import { Link } from "wouter";

function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

export default function AdminWithdrawalBlock() {
  const { toast } = useToast();
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch("/api/admin/settings/withdrawal-block")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setBlocked(data.blocked ?? false);
          setReason(data.reason ?? "");
          setWhatsapp(data.whatsapp ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await authFetch("/api/admin/settings/withdrawal-block", {
        method: "POST",
        body: JSON.stringify({ blocked, reason, whatsapp }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Erreur");
      toast({ title: blocked ? "🔒 Retraits bloqués pour tous les utilisateurs" : "✅ Retraits débloqués" });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, je souhaite débloquer mon retrait sur Banque Mondiale.")}`
    : "#";

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <Link href="/admin/users">
          <button className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blocage global des retraits</h1>
          <p className="text-sm text-slate-400 mt-0.5">Suspendre tous les virements et retraits utilisateurs</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Status card */}
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: blocked
                ? "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
                : "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
              border: `1.5px solid ${blocked ? "#fca5a5" : "#6ee7b7"}`,
            }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: blocked ? "#ef4444" : "#10b981" }}
            >
              {blocked ? (
                <Lock className="h-7 w-7 text-white" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-white" />
              )}
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: blocked ? "#991b1b" : "#065f46" }}>
                {blocked ? "Retraits actuellement BLOQUÉS" : "Retraits actuellement AUTORISÉS"}
              </p>
              <p className="text-sm mt-0.5" style={{ color: blocked ? "#b91c1c" : "#047857" }}>
                {blocked
                  ? "Aucun utilisateur ne peut effectuer de retrait ou virement."
                  : "Les utilisateurs peuvent effectuer librement leurs opérations."}
              </p>
            </div>
          </div>

          {/* Config form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#003087]" />
              Configuration du blocage
            </h2>

            {/* Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Activer le blocage</p>
                <p className="text-xs text-slate-400 mt-0.5">Bloque tous les retraits et virements</p>
              </div>
              <button
                onClick={() => setBlocked((b) => !b)}
                className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none"
                style={{ background: blocked ? "#ef4444" : "#e2e8f0" }}
              >
                <span
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform"
                  style={{ transform: blocked ? "translateX(22px)" : "translateX(4px)" }}
                />
              </button>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Raison affichée aux utilisateurs
              </label>
              <Textarea
                placeholder="Ex: Maintenance technique en cours. Vos retraits seront disponibles dans les 24h."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-slate-400">
                Ce message sera affiché quand l'utilisateur tente de faire un retrait ou virement.
              </p>
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#25D366]" />
                Numéro WhatsApp de contact
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">+</span>
                <Input
                  className="pl-7 text-sm font-mono"
                  placeholder="33612345678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
              <p className="text-xs text-slate-400">
                Numéro international sans le "+" (ex: 33612345678 pour la France). Les utilisateurs verront un bouton pour vous contacter directement.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full font-bold h-11"
              style={{ background: "#003087" }}
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer la configuration
                </>
              )}
            </Button>
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Aperçu — ce que verront les utilisateurs</h2>

            <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 bg-red-100/60 border-b border-red-200">
                <div className="h-9 w-9 rounded-full bg-red-200 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-red-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Retrait bloqué</p>
                  <p className="text-xs text-red-600">Votre retrait est temporairement suspendu</p>
                </div>
              </div>
              {reason && (
                <div className="px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Raison</p>
                  <p className="text-sm text-red-800 leading-relaxed">{reason}</p>
                </div>
              )}
            </div>

            {whatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 text-white no-underline"
                style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
              >
                <MessageCircle className="h-5 w-5" />
                Contacter le service Banque Mondiale
              </a>
            )}
            {!whatsapp && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-400 text-center">
                Le bouton WhatsApp apparaîtra ici quand un numéro est configuré.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
