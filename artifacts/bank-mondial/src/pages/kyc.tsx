import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetKyc, useSubmitKyc, getGetKycQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldAlert, Clock, Upload, X, FileImage, FileScan, Camera, ArrowLeft } from "lucide-react";
import { useRef, useState, useCallback } from "react";

const kycSchema = z.object({
  documentType: z.enum(["id_card", "passport", "driving_license"]),
  documentNumber: z.string().min(5, "Numéro de document requis"),
  documentFrontUrl: z.string().min(1, "Document recto requis"),
  documentBackUrl: z.string().optional(),
  selfieUrl: z.string().min(1, "Selfie / photo requis"),
});

type UploadState = {
  uploading: boolean;
  preview: string | null;
  filename: string | null;
  error: string | null;
};

function useFileUpload(onUploaded: (url: string) => void) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    preview: null,
    filename: null,
    error: null,
  });

  const upload = useCallback(async (file: File) => {
    setState({ uploading: true, preview: null, filename: null, error: null });
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith("image/")) {
        setState((s) => ({ ...s, preview: e.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setState((s) => ({ ...s, uploading: false, error: err.error || "Erreur d'envoi" }));
        return;
      }
      const { url, filename } = await res.json();
      setState((s) => ({ ...s, uploading: false, filename }));
      onUploaded(url);
    } catch {
      setState((s) => ({ ...s, uploading: false, error: "Erreur réseau" }));
    }
  }, [onUploaded]);

  const reset = useCallback(() => {
    setState({ uploading: false, preview: null, filename: null, error: null });
  }, []);

  return { state, upload, reset };
}

type DropZoneProps = {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  onUploaded: (url: string) => void;
  value: string;
  onChange: (url: string) => void;
  error?: string;
};

function DropZone({ label, hint, icon, onUploaded, value, onChange, error }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const { state, upload, reset } = useFileUpload((url) => {
    onChange(url);
    onUploaded(url);
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    onChange("");
    upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clear = () => {
    reset();
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasFile = !!value || state.uploading;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          dragging
            ? "border-[#003087] bg-blue-50"
            : hasFile
            ? "border-green-400 bg-green-50"
            : "border-gray-200 hover:border-[#003087] hover:bg-blue-50/40"
        } ${state.error ? "border-red-300 bg-red-50" : ""}`}
        onClick={() => !hasFile && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {state.uploading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="h-8 w-8 rounded-full border-2 border-[#003087] border-t-transparent animate-spin" />
            <span className="text-sm text-[#003087] font-medium">Envoi en cours...</span>
          </div>
        ) : state.preview && value ? (
          <div className="relative p-2">
            <img src={state.preview} alt="Aperçu" className="w-full max-h-40 object-contain rounded-lg" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
            <div className="mt-1 flex items-center gap-1 px-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[11px] text-green-600 font-medium truncate">{state.filename}</span>
            </div>
          </div>
        ) : value && !state.preview ? (
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-green-700 font-medium">Fichier envoyé</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              {icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Glissez-déposez ou <span className="text-[#003087] underline">choisissez un fichier</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP ou PDF — max 10 Mo</p>
            </div>
          </div>
        )}
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {error && !state.error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function Kyc() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kyc, isLoading } = useGetKyc();
  const submitKyc = useSubmitKyc();

  const form = useForm<z.infer<typeof kycSchema>>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      documentType: "id_card",
      documentNumber: "",
      documentFrontUrl: "",
      documentBackUrl: "",
      selfieUrl: "",
    },
  });

  const docType = form.watch("documentType");

  const onSubmit = (data: z.infer<typeof kycSchema>) => {
    submitKyc.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Documents soumis avec succès" });
        queryClient.invalidateQueries({ queryKey: getGetKycQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Erreur",
          description: err.message || "Impossible de soumettre les documents",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vérification d'identité (KYC)</h1>
          <p className="text-sm text-muted-foreground mt-1">Conformément à la réglementation bancaire, nous devons vérifier votre identité.</p>
        </div>
      </div>

      {kyc && kyc.status === "verified" && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-green-800">Identité vérifiée</h3>
              <p className="text-green-700/80 text-sm">Votre compte bénéficie de l'ensemble des services Banque Mondiale sans limites de plafond.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {kyc && kyc.status === "pending" && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-yellow-800">Vérification en cours</h3>
              <p className="text-yellow-700/80 text-sm">Vos documents sont en cours d'analyse par nos équipes. Cette opération prend généralement moins de 24h.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {kyc && kyc.status === "rejected" && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-red-800">Vérification refusée</h3>
              <p className="text-red-700/80 text-sm mb-1">Motif : {kyc.rejectionReason || "Document non conforme ou illisible"}</p>
              <p className="text-sm font-medium text-red-800">Veuillez soumettre à nouveau vos documents ci-dessous.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(!kyc || kyc.status === "rejected") && (
        <Card>
          <CardHeader>
            <CardTitle>Soumettre vos documents</CardTitle>
            <CardDescription>Téléversez les photos de vos documents d'identité et un selfie pour valider votre compte.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="documentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de pièce d'identité</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type de document" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="id_card">Carte Nationale d'Identité</SelectItem>
                        <SelectItem value="passport">Passeport</SelectItem>
                        <SelectItem value="driving_license">Permis de conduire</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="documentNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro du document</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="border-t pt-6 space-y-5">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#003087]" />
                    Téléversement des documents
                  </h4>

                  <FormField
                    control={form.control}
                    name="documentFrontUrl"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <DropZone
                            label="Document — Recto"
                            hint={docType === "passport" ? "Photo de la page principale de votre passeport" : "Photo de la face avant de votre document"}
                            icon={<FileScan className="h-6 w-6" />}
                            value={field.value}
                            onChange={field.onChange}
                            onUploaded={field.onChange}
                            error={fieldState.error?.message}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {docType === "id_card" && (
                    <FormField
                      control={form.control}
                      name="documentBackUrl"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <DropZone
                              label="Document — Verso"
                              hint="Photo de la face arrière de votre carte d'identité"
                              icon={<FileImage className="h-6 w-6" />}
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              onUploaded={field.onChange}
                              error={fieldState.error?.message}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="selfieUrl"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <DropZone
                            label="Selfie / Vérification faciale"
                            hint="Prenez une photo de vous en tenant votre document d'identité bien visible"
                            icon={<Camera className="h-6 w-6" />}
                            value={field.value}
                            onChange={field.onChange}
                            onUploaded={field.onChange}
                            error={fieldState.error?.message}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={submitKyc.isPending}
                    className="bg-[#003087] hover:bg-[#002060] text-white px-6"
                  >
                    {submitKyc.isPending ? "Transmission..." : "Soumettre pour vérification"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
