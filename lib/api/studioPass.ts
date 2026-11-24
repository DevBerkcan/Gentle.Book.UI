// lib/api/studioPass.ts
// Studio-Pass (public, token) + "Freunde machen Freude" (studio side).
// See Gentle.Book.API/Controllers/PublicPassController.cs and ReferralsController.cs.
import api from './client';

export interface StudioPassData {
  studio: {
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    address: string | null;
    phone: string | null;
    bookingPath: string | null;
  };
  customer: { firstName: string };
  upcoming: { date: string; startTime: string; endTime: string; serviceName: string; employeeName: string | null; managePath: string }[];
  packages: { name: string; serviceName: string; totalSessions: number; usedSessions: number; openSessions: number; nextSessionBookingPath: string | null }[];
  stamps: { target: number; current: number; completedVisits: number; rewardLabel: string } | null;
  rewards: { kind: 'referral_thanks' | 'referral_welcome'; text: string; redeemed: boolean }[];
  vouchers: { code: string; type: 'MonetaryValue' | 'PercentageDiscount' | 'SessionPackage'; remainingAmount: number | null; remainingSessions: number | null; percentageValue: number | null; expiresAt: string | null }[];
  referral: { canInvite: boolean; sharePath: string; rewardText: string; invitedCount: number; firstVisitsCount: number } | null;
}

/** Public pass — plain fetch (no admin auth/interceptors on this customer-facing page). */
export async function getStudioPass(token: string): Promise<StudioPassData | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pass/${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export interface ReferralSettings { available: boolean; enabled: boolean; rewardText: string | null; defaultRewardText: string }

export interface ReferralStats {
  enabled: boolean;
  bookedInvitations: number;
  firstVisits: number;
  rewardsEarned: number;
  rewardsRedeemed: number;
  secondBookings: number;
  recent: { id: string; referrerName: string; referredName: string; status: 'Pending' | 'Qualified'; createdAt: string; qualifiedAt: string | null }[];
}

export interface CustomerReferralInfo {
  passPath: string;
  referralAvailable: boolean;
  referredBy: { name: string; status: 'Pending' | 'Qualified' } | null;
  invited: { name: string; status: 'Pending' | 'Qualified'; createdAt: string; qualifiedAt: string | null }[];
  rewards: { referralId: string; side: 'referrer' | 'referred'; text: string; reason: string; redeemedAt: string | null }[];
}

export const referralsApi = {
  getSettings: async (): Promise<ReferralSettings> => (await api.get('/referrals/settings')).data,
  updateSettings: async (enabled: boolean, rewardText: string | null): Promise<ReferralSettings> =>
    (await api.put('/referrals/settings', { enabled, rewardText })).data,
  getStats: async (): Promise<ReferralStats> => (await api.get('/referrals/stats')).data,
  getForCustomer: async (customerId: string): Promise<CustomerReferralInfo> => (await api.get(`/referrals/customer/${customerId}`)).data,
  renewPass: async (customerId: string): Promise<{ passPath: string }> => (await api.post(`/referrals/customer/${customerId}/pass/renew`)).data,
  redeem: async (referralId: string, side: 'referrer' | 'referred', undo = false) =>
    (await api.post(`/referrals/${referralId}/redeem`, { side, undo })).data,
};
