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
import ErrorBoundary from "@/components/ErrorBoundary";

// Always show debug for now to troubleshoot Vercel deployment
const showDebug = () => {
  return true; // Always show for now
};

// Basic error display for critical failures 
const BasicErrorFallback = () => (
  <div style={{
    padding: '20px',
    margin: '20px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    color: '#721c24',
    fontFamily: 'system-ui'
  }}>
    <h2>Något gick fel</h2>
    <p>Ett oväntat fel har inträffat. Försök ladda om sidan.</p>
    <p>Om problemet kvarstår, kontakta administratören.</p>
    <button
      onClick={() => window.location.reload()}
      style={{
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Ladda om sidan
    </button>
    <div style={{ marginTop: '20px' }}>
      <h3>Teknisk information</h3>
      <p>URL: {window.location.href}</p>
      <p>Tidpunkt: {new Date().toLocaleString()}</p>
    </div>
  </div>
);

function Router() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary fallback={<BasicErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
        <Debug />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
