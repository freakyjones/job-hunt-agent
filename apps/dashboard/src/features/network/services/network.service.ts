'use server';

import { createClient } from '@/utils/supabase/server';
import { TargetCompany, NetworkingLead, NetworkingLeadStatusEnum } from '@job-hunt/types';

export async function getTargetCompanies(): Promise<{
  data: TargetCompany[] | null;
  error?: string;
}> {
  const supabase = await createClient();

  let attempts = 0;
  while (attempts < 3) {
    try {
      const { data, error } = await supabase
        .from('target_companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as TargetCompany[] };
    } catch (err: unknown) {
      attempts++;
      if (attempts >= 3) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to database.';
        return { data: null, error: errorMessage };
      }
      await new Promise((res) => setTimeout(res, 500 * attempts));
    }
  }
  return { data: null, error: 'Network timeout.' };
}

export async function addTargetCompany(
  companyName: string,
  rssFeedUrl: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase.from('target_companies').insert({
    user_id: userData.user.id,
    company_name: companyName,
    rss_feed_url: rssFeedUrl,
  });

  if (error) {
    return { error: error.message };
  }
  return {};
}

export async function removeTargetCompany(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('target_companies').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }
  return {};
}

export interface NetworkingLeadWithSignal extends NetworkingLead {
  company_signals: {
    id: string;
    title: string;
    source_url: string;
  };
}

export async function getNetworkingLeads(): Promise<{
  data: NetworkingLeadWithSignal[] | null;
  error?: string;
}> {
  const supabase = await createClient();

  let attempts = 0;
  while (attempts < 3) {
    try {
      const { data, error } = await supabase
        .from('networking_leads')
        .select(
          `
          *,
          company_signals (
            id,
            title,
            source_url
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as NetworkingLeadWithSignal[] };
    } catch (err: unknown) {
      attempts++;
      if (attempts >= 3) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to database.';
        return { data: null, error: errorMessage };
      }
      await new Promise((res) => setTimeout(res, 500 * attempts));
    }
  }
  return { data: null, error: 'Network timeout.' };
}

export async function updateNetworkingLeadStatus(
  id: string,
  newStatusStr: string
): Promise<{ error?: string }> {
  const newStatus = NetworkingLeadStatusEnum.parse(newStatusStr);
  const supabase = await createClient();

  const { error } = await supabase
    .from('networking_leads')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }
  return {};
}
