"use client";

import { useState } from "react";
import { Package, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  starting_stock: number;
  reorder_level: number;
  quantity_sold: number;
  current_stock: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface InventoryClientProps {
  initialInventory: InventoryItem[];
}

export function InventoryClient({ initialInventory }: InventoryClientProps) {
  const [inventory] = useState(initialInventory);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInventory = inventory.filter((item) =>
    item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inStockCount = inventory.filter((item) => item.status === "In Stock").length;
  const lowStockCount = inventory.filter((item) => item.status === "Low Stock").length;
  const outOfStockCount = inventory.filter((item) => item.status === "Out of Stock").length;

  const getStatusBadge = (status: string) => {
    if (status === "Out of Stock") {
      return <Badge variant="danger">Out of Stock</Badge>;
    }
    if (status === "Low Stock") {
      return <Badge variant="warning">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === "Out of Stock") {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (status === "Low Stock") {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Tracker</h1>
          <p className="text-muted-foreground mt-1">
            Monitor stock levels and manage inventory in real-time
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="In Stock"
          value={inStockCount}
          icon={CheckCircle}
        />
        <MetricCard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={Package}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Starting Stock</TableHead>
              <TableHead className="text-right">Quantity Sold</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Reorder Level</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No inventory items found. Add products in Product Costing to see them here.
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-right">{item.starting_stock}</TableCell>
                  <TableCell className="text-right">{item.quantity_sold}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.current_stock}
                  </TableCell>
                  <TableCell className="text-right">{item.reorder_level}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">Healthy Stock</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{inStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Low Stock Alert</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{lowStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">Out of Stock</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{outOfStockCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Automatic Inventory Tracking
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Inventory automatically updates when you record sales. Current Stock = Starting Stock - Quantity Sold. 
              Status changes based on reorder levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
