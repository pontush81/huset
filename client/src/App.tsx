import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import GuestApartment from "@/pages/GuestApartment";
import ManageBookings from "@/pages/ManageBookings";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/gastlagenhet">
          {(params) => <GuestApartment />}
        </Route>
        <Route path="/gastlagenhet/boka">
          {(params) => <GuestApartment showBookingForm={true} />}
        </Route>
        <Route path="/admin/bokningar" component={ManageBookings} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/#:section" component={Home} />
        <Route path="/:section" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
