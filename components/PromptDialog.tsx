// components/PromptDialog.tsx
"use client";

import { useCallback, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Euro, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const MODAL_CLASS = {
  base: "bg-white border border-[#ECEBF2]/30 shadow-2xl",
  header: "border-b border-[#ECEBF2]/20 bg-gradient-to-r from-[#F6F5FA] to-white",
  footer: "border-t border-[#ECEBF2]/20 bg-[#F6F5FA]/30",
};

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** NextUI Input's own type prop — "number" shows a numeric keypad and strips non-numeric input. */
  inputType?: "text" | "number";
}

function PromptDialog({
  isOpen, onClose, onSubmit,
  title, message, label, placeholder, defaultValue = "",
  confirmLabel, cancelLabel, inputType = "text",
}: PromptDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);

  // Re-seed the input every time the dialog opens, so a previous prompt's leftover value never
  // bleeds into the next one (the component instance is reused across open/close cycles).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setValue(defaultValue);
  }

  const submit = () => { if (value.trim()) onSubmit(value.trim()); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" placement="center" classNames={MODAL_CLASS}>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#6355E4]/10">
                  <Euro size={18} className="text-[#6355E4]" />
                </div>
                <h2 className="text-base font-bold text-[#1E1E1E]">{title}</h2>
              </div>
            </ModalHeader>
            <ModalBody className="py-4 space-y-3">
              {message && <p className="text-sm text-gb-textSecondary leading-relaxed">{message}</p>}
              <Input
                autoFocus
                type={inputType}
                label={label}
                placeholder={placeholder}
                value={value}
                onValueChange={setValue}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                startContent={inputType === "number" ? <Euro size={14} className="text-gb-textSecondary" /> : undefined}
                classNames={{
                  input: "text-[#14162B]",
                  inputWrapper: "border-2 border-[#ECEBF2]",
                  label: "text-gb-textSecondary font-medium",
                }}
              />
            </ModalBody>
            <ModalFooter className="gap-2">
              <Button
                variant="flat"
                className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                onPress={close}
                startContent={<X size={14} />}
              >
                {cancelLabel ?? t.cancel}
              </Button>
              <Button
                className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
                onPress={submit}
                isDisabled={!value.trim()}
              >
                {confirmLabel ?? t.confirm}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// ─── usePrompt hook — drop `{dialog}` anywhere, call `prompt({...})` to get a Promise<string | null>
// (null = cancelled), as a drop-in replacement for window.prompt() with this app's own styling.
interface UsePromptOptions {
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputType?: "text" | "number";
}

export function usePrompt() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<UsePromptOptions>({ title: "" });
  const [resolveFn, setResolveFn] = useState<(v: string | null) => void>(() => () => {});

  const prompt = useCallback((options: UsePromptOptions): Promise<string | null> => {
    setOpts(options);
    setOpen(true);
    return new Promise((res) => setResolveFn(() => res));
  }, []);

  const handleSubmit = (value: string) => { setOpen(false); resolveFn(value); };
  const handleClose = () => { setOpen(false); resolveFn(null); };

  const dialog = (
    <PromptDialog
      isOpen={open} onClose={handleClose} onSubmit={handleSubmit}
      title={opts.title} message={opts.message} label={opts.label}
      placeholder={opts.placeholder} defaultValue={opts.defaultValue}
      confirmLabel={opts.confirmLabel} cancelLabel={opts.cancelLabel}
      inputType={opts.inputType}
    />
  );

  return { prompt, dialog };
}
