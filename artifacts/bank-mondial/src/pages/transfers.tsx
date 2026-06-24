import { useListTransfers } from "@workspace/api-client-react";
import { useCurrency } from "@/contexts/currency-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Search, Plus, ExternalLink, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  virement:  { label: "Virement",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  "dépôt":   { label: "Dépôt",    className: "bg-green-100 text-green-700 border-green-200" },
  retrait:   { label: "Retrait",  className: "bg-orange-100 text-orange-700 border-orange-200" },
  facture:   { label: "Facture",  className: "bg-purple-100 text-purple-700 border-purple-200" },
};

function getTypeBadge(type: string) {
  const cfg = TYPE_CONFIG[type] ?? { label: type, className: "bg-gray-100 text-gray-700 border-gray-200" };
  return <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${cfg.className}`}>{cfg.label}</Badge>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed": return <Badge className="bg-green-500 hover:bg-green-600 text-[10px]">Complété</Badge>;
    case "pending":   return <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px]">En attente</Badge>;
    case "cancelled": return <Badge variant="destructive" className="text-[10px]">Annulé</Badge>;
    case "expired":   return <Badge variant="secondary" className="text-[10px]">Expiré</Badge>;
    default:          return <Badge className="text-[10px]">{status}</Badge>;
  }
}

export default function Transfers() {
  const { data, isLoading } = useListTransfers({ page: 1, limit: 50 });
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("tous");

  const transfers = Array.isArray(data?.transfers) ? data.transfers : [];

  const filtered = transfers.filter((t) => {
    const matchSearch = search === "" ||
      t.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "tous" || (t as any).transactionType === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Virements</h1>
        <Button asChild>
          <Link href="/transfers/new">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle opération
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <CardTitle>Historique des opérations</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* Type filter pills */}
            <div className="flex flex-wrap gap-2">
              {["tous", "virement", "dépôt", "retrait", "facture"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize ${
                    filterType === t
                      ? "bg-[#003087] text-white border-[#003087]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t === "tous" ? "Tous" : TYPE_CONFIG[t]?.label ?? t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune opération trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-xs">
                        {format(new Date(t.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>{getTypeBadge((t as any).transactionType ?? "virement")}</TableCell>
                      <TableCell className="font-medium">{t.beneficiaryName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.reference}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatAmount(t.amount, t.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/transfers/${t.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
