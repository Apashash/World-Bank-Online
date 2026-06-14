import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTransfer, getListTransfersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const transferSchema = z.object({
  beneficiaryName: z.string().min(2, "Nom requis"),
  amount: z.coerce.number().positive("Montant invalide"),
  currency: z.string().min(3),
  message: z.string().optional(),
  accessType: z.enum(["public", "private", "limited"]),
  expiresAt: z.string().optional(),
});

export default function TransferNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTransfer = useCreateTransfer();

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      beneficiaryName: "",
      amount: 0,
      currency: "EUR",
      message: "",
      accessType: "public",
      expiresAt: "",
    },
  });

  const onSubmit = (data: z.infer<typeof transferSchema>) => {
    createTransfer.mutate({ data }, {
      onSuccess: (res) => {
        toast({ title: "Virement créé avec succès" });
        queryClient.invalidateQueries({ queryKey: getListTransfersQueryKey() });
        setLocation(`/transfers/${res.id}`);
      },
      onError: (err: any) => {
        toast({
          title: "Erreur",
          description: err.message || "Impossible de créer le virement",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Nouveau virement</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du virement</CardTitle>
          <CardDescription>Saisissez les informations pour générer un lien de virement.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="beneficiaryName" render={({ field }) => (
                <FormItem><FormLabel>Nom du bénéficiaire</FormLabel><FormControl><Input placeholder="Entreprise ou Particulier" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Montant</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Devise" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="accessType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'accès</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Type d'accès" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public (Lien ouvert)</SelectItem>
                      <SelectItem value="private">Privé (Authentification requise)</SelectItem>
                      <SelectItem value="limited">Limité (Usage unique)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem><FormLabel>Message (optionnel)</FormLabel><FormControl><Textarea placeholder="Motif du virement..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setLocation("/transfers")}>Annuler</Button>
                <Button type="submit" disabled={createTransfer.isPending}>
                  {createTransfer.isPending ? "Création..." : "Générer le virement"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
