"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooterActions } from "@/components/ui/modal";

interface LibraryExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    category: string;
    description: string;
    amount: number;
  }) => void;
}

const CATEGORIES = ["Book Purchase", "Maintenance", "Utilities", "Staff", "Miscellaneous"];

export function LibraryExpenseModal({ isOpen, onClose, onSubmit }: LibraryExpenseModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Book Purchase",
    description: "",
    amount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
    });
    setFormData({
      date: new Date().toISOString().split("T")[0],
      category: "Book Purchase",
      description: "",
      amount: "",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add library expense"
      description="Track spending for the library division."
      footer={
        <ModalFooterActions formId="library-expense-form" onCancel={onClose} submitLabel="Add expense" />
      }
    >
      <form id="library-expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lib-date">Date</Label>
          <Input
            id="lib-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lib-category">Category</Label>
          <Select
            id="lib-category"
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
          <Label htmlFor="lib-description">Description</Label>
          <Input
            id="lib-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional details"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lib-amount">Amount</Label>
          <Input
            id="lib-amount"
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
