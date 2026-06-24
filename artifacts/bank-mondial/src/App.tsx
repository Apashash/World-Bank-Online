import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsent from "@/components/CookieConsent";
import { CurrencyProvider } from "@/contexts/currency-context";

import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import { AdminLayout } from "@/components/admin-layout";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import TransferLink from "@/pages/transfer-link";
import Transfers from "@/pages/transfers";
import TransferNew from "@/pages/transfer-new";
import TransferDetail from "@/pages/transfer-detail";
import SubAccounts from "@/pages/sub-accounts";
import SubAccountNew from "@/pages/sub-accounts-new";
import Referrals from "@/pages/referrals";
import Kyc from "@/pages/kyc";
import Settings from "@/pages/settings";

import AccountTypeSelect from "@/pages/account-type-select";
import OpenAccountOffer from "@/pages/open-account-offer";
import OpenAccountSteps from "@/pages/open-account-steps";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminUsers from "@/pages/admin-users";
import AdminTransfers from "@/pages/admin-transfers";
import AdminTransferNew from "@/pages/admin-transfer-new";
import AdminKyc from "@/pages/admin-kyc";
import AdminAlerts from "@/pages/admin-alerts";
import AdminExchangeRates from "@/pages/admin-exchange-rates";
import AdminSupport from "@/pages/admin-support";

import Depot from "@/pages/depot";
import Recevoir from "@/pages/recevoir";
import ScannerQR from "@/pages/scanner-qr";
import Retrait from "@/pages/retrait";
import PayerFactures from "@/pages/payer-factures";
import Plus from "@/pages/plus";
import Notifications from "@/pages/notifications";

import Beneficiaries from "@/pages/beneficiaries";
import Support from "@/pages/support";
import ScheduledTransfers from "@/pages/scheduled-transfers";
import FundRequests from "@/pages/fund-requests";
import Onboarding from "@/pages/onboarding";
import Analyses from "@/pages/analyses";

// Setup auth token for all API requests
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// When server issues a new token after a role change, re-fetch all queries
window.addEventListener("tokenRefreshed", () => {
  queryClient.invalidateQueries();
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/open-account" component={AccountTypeSelect} />
      <Route path="/open-account/offer" component={OpenAccountOffer} />
      <Route path="/open-account/steps" component={OpenAccountSteps} />
      <Route path="/register" component={Register} />
      <Route path="/t/:token" component={TransferLink} />
      <Route path="/onboarding" component={Onboarding} />

      {/* Protected Routes */}
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

      {/* Quick Action Routes */}
      <Route path="/depot"><AppLayout><Depot /></AppLayout></Route>
      <Route path="/recevoir"><AppLayout><Recevoir /></AppLayout></Route>
      <Route path="/scanner-qr"><AppLayout><ScannerQR /></AppLayout></Route>
      <Route path="/retrait"><AppLayout><Retrait /></AppLayout></Route>
      <Route path="/payer-factures"><AppLayout><PayerFactures /></AppLayout></Route>
      <Route path="/plus"><AppLayout><Plus /></AppLayout></Route>
      <Route path="/notifications"><AppLayout><Notifications /></AppLayout></Route>

      {/* Admin Routes */}
      <Route path="/admin"><AdminLayout><AdminDashboard /></AdminLayout></Route>
      <Route path="/admin/users"><AdminLayout><AdminUsers /></AdminLayout></Route>
      <Route path="/admin/transfers"><AdminLayout><AdminTransfers /></AdminLayout></Route>
      <Route path="/admin/transfers/new"><AdminLayout><AdminTransferNew /></AdminLayout></Route>
      <Route path="/admin/kyc"><AdminLayout><AdminKyc /></AdminLayout></Route>
      <Route path="/admin/alerts"><AdminLayout><AdminAlerts /></AdminLayout></Route>
      <Route path="/admin/exchange-rates"><AdminLayout><AdminExchangeRates /></AdminLayout></Route>
      <Route path="/admin/support"><AdminLayout><AdminSupport /></AdminLayout></Route>

      <Route component={NotFound} />
    </Switch>
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
