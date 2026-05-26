"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesRecord, ProductCosting } from "@/types/business";
import { createSalesRecord, updateSalesRecord, deleteSalesRecord } from "@/lib/actions/sales";
import { SalesModal } from "./SalesModal";

interface SalesClientProps {
  initialSales: SalesRecord[];
  products: ProductCosting[];
  summary: { daily: number; weekly: number; monthly: number };
}

export function SalesClient({ initialSales, products, summary }: SalesClientProps) {
  const [sales, setSales] = useState(initialSales);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesRecord | null>(null);

  const filteredSales = sales.filter((sale) =>
    sale.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSale = async (data: any) => {
    const newSale = await createSalesRecord(data);
    setSales([newSale, ...sales]);
    setIsModalOpen(false);
  };

  const handleEditSale = async (data: any) => {
    if (!editingSale) return;
    const updated = await updateSalesRecord(editingSale.id, data);
    setSales(sales.map((s) => (s.id === updated.id ? updated : s)));
    setEditingSale(null);
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm("Are you sure you want to delete this sale?")) {
      await deleteSalesRecord(id);
      setSales(sales.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Record</h1>
          <p className="text-muted-foreground mt-1">Track and manage all sales transactions</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Sale
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Daily Sales"
          value={`$${summary.daily.toFixed(2)}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Weekly Sales"
          value={`$${summary.weekly.toFixed(2)}`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Monthly Sales"
          value={`$${summary.monthly.toFixed(2)}`}
          icon={Calendar}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No sales found. Add your first sale to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{sale.product_name}</TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  <TableCell className="text-right">${sale.selling_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    ${(sale.quantity * sale.selling_price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSale(sale)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <SalesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddSale}
        products={products}
      />

      {editingSale && (
        <SalesModal
          isOpen={true}
          onClose={() => setEditingSale(null)}
          onSubmit={handleEditSale}
          products={products}
          initialData={editingSale}
        />
      )}
    </div>
  );
}
