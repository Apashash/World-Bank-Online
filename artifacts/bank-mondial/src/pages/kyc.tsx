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
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle } from "lucide-react";

const kycSchema = z.object({
  documentType: z.enum(["id_card", "passport", "driving_license"]),
  documentNumber: z.string().min(5, "Numéro de document requis"),
  documentFrontUrl: z.string().url("URL de document requise"),
  documentBackUrl: z.string().url("URL de document requise").optional().or(z.literal("")),
  selfieUrl: z.string().url("URL de selfie requise"),
});

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
      documentFrontUrl: "https://example.com/front.jpg", // Pre-filled for demo
      documentBackUrl: "https://example.com/back.jpg",   // Pre-filled for demo
      selfieUrl: "https://example.com/selfie.jpg",       // Pre-filled for demo
    },
  });

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vérification d'identité (KYC)</h1>
      </div>

      {kyc && kyc.status === "verified" && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-green-800 dark:text-green-400">Identité vérifiée</h3>
              <p className="text-green-700/80 dark:text-green-500/80">Votre compte bénéficie de l'ensemble des services Bank Mondial sans limites de plafond.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {kyc && kyc.status === "pending" && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-400">Vérification en cours</h3>
              <p className="text-yellow-700/80 dark:text-yellow-500/80">Vos documents sont en cours d'analyse par nos équipes. Cette opération prend généralement moins de 24h.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {kyc && kyc.status === "rejected" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-destructive">Vérification refusée</h3>
              <p className="text-destructive/80 mb-2">Motif: {kyc.rejectionReason || "Document non conforme ou illisible"}</p>
              <p className="text-sm font-medium">Veuillez soumettre à nouveau vos documents ci-dessous.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(!kyc || kyc.status === "rejected") && (
        <Card>
          <CardHeader>
            <CardTitle>Soumettre vos documents</CardTitle>
            <CardDescription>Conformément à la réglementation bancaire, nous devons vérifier votre identité.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg flex gap-3 mb-6 items-start text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-muted-foreground">
                <strong>Mode démo:</strong> Les URLs des documents sont pré-remplies. Cliquez simplement sur Soumettre pour tester le flux.
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="documentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de pièce d'identité</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Type de document" /></SelectTrigger></FormControl>
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
                  <FormItem><FormLabel>Numéro du document</FormLabel><FormControl><Input placeholder="Ex: 123456789" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-4">Téléversement des fichiers (Simulé via URL)</h4>
                  
                  <div className="space-y-4">
                    <FormField control={form.control} name="documentFrontUrl" render={({ field }) => (
                      <FormItem><FormLabel>URL Document (Recto)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    {form.watch("documentType") === "id_card" && (
                      <FormField control={form.control} name="documentBackUrl" render={({ field }) => (
                        <FormItem><FormLabel>URL Document (Verso)</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                      )} />
                    )}
                    
                    <FormField control={form.control} name="selfieUrl" render={({ field }) => (
                      <FormItem><FormLabel>URL Selfie / Vérification faciale</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={submitKyc.isPending}>
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
