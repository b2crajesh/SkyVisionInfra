import type { ReactNode } from "react";
import Button from "./ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose?: () => void;
  hideCancel?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "OK",
  onConfirm,
  onClose,
  hideCancel = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-bold text-navy">{title}</h3>
        <div className="mb-6 text-sm text-charcoal/80">{children}</div>
        <div className="flex justify-end gap-3">
          {!hideCancel && onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
