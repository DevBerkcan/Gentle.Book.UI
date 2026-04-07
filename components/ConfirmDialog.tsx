// components/admin/ConfirmDialog.tsx
"use client";

import { useState, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { AlertTriangle, Trash2, Ban, X } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const MODAL_CLASS = {
  base: "bg-white border border-[#E8C7C3]/30 shadow-2xl",
  header: "border-b border-[#E8C7C3]/20 bg-gradient-to-r from-[#F5EDEB] to-white",
  footer: "border-t border-[#E8C7C3]/20 bg-[#F5EDEB]/30",
};

const VARIANT_CFG: Record<ConfirmVariant, { iconBg: string; icon: React.ReactNode; btnClass: string }> = {
  danger: {
    iconBg: "bg-red-100",
    icon: <Trash2 size={18} className="text-red-500" />,
    btnClass: "bg-red-500 text-white font-semibold shadow-lg shadow-red-500/20",
  },
  warning: {
    iconBg: "bg-amber-100",
    icon: <AlertTriangle size={18} className="text-amber-500" />,
    btnClass: "bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/20",
  },
  info: {
    iconBg: "bg-[#017172]/10",
    icon: <Ban size={18} className="text-[#017172]" />,
    btnClass: "bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20",
  },
};

export function ConfirmDialog({
  isOpen, onClose, onConfirm,
  title, message,
  confirmLabel = "Bestätigen", cancelLabel = "Abbrechen",
  variant = "danger", loading = false,
}: ConfirmDialogProps) {
  const cfg = VARIANT_CFG[variant];
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" placement="center" classNames={MODAL_CLASS}>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                  {cfg.icon}
                </div>
                <h2 className="text-base font-bold text-[#1E1E1E]">{title}</h2>
              </div>
            </ModalHeader>
            <ModalBody className="py-4">
              <p className="text-sm text-[#8A8A8A] leading-relaxed">{message}</p>
            </ModalBody>
            <ModalFooter className="gap-2">
              <Button
                variant="flat"
                className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                onPress={close}
                isDisabled={loading}
                startContent={<X size={14} />}
              >
                {cancelLabel}
              </Button>
              <Button className={cfg.btnClass} onPress={onConfirm} isLoading={loading}>
                {confirmLabel}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// ─── useConfirm hook — drop `{dialog}` anywhere, call `confirm({...})` to get a Promise<boolean>
interface UseConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<UseConfirmOptions>({ title: "", message: "" });
  const [resolveFn, setResolveFn] = useState<(v: boolean) => void>(() => () => {});

  const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
    setOpts(options);
    setOpen(true);
    return new Promise((res) => setResolveFn(() => res));
  }, []);

  const handleConfirm = () => { setOpen(false); resolveFn(true); };
  const handleClose   = () => { setOpen(false); resolveFn(false); };

  const dialog = (
    <ConfirmDialog
      isOpen={open} onClose={handleClose} onConfirm={handleConfirm}
      title={opts.title} message={opts.message}
      confirmLabel={opts.confirmLabel} cancelLabel={opts.cancelLabel}
      variant={opts.variant}
    />
  );

  return { confirm, dialog };
}