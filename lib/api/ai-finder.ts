import api from '@/lib/api/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured');
}

export type FinderAnswerType =
  | 'SingleChoice'
  | 'MultiChoice'
  | 'FreeText'
  | 'YesNo'
  | 'Number'
  | 'DateRange'
  | 'ImageUpload'
  | 'EmployeeChoice'
  | 'PriceRange'
  | 'DurationRange';

export interface FinderQuestion {
  id: string;
  questionKey: string;
  questionText: string;
  answerType: FinderAnswerType;
  isRequired: boolean;
  displayOrder: number;
  configJson: string | null;
  isActive: boolean;
  industryProfileId: string | null;
}

export interface FinderRule {
  id: string;
  serviceId: string | null;
  ruleType: string;
  conditionJson: string;
  resultJson: string;
  priority: number;
  isActive: boolean;
  approvalStatus: string;
}

export interface FinderGuidance {
  id: string;
  serviceId: string;
  guidanceType: string;
  title: string;
  content: string;
  approvalStatus: string;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
}

export interface IndustryCapability {
  id: string;
  capabilityKey: string;
  defaultEnabled: boolean;
}

export interface IndustryProfile {
  id: string;
  key: string;
  name: string;
  description: string | null;
  capabilities: IndustryCapability[];
}

export interface TenantIndustrySettings {
  primaryIndustryProfileId: string | null;
  isFinderEnabled: boolean;
  settingsJson: string | null;
  enabledCapabilities: string[];
}

export interface FinderOverview {
  finderEnabled: boolean;
  primaryIndustryProfileId: string | null;
  questionCount: number;
  ruleCount: number;
  guidanceCount: number;
  usage: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export interface ServiceRecommendation {
  serviceId: string;
  serviceName: string;
  score: number;
  price: number;
  currency: string;
  durationMinutes: number;
  suggestedEmployeeIds: string[];
}

export interface RequiredQuestion {
  questionKey: string;
  questionText: string;
  answerType: FinderAnswerType;
}

export interface GuidanceItem {
  guidanceId: string;
  guidanceType: string;
  title: string;
  content: string;
  sourceLabel: string;
}

export interface EvaluateFinderResponse {
  message: string;
  recommendations: ServiceRecommendation[];
  missingQuestions: RequiredQuestion[];
  guidance: GuidanceItem[];
  requiresHumanConsultation: boolean;
  usedAiFallback: boolean;
  sources: string[];
  suggestedEmployeeIds: string[];
}

export interface BookingDraftResponse {
  draftId: string;
  expiresAt: string;
  status: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  employeeId: string | null;
}

export const aiFinderApi = {
  async getOverview(): Promise<FinderOverview> {
    const { data } = await api.get('/admin/ai-finder/overview');
    return data;
  },

  async getIndustryProfiles(): Promise<IndustryProfile[]> {
    const { data } = await api.get('/admin/ai-finder/industry-profiles');
    return data;
  },

  async getIndustrySettings(): Promise<TenantIndustrySettings> {
    const { data } = await api.get('/admin/ai-finder/industry-settings');
    return data;
  },

  async upsertIndustrySettings(payload: {
    primaryIndustryProfileId: string;
    isFinderEnabled: boolean;
    settingsJson: string | null;
    enabledCapabilities: string[];
  }): Promise<void> {
    await api.put('/admin/ai-finder/industry-settings', payload);
  },

  async getQuestions(): Promise<FinderQuestion[]> {
    const { data } = await api.get('/admin/ai-finder/questions');
    return data;
  },

  async upsertQuestions(payload: { questions: Array<{
    id?: string;
    industryProfileId?: string | null;
    questionKey: string;
    questionText: string;
    answerType: FinderAnswerType;
    isRequired: boolean;
    displayOrder: number;
    configJson: string | null;
    isActive: boolean;
  }> }): Promise<void> {
    await api.put('/admin/ai-finder/questions', payload);
  },

  async getRules(): Promise<FinderRule[]> {
    const { data } = await api.get('/admin/ai-finder/rules');
    return data;
  },

  async upsertRules(payload: { rules: Array<{
    id?: string;
    serviceId?: string | null;
    ruleType: string;
    conditionJson: string;
    resultJson: string;
    priority: number;
    isActive: boolean;
    approvalStatus: string;
  }> }): Promise<void> {
    await api.put('/admin/ai-finder/rules', payload);
  },

  async getGuidance(): Promise<FinderGuidance[]> {
    const { data } = await api.get('/admin/ai-finder/guidance');
    return data;
  },

  async upsertGuidance(payload: { guidance: Array<{
    id?: string;
    serviceId: string;
    guidanceType: string;
    title: string;
    content: string;
    approvalStatus: string;
    isActive: boolean;
    validFrom: string | null;
    validTo: string | null;
  }> }): Promise<void> {
    await api.put('/admin/ai-finder/guidance', payload);
  },

  async preview(payload: { answers: Array<{ key: string; value: unknown }>; freeText?: string | null }): Promise<EvaluateFinderResponse> {
    const { data } = await api.post('/admin/ai-finder/preview', payload);
    return data;
  },
};

export async function getPublicFinderBootstrap(slug: string): Promise<{ enabled: boolean; aiDisclosure?: string; medicalDisclaimer?: string; questions?: FinderQuestion[]; }> {
  const res = await fetch(`${API_BASE_URL}/public/${slug}/finder/bootstrap`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Finder bootstrap konnte nicht geladen werden.');
  return res.json();
}

export async function evaluatePublicFinder(slug: string, payload: {
  answers: Array<{ key: string; value: unknown }>;
  freeText?: string | null;
}): Promise<EvaluateFinderResponse> {
  const res = await fetch(`${API_BASE_URL}/public/${slug}/finder/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Finder konnte nicht ausgewertet werden.');
  }

  return res.json();
}

export async function createPublicBookingDraft(slug: string, payload: {
  serviceId: string;
  employeeId?: string | null;
  bookingDate: string;
  startTime: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  customerNotes?: string | null;
}): Promise<BookingDraftResponse> {
  const res = await fetch(`${API_BASE_URL}/public/${slug}/finder/booking-drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Buchungsentwurf konnte nicht erstellt werden.');
  }

  return res.json();
}

export async function confirmPublicBookingDraft(slug: string, draftId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/public/${slug}/finder/booking-drafts/${draftId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerConfirmed: true }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Buchung konnte nicht bestaetigt werden.');
  }

  return res.json();
}
