// F044: Workspace Settings Service Layer
// Handles workspace API configuration and enrichment settings

import { createClient } from '@/lib/supabase/client';
import type {
  WorkspaceSettings,
  UpdateWorkspaceSettingsRequest,
  TestApolloConnectionResponse,
  EnrichmentUsage,
  DailyUsage,
} from '@/types/workspace-settings';

const supabase = createClient();

/**
 * Get workspace settings (creates default if doesn't exist)
 */
export async function getWorkspaceSettings(
  workspaceId: string,
): Promise<WorkspaceSettings> {
  let { data, error } = await supabase
    .from('workspace_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  // If settings don't exist, create them
  if (error && error.code === 'PGRST116') {
    const { data: newSettings, error: createError } = await supabase
      .from('workspace_settings')
      .insert({
        workspace_id: workspaceId,
        apollo_auto_enrich: false,
        enrichment_credits_used: 0,
      })
      .select()
      .single();

    if (createError) throw createError;
    data = newSettings;
  } else if (error) {
    throw error;
  }

  // Transform for frontend (don't send actual API key)
  return {
    ...data,
    apollo_api_key_configured: !!data.apollo_api_key_encrypted,
  } as WorkspaceSettings;
}

/**
 * Update workspace settings (auto-enrich toggle, etc.)
 */
export async function updateWorkspaceSettings(
  workspaceId: string,
  updates: UpdateWorkspaceSettingsRequest,
): Promise<WorkspaceSettings> {
  const { data, error } = await supabase
    .from('workspace_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    apollo_api_key_configured: !!data.apollo_api_key_encrypted,
  } as WorkspaceSettings;
}

/**
 * Get enrichment usage statistics
 */
export async function getEnrichmentUsage(
  workspaceId: string,
  daysBack: number = 30,
): Promise<EnrichmentUsage> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Get settings for total credits used
  const settings = await getWorkspaceSettings(workspaceId);

  // Get enrichment jobs from last N days
  const { data: enrichmentJobs, error } = await supabase
    .from('jobs')
    .select('job_type, created_at, result')
    .eq('workspace_id', workspaceId)
    .in('job_type', ['enrich_account', 'enrich_contact'])
    .eq('status', 'completed')
    .gte('created_at', startDateStr);

  if (error) throw error;

  // Aggregate by day
  const dailyMap = new Map<string, DailyUsage>();
  let accountsEnriched = 0;
  let contactsEnriched = 0;

  (enrichmentJobs ?? []).forEach((job) => {
    const date = job.created_at.split('T')[0];
    const credits = (job.result as any)?.credits_used ?? 1; // Assume 1 credit if not specified

    if (!dailyMap.has(date)) {
      dailyMap.set(date, { date, credits: 0, accounts: 0, contacts: 0 });
    }

    const daily = dailyMap.get(date)!;
    daily.credits += credits;

    if (job.job_type === 'enrich_account') {
      daily.accounts += 1;
      accountsEnriched += 1;
    } else if (job.job_type === 'enrich_contact') {
      daily.contacts += 1;
      contactsEnriched += 1;
    }
  });

  // Fill in missing days with zeros
  const last30Days: DailyUsage[] = [];
  for (let i = 0; i < daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    last30Days.unshift(
      dailyMap.get(dateStr) ?? { date: dateStr, credits: 0, accounts: 0, contacts: 0 },
    );
  }

  const totalCreditsFromJobs = last30Days.reduce((sum, day) => sum + day.credits, 0);
  const dailyAverage = totalCreditsFromJobs / daysBack;

  return {
    credits_used: settings.enrichment_credits_used,
    accounts_enriched: accountsEnriched,
    contacts_enriched: contactsEnriched,
    last_30_days: last30Days,
    daily_average: Math.round(dailyAverage * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Helper function to check if Apollo API key is configured
 */
export async function isApolloConfigured(workspaceId: string): Promise<boolean> {
  const settings = await getWorkspaceSettings(workspaceId);
  return settings.apollo_api_key_configured;
}

/**
 * Increment enrichment credits counter
 * (Called after successful enrichment)
 */
export async function incrementEnrichmentCredits(
  workspaceId: string,
  credits: number = 1,
): Promise<void> {
  const { error } = await supabase.rpc('increment_enrichment_credits', {
    p_workspace_id: workspaceId,
    p_credits: credits,
  });

  // If RPC doesn't exist, fall back to manual update
  if (error && error.code === '42883') {
    const settings = await getWorkspaceSettings(workspaceId);
    await supabase
      .from('workspace_settings')
      .update({
        enrichment_credits_used: settings.enrichment_credits_used + credits,
        last_enrichment_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId);
  } else if (error) {
    throw error;
  }
}

// Note: Apollo API key operations (set, remove, test) are handled via API routes
// for security reasons - we don't want to expose the service role key to the client
