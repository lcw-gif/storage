import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History as HistoryIcon, ShoppingCart, Package, ArrowLeftRight } from "lucide-react";
import backend from "~backend/client";

export default function History() {
  const { data: purchaseData, isLoading: purchaseLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => backend.purchase.list(),
  });

  const { data: borrowData, isLoading: borrowLoading } = useQuery({
    queryKey: ["borrows"],
    queryFn: () => backend.borrow.list(),
  });

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: () => backend.stock.list(),
  });

  if (purchaseLoading || borrowLoading || stockLoading) {
    return <div className="flex items-center justify-center h-64">Loading history...</div>;
  }

  const purchases = purchaseData?.items || [];
  const borrows = borrowData?.records || [];
  const stockItems = stockData?.items || [];

  const getStatusBadge = (status: string, type: string) => {
    if (type === "purchase") {
      const variants: Record<string, any> = {
        considering: "secondary",
        waiting_delivery: "outline",
        arrived: "default",
        stored: "default",
      };
      return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
    } else if (type === "borrow") {
      if (status === "returned") {
        return <Badge variant="default">Returned</Badge>;
      } else if (status === "partially_returned") {
        return <Badge variant="outline">Partially Returned</Badge>;
      } else {
        return <Badge variant="secondary">Active</Badge>;
      }
    } else if (type === "stock") {
      if (status === "out_of_stock") {
        return <Badge variant="destructive">Out of Stock</Badge>;
      } else if (status === "low_stock") {
        return <Badge variant="outline">Low Stock</Badge>;
      } else {
        return <Badge variant="default">In Stock</Badge>;
      }
    }
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground">View all system transactions and activities</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <HistoryIcon className="h-4 w-4" />
            <span>All</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Purchases</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Stock</span>
          </TabsTrigger>
          <TabsTrigger value="borrows" className="flex items-center space-x-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span>Borrows</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recent Purchases */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recent Purchases</h3>
                  <div className="space-y-2">
                    {purchases.slice(0, 5).map((purchase) => (
                      <div key={`purchase-${purchase.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{purchase.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(purchase.createdAt).toLocaleDateString()} • Qty: {purchase.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Purchase</Badge>
                          {getStatusBadge(purchase.status, "purchase")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Borrows */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recent Borrows</h3>
                  <div className="space-y-2">
                    {borrows.slice(0, 5).map((borrow) => (
                      <div key={`borrow-${borrow.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{borrow.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(borrow.borrowDate).toLocaleDateString()} • By: {borrow.borrowedBy}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Borrow</Badge>
                          {getStatusBadge(borrow.status, "borrow")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Course Tag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.name}</TableCell>
                      <TableCell>{purchase.quantity}</TableCell>
                      <TableCell>{purchase.price ? `$${purchase.price.toFixed(2)}` : "-"}</TableCell>
                      <TableCell>{purchase.courseTag || "-"}</TableCell>
                      <TableCell>{getStatusBadge(purchase.status, "purchase")}</TableCell>
                      <TableCell>{new Date(purchase.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Available Qty</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Course Tag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.availableQuantity}</TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                      <TableCell>{item.courseTag || "-"}</TableCell>
                      <TableCell>{getStatusBadge(item.status, "stock")}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="borrows">
          <Card>
            <CardHeader>
              <CardTitle>Borrow History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Borrowed By</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Borrow Date</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Actual Return</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrows.map((borrow) => (
                    <TableRow key={borrow.id}>
                      <TableCell className="font-medium">{borrow.itemName}</TableCell>
                      <TableCell>{borrow.borrowedBy}</TableCell>
                      <TableCell>{borrow.borrowedQuantity}</TableCell>
                      <TableCell>{new Date(borrow.borrowDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(borrow.expectedReturnDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {borrow.actualReturnDate 
                          ? new Date(borrow.actualReturnDate).toLocaleDateString() 
                          : "-"
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(borrow.status, "borrow")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
