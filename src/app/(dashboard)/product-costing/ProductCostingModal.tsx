"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooterActions } from "@/components/ui/modal";
import type { ProductCosting } from "@/types/business";

interface ProductCostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { product_name: string; cost_price: number; selling_price: number }) => void;
  initialData?: ProductCosting;
}

export function ProductCostingModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ProductCostingModalProps) {
  const [formData, setFormData] = useState({
    product_name: "",
    cost_price: "",
    selling_price: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        product_name: initialData.product_name,
        cost_price: initialData.cost_price.toString(),
        selling_price: initialData.selling_price.toString(),
      });
    } else {
      setFormData({ product_name: "", cost_price: "", selling_price: "" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      product_name: formData.product_name,
      cost_price: parseFloat(formData.cost_price),
      selling_price: parseFloat(formData.selling_price),
    });
    if (!initialData) {
      setFormData({ product_name: "", cost_price: "", selling_price: "" });
    }
  };

  const profit =
    parseFloat(formData.selling_price || "0") - parseFloat(formData.cost_price || "0");
  const markup =
    parseFloat(formData.cost_price || "0") > 0
      ? ((profit / parseFloat(formData.cost_price)) * 100).toFixed(1)
      : "0.0";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit product" : "Add product"}
      description="Set cost and selling price — profit and markup calculate automatically."
      footer={
        <ModalFooterActions
          formId="product-form"
          onCancel={onClose}
          submitLabel={initialData ? "Save changes" : "Add product"}
        />
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product_name">Product name</Label>
          <Input
            id="product_name"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            placeholder="e.g. Classic Tee"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost_price">Cost price</Label>
            <Input
              id="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              placeholder="0.00"
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
              placeholder="0.00"
              required
            />
          </div>
        </div>
        {formData.cost_price && formData.selling_price && (
          <div className="space-y-2 rounded-xl bg-[#f5f5f7] px-4 py-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#86868b]">Profit per unit</span>
              <span className="font-semibold tabular-nums text-[#34c759]">
                ${profit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#86868b]">Markup</span>
              <span className="font-semibold tabular-nums text-[#1d1d1f]">{markup}%</span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
