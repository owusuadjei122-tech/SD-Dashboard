"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooterActions } from "@/components/ui/modal";
import type { Expense } from "@/types/business";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    category: string;
    description: string;
    amount: number;
  }) => void;
  initialData?: Expense;
}

const CATEGORIES = ["Inventory", "Marketing", "Operations", "Utilities", "Miscellaneous"];

export function ExpenseModal({ isOpen, onClose, onSubmit, initialData }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Operations",
    description: "",
    amount: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        category: initialData.category,
        description: initialData.description || "",
        amount: initialData.amount.toString(),
      });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        category: "Operations",
        description: "",
        amount: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit expense" : "Add expense"}
      description="Record a business expense with category and amount."
      footer={
        <ModalFooterActions
          formId="expense-form"
          onCancel={onClose}
          submitLabel={initialData ? "Save changes" : "Add expense"}
        />
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What was this expense for?"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </form>
    </Modal>
  );
}
