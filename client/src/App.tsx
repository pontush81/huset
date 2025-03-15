import { Switch, Route, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import GuestApartment from "@/pages/GuestApartment";
import BookingPage from "@/pages/BookingPage";
import AdminDashboard from "@/pages/AdminDashboard";
import Debug from "@/components/Debug";

// Only show debug in development or if forced via URL parameter
const showDebug = () => {
  const isDevMode = process.env.NODE_ENV === 'development';
  const urlParams = new URLSearchParams(window.location.search);
  const debugParam = urlParams.get('debug');
  return isDevMode || debugParam === 'true';
};

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/gastlagenhet" component={GuestApartment} />
        <Route path="/gastlagenhet/boka" component={BookingPage} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        {/* Omdirigera gamla admin/bokningar till nya bokningssidan */}
        <Route path="/admin/bokningar">
          {() => {
            // Anväd wouter's href
            window.location.href = "/gastlagenhet/boka";
            return null;
          }}
        </Route>
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
      {<Debug />}
    </QueryClientProvider>
  );
}

export default App;
