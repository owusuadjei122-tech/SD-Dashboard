"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[size];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[6px] animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] animate-slide-up",
          "max-h-[min(90vh,720px)]",
          sizeClass
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-[#86868b]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[#86868b] transition hover:bg-black/[0.08] hover:text-[#1d1d1f]"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-black/[0.06] bg-[#fafafa] px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalFooterActions({
  onCancel,
  submitLabel,
  isSubmitting,
  cancelLabel = "Cancel",
  formId,
}: {
  onCancel: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  cancelLabel?: string;
  formId?: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-[10px] px-5 text-[14px] font-medium text-[#424245] transition hover:bg-black/[0.05] sm:min-w-[100px]"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isSubmitting}
        className="h-10 rounded-[10px] bg-[#0071e3] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#0077ed] disabled:opacity-50 sm:min-w-[120px]"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </>
  );
}
