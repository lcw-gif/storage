import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, AlertTriangle, ArrowLeftRight, Calendar, TrendingUp } from "lucide-react";
import backend from "~backend/client";
import type { DashboardResponse } from "~backend/analytics/dashboard";

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: () => backend.analytics.dashboard(),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading dashboard data</div>;
  }

  const stats = data?.stats;
  const recentPurchases = data?.recentPurchases || [];
  const lowStockItems = data?.lowStockItems || [];
  const activeBorrows = data?.activeBorrows || [];

  const statCards = [
    {
      title: "Total Purchases",
      value: stats?.totalPurchases || 0,
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Pending Deliveries",
      value: stats?.pendingDeliveries || 0,
      icon: Package,
      color: "text-orange-600",
    },
    {
      title: "Stock Items",
      value: stats?.stockItems || 0,
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "Low Stock Alert",
      value: stats?.lowStockAlert || 0,
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Active Borrows",
      value: stats?.activeBorrows || 0,
      icon: ArrowLeftRight,
      color: "text-purple-600",
    },
    {
      title: "Borrowed Quantity",
      value: stats?.borrowedQuantity || 0,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      considering: "secondary",
      waiting_delivery: "outline",
      arrived: "default",
      stored: "default",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your school inventory system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Recent Purchases</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPurchases.length === 0 ? (
                <p className="text-muted-foreground">No recent purchases</p>
              ) : (
                recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{purchase.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(purchase.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <p className="text-muted-foreground">No low stock items</p>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.location || "No location"}</p>
                    </div>
                    <Badge variant="destructive">{item.quantity} left</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Borrows */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowLeftRight className="h-5 w-5" />
              <span>Active Borrows</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeBorrows.length === 0 ? (
                <p className="text-muted-foreground">No active borrows</p>
              ) : (
                activeBorrows.map((borrow) => (
                  <div key={borrow.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{borrow.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        Borrowed by {borrow.borrowedBy} • Qty: {borrow.borrowedQuantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Due: {new Date(borrow.expectedReturnDate).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(borrow.expectedReturnDate) < new Date() ? "Overdue" : "Active"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
