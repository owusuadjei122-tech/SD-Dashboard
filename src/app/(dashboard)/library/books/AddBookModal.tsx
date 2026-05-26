"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooterActions } from "@/components/ui/modal";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; author: string; quantity: number }) => void;
  initialData?: { title: string; author: string; quantity: number };
}

export function AddBookModal({ isOpen, onClose, onSubmit, initialData }: AddBookModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    quantity: "1",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author,
        quantity: initialData.quantity.toString(),
      });
    } else {
      setFormData({ title: "", author: "", quantity: "1" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      author: formData.author,
      quantity: parseInt(formData.quantity, 10),
    });
    if (!initialData) {
      setFormData({ title: "", author: "", quantity: "1" });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit book" : "Add book"}
      description="Add a title to your library catalog."
      footer={
        <ModalFooterActions
          formId="book-form"
          onCancel={onClose}
          submitLabel={initialData ? "Save changes" : "Add book"}
        />
      }
    >
      <form id="book-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Book title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="Author name"
            required
          />
        </div>
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
      </form>
    </Modal>
  );
}
