import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Minus, Package, Edit } from "lucide-react";
import backend from "~backend/client";
import type { CreateStockRequest, StockItem } from "~backend/stock/create";
import type { StockTransactionRequest } from "~backend/stock/transaction";
import type { UpdateStockRequest } from "~backend/stock/update";

export default function StockManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: () => backend.stock.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStockRequest) => backend.stock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Stock item created successfully" });
    },
    onError: (error) => {
      console.error("Error creating stock:", error);
      toast({ title: "Error creating stock item", variant: "destructive" });
    },
  });

  const transactionMutation = useMutation({
    mutationFn: (data: StockTransactionRequest) => backend.stock.transaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setIsTransactionDialogOpen(false);
      setSelectedStock(null);
      toast({ title: "Stock transaction recorded successfully" });
    },
    onError: (error) => {
      console.error("Error recording transaction:", error);
      toast({ title: "Error recording transaction", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStockRequest) => backend.stock.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setIsEditDialogOpen(false);
      setSelectedStock(null);
      toast({ title: "Stock item updated successfully" });
    },
    onError: (error) => {
      console.error("Error updating stock item:", error);
      toast({ title: "Error updating stock item", variant: "destructive" });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateStockRequest = {
      name: formData.get("name") as string,
      quantity: Number(formData.get("quantity")),
      purchasePrice: formData.get("purchasePrice") ? Number(formData.get("purchasePrice")) : undefined,
      location: formData.get("location") as string || undefined,
      courseTag: formData.get("courseTag") as string || undefined,
    };

    createMutation.mutate(data);
  };

  const handleTransactionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStock) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data: StockTransactionRequest = {
      stockItemId: selectedStock.id,
      type: formData.get("type") as "in" | "out",
      quantity: Number(formData.get("quantity")),
      reason: formData.get("reason") as string || undefined,
      performedBy: formData.get("performedBy") as string,
    };

    transactionMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStock) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data: UpdateStockRequest = {
      id: selectedStock.id,
      name: formData.get("name") as string,
      purchasePrice: formData.get("purchasePrice") ? Number(formData.get("purchasePrice")) : undefined,
      location: formData.get("location") as string || undefined,
      courseTag: formData.get("courseTag") as string || undefined,
    };

    updateMutation.mutate(data);
  };

  const getStatusBadge = (status: string, quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (status === "low_stock" || quantity < 10) {
      return <Badge variant="outline">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  const openTransactionDialog = (stock: StockItem) => {
    setSelectedStock(stock);
    setIsTransactionDialogOpen(true);
  };

  const openEditDialog = (stock: StockItem) => {
    setSelectedStock(stock);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading stock...</div>;
  }

  const stockItems = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
          <p className="text-muted-foreground">Manage inventory levels and track stock movements</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stock Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" name="quantity" type="number" min="0" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="courseTag">Course Tag</Label>
                <Input id="courseTag" name="courseTag" />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Stock Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Stock Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock Item - {selectedStock?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input 
                id="edit-name" 
                name="name" 
                defaultValue={selectedStock?.name}
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-purchasePrice">Purchase Price</Label>
                <Input 
                  id="edit-purchasePrice" 
                  name="purchasePrice" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  defaultValue={selectedStock?.purchasePrice || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input 
                  id="edit-location" 
                  name="location" 
                  defaultValue={selectedStock?.location || ""}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-courseTag">Course Tag</Label>
              <Input 
                id="edit-courseTag" 
                name="courseTag" 
                defaultValue={selectedStock?.courseTag || ""}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Stock Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Transaction - {selectedStock?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Transaction Type *</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input 
                id="quantity" 
                name="quantity" 
                type="number" 
                min="1" 
                max={selectedStock?.availableQuantity || undefined}
                required 
              />
              <p className="text-sm text-muted-foreground mt-1">
                Available: {selectedStock?.availableQuantity || 0}
              </p>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" placeholder="Optional reason" />
            </div>
            
            <div>
              <Label htmlFor="performedBy">Performed By *</Label>
              <Input id="performedBy" name="performedBy" required />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsTransactionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={transactionMutation.isPending}>
                {transactionMutation.isPending ? "Recording..." : "Record Transaction"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Available Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Course Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No stock items found
                  </TableCell>
                </TableRow>
              ) : (
                stockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.availableQuantity}</TableCell>
                    <TableCell>{item.purchasePrice ? `$${item.purchasePrice.toFixed(2)}` : "-"}</TableCell>
                    <TableCell>{item.location || "-"}</TableCell>
                    <TableCell>{item.courseTag || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.status, item.quantity)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTransactionDialog(item)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Transaction
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
