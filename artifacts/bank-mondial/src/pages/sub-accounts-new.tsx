import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateSubAccount, getListSubAccountsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const permissions = [
  { id: "read_balance", label: "Voir le solde" },
  { id: "read_transfers", label: "Voir l'historique des virements" },
  { id: "create_transfers", label: "Créer des virements" },
] as const;

const subAccountSchema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe requis (min 6 caractères)"),
  permissions: z.array(z.string()).min(1, "Sélectionnez au moins une permission"),
});

export default function SubAccountNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSubAccount = useCreateSubAccount();

  const form = useForm<z.infer<typeof subAccountSchema>>({
    resolver: zodResolver(subAccountSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      permissions: ["read_balance"],
    },
  });

  const onSubmit = (data: z.infer<typeof subAccountSchema>) => {
    createSubAccount.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Sous-compte créé avec succès" });
        queryClient.invalidateQueries({ queryKey: getListSubAccountsQueryKey() });
        setLocation("/sub-accounts");
      },
      onError: (err: any) => {
        toast({
          title: "Erreur",
          description: err.message || "Impossible de créer le sous-compte",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau sous-compte</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du compte délégué</CardTitle>
          <CardDescription>Créez un accès limité pour un collaborateur.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Nom et prénom</FormLabel><FormControl><Input placeholder="Marc Dupont" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="marc.dupont@entreprise.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Mot de passe temporaire</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="permissions" render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Permissions</FormLabel>
                    <FormDescription>Sélectionnez les droits accordés à ce sous-compte.</FormDescription>
                  </div>
                  {permissions.map((permission) => (
                    <FormField key={permission.id} control={form.control} name="permissions" render={({ field }) => {
                      return (
                        <FormItem key={permission.id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value?.includes(permission.id)} onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, permission.id])
                                  : field.onChange(field.value?.filter((value) => value !== permission.id))
                              }} />
                          </FormControl>
                          <FormLabel className="font-normal">{permission.label}</FormLabel>
                        </FormItem>
                      )
                    }} />
                  ))}
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setLocation("/sub-accounts")}>Annuler</Button>
                <Button type="submit" disabled={createSubAccount.isPending}>
                  {createSubAccount.isPending ? "Création..." : "Créer le sous-compte"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

const FormDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[0.8rem] text-muted-foreground">{children}</p>
);
