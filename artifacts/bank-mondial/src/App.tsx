import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsent from "@/components/CookieConsent";

import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";

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
import AdminKyc from "@/pages/admin-kyc";

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
      
      {/* Admin Routes */}
      <Route path="/admin"><AppLayout><AdminDashboard /></AppLayout></Route>
      <Route path="/admin/users"><AppLayout><AdminUsers /></AppLayout></Route>
      <Route path="/admin/transfers"><AppLayout><AdminTransfers /></AppLayout></Route>
      <Route path="/admin/kyc"><AppLayout><AdminKyc /></AppLayout></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <CookieConsent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
