import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminListUsers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, User, Users, CreditCard, Smartphone, Wallet, CheckCircle2, Copy, Share2, Loader2, Search, X, Building2, Hash } from "lucide-react";
import { Link } from "wouter";
import { CURRENCY_LABELS, convertFromEur, formatCurrencyAmount } from "@/lib/currency";

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

type Bank = { id: string; label: string; country: string; region: string; color: string; abbr: string };

const BANKS_WORLDWIDE: Bank[] = [
  // ── Paiements numériques ──
  { id: "carte_bancaire", label: "Carte bancaire", country: "", region: "Paiement", color: "#003087", abbr: "CB" },
  { id: "paypal", label: "PayPal", country: "", region: "Paiement", color: "#0070BA", abbr: "PP" },
  { id: "mobile_money", label: "Mobile Money", country: "", region: "Paiement", color: "#1DB954", abbr: "MM" },
  { id: "western_union", label: "Western Union", country: "", region: "Paiement", color: "#FFB300", abbr: "WU" },
  { id: "moneygram", label: "MoneyGram", country: "", region: "Paiement", color: "#FF4B00", abbr: "MG" },
  { id: "wise", label: "Wise (TransferWise)", country: "", region: "Paiement", color: "#9FE870", abbr: "WS" },
  { id: "revolut", label: "Revolut", country: "", region: "Paiement", color: "#0075EB", abbr: "RV" },
  { id: "stripe", label: "Stripe", country: "", region: "Paiement", color: "#635BFF", abbr: "ST" },
  { id: "orange_money", label: "Orange Money", country: "", region: "Paiement", color: "#FF6600", abbr: "OM" },
  { id: "mtn_momo", label: "MTN MoMo", country: "", region: "Paiement", color: "#FFCB00", abbr: "MT" },
  { id: "wave", label: "Wave", country: "", region: "Paiement", color: "#1BADFE", abbr: "WV" },
  { id: "airtel_money", label: "Airtel Money", country: "", region: "Paiement", color: "#EA1C24", abbr: "AM" },
  { id: "moov_money", label: "Moov Money", country: "", region: "Paiement", color: "#0033A0", abbr: "MV" },
  { id: "ccp", label: "CCP / Algérie Poste", country: "", region: "Paiement", color: "#FFAA00", abbr: "CC" },
  { id: "virement_swift", label: "Virement SWIFT", country: "", region: "Paiement", color: "#1a4a3a", abbr: "SW" },
  { id: "virement_sepa", label: "Virement SEPA", country: "", region: "Paiement", color: "#003399", abbr: "SP" },
  { id: "crypto_btc", label: "Bitcoin (BTC)", country: "", region: "Paiement", color: "#F7931A", abbr: "BT" },
  { id: "crypto_eth", label: "Ethereum (ETH)", country: "", region: "Paiement", color: "#627EEA", abbr: "ET" },
  { id: "usdt", label: "USDT (Tether)", country: "", region: "Paiement", color: "#26A17B", abbr: "UT" },
  { id: "usdc", label: "USDC", country: "", region: "Paiement", color: "#2775CA", abbr: "UC" },
  { id: "bnb", label: "BNB (Binance)", country: "", region: "Paiement", color: "#F3BA2F", abbr: "BB" },
  { id: "perfect_money", label: "Perfect Money", country: "", region: "Paiement", color: "#FF9900", abbr: "PM" },
  { id: "skrill", label: "Skrill", country: "", region: "Paiement", color: "#862165", abbr: "SK" },
  { id: "neteller", label: "Neteller", country: "", region: "Paiement", color: "#7EC8E3", abbr: "NE" },
  { id: "payoneer", label: "Payoneer", country: "", region: "Paiement", color: "#FF4800", abbr: "PY" },
  { id: "zelle", label: "Zelle", country: "", region: "Paiement", color: "#6D1ED4", abbr: "ZL" },
  { id: "cashapp", label: "Cash App", country: "", region: "Paiement", color: "#00C244", abbr: "CA" },
  { id: "venmo", label: "Venmo", country: "", region: "Paiement", color: "#008CFF", abbr: "VM" },
  { id: "applepay", label: "Apple Pay", country: "", region: "Paiement", color: "#1C1C1E", abbr: "AP" },
  { id: "googlepay", label: "Google Pay", country: "", region: "Paiement", color: "#4285F4", abbr: "GP" },

  // ── Europe ──
  { id: "bnp_paribas", label: "BNP Paribas", country: "", region: "Europe", color: "#009966", abbr: "BN" },
  { id: "credit_agricole", label: "Crédit Agricole", country: "", region: "Europe", color: "#00AA32", abbr: "CA" },
  { id: "societe_generale", label: "Société Générale", country: "", region: "Europe", color: "#E20025", abbr: "SG" },
  { id: "lcl", label: "LCL", country: "", region: "Europe", color: "#00509E", abbr: "LC" },
  { id: "la_banque_postale", label: "La Banque Postale", country: "", region: "Europe", color: "#F7A600", abbr: "BP" },
  { id: "credit_mutuel", label: "Crédit Mutuel", country: "", region: "Europe", color: "#003D8F", abbr: "CM" },
  { id: "caisse_epargne", label: "Caisse d'Épargne", country: "", region: "Europe", color: "#D4001A", abbr: "CE" },
  { id: "banque_populaire", label: "Banque Populaire", country: "", region: "Europe", color: "#007CC3", abbr: "BP" },
  { id: "cic", label: "CIC", country: "", region: "Europe", color: "#003087", abbr: "CI" },
  { id: "boursorama", label: "Boursorama Banque", country: "", region: "Europe", color: "#0095CA", abbr: "BO" },
  { id: "hello_bank", label: "Hello Bank", country: "", region: "Europe", color: "#1A1A1A", abbr: "HB" },
  { id: "fortuneo", label: "Fortuneo", country: "", region: "Europe", color: "#00A86B", abbr: "FO" },
  { id: "monabanq", label: "Monabanq", country: "", region: "Europe", color: "#E2001A", abbr: "MB" },
  { id: "axa_banque", label: "AXA Banque", country: "", region: "Europe", color: "#00008F", abbr: "AX" },
  { id: "hsbc", label: "HSBC", country: "", region: "Europe", color: "#CC0000", abbr: "HS" },
  { id: "barclays", label: "Barclays", country: "", region: "Europe", color: "#00AEEF", abbr: "BA" },
  { id: "lloyds", label: "Lloyds Bank", country: "", region: "Europe", color: "#024731", abbr: "LL" },
  { id: "natwest", label: "NatWest", country: "", region: "Europe", color: "#5B2D8E", abbr: "NW" },
  { id: "halifax", label: "Halifax", country: "", region: "Europe", color: "#009FD4", abbr: "HX" },
  { id: "monzo", label: "Monzo", country: "", region: "Europe", color: "#FF3464", abbr: "MZ" },
  { id: "starling", label: "Starling Bank", country: "", region: "Europe", color: "#6935D3", abbr: "SL" },
  { id: "deutsche_bank", label: "Deutsche Bank", country: "", region: "Europe", color: "#0018A8", abbr: "DB" },
  { id: "commerzbank", label: "Commerzbank", country: "", region: "Europe", color: "#FFCC00", abbr: "CO" },
  { id: "dz_bank", label: "DZ Bank", country: "", region: "Europe", color: "#E2001A", abbr: "DZ" },
  { id: "sparkasse", label: "Sparkasse", country: "", region: "Europe", color: "#CC0000", abbr: "SP" },
  { id: "volksbank", label: "Volksbank", country: "", region: "Europe", color: "#004E9E", abbr: "VB" },
  { id: "n26", label: "N26", country: "", region: "Europe", color: "#26E8BD", abbr: "N2" },
  { id: "ing", label: "ING", country: "", region: "Europe", color: "#FF6200", abbr: "IN" },
  { id: "abn_amro", label: "ABN AMRO", country: "", region: "Europe", color: "#009E3D", abbr: "AA" },
  { id: "rabobank", label: "Rabobank", country: "", region: "Europe", color: "#E57200", abbr: "RB" },
  { id: "santander", label: "Santander", country: "", region: "Europe", color: "#EC0000", abbr: "SA" },
  { id: "bbva", label: "BBVA", country: "", region: "Europe", color: "#004481", abbr: "BB" },
  { id: "caixabank", label: "CaixaBank", country: "", region: "Europe", color: "#007BC4", abbr: "CX" },
  { id: "banco_sabadell", label: "Banco Sabadell", country: "", region: "Europe", color: "#005C8E", abbr: "BS" },
  { id: "unicredit", label: "UniCredit", country: "", region: "Europe", color: "#E21B23", abbr: "UC" },
  { id: "intesa", label: "Intesa Sanpaolo", country: "", region: "Europe", color: "#003087", abbr: "IS" },
  { id: "mediobanca", label: "Mediobanca", country: "", region: "Europe", color: "#002B5E", abbr: "MD" },
  { id: "ubs", label: "UBS", country: "", region: "Europe", color: "#D20001", abbr: "UB" },
  { id: "credit_suisse", label: "Crédit Suisse", country: "", region: "Europe", color: "#004C97", abbr: "CS" },
  { id: "postfinance", label: "PostFinance", country: "", region: "Europe", color: "#FFD700", abbr: "PF" },
  { id: "raiffeisen", label: "Raiffeisen Bank", country: "", region: "Europe", color: "#FFED00", abbr: "RF" },
  { id: "bnp_belgique", label: "BNP Paribas Fortis", country: "", region: "Europe", color: "#009966", abbr: "BF" },
  { id: "kbc", label: "KBC", country: "", region: "Europe", color: "#009999", abbr: "KB" },
  { id: "belfius", label: "Belfius", country: "", region: "Europe", color: "#CC0052", abbr: "BL" },
  { id: "nordea", label: "Nordea", country: "", region: "Europe", color: "#0000A0", abbr: "NO" },
  { id: "seb", label: "SEB", country: "", region: "Europe", color: "#00427A", abbr: "SE" },
  { id: "swedbank", label: "Swedbank", country: "", region: "Europe", color: "#F4820D", abbr: "SW" },
  { id: "danske_bank", label: "Danske Bank", country: "", region: "Europe", color: "#003755", abbr: "DA" },
  { id: "dnb", label: "DNB", country: "", region: "Europe", color: "#007272", abbr: "DN" },
  { id: "op_finland", label: "OP Financial Group", country: "", region: "Europe", color: "#FF6600", abbr: "OP" },
  { id: "pko", label: "PKO Bank Polski", country: "", region: "Europe", color: "#005CA9", abbr: "PK" },
  { id: "pko_sa", label: "Bank Pekao", country: "", region: "Europe", color: "#CC0000", abbr: "PE" },
  { id: "erste_bank", label: "Erste Bank", country: "", region: "Europe", color: "#CC0000", abbr: "ER" },
  { id: "otp_bank", label: "OTP Bank", country: "", region: "Europe", color: "#006DB7", abbr: "OT" },
  { id: "alpha_bank", label: "Alpha Bank", country: "", region: "Europe", color: "#003DA5", abbr: "AL" },
  { id: "piraeus", label: "Piraeus Bank", country: "", region: "Europe", color: "#FFD700", abbr: "PI" },
  { id: "eurobank", label: "Eurobank", country: "", region: "Europe", color: "#003DA5", abbr: "EU" },
  { id: "millennium_bcp", label: "Millennium BCP", country: "", region: "Europe", color: "#CC0000", abbr: "ML" },
  { id: "cgd", label: "Caixa Geral de Depósitos", country: "", region: "Europe", color: "#008000", abbr: "CG" },

  // ── Afrique ──
  { id: "ecobank", label: "Ecobank", country: "", region: "Afrique", color: "#0066B3", abbr: "EC" },
  { id: "uba", label: "United Bank for Africa (UBA)", country: "", region: "Afrique", color: "#CC0001", abbr: "UB" },
  { id: "zenith", label: "Zenith Bank", country: "", region: "Afrique", color: "#2F2E85", abbr: "ZE" },
  { id: "access_bank", label: "Access Bank", country: "", region: "Afrique", color: "#F76C1B", abbr: "AB" },
  { id: "first_bank_nigeria", label: "First Bank of Nigeria", country: "", region: "Afrique", color: "#004C97", abbr: "FB" },
  { id: "gt_bank", label: "GTBank", country: "", region: "Afrique", color: "#FF6600", abbr: "GT" },
  { id: "sterling_bank", label: "Sterling Bank", country: "", region: "Afrique", color: "#C8102E", abbr: "ST" },
  { id: "fidelity_bank_ng", label: "Fidelity Bank Nigeria", country: "", region: "Afrique", color: "#006400", abbr: "FD" },
  { id: "polaris_bank", label: "Polaris Bank", country: "", region: "Afrique", color: "#006699", abbr: "PL" },
  { id: "coris_bank", label: "Coris Bank", country: "", region: "Afrique", color: "#006E51", abbr: "CB" },
  { id: "sgbf", label: "Société Générale BF", country: "", region: "Afrique", color: "#E20025", abbr: "SG" },
  { id: "bicibf", label: "BICI Burkina", country: "", region: "Afrique", color: "#003087", abbr: "BI" },
  { id: "bicia_b", label: "BICIA-B", country: "", region: "Afrique", color: "#006400", abbr: "BC" },
  { id: "bhbf", label: "BHB (Banque de l'Habitat)", country: "", region: "Afrique", color: "#FF8C00", abbr: "BH" },
  { id: "boa_bf", label: "Bank of Africa BF", country: "", region: "Afrique", color: "#005C9B", abbr: "BO" },
  { id: "sgci", label: "Société Générale CI", country: "", region: "Afrique", color: "#E20025", abbr: "SC" },
  { id: "boa_ci", label: "Bank of Africa CI", country: "", region: "Afrique", color: "#005C9B", abbr: "BC" },
  { id: "vs_bank", label: "VS Bank (Côte d'Ivoire)", country: "", region: "Afrique", color: "#007A33", abbr: "VS" },
  { id: "sgsen", label: "Société Générale Sénégal", country: "", region: "Afrique", color: "#E20025", abbr: "SS" },
  { id: "cbao", label: "CBAO (Attijariwafa)", country: "", region: "Afrique", color: "#D4003B", abbr: "CB" },
  { id: "bicis", label: "BICIS", country: "", region: "Afrique", color: "#003087", abbr: "BC" },
  { id: "boa_mali", label: "Bank of Africa Mali", country: "", region: "Afrique", color: "#005C9B", abbr: "BM" },
  { id: "boa_niger", label: "Bank of Africa Niger", country: "", region: "Afrique", color: "#005C9B", abbr: "BN" },
  { id: "sg_mali", label: "Société Générale Mali", country: "", region: "Afrique", color: "#E20025", abbr: "SM" },
  { id: "orabank", label: "Orabank", country: "", region: "Afrique", color: "#E87722", abbr: "OR" },
  { id: "boa_togo", label: "Bank of Africa Togo", country: "", region: "Afrique", color: "#005C9B", abbr: "BT" },
  { id: "boa_benin", label: "Bank of Africa Bénin", country: "", region: "Afrique", color: "#005C9B", abbr: "BB" },
  { id: "boa_ghana", label: "Bank of Africa Ghana", country: "", region: "Afrique", color: "#005C9B", abbr: "BG" },
  { id: "gcb_bank", label: "GCB Bank (Ghana)", country: "", region: "Afrique", color: "#006600", abbr: "GC" },
  { id: "absa_ghana", label: "Absa Bank Ghana", country: "", region: "Afrique", color: "#DC143C", abbr: "AG" },
  { id: "cal_bank", label: "CAL Bank (Ghana)", country: "", region: "Afrique", color: "#003087", abbr: "CL" },
  { id: "attijariwafa", label: "Attijariwafa Bank", country: "", region: "Afrique", color: "#D4003B", abbr: "AW" },
  { id: "bmce", label: "Bank of Africa Maroc", country: "", region: "Afrique", color: "#005C9B", abbr: "BM" },
  { id: "cih", label: "CIH Bank", country: "", region: "Afrique", color: "#00569D", abbr: "CI" },
  { id: "bmci", label: "BMCI (BNP Paribas Maroc)", country: "", region: "Afrique", color: "#009966", abbr: "BM" },
  { id: "banque_populaire_ma", label: "Banque Populaire Maroc", country: "", region: "Afrique", color: "#007CC3", abbr: "BP" },
  { id: "cib_egypt", label: "CIB Égypte", country: "", region: "Afrique", color: "#006838", abbr: "CI" },
  { id: "nbe", label: "National Bank of Egypt", country: "", region: "Afrique", color: "#003087", abbr: "NB" },
  { id: "banque_misr", label: "Banque Misr", country: "", region: "Afrique", color: "#00843D", abbr: "BM" },
  { id: "al_rajhi", label: "Al Rajhi Bank", country: "", region: "Afrique", color: "#006C35", abbr: "AR" },
  { id: "bna_tunisie", label: "BNA Tunisie", country: "", region: "Afrique", color: "#E20025", abbr: "BN" },
  { id: "stb_tunisie", label: "STB Tunisie", country: "", region: "Afrique", color: "#003087", abbr: "ST" },
  { id: "biat", label: "BIAT Tunisie", country: "", region: "Afrique", color: "#004B87", abbr: "BI" },
  { id: "bea_algerie", label: "BEA Algérie", country: "", region: "Afrique", color: "#006600", abbr: "BA" },
  { id: "badr_algerie", label: "BADR Algérie", country: "", region: "Afrique", color: "#CC0000", abbr: "BD" },
  { id: "bnp_algerie", label: "BNP Paribas El Djazaïr", country: "", region: "Afrique", color: "#009966", abbr: "BE" },
  { id: "absa", label: "ABSA", country: "", region: "Afrique", color: "#DC143C", abbr: "AB" },
  { id: "standard_bank", label: "Standard Bank", country: "", region: "Afrique", color: "#1E3A5F", abbr: "SB" },
  { id: "fnb", label: "First National Bank", country: "", region: "Afrique", color: "#007DBE", abbr: "FN" },
  { id: "nedbank", label: "Nedbank", country: "", region: "Afrique", color: "#007A4D", abbr: "ND" },
  { id: "capitec", label: "Capitec Bank", country: "", region: "Afrique", color: "#D4001A", abbr: "CP" },
  { id: "equity_bank", label: "Equity Bank", country: "", region: "Afrique", color: "#E20025", abbr: "EQ" },
  { id: "kcb", label: "KCB Group", country: "", region: "Afrique", color: "#006400", abbr: "KC" },
  { id: "cba_kenya", label: "NCBA Bank Kenya", country: "", region: "Afrique", color: "#003087", abbr: "NC" },
  { id: "co_op_bank", label: "Co-operative Bank Kenya", country: "", region: "Afrique", color: "#006400", abbr: "CO" },
  { id: "crdb", label: "CRDB Bank Tanzania", country: "", region: "Afrique", color: "#003087", abbr: "CR" },
  { id: "nmb_tz", label: "NMB Bank Tanzania", country: "", region: "Afrique", color: "#FF0000", abbr: "NM" },
  { id: "stanbic_ug", label: "Stanbic Bank Uganda", country: "", region: "Afrique", color: "#1E3A5F", abbr: "SU" },
  { id: "centenary_bank", label: "Centenary Bank Uganda", country: "", region: "Afrique", color: "#006400", abbr: "CB" },
  { id: "rawbank", label: "Rawbank RDC", country: "", region: "Afrique", color: "#003087", abbr: "RW" },
  { id: "bcdc", label: "BCDC RDC", country: "", region: "Afrique", color: "#0066CC", abbr: "BC" },
  { id: "afriland", label: "Afriland First Bank", country: "", region: "Afrique", color: "#007A33", abbr: "AF" },
  { id: "sgbc", label: "SG Cameroun", country: "", region: "Afrique", color: "#E20025", abbr: "SC" },

  // ── Amériques ──
  { id: "jpmorgan", label: "JPMorgan Chase", country: "", region: "Amériques", color: "#117ACA", abbr: "JP" },
  { id: "bank_of_america", label: "Bank of America", country: "", region: "Amériques", color: "#C5002B", abbr: "BA" },
  { id: "wells_fargo", label: "Wells Fargo", country: "", region: "Amériques", color: "#D71E28", abbr: "WF" },
  { id: "citibank", label: "Citibank", country: "", region: "Amériques", color: "#1D6FAB", abbr: "CB" },
  { id: "us_bank", label: "US Bank", country: "", region: "Amériques", color: "#0C2340", abbr: "US" },
  { id: "goldman_sachs", label: "Goldman Sachs", country: "", region: "Amériques", color: "#7399C6", abbr: "GS" },
  { id: "morgan_stanley", label: "Morgan Stanley", country: "", region: "Amériques", color: "#003087", abbr: "MS" },
  { id: "capital_one", label: "Capital One", country: "", region: "Amériques", color: "#D22B2B", abbr: "CO" },
  { id: "pnc_bank", label: "PNC Bank", country: "", region: "Amériques", color: "#E87722", abbr: "PN" },
  { id: "td_bank", label: "TD Bank", country: "", region: "Amériques", color: "#2E8B22", abbr: "TD" },
  { id: "rbc", label: "RBC (Royal Bank of Canada)", country: "", region: "Amériques", color: "#005DAA", abbr: "RB" },
  { id: "scotiabank", label: "Scotiabank", country: "", region: "Amériques", color: "#C8102E", abbr: "SC" },
  { id: "bmo", label: "BMO (Bank of Montreal)", country: "", region: "Amériques", color: "#0079C1", abbr: "BM" },
  { id: "cibc", label: "CIBC", country: "", region: "Amériques", color: "#CC0000", abbr: "CI" },
  { id: "national_bank_ca", label: "Banque Nationale Canada", country: "", region: "Amériques", color: "#E41D2C", abbr: "BN" },
  { id: "itau", label: "Itaú Unibanco", country: "", region: "Amériques", color: "#E67E22", abbr: "IT" },
  { id: "bradesco", label: "Bradesco", country: "", region: "Amériques", color: "#CC0001", abbr: "BR" },
  { id: "banco_do_brasil", label: "Banco do Brasil", country: "", region: "Amériques", color: "#FFCC00", abbr: "BB" },
  { id: "caixa_br", label: "Caixa Econômica Federal", country: "", region: "Amériques", color: "#0066CC", abbr: "CX" },
  { id: "santander_br", label: "Santander Brasil", country: "", region: "Amériques", color: "#EC0000", abbr: "SB" },
  { id: "bancolombia", label: "Bancolombia", country: "", region: "Amériques", color: "#FFCC00", abbr: "BC" },
  { id: "davivienda", label: "Davivienda", country: "", region: "Amériques", color: "#CC0000", abbr: "DV" },
  { id: "banco_bogota", label: "Banco de Bogotá", country: "", region: "Amériques", color: "#003087", abbr: "BG" },
  { id: "bbva_mexico", label: "BBVA México", country: "", region: "Amériques", color: "#004481", abbr: "BV" },
  { id: "banamex", label: "Banamex (Citibanamex)", country: "", region: "Amériques", color: "#003087", abbr: "BX" },
  { id: "banorte", label: "Banorte", country: "", region: "Amériques", color: "#E20025", abbr: "BN" },
  { id: "bcp_peru", label: "BCP (Banco Crédito Perú)", country: "", region: "Amériques", color: "#003087", abbr: "BC" },
  { id: "banco_nacion_ar", label: "Banco Nación Argentina", country: "", region: "Amériques", color: "#003087", abbr: "BN" },
  { id: "scotiabank_cl", label: "Scotiabank Chile", country: "", region: "Amériques", color: "#C8102E", abbr: "SC" },

  // ── Asie & Moyen-Orient ──
  { id: "icbc", label: "ICBC", country: "", region: "Asie", color: "#C41E3A", abbr: "IC" },
  { id: "construction_bank", label: "China Construction Bank", country: "", region: "Asie", color: "#003087", abbr: "CC" },
  { id: "bank_of_china", label: "Bank of China", country: "", region: "Asie", color: "#CC0001", abbr: "BC" },
  { id: "abc_china", label: "Agricultural Bank of China", country: "", region: "Asie", color: "#006400", abbr: "AB" },
  { id: "bank_of_comm", label: "Bank of Communications", country: "", region: "Asie", color: "#003087", abbr: "BC" },
  { id: "citic", label: "CITIC Bank", country: "", region: "Asie", color: "#CC0000", abbr: "CT" },
  { id: "ping_an", label: "Ping An Bank", country: "", region: "Asie", color: "#FF6600", abbr: "PA" },
  { id: "sbi", label: "State Bank of India", country: "", region: "Asie", color: "#2C4A8E", abbr: "SB" },
  { id: "hdfc", label: "HDFC Bank", country: "", region: "Asie", color: "#004C8C", abbr: "HD" },
  { id: "icici", label: "ICICI Bank", country: "", region: "Asie", color: "#F26522", abbr: "IC" },
  { id: "axis_bank", label: "Axis Bank", country: "", region: "Asie", color: "#800000", abbr: "AX" },
  { id: "kotak", label: "Kotak Mahindra Bank", country: "", region: "Asie", color: "#EF4E22", abbr: "KO" },
  { id: "punjab_national", label: "Punjab National Bank", country: "", region: "Asie", color: "#FF6600", abbr: "PN" },
  { id: "mitsubishi", label: "MUFG (Mitsubishi UFJ)", country: "", region: "Asie", color: "#E60012", abbr: "MU" },
  { id: "sumitomo", label: "Sumitomo Mitsui", country: "", region: "Asie", color: "#003087", abbr: "SM" },
  { id: "mizuho", label: "Mizuho Bank", country: "", region: "Asie", color: "#004C97", abbr: "MH" },
  { id: "japan_post", label: "Japan Post Bank", country: "", region: "Asie", color: "#CC0000", abbr: "JP" },
  { id: "dbs", label: "DBS Bank", country: "", region: "Asie", color: "#CC0001", abbr: "DB" },
  { id: "ocbc", label: "OCBC Bank", country: "", region: "Asie", color: "#D71E28", abbr: "OC" },
  { id: "uob", label: "UOB", country: "", region: "Asie", color: "#003087", abbr: "UO" },
  { id: "kb_kookmin", label: "KB Kookmin Bank", country: "", region: "Asie", color: "#FFCC00", abbr: "KB" },
  { id: "shinhan", label: "Shinhan Bank", country: "", region: "Asie", color: "#0046FF", abbr: "SH" },
  { id: "woori", label: "Woori Bank", country: "", region: "Asie", color: "#007DC5", abbr: "WO" },
  { id: "hana_bank", label: "Hana Bank", country: "", region: "Asie", color: "#009E60", abbr: "HB" },
  { id: "kasikorn", label: "Kasikorn Bank (KBank)", country: "", region: "Asie", color: "#009900", abbr: "KS" },
  { id: "scb_thailand", label: "SCB (Siam Commercial Bank)", country: "", region: "Asie", color: "#4B2782", abbr: "SC" },
  { id: "bbl", label: "Bangkok Bank", country: "", region: "Asie", color: "#003087", abbr: "BB" },
  { id: "bca", label: "BCA (Bank Central Asia)", country: "", region: "Asie", color: "#006CB7", abbr: "BC" },
  { id: "mandiri", label: "Bank Mandiri", country: "", region: "Asie", color: "#003087", abbr: "MA" },
  { id: "bri", label: "Bank Rakyat Indonesia", country: "", region: "Asie", color: "#004B87", abbr: "BR" },
  { id: "bni", label: "Bank Negara Indonesia", country: "", region: "Asie", color: "#FF6600", abbr: "BN" },
  { id: "maybank", label: "Maybank", country: "", region: "Asie", color: "#FFCC00", abbr: "MY" },
  { id: "cimb", label: "CIMB Bank", country: "", region: "Asie", color: "#CC0000", abbr: "CI" },
  { id: "public_bank", label: "Public Bank", country: "", region: "Asie", color: "#CC0000", abbr: "PB" },
  { id: "emirates_nbd", label: "Emirates NBD", country: "", region: "Asie", color: "#CC0001", abbr: "EN" },
  { id: "mashreq", label: "Mashreq Bank", country: "", region: "Asie", color: "#B70000", abbr: "MA" },
  { id: "adcb", label: "ADCB", country: "", region: "Asie", color: "#E87722", abbr: "AD" },
  { id: "fab", label: "First Abu Dhabi Bank", country: "", region: "Asie", color: "#B8902D", abbr: "FA" },
  { id: "qnb", label: "Qatar National Bank", country: "", region: "Asie", color: "#8B0000", abbr: "QN" },
  { id: "nbd_dubai", label: "Dubai Islamic Bank", country: "", region: "Asie", color: "#006400", abbr: "DI" },
  { id: "riyad_bank", label: "Riyad Bank", country: "", region: "Asie", color: "#006400", abbr: "RI" },
  { id: "al_rajhi_sa", label: "Al Rajhi Bank", country: "", region: "Asie", color: "#006C35", abbr: "AR" },
  { id: "saudi_national", label: "Saudi National Bank (SNB)", country: "", region: "Asie", color: "#00843D", abbr: "SN" },
  { id: "ahli_united", label: "Ahli United Bank", country: "", region: "Asie", color: "#003087", abbr: "AU" },
  { id: "byblos", label: "Byblos Bank", country: "", region: "Asie", color: "#003087", abbr: "BY" },
  { id: "bank_mellat", label: "Bank Mellat", country: "", region: "Asie", color: "#CC0000", abbr: "BM" },
  { id: "tejarat", label: "Bank Tejarat", country: "", region: "Asie", color: "#006400", abbr: "TJ" },
  { id: "zarai_bank", label: "Zarai Taraqiati Bank", country: "", region: "Asie", color: "#006400", abbr: "ZT" },
  { id: "habib_bank", label: "Habib Bank Limited (HBL)", country: "", region: "Asie", color: "#006400", abbr: "HB" },
  { id: "meezan", label: "Meezan Bank", country: "", region: "Asie", color: "#006C35", abbr: "MZ" },
  { id: "brac_bank", label: "BRAC Bank Bangladesh", country: "", region: "Asie", color: "#E20025", abbr: "BR" },
  { id: "dutch_bangla", label: "Dutch-Bangla Bank", country: "", region: "Asie", color: "#003087", abbr: "DB" },
];

const REGIONS = ["Paiement", "Europe", "Afrique", "Amériques", "Asie"];

const CUSTOM_PREFIX = "__custom__:";
const isCustom = (id: string) => id.startsWith(CUSTOM_PREFIX);
const customLabel = (id: string) => id.slice(CUSTOM_PREFIX.length);
const customId = (label: string) => CUSTOM_PREFIX + label.trim();
const makeCustomBank = (label: string): Bank => ({
  id: customId(label), label, country: "", region: "Autre",
  color: "#64748b", abbr: label.slice(0, 2).toUpperCase(),
});

const TRANSACTION_TYPES = [
  { value: "virement", label: "↗ Virement" },
  { value: "dépôt", label: "⬇ Dépôt" },
  { value: "retrait", label: "⬆ Retrait" },
  { value: "facture", label: "📄 Facture" },
];

const COUNTRIES = [
  "Afghanistan","Afrique du Sud","Algérie","Allemagne","Angola","Arabie Saoudite","Argentine","Australie",
  "Autriche","Belgique","Bénin","Brésil","Burkina Faso","Burundi","Cameroun","Canada","Cap-Vert",
  "Centrafrique","Chili","Chine","Colombie","Comores","Congo","Côte d'Ivoire","Croatie","Cuba","Danemark",
  "Djibouti","Égypte","Émirats arabes unis","Espagne","Estonie","Éthiopie","Finlande","France","Gabon",
  "Gambie","Ghana","Grèce","Guinée","Guinée-Bissau","Guinée équatoriale","Haïti","Hongrie","Inde",
  "Indonésie","Irak","Irlande","Israël","Italie","Jamaïque","Japon","Jordanie","Kazakhstan","Kenya",
  "Koweït","Liban","Libéria","Libye","Luxembourg","Madagascar","Malawi","Mali","Maroc","Mauritanie",
  "Mexique","Monaco","Mozambique","Namibie","Niger","Nigéria","Norvège","Nouvelle-Zélande","Oman",
  "Ouganda","Pakistan","Palestine","Pays-Bas","Pérou","Philippines","Pologne","Portugal","Qatar",
  "République démocratique du Congo","Roumanie","Royaume-Uni","Russie","Rwanda","Sénégal","Serbie",
  "Sierra Leone","Singapour","Somalie","Soudan","Sri Lanka","Suède","Suisse","Syrie","Tanzanie","Tchad",
  "Thaïlande","Togo","Tunisie","Turquie","Ukraine","Uruguay","Venezuela","Vietnam","Yémen","Zambie","Zimbabwe",
];

type AdminUser = { id: number; fullName: string; email: string; currency: string; balance: number; clientId: string };
type GeneratedResult = { id: number; token: string; reference: string; beneficiaryName: string; amount: number; displayCurrency: string };

function SectionCard({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100" style={{ backgroundColor: color + "0D" }}>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function BankAbbr({ bank, size = "sm" }: { bank: Bank; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: bank.color }}
    >
      {bank.abbr}
    </div>
  );
}

function BankSingleSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const selectedBank = isCustom(selected)
    ? makeCustomBank(customLabel(selected))
    : (BANKS_WORLDWIDE.find((b) => b.id === selected) ?? null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return BANKS_WORLDWIDE.filter((b) => {
      const matchesSearch = !q || b.label.toLowerCase().includes(q);
      const matchesRegion = !activeRegion || b.region === activeRegion;
      return matchesSearch && matchesRegion;
    });
  }, [search, activeRegion]);

  const trimmedSearch = search.trim();
  const showCustomOption = trimmedSearch.length >= 2 &&
    !BANKS_WORLDWIDE.some((b) => b.label.toLowerCase() === trimmedSearch.toLowerCase());

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left ${selectedBank ? "border-[#7c3aed]/40 bg-[#7c3aed]/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}
      >
        {selectedBank ? (
          <>
            <BankAbbr bank={selectedBank} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#7c3aed] truncate">{selectedBank.label}</p>
              {isCustom(selected) && <p className="text-[10px] text-slate-400">Banque personnalisée</p>}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect(""); }}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="h-8 w-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <span className="text-sm text-slate-400">Choisir ou saisir une banque…</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2 border border-[#7c3aed]/30 rounded-xl p-3 bg-[#7c3aed]/3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher ou saisir une banque…"
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveRegion(null)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${!activeRegion ? "bg-[#7c3aed] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Tous
        </button>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRegion(activeRegion === r ? null : r)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${activeRegion === r ? "bg-[#7c3aed] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
        {showCustomOption && (
          <button
            type="button"
            onClick={() => { onSelect(customId(trimmedSearch)); setOpen(false); setSearch(""); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#7c3aed]/5 transition-all border-b border-slate-100"
          >
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
              {trimmedSearch.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#7c3aed] truncate">Utiliser « {trimmedSearch} »</p>
              <p className="text-[11px] text-slate-400">Banque personnalisée</p>
            </div>
          </button>
        )}
        {filtered.length === 0 && !showCustomOption ? (
          <div className="px-4 py-6 text-center text-sm text-slate-400">Aucun résultat — saisissez un nom pour l'ajouter</div>
        ) : (
          filtered.map((bank) => {
            const isSelected = bank.id === selected;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => { onSelect(bank.id); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${isSelected ? "bg-[#7c3aed]/8" : "hover:bg-slate-50"}`}
              >
                <BankAbbr bank={bank} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? "text-[#7c3aed]" : "text-slate-800"}`}>{bank.label}</p>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-[#7c3aed] bg-[#7c3aed]" : "border-slate-300"}`}>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>
      <button
        type="button"
        onClick={() => { setOpen(false); setSearch(""); }}
        className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors"
      >
        Fermer
      </button>
    </div>
  );
}

function BankSelector({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return BANKS_WORLDWIDE.filter((b) => {
      const matchesSearch = !q || b.label.toLowerCase().includes(q);
      const matchesRegion = !activeRegion || b.region === activeRegion;
      return matchesSearch && matchesRegion;
    });
  }, [search, activeRegion]);

  const selectedBanks: Bank[] = selected.map((id) =>
    isCustom(id) ? makeCustomBank(customLabel(id)) : (BANKS_WORLDWIDE.find((b) => b.id === id) ?? makeCustomBank(id))
  );

  const trimmedSearch = search.trim();
  const showCustomOption = trimmedSearch.length >= 2 &&
    !BANKS_WORLDWIDE.some((b) => b.label.toLowerCase() === trimmedSearch.toLowerCase()) &&
    !selected.includes(customId(trimmedSearch));

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher ou saisir un moyen de paiement…"
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/30 focus:border-[#003087]/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Region filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveRegion(null)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${!activeRegion ? "bg-[#003087] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Tous
        </button>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRegion(activeRegion === r ? null : r)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${activeRegion === r ? "bg-[#003087] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Bank list */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
        {showCustomOption && (
          <button
            type="button"
            onClick={() => { onToggle(customId(trimmedSearch)); setSearch(""); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#003087]/5 transition-all border-b border-slate-100"
          >
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
              {trimmedSearch.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#003087] truncate">Ajouter « {trimmedSearch} »</p>
              <p className="text-[11px] text-slate-400">Moyen de paiement personnalisé</p>
            </div>
          </button>
        )}
        {filtered.length === 0 && !showCustomOption ? (
          <div className="px-4 py-6 text-center text-sm text-slate-400">Aucun résultat — saisissez un nom pour l'ajouter</div>
        ) : (
          filtered.map((bank) => {
            const isSelected = selected.includes(bank.id);
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => onToggle(bank.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${isSelected ? "bg-[#003087]/5" : "hover:bg-slate-50"}`}
              >
                <BankAbbr bank={bank} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? "text-[#003087]" : "text-slate-800"}`}>{bank.label}</p>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-[#003087] bg-[#003087]" : "border-slate-300"}`}>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected chips */}
      {selectedBanks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedBanks.map((bank) => (
            <span
              key={bank.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: bank.color }}
            >
              {bank.label}
              <button type="button" onClick={() => onToggle(bank.id)} className="opacity-70 hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-red-400 font-medium">Sélectionnez au moins un moyen de paiement</p>
      )}
    </div>
  );
}

export default function AdminTransferNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: usersData } = useAdminListUsers({ page: 1, limit: 500 });
  const users: AdminUser[] = Array.isArray(usersData?.users) ? (usersData.users as AdminUser[]) : [];

  const [creating, setCreating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedResult | null>(null);

  const [form, setForm] = useState({
    userId: "",
    transactionType: "virement",
    // Sender
    senderFirstName: "", senderLastName: "", senderCountry: "", senderCity: "",
    // Receiver
    receiverFirstName: "", receiverLastName: "", receiverEmail: "",
    receiverCountry: "", receiverCity: "",
    receiverAccountNumber: "",
    receiverBankId: "",
    // Amount & currency
    amountEur: "", displayCurrency: "EUR",
    // Payment methods
    paymentMethods: [] as string[],
    // Block & WhatsApp
    blockReason: "", whatsappNumber: "",
    // Optional
    message: "",
  });

  const set = (key: string, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }));

  const selectedUser = users.find((u) => String(u.id) === form.userId);
  const convertedAmount = form.amountEur && form.displayCurrency !== "EUR"
    ? convertFromEur(Number(form.amountEur), form.displayCurrency)
    : null;

  const toggleMethod = (id: string) => {
    set("paymentMethods", form.paymentMethods.includes(id)
      ? form.paymentMethods.filter((m) => m !== id)
      : [...form.paymentMethods, id]);
  };

  const isValid = form.userId && form.receiverFirstName && form.receiverLastName &&
    form.amountEur && Number(form.amountEur) > 0 &&
    form.paymentMethods.length > 0 && form.blockReason && form.whatsappNumber;

  const handleCreate = async () => {
    if (!isValid) return;
    setCreating(true);
    try {
      const receiverName = `${form.receiverFirstName} ${form.receiverLastName}`.trim();

      // Build payment method labels (bank names + custom entries)
      const selectedBankLabels = form.paymentMethods.map((id) =>
        isCustom(id) ? customLabel(id) : (BANKS_WORLDWIDE.find((b) => b.id === id)?.label ?? id)
      );

      const r = await authFetch("/api/admin/transfers/create", {
        method: "POST",
        body: JSON.stringify({
          userId: Number(form.userId),
          beneficiaryName: receiverName,
          amount: Number(form.amountEur),
          currency: "EUR",
          message: form.message || undefined,
          transactionType: form.transactionType,
          senderFirstName: form.senderFirstName,
          senderLastName: form.senderLastName,
          senderCountry: form.senderCountry,
          senderCity: form.senderCity,
          receiverFirstName: form.receiverFirstName,
          receiverLastName: form.receiverLastName,
          receiverEmail: form.receiverEmail,
          receiverCountry: form.receiverCountry,
          receiverCity: form.receiverCity,
          receiverAccountNumber: form.receiverAccountNumber || undefined,
          receiverBankId: form.receiverBankId || undefined,
          receiverBankLabel: form.receiverBankId
            ? (isCustom(form.receiverBankId)
                ? customLabel(form.receiverBankId)
                : (BANKS_WORLDWIDE.find((b) => b.id === form.receiverBankId)?.label ?? undefined))
            : undefined,
          displayCurrency: form.displayCurrency,
          paymentMethods: form.paymentMethods,
          paymentMethodLabels: selectedBankLabels,
          blockReason: form.blockReason,
          whatsappNumber: form.whatsappNumber,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error ?? "Erreur lors de la création");
      setGenerated(result);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const fullLink = generated ? `${window.location.origin}/t/${generated.token}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    toast({ title: "Lien copié !" });
  };

  const resetForm = () => setForm({
    userId: "", transactionType: "virement",
    senderFirstName: "", senderLastName: "", senderCountry: "", senderCity: "",
    receiverFirstName: "", receiverLastName: "", receiverEmail: "",
    receiverCountry: "", receiverCity: "", receiverAccountNumber: "", receiverBankId: "",
    amountEur: "", displayCurrency: "EUR",
    paymentMethods: [],
    blockReason: "", whatsappNumber: "", message: "",
  });

  // ── Success screen ──
  if (generated) {
    const convAmt = generated.displayCurrency !== "EUR"
      ? convertFromEur(generated.amount, generated.displayCurrency)
      : null;

    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/transfers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900">Virement créé</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Lien de virement généré !</h2>
            <p className="text-sm text-slate-500 mt-1">Partagez ce lien avec le receveur</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Lien de paiement</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 font-mono truncate">
                  {fullLink}
                </div>
                <button onClick={handleCopy}
                  className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <Copy className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Référence</p>
                <p className="font-mono text-xs font-semibold text-slate-800 break-all">{generated.reference}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Montant EUR</p>
                <p className="font-bold text-slate-900">{generated.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
              {convAmt !== null && (
                <div className="bg-blue-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-blue-400 mb-0.5">Affiché en {generated.displayCurrency}</p>
                  <p className="font-bold text-blue-800">{formatCurrencyAmount(convAmt, generated.displayCurrency)}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Partager via
              </p>
              <div className="flex gap-2">
                {[
                  { label: "WhatsApp", color: "#25D366", char: "W", href: `https://wa.me/?text=${encodeURIComponent(`Virement – Confirmez ici : ${fullLink}`)}` },
                  { label: "Telegram", color: "#229ED9", char: "T", href: `https://t.me/share/url?url=${encodeURIComponent(fullLink)}` },
                  { label: "Email", color: "#6b7280", char: "✉", href: `mailto:?subject=Virement ${generated.reference}&body=${encodeURIComponent(`Lien : ${fullLink}`)}` },
                ].map((sl) => (
                  <a key={sl.label} href={sl.href} target="_blank" rel="noreferrer"
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: sl.color }}>
                    {sl.char}
                  </a>
                ))}
                <button onClick={handleCopy}
                  className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setLocation("/admin/transfers")}>
            Voir les virements
          </Button>
          <Button className="flex-1 text-white" style={{ background: "#003087" }}
            onClick={() => { setGenerated(null); resetForm(); }}>
            Nouveau virement
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/transfers"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nouveau virement admin</h1>
          <p className="text-sm text-slate-400">Créez un lien de virement complet pour un client</p>
        </div>
      </div>

      {/* Compte émetteur */}
      <SectionCard icon={User} title="Compte émetteur" color="#003087">
        <div className="space-y-3">
          <Field label="Sélectionner un utilisateur" required>
            <Select value={form.userId} onValueChange={(v) => set("userId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un compte..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{u.fullName}</span>
                      <span className="text-xs text-slate-400">{u.balance?.toFixed(2)} {u.currency} · {u.clientId}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {selectedUser && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-[#003087] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {selectedUser.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{selectedUser.fullName}</p>
                <p className="text-xs text-slate-400">{selectedUser.email} · Solde : <span className="font-semibold text-slate-600">{selectedUser.balance?.toFixed(2)} {selectedUser.currency}</span></p>
              </div>
            </div>
          )}
          <Field label="Type d'opération">
            <div className="grid grid-cols-4 gap-2">
              {TRANSACTION_TYPES.map((t) => (
                <label key={t.value}
                  className={`flex items-center justify-center gap-1.5 cursor-pointer text-xs px-2 py-2 rounded-lg border transition-all ${form.transactionType === t.value ? "border-[#003087] bg-[#003087]/5 text-[#003087] font-semibold" : "border-slate-200 text-slate-600"}`}>
                  <input type="radio" className="hidden" value={t.value} checked={form.transactionType === t.value} onChange={() => set("transactionType", t.value)} />
                  {t.label}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Expéditeur */}
      <SectionCard icon={User} title="Informations de l'expéditeur" color="#0ea5e9">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <Input placeholder="Prénom" value={form.senderFirstName} onChange={(e) => set("senderFirstName", e.target.value)} />
          </Field>
          <Field label="Nom">
            <Input placeholder="Nom de famille" value={form.senderLastName} onChange={(e) => set("senderLastName", e.target.value)} />
          </Field>
          <Field label="Pays">
            <Select value={form.senderCountry} onValueChange={(v) => set("senderCountry", v)}>
              <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ville">
            <Input placeholder="Ville" value={form.senderCity} onChange={(e) => set("senderCity", e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* Receveur */}
      <SectionCard icon={Users} title="Informations du receveur" color="#7c3aed">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" required>
            <Input placeholder="Prénom" value={form.receiverFirstName} onChange={(e) => set("receiverFirstName", e.target.value)} />
          </Field>
          <Field label="Nom" required>
            <Input placeholder="Nom de famille" value={form.receiverLastName} onChange={(e) => set("receiverLastName", e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="Email">
              <Input type="email" placeholder="email@exemple.com" value={form.receiverEmail} onChange={(e) => set("receiverEmail", e.target.value)} />
            </Field>
          </div>
          <Field label="Pays">
            <Select value={form.receiverCountry} onValueChange={(v) => set("receiverCountry", v)}>
              <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ville">
            <Input placeholder="Ville" value={form.receiverCity} onChange={(e) => set("receiverCity", e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="Banque du receveur">
              <BankSingleSelector
                selected={form.receiverBankId}
                onSelect={(id) => set("receiverBankId", id)}
              />
              <p className="text-[11px] text-slate-400 mt-1">Sélectionnez la banque où se trouve le compte du receveur.</p>
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Numéro de compte / RIB">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Ex: FR76 3000 6000 0112 3456 7890 189 ou numéro de compte"
                  value={form.receiverAccountNumber}
                  onChange={(e) => set("receiverAccountNumber", e.target.value)}
                  className="pl-9 font-mono text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">RIB, IBAN, numéro de compte ou tout identifiant bancaire du receveur.</p>
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Montant */}
      <SectionCard icon={Wallet} title="Montant et devise d'affichage" color="#059669">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant en EUR (€)" required>
            <Input type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amountEur} onChange={(e) => set("amountEur", e.target.value)} />
          </Field>
          <Field label="Devise d'affichage">
            <Select value={form.displayCurrency} onValueChange={(v) => set("displayCurrency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {convertedAmount !== null && (
          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">Affiché au receveur en {form.displayCurrency}</span>
            <span className="text-sm font-bold text-emerald-800">{formatCurrencyAmount(convertedAmount, form.displayCurrency)}</span>
          </div>
        )}
      </SectionCard>

      {/* Moyens de paiement */}
      <SectionCard icon={Building2} title="Moyens de paiement activés" color="#f59e0b">
        <div className="space-y-4">
          <BankSelector selected={form.paymentMethods} onToggle={toggleMethod} />
        </div>
      </SectionCard>

      {/* Config retrait */}
      <SectionCard icon={Smartphone} title="Configuration du retrait" color="#ef4444">
        <div className="space-y-3">
          <Field label="Raison de blocage du retrait" required>
            <textarea
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003087]/30"
              rows={3}
              placeholder="Ex: Document d'identité requis pour débloquer les fonds..."
              value={form.blockReason}
              onChange={(e) => set("blockReason", e.target.value)}
            />
            <p className="text-[11px] text-slate-400">Ce message s'affiche au receveur lorsqu'il tente d'effectuer le retrait.</p>
          </Field>
          <Field label="Numéro WhatsApp admin (avec indicatif)" required>
            <Input placeholder="+33612345678" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
            <p className="text-[11px] text-slate-400 mt-1">Le receveur contactera ce numéro pour débloquer ses fonds.</p>
          </Field>
        </div>
      </SectionCard>

      {/* Message optionnel */}
      <SectionCard icon={Send} title="Message (optionnel)" color="#6b7280">
        <Field label="Message pour le receveur">
          <textarea
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003087]/30"
            rows={2}
            placeholder="Message personnalisé..."
            maxLength={250}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
          />
          <div className="text-right text-[11px] text-slate-400">{form.message.length}/250</div>
        </Field>
      </SectionCard>

      {/* Submit */}
      <button
        onClick={handleCreate}
        disabled={!isValid || creating}
        className="w-full h-13 py-3.5 rounded-xl text-white font-bold text-base shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: isValid ? "#003087" : "#94a3b8", cursor: isValid ? "pointer" : "not-allowed" }}
      >
        {creating ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Création en cours…</>
        ) : (
          <><Send className="h-5 w-5" /> Générer le lien de virement</>
        )}
      </button>
    </div>
  );
}
