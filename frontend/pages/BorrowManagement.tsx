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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeftRight, RotateCcw, Search } from "lucide-react";
import backend from "~backend/client";
import type { CheckoutRequest, BorrowRecord } from "~backend/borrow/checkout";
import type { StockItem } from "~backend/stock/create";

export default function BorrowManagement() {
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<BorrowRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: borrowData, isLoading: borrowLoading } = useQuery({
    queryKey: ["borrows"],
    queryFn: () => backend.borrow.list(),
  });

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: () => backend.stock.list(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: CheckoutRequest) => backend.borrow.checkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrows"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setIsCheckoutDialogOpen(false);
      toast({ title: "Item checked out successfully" });
    },
    onError: (error) => {
      console.error("Error checking out item:", error);
      toast({ title: "Error checking out item", variant: "destructive" });
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, returnedQuantity }: { id: number; returnedQuantity: number }) =>
      backend.borrow.returnItem({ id, returnedQuantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrows"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setIsReturnDialogOpen(false);
      setSelectedBorrow(null);
      toast({ title: "Item returned successfully" });
    },
    onError: (error) => {
      console.error("Error returning item:", error);
      toast({ title: "Error returning item", variant: "destructive" });
    },
  });

  const handleCheckoutSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CheckoutRequest = {
      stockItemId: selectedItemId || Number(formData.get("stockItemId")),
      borrowedBy: formData.get("borrowedBy") as string,
      borrowedQuantity: Number(formData.get("borrowedQuantity")),
      expectedReturnDate: new Date(formData.get("expectedReturnDate") as string),
      remarks: formData.get("remarks") as string || undefined,
    };

    checkoutMutation.mutate(data);
    setSelectedItemId(null);
    setSearchTerm("");
  };

  const handleReturnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBorrow) return;
    
    const formData = new FormData(e.currentTarget);
    const returnedQuantity = Number(formData.get("returnedQuantity"));

    returnMutation.mutate({ id: selectedBorrow.id, returnedQuantity });
  };

  const getStatusBadge = (status: string, expectedReturnDate: Date) => {
    if (status === "returned") {
      return <Badge variant="default">Returned</Badge>;
    } else if (status === "partially_returned") {
      return <Badge variant="outline">Partially Returned</Badge>;
    } else if (new Date(expectedReturnDate) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="secondary">Active</Badge>;
    }
  };

  const openReturnDialog = (borrow: BorrowRecord) => {
    setSelectedBorrow(borrow);
    setIsReturnDialogOpen(true);
  };

  if (borrowLoading || stockLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const borrows = borrowData?.records || [];
  const stockItems = stockData?.items || [];
  const availableStockItems = stockItems.filter(item => item.availableQuantity > 0);
  
  const filteredItems = availableStockItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.courseTag && item.courseTag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Borrow Management</h1>
          <p className="text-muted-foreground">Track borrowed items and returns</p>
        </div>
        
        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Checkout Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Checkout Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <Label htmlFor="stockItemId">Item *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchTerm && (
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      {filteredItems.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">No items found</div>
                      ) : (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${
                              selectedItemId === item.id ? 'bg-accent' : ''
                            }`}
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setSearchTerm(item.name);
                            }}
                          >
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Available: {item.availableQuantity}
                              {item.courseTag && ` • Course: ${item.courseTag}`}
                              {item.location && ` • Location: ${item.location}`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {!searchTerm && (
                    <Select 
                      name="stockItemId" 
                      required={!selectedItemId}
                      onValueChange={(value) => setSelectedItemId(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Or select from dropdown" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStockItems.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} (Available: {item.availableQuantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="borrowedBy">Borrowed By *</Label>
                <Input id="borrowedBy" name="borrowedBy" required />
              </div>
              
              <div>
                <Label htmlFor="borrowedQuantity">Quantity *</Label>
                <Input id="borrowedQuantity" name="borrowedQuantity" type="number" min="1" required />
              </div>
              
              <div>
                <Label htmlFor="expectedReturnDate">Expected Return Date *</Label>
                <Input 
                  id="expectedReturnDate" 
                  name="expectedReturnDate" 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea 
                  id="remarks" 
                  name="remarks" 
                  placeholder="Optional remarks about this borrowing..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={checkoutMutation.isPending}>
                  {checkoutMutation.isPending ? "Checking out..." : "Checkout"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Item - {selectedBorrow?.itemName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div>
              <Label htmlFor="returnedQuantity">Returned Quantity *</Label>
              <Input 
                id="returnedQuantity" 
                name="returnedQuantity" 
                type="number" 
                min="1" 
                max={selectedBorrow?.borrowedQuantity || undefined}
                required 
              />
              <p className="text-sm text-muted-foreground mt-1">
                Borrowed quantity: {selectedBorrow?.borrowedQuantity || 0}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsReturnDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={returnMutation.isPending}>
                {returnMutation.isPending ? "Returning..." : "Return Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Borrow Records</CardTitle>
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
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {borrows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No borrow records found
                  </TableCell>
                </TableRow>
              ) : (
                borrows.map((borrow) => (
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
                    <TableCell>
                      <div className="max-w-48 truncate" title={borrow.remarks}>
                        {borrow.remarks || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(borrow.status, borrow.expectedReturnDate)}</TableCell>
                    <TableCell>
                      {borrow.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReturnDialog(borrow)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Return
                        </Button>
                      )}
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
