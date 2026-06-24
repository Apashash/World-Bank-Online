import { Link } from "wouter";
import {
  Wallet, Send, Download, QrCode, Landmark, Receipt,
  LayoutDashboard, Users, CreditCard, ShieldCheck, Settings, ArrowUpRight,
} from "lucide-react";

const ACTIONS = [
  { icon: Wallet, label: "Dépôt", href: "/depot", color: "bg-blue-50 text-[#003087]" },
  { icon: Send, label: "Envoyer", href: "/transfers/new", color: "bg-blue-50 text-[#003087]" },
  { icon: Download, label: "Recevoir", href: "/recevoir", color: "bg-blue-50 text-[#003087]" },
  { icon: QrCode, label: "Scanner QR", href: "/scanner-qr", color: "bg-blue-50 text-[#003087]" },
  { icon: Landmark, label: "Retrait", href: "/retrait", color: "bg-blue-50 text-[#003087]" },
  { icon: Receipt, label: "Payer factures", href: "/payer-factures", color: "bg-blue-50 text-[#003087]" },
];

const NAV = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard", color: "bg-green-50 text-[#6DC142]" },
  { icon: ArrowUpRight, label: "Virements", href: "/transfers", color: "bg-green-50 text-[#6DC142]" },
  { icon: Users, label: "Sous-comptes", href: "/sub-accounts", color: "bg-green-50 text-[#6DC142]" },
  { icon: CreditCard, label: "Parrainage", href: "/referrals", color: "bg-green-50 text-[#6DC142]" },
  { icon: ShieldCheck, label: "KYC & Sécurité", href: "/kyc", color: "bg-green-50 text-[#6DC142]" },
  { icon: Settings, label: "Paramètres", href: "/settings", color: "bg-green-50 text-[#6DC142]" },
];

function Section({ title, items }: { title: string; items: typeof ACTIONS }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
        {items.map(({ icon: Icon, label, href, color }) => (
          <Link key={href} href={href}>
            <div className="flex flex-col items-center gap-2.5 group cursor-pointer">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform shadow-sm`}>
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Plus() {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Toutes les fonctionnalités</h1>
        <p className="text-sm text-gray-500 mt-1">Accédez à tous vos services bancaires</p>
      </div>

      <Section title="Actions rapides" items={ACTIONS} />
      <div className="border-t border-gray-100" />
      <Section title="Navigation" items={NAV} />
    </div>
  );
}
