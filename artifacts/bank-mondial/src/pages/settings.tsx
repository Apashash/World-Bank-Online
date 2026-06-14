import { useGetMe, useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { User } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  phone: z.string().min(5, "Numéro requis"),
  country: z.string().min(2, "Pays requis"),
});

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      country: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        country: user.country || "",
      });
    }
  }, [user, form]);

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    updateUser.mutate({ id: user.id, data }, {
      onSuccess: () => {
        toast({ title: "Profil mis à jour" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Erreur",
          description: err.message || "Impossible de mettre à jour le profil",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <CardTitle>Profil personnel</CardTitle>
              <CardDescription>Mettez à jour vos informations personnelles.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Client ID</span>
              <span className="font-mono">{user?.clientId}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span>{user?.email}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
