const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ChatbotRecommendedService {
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  durationMinutes: number;
}

export interface ChatbotEmployeeOption {
  employeeId: string;
  name: string;
  role: string | null;
}

export interface ChatbotSlotOption {
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  label: string;
}

export interface ChatbotCustomerInfo {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface ChatbotConfirmedBooking {
  id: string;
  bookingNumber: string;
  status: string;
  booking: { serviceName: string; bookingDate: string; startTime: string; endTime: string; price: number; currency: string };
}

export interface ChatbotMessageResponse {
  conversationId: string;
  status: string;
  reply: string;
  recommendedServices: ChatbotRecommendedService[];
  employeeOptions: ChatbotEmployeeOption[];
  slotOptions: ChatbotSlotOption[];
  requiresCustomerInfo: boolean;
  bookingDraftId: string | null;
  confirmedBooking: ChatbotConfirmedBooking | null;
  requiresHumanConsultation: boolean;
  usedAiFallback: boolean;
}

export interface ChatbotMessageRequest {
  conversationId?: string;
  message?: string;
  selectedServiceId?: string;
  selectedEmployeeId?: string;
  anyEmployee?: boolean;
  selectedDate?: string;
  selectedTime?: string;
  customer?: ChatbotCustomerInfo;
  confirmBooking?: boolean;
}

export async function getChatbotBootstrap(slug: string): Promise<{ enabled: boolean; aiDisclosure?: string }> {
  const res = await fetch(`${API_BASE_URL}/public/${slug}/chatbot/bootstrap`, { cache: 'no-store' });
  if (!res.ok) return { enabled: false };
  return res.json();
}

export async function sendChatbotMessage(slug: string, payload: ChatbotMessageRequest): Promise<ChatbotMessageResponse> {
  const res = await fetch(`${API_BASE_URL}/public/${slug}/chatbot/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Nachricht konnte nicht gesendet werden.');
  }

  return res.json();
}
