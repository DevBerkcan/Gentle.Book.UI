// lib/api/designAssistant.ts
// Typed API client for the "Meine Links" AI Design Assistant (api/tenant/design-assistant/*),
// Agency-exclusive. Stateless on the server — this module's caller holds the conversation
// history and resends it each turn (see TenantDesignAssistantController / AiFinderDtos.cs).
import api from "@/lib/api/client";

export interface DesignAssistantHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DesignSuggestion {
  pageTemplate: string | null;
  colorPaletteKey: string | null;
  ctaText: string | null;
  ctaBadge: string | null;
}

export interface DesignAssistantMessageResponse {
  reply: string;
  suggestion: DesignSuggestion | null;
  usedAiFallback: boolean;
}

export async function sendDesignAssistantMessage(
  message: string,
  history: DesignAssistantHistoryTurn[],
): Promise<DesignAssistantMessageResponse> {
  const res = await api.post("/tenant/design-assistant/messages", { message, history });
  return res.data;
}
