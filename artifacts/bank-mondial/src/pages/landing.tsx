import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Smartphone, CheckCircle2, ArrowRight, Zap, Globe, Lock } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 bg-primary/95 backdrop-blur-md border-b border-primary-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between text-primary-foreground">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-secondary" />
            Bank Mondial
          </div>
          <div className="hidden md:flex gap-6 items-center text-sm font-medium">
            <Link href="#features" className="hover:text-secondary transition-colors">Fonctionnalités</Link>
            <Link href="#cards" className="hover:text-secondary transition-colors">Cartes</Link>
            <Link href="#mobility" className="hover:text-secondary transition-colors">Mobilité</Link>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="text-primary-foreground hover:bg-white/10 hidden sm:inline-flex" asChild>
              <Link href="/login">Espace Client</Link>
            </Button>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
              <Link href="/register">Ouvrir un compte</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tighter">
                Votre compte est <span className="text-secondary">déjà rentable</span>.
              </h1>
              <p className="text-xl text-primary-foreground/80 leading-relaxed max-w-lg">
                Jusqu'à 250€ offerts pour toute première ouverture de compte bancaire. La banque en ligne premium, sans compromis sur la sécurité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 h-14" asChild>
                  <Link href="/register">Ouvrir un compte</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 h-14" asChild>
                  <Link href="#features">Découvrir les offres</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-primary-foreground/70">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-secondary" /> Sans engagement</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-secondary" /> 100% digital</span>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="aspect-square bg-gradient-to-br from-secondary/30 to-transparent rounded-full absolute -inset-10 blur-3xl opacity-60"></div>
              <div className="relative h-[500px] w-full flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 bg-card rounded-2xl shadow-2xl border border-border rotate-[-10deg] transform origin-bottom-left transition-transform hover:rotate-0 duration-500 overflow-hidden">
                  <div className="h-48 bg-primary p-6 flex flex-col justify-between text-primary-foreground">
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-8 h-8 opacity-80" />
                      <span className="font-mono text-xs opacity-70">BANK MONDIAL</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl font-bold tracking-widest">**** **** **** 4092</div>
                      <div className="flex justify-between text-xs opacity-80 uppercase tracking-widest">
                        <span>JEAN DUPONT</span>
                        <span>12/28</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Une banque pensée pour vous</h2>
              <p className="text-muted-foreground text-lg">Tout ce dont vous avez besoin pour gérer votre argent au quotidien, directement depuis votre espace client.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Virements instantanés gratuits", desc: "Envoyez et recevez de l'argent en quelques secondes, sans frais supplémentaires." },
                { icon: Globe, title: "Paiements internationaux", desc: "0€ de frais sur vos paiements et retraits par carte partout dans le monde." },
                { icon: Lock, title: "Sécurité maximale", desc: "Double authentification, blocage de carte en 1 clic et limites personnalisables." }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Card Comparison */}
        <section id="cards" className="py-24 bg-muted/50 border-y">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Choisissez la carte qui vous correspond</h2>
              <p className="text-muted-foreground text-lg">Nos cartes Mastercard sont gratuites sous réserve d'utilisation.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Card 1 */}
              <div className="bg-card rounded-2xl border p-8 shadow-sm flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="bg-secondary/20 text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">SANS CONDITIONS</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Fosfo Mastercard</h3>
                <div className="text-4xl font-extrabold mb-6">0€<span className="text-sm font-normal text-muted-foreground"> /mois</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Paiements et retraits gratuits partout dans le monde</span>
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Carte à débit immédiat</span>
                  </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Assurances et assistances de base</span>
                  </li>
                </ul>
                <Button className="w-full text-lg h-12" asChild>
                  <Link href="/register">Choisir Fosfo</Link>
                </Button>
              </div>

              {/* Card 2 */}
              <div className="bg-primary text-primary-foreground rounded-2xl border border-primary-border p-8 shadow-xl flex flex-col relative overflow-hidden transform md:-translate-y-4">
                <div className="absolute top-0 right-0 p-4">
                  <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">PREMIUM</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-secondary">Gold Mastercard</h3>
                <div className="text-4xl font-extrabold mb-6">0€<span className="text-sm font-normal text-primary-foreground/70"> /mois</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <span>Paiements et retraits gratuits partout dans le monde</span>
                  </li>
                  <li className="flex items-start gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <span>Débit immédiat ou différé au choix</span>
                  </li>
                  <li className="flex items-start gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <span>Plafonds de paiement et de retrait plus élevés</span>
                  </li>
                  <li className="flex items-start gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <span>Assurances voyages et loisirs étendues</span>
                  </li>
                </ul>
                <Button className="w-full text-lg h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
                  <Link href="/register">Choisir Gold</Link>
                </Button>
                <div className="text-center mt-4 text-xs text-primary-foreground/60">
                  Sous réserve de 1800€ de revenus nets mensuels
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobility Section */}
        <section id="mobility" className="py-24 bg-background">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 bg-muted rounded-2xl aspect-square p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
              <div className="relative z-10 w-full max-w-sm space-y-4">
                <div className="bg-card p-4 rounded-lg shadow-sm flex items-center gap-4 border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Prélèvements transférés</div>
                    <div className="text-xs text-muted-foreground">EDF, Orange, Free...</div>
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-sm flex items-center gap-4 border ml-8">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Virements récurrents</div>
                    <div className="text-xs text-muted-foreground">Salaire, CAF, Mutuelle...</div>
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-sm flex items-center gap-4 border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Ancien compte clôturé</div>
                    <div className="text-xs text-muted-foreground">Automatiquement et sans frais</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Changer de banque n'a jamais été aussi simple</h2>
              <p className="text-xl text-muted-foreground">
                Avec notre service de mobilité bancaire gratuit NeoChange, nous nous occupons de tout.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</span>
                  <div>
                    <strong className="block mb-1">Ouvrez votre compte</strong>
                    <span className="text-muted-foreground">En quelques minutes depuis votre smartphone ou ordinateur.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</span>
                  <div>
                    <strong className="block mb-1">Signez le mandat de mobilité</strong>
                    <span className="text-muted-foreground">Une simple signature électronique suffit. Nous contactons votre ancienne banque.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</span>
                  <div>
                    <strong className="block mb-1">Profitez de Bank Mondial</strong>
                    <span className="text-muted-foreground">Vos prélèvements et virements sont automatiquement redirigés.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground text-center px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">Prêt à reprendre le contrôle ?</h2>
            <p className="text-xl text-primary-foreground/80">
              Rejoignez les milliers de clients qui font déjà confiance à Bank Mondial pour la gestion de leur argent.
            </p>
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-10 h-14" asChild>
              <Link href="/register">Ouvrir un compte en 5 minutes <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-[#0f1f15] text-white/60 py-16 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="font-bold text-xl text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-secondary" />
                Bank Mondial
              </div>
              <p className="text-sm">La banque premium qui vous en donne plus. Sans frais cachés, sans compromis.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Comptes & Cartes</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-secondary transition-colors">Compte courant</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Fosfo Mastercard</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Gold Mastercard</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-secondary transition-colors">Mobilité bancaire</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Parrainage</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Virements instantanés</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-secondary transition-colors">Mentions légales</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Données personnelles</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Cookies</Link></li>
                <li><Link href="#" className="hover:text-secondary transition-colors">Sécurité</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Bank Mondial. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
