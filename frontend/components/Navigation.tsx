import { Link, useLocation } from "react-router-dom";
import { Package, BarChart3, ShoppingCart, ArrowLeftRight, History, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/purchase", label: "Purchase", icon: ShoppingCart },
  { path: "/stock", label: "Stock", icon: Package },
  { path: "/borrow", label: "Borrow", icon: ArrowLeftRight },
  { path: "/courses", label: "Courses", icon: BookOpen },
  { path: "/history", label: "History", icon: History },
  { path: "/search", label: "Search", icon: Search },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">School Stock System</h1>
          </div>
          
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
