"use client";
import { Tooltip } from "@nextui-org/tooltip";
import { HelpCircle } from "lucide-react";

export function HelpTip({ text }: { text: string }) {
  return (
    <Tooltip content={text} placement="right" className="max-w-xs text-xs">
      <HelpCircle
        size={14}
        className="text-[#8A8A8A] hover:text-[#017172] cursor-help transition-colors shrink-0"
      />
    </Tooltip>
  );
}
