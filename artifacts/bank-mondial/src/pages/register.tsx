import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(5, "Numéro de téléphone requis"),
  country: z.string().min(2, "Pays requis"),
  password: z.string().min(6, "Mot de passe trop court"),
  referralCode: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", country: "FR", password: "", referralCode: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("auth_token", res.token);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Erreur d'inscription",
          description: err.message || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <Card className="w-full max-w-lg shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Bank Mondial</CardTitle>
          <CardDescription className="text-base">Rejoignez la banque en ligne premium</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Nom et Prénom</FormLabel><FormControl><Input placeholder="Jean Dupont" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="jean.dupont@exemple.fr" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="+33 6 12 34 56 78" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Pays</FormLabel><FormControl><Input placeholder="FR" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="referralCode" render={({ field }) => (
                <FormItem><FormLabel>Code de parrainage (optionnel)</FormLabel><FormControl><Input placeholder="CODE123" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Création..." : "Ouvrir mon compte"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <p className="text-sm text-muted-foreground">
            Déjà client ?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
