import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import PurchaseManagement from "./pages/PurchaseManagement";
import StockManagement from "./pages/StockManagement";
import BorrowManagement from "./pages/BorrowManagement";
import History from "./pages/History";
import Search from "./pages/Search";
import Courses from "./pages/Courses";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/purchase" element={<PurchaseManagement />} />
              <Route path="/stock" element={<StockManagement />} />
              <Route path="/borrow" element={<BorrowManagement />} />
              <Route path="/history" element={<History />} />
              <Route path="/search" element={<Search />} />
              <Route path="/courses" element={<Courses />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
