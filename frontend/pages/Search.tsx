import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Package, ShoppingCart, ArrowLeftRight } from "lucide-react";
import backend from "~backend/client";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["search", searchQuery, searchType],
    queryFn: () => backend.search.global({ query: searchQuery, type: searchType || undefined }),
    enabled: false,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    refetch();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="h-4 w-4" />;
      case "stock":
        return <Package className="h-4 w-4" />;
      case "borrow":
        return <ArrowLeftRight className="h-4 w-4" />;
      default:
        return <SearchIcon className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      purchase: "default",
      stock: "secondary",
      borrow: "outline",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

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

  const results = data?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Global Search</h1>
        <p className="text-muted-foreground">Search across all purchases, stock, and borrow records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SearchIcon className="h-5 w-5" />
            <span>Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search Query</Label>
                <Input
                  id="search"
                  placeholder="Enter item name, course tag, or borrower name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="type">Filter by Type</Label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="borrow">Borrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results found. Try a different search term or filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(result.type)}
                        {getTypeBadge(result.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{result.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {result.type === "purchase" && (
                            <p>
                              Quantity: {result.details.quantity}
                              {result.details.price && ` • Price: $${result.details.price.toFixed(2)}`}
                              {result.details.courseTag && ` • Course: ${result.details.courseTag}`}
                            </p>
                          )}
                          {result.type === "stock" && (
                            <p>
                              Total: {result.details.quantity} • Available: {result.details.availableQuantity}
                              {result.details.location && ` • Location: ${result.details.location}`}
                              {result.details.courseTag && ` • Course: ${result.details.courseTag}`}
                            </p>
                          )}
                          {result.type === "borrow" && (
                            <p>
                              Borrowed by: {result.details.borrowedBy} • Quantity: {result.details.borrowedQuantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(result.status, result.type)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
