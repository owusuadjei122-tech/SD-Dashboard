"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductCosting } from "@/types/business";
import { createProductCosting, updateProductCosting, deleteProductCosting } from "@/lib/actions/product-costing";
import { createInventory } from "@/lib/actions/inventory";
import { ProductCostingModal } from "./ProductCostingModal";

interface ProductCostingClientProps {
  initialProducts: ProductCosting[];
}

export function ProductCostingClient({ initialProducts }: ProductCostingClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCosting | null>(null);

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async (data: { product_name: string; cost_price: number; selling_price: number }) => {
    const newProduct = await createProductCosting(data);
    
    // Auto-create inventory entry
    await createInventory({
      product_id: newProduct.id,
      product_name: newProduct.product_name,
      starting_stock: 0,
      reorder_level: 10,
    });
    
    setProducts([newProduct, ...products]);
    setIsModalOpen(false);
  };

  const handleEditProduct = async (data: { product_name: string; cost_price: number; selling_price: number }) => {
    if (!editingProduct) return;
    const updated = await updateProductCosting(editingProduct.id, data);
    setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProductCosting(id);
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const calculateProfit = (selling: number, cost: number) => (selling - cost).toFixed(2);
  const calculateMarkup = (selling: number, cost: number) => 
    cost > 0 ? (((selling - cost) / cost) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Costing & Pricing</h1>
          <p className="text-muted-foreground mt-1">
            Manage product costs, pricing, and profit margins
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
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
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Profit Per Unit</TableHead>
              <TableHead className="text-right">Markup %</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell className="text-right">${product.cost_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${product.selling_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    ${calculateProfit(product.selling_price, product.cost_price)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {calculateMarkup(product.selling_price, product.cost_price)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
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

      <ProductCostingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProduct}
      />

      {editingProduct && (
        <ProductCostingModal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleEditProduct}
          initialData={editingProduct}
        />
      )}
    </div>
  );
}
