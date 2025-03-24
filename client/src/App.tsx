import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Projects from "@/pages/projects";
import Users from "@/pages/users";
import Documents from "@/pages/documents";
import Reports from "@/pages/reports";
import Activities from "@/pages/activities";
import Settings from "@/pages/settings";

import { useAuth } from "./hooks/use-auth";
import { AuthProvider } from "./context/auth-context"; // أضفنا استيراد مزود المصادقة
import { Sidebar } from "@/components/ui/sidebar";

function AppRoutes() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route path="*" component={() => <Login />} />
      </Switch>
    );
  }
  
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen p-4 sm:p-6 md:px-8 lg:px-10 pb-12 transition-all duration-300 ml-0 md:ml-72">
        <div className="responsive-container fade-in">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/projects" component={Projects} />
            <Route path="/users" component={Users} />
            <Route path="/documents" component={Documents} />
            <Route path="/reports" component={Reports} />
            <Route path="/activities" component={Activities} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div dir="rtl" lang="ar" className="font-cairo">
          <AppRoutes />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
