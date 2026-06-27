import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsent from "@/components/CookieConsent";
import { CurrencyProvider } from "@/contexts/currency-context";
import { AppLayout } from "@/components/layout";
import { AdminLayout } from "@/components/admin-layout";

// ErrorBoundary local pour les erreurs de chargement de chunks (lazy imports)
const isChunkError = (e: Error) =>
  e.message.includes("Importing a module") ||
  e.message.includes("Failed to fetch") ||
  e.message.includes("Loading chunk") ||
  e.message.includes("dynamically imported");

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (isChunkError(error)) {
      const key = "__chunk_reload__";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        setTimeout(() => window.location.reload(), 800);
      }
    }
  }
  render() {
    if (this.state.failed) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", gap: 16,
          fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif",
          textAlign: "center", padding: 24,
        }}>
          <div style={{ fontSize: 36 }}>🔄</div>
          <strong style={{ fontSize: 17 }}>Mise à jour disponible</strong>
          <p style={{ color: "#6b7280", maxWidth: 280, margin: 0 }}>
            Rechargez la page pour accéder à la dernière version.
          </p>
          <button
            onClick={() => { sessionStorage.removeItem("__chunk_reload__"); window.location.reload(); }}
            style={{
              background: "#003087", color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 28px", fontSize: 15,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages chargées immédiatement (critiques, toujours visitées sans auth)
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

// Toutes les autres pages chargées à la demande
const Dashboard        = lazy(() => import("@/pages/dashboard"));
const TransferLink     = lazy(() => import("@/pages/transfer-link"));
const Transfers        = lazy(() => import("@/pages/transfers"));
const TransferNew      = lazy(() => import("@/pages/transfer-new"));
const TransferDetail   = lazy(() => import("@/pages/transfer-detail"));
const SubAccounts      = lazy(() => import("@/pages/sub-accounts"));
const SubAccountNew    = lazy(() => import("@/pages/sub-accounts-new"));
const Referrals        = lazy(() => import("@/pages/referrals"));
const Kyc              = lazy(() => import("@/pages/kyc"));
const Settings         = lazy(() => import("@/pages/settings"));
const Beneficiaries    = lazy(() => import("@/pages/beneficiaries"));
const Support          = lazy(() => import("@/pages/support"));
const ScheduledTransfers = lazy(() => import("@/pages/scheduled-transfers"));
const FundRequests     = lazy(() => import("@/pages/fund-requests"));
const Analyses         = lazy(() => import("@/pages/analyses"));
const Depot            = lazy(() => import("@/pages/depot"));
const Recevoir         = lazy(() => import("@/pages/recevoir"));
const ScannerQR        = lazy(() => import("@/pages/scanner-qr"));
const Retrait          = lazy(() => import("@/pages/retrait"));
const PayerFactures    = lazy(() => import("@/pages/payer-factures"));
const Notifications    = lazy(() => import("@/pages/notifications"));
const ErreurBloquage   = lazy(() => import("@/pages/erreur-bloquage"));
const Onboarding       = lazy(() => import("@/pages/onboarding"));

const AccountTypeSelect  = lazy(() => import("@/pages/account-type-select"));
const OpenAccountOffer   = lazy(() => import("@/pages/open-account-offer"));
const OpenAccountSteps   = lazy(() => import("@/pages/open-account-steps"));

// Admin — chargé séparément (lourd, jamais visité par les clients)
const AdminDashboard       = lazy(() => import("@/pages/admin-dashboard"));
const AdminUsers           = lazy(() => import("@/pages/admin-users"));
const AdminCreateUser      = lazy(() => import("@/pages/admin-create-user"));
const AdminTransfers       = lazy(() => import("@/pages/admin-transfers"));
const AdminTransferNew     = lazy(() => import("@/pages/admin-transfer-new"));
const AdminKyc             = lazy(() => import("@/pages/admin-kyc"));
const AdminAlerts          = lazy(() => import("@/pages/admin-alerts"));
const AdminExchangeRates   = lazy(() => import("@/pages/admin-exchange-rates"));
const AdminSupport         = lazy(() => import("@/pages/admin-support"));
const AdminWithdrawalBlock = lazy(() => import("@/pages/admin-withdrawal-block"));

setAuthTokenGetter(() => localStorage.getItem("auth_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,       // ne re-fetch pas si données encore fraîches en cache
      staleTime: 2 * 60_000,      // données fraîches 2 minutes — réduit les appels API à la navigation
      gcTime: 10 * 60_000,        // garde en cache 10 minutes
    },
  },
});

window.addEventListener("tokenRefreshed", () => {
  queryClient.invalidateQueries();
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 rounded-full border-2 border-[#003087] border-t-transparent animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/open-account" component={AccountTypeSelect} />
        <Route path="/open-account/offer" component={OpenAccountOffer} />
        <Route path="/open-account/steps" component={OpenAccountSteps} />
        <Route path="/register" component={Register} />
        <Route path="/t/:token" component={TransferLink} />
        <Route path="/onboarding" component={Onboarding} />

        <Route path="/dashboard"><AppLayout><Dashboard /></AppLayout></Route>
        <Route path="/transfers"><AppLayout><Transfers /></AppLayout></Route>
        <Route path="/transfers/new"><AppLayout><TransferNew /></AppLayout></Route>
        <Route path="/transfers/:id"><AppLayout><TransferDetail /></AppLayout></Route>
        <Route path="/sub-accounts"><AppLayout><SubAccounts /></AppLayout></Route>
        <Route path="/sub-accounts/new"><AppLayout><SubAccountNew /></AppLayout></Route>
        <Route path="/referrals"><AppLayout><Referrals /></AppLayout></Route>
        <Route path="/kyc"><AppLayout><Kyc /></AppLayout></Route>
        <Route path="/settings"><AppLayout><Settings /></AppLayout></Route>
        <Route path="/beneficiaries"><AppLayout><Beneficiaries /></AppLayout></Route>
        <Route path="/support"><AppLayout><Support /></AppLayout></Route>
        <Route path="/scheduled-transfers"><AppLayout><ScheduledTransfers /></AppLayout></Route>
        <Route path="/fund-requests"><AppLayout><FundRequests /></AppLayout></Route>
        <Route path="/analyses"><AppLayout><Analyses /></AppLayout></Route>

        <Route path="/depot"><AppLayout><Depot /></AppLayout></Route>
        <Route path="/recevoir"><AppLayout><Recevoir /></AppLayout></Route>
        <Route path="/scanner-qr"><AppLayout><ScannerQR /></AppLayout></Route>
        <Route path="/retrait"><AppLayout><Retrait /></AppLayout></Route>
        <Route path="/payer-factures"><AppLayout><PayerFactures /></AppLayout></Route>
        <Route path="/notifications"><AppLayout><Notifications /></AppLayout></Route>
        <Route path="/erreur-bloquage" component={ErreurBloquage} />

        <Route path="/admin"><AdminLayout><AdminDashboard /></AdminLayout></Route>
        <Route path="/admin/users"><AdminLayout><AdminUsers /></AdminLayout></Route>
        <Route path="/admin/users/new"><AdminLayout><AdminCreateUser /></AdminLayout></Route>
        <Route path="/admin/transfers"><AdminLayout><AdminTransfers /></AdminLayout></Route>
        <Route path="/admin/transfers/new"><AdminLayout><AdminTransferNew /></AdminLayout></Route>
        <Route path="/admin/kyc"><AdminLayout><AdminKyc /></AdminLayout></Route>
        <Route path="/admin/alerts"><AdminLayout><AdminAlerts /></AdminLayout></Route>
        <Route path="/admin/exchange-rates"><AdminLayout><AdminExchangeRates /></AdminLayout></Route>
        <Route path="/admin/support"><AdminLayout><AdminSupport /></AdminLayout></Route>
        <Route path="/admin/withdrawal-block"><AdminLayout><AdminWithdrawalBlock /></AdminLayout></Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
    </ChunkErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <CookieConsent />
        </TooltipProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;
