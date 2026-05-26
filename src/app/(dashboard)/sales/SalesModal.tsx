"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooterActions } from "@/components/ui/modal";
import type { SalesRecord, ProductCosting } from "@/types/business";

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    product_id: string;
    product_name: string;
    quantity: number;
    selling_price: number;
  }) => void;
  products: ProductCosting[];
  initialData?: SalesRecord;
}

export function SalesModal({ isOpen, onClose, onSubmit, products, initialData }: SalesModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    product_id: "",
    product_name: "",
    quantity: "1",
    selling_price: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        product_id: initialData.product_id,
        product_name: initialData.product_name,
        quantity: initialData.quantity.toString(),
        selling_price: initialData.selling_price.toString(),
      });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        product_id: "",
        product_name: "",
        quantity: "1",
        selling_price: "",
      });
    }
  }, [initialData, isOpen]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        product_id: productId,
        product_name: product.product_name,
        selling_price: product.selling_price.toString(),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: formData.date,
      product_id: formData.product_id,
      product_name: formData.product_name,
      quantity: parseInt(formData.quantity, 10),
      selling_price: parseFloat(formData.selling_price),
    });
  };

  const totalSales =
    parseFloat(formData.quantity || "0") * parseFloat(formData.selling_price || "0");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit sale" : "Add sale"}
      description="Record a sale — product and price can auto-fill from costing."
      footer={
        <ModalFooterActions
          formId="sales-form"
          onCancel={onClose}
          submitLabel={initialData ? "Save changes" : "Add sale"}
        />
      }
    >
      <form id="sales-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product">Product</Label>
          <Select
            id="product"
            value={formData.product_id}
            onChange={(e) => handleProductChange(e.target.value)}
            required
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name} — ${product.selling_price.toFixed(2)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="selling_price">Selling price</Label>
            <Input
              id="selling_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              required
            />
          </div>
        </div>
        {formData.quantity && formData.selling_price && (
          <div className="rounded-xl bg-[#f5f5f7] px-4 py-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#86868b]">Total sale</span>
              <span className="font-semibold tabular-nums text-[#1d1d1f]">
                ${totalSales.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
