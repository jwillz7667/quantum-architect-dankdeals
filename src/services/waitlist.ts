import { supabase } from '@/integrations/supabase/client';

export type LaunchWaitlistInterest = 'grand_opening' | 'beta' | 'vip_access';

export interface LaunchWaitlistPayload {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  notes?: string;
  interest?: LaunchWaitlistInterest;
  source?: string;
  path?: string;
}

export interface LaunchWaitlistResponse {
  success: boolean;
  message?: string;
  alreadyRegistered?: boolean;
  contactId?: string;
  adminEmailSent?: boolean;
  userEmailSent?: boolean;
  emailWarning?: string;
  error?: string;
}

export async function submitLaunchWaitlist(
  payload: LaunchWaitlistPayload
): Promise<LaunchWaitlistResponse> {
  const requestBody: LaunchWaitlistPayload = {
    ...payload,
    // Trim empty strings so the edge function does not get noisy values
    email: payload.email?.trim() || undefined,
    phone: payload.phone?.trim() || undefined,
    name: payload.name?.trim() || undefined,
    city: payload.city?.trim() || undefined,
    notes: payload.notes?.trim() || undefined,
  };

  const response = await supabase.functions.invoke<LaunchWaitlistResponse>('launch-waitlist', {
    body: requestBody,
  });

  const { data, error } = response as {
    data: LaunchWaitlistResponse | null;
    error: { message?: string } | null;
  };

  const hasErrorMessage = typeof error?.message === 'string';
  if (error) {
    throw new Error(
      hasErrorMessage
        ? error.message || 'Unable to submit your request right now.'
        : 'Unable to submit your request right now.'
    );
  }

  if (!data?.success) {
    const message =
      typeof data?.error === 'string' ? data.error : 'Something went wrong saving your request.';
    throw new Error(message);
  }

  return data;
}
