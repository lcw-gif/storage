import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import backend from "~backend/client";
import type { CreatePurchaseRequest, PurchaseItem } from "~backend/purchase/create";

export default function PurchaseManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => backend.purchase.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePurchaseRequest) => backend.purchase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      setIsDialogOpen(false);
      toast({ title: "Purchase item created successfully" });
    },
    onError: (error) => {
      console.error("Error creating purchase:", error);
      toast({ title: "Error creating purchase item", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      backend.purchase.updateStatus({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast({ title: "Error updating status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => backend.purchase.deletePurchase({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({ title: "Purchase item deleted successfully" });
    },
    onError: (error) => {
      console.error("Error deleting purchase:", error);
      toast({ title: "Error deleting purchase item", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreatePurchaseRequest = {
      name: formData.get("name") as string,
      whereToBuy: formData.get("whereToBuy") as string || undefined,
      price: formData.get("price") ? Number(formData.get("price")) : undefined,
      quantity: Number(formData.get("quantity")),
      courseTag: formData.get("courseTag") as string || undefined,
      link: formData.get("link") as string || undefined,
    };

    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      considering: "secondary",
      waiting_delivery: "outline",
      arrived: "default",
      stored: "default",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
  };

  const statusOptions = [
    { value: "considering", label: "Considering" },
    { value: "waiting_delivery", label: "Waiting Delivery" },
    { value: "arrived", label: "Arrived" },
    { value: "stored", label: "Stored" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading purchases...</div>;
  }

  const purchases = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Management</h1>
          <p className="text-muted-foreground">Track purchases from consideration to delivery</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Purchase Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whereToBuy">Where to Buy</Label>
                  <Input id="whereToBuy" name="whereToBuy" />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseTag">Course Tag</Label>
                  <Input id="courseTag" name="courseTag" />
                </div>
                <div>
                  <Label htmlFor="link">Link</Label>
                  <Input id="link" name="link" type="url" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Purchase"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Where to Buy</TableHead>
                <TableHead>Course Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No purchase items found
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price ? `$${item.price.toFixed(2)}` : "-"}</TableCell>
                    <TableCell>{item.whereToBuy || "-"}</TableCell>
                    <TableCell>{item.courseTag || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={item.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: item.id, status })}
                          disabled={item.status === "arrived" || item.status === "stored"}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending || item.status === "arrived" || item.status === "stored"}
                        >
                          <Trash2 className="h-4 w-4" />
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
