import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Flame, Heart, BarChart3 } from "lucide-react";
import NotFound from "@/pages/not-found";
import SwipePage from "@/pages/swipe";
import SavedPage from "@/pages/saved";
import StatsPage from "@/pages/stats";

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: typeof Flame;
  label: string;
  badge?: number;
}) {
  const [location, navigate] = useLocation();
  const isActive = location === href;

  return (
    <button
      data-testid={`nav-${label.toLowerCase()}`}
      onClick={() => navigate(href)}
      className={`relative flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
        isActive
          ? "text-primary"
          : "text-muted-foreground"
      }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function BottomNav() {
  const { data: stats } = useQuery<{ liked: number; disliked: number; total: number }>({
    queryKey: ["/api/stats"],
  });

  return (
    <nav
      data-testid="bottom-nav"
      className="sticky bottom-0 z-50 flex items-center justify-center gap-2 border-t bg-background/95 backdrop-blur-sm px-4 py-1"
    >
      <NavItem href="/" icon={Flame} label="Discover" />
      <NavItem href="/saved" icon={Heart} label="Saved" badge={stats?.liked} />
      <NavItem href="/stats" icon={BarChart3} label="Stats" />
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={SwipePage} />
      <Route path="/saved" component={SavedPage} />
      <Route path="/stats" component={StatsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col h-[100dvh] max-w-lg mx-auto bg-background">
          <header className="flex items-center justify-center py-3 px-4 border-b">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold tracking-tight">ArtSwipe</h1>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <Router />
          </main>

          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
