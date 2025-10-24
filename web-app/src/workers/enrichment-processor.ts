/**
 * Enrichment Job Processor
 *
 * Handles account and contact enrichment using Apollo.io API
 * with caching layer to reduce API calls
 */

import { createClient } from '@/lib/supabase/server';
import { createApolloClient } from '@/lib/apollo-client';
import { JobProcessor, updateJobProgress, logJob } from './job-worker';
import { checkCache, writeCache } from '@/services/enrichment-cache';
import type { Job } from '@/types/jobs';
import type { ApolloOrganization, ApolloPerson } from '@/lib/apollo-client';

export class EnrichmentProcessor implements JobProcessor {
  getJobTypes(): string[] {
    return ['enrich_account', 'enrich_contact'];
  }

  async process(job: Job): Promise<any> {
    if (job.job_type === 'enrich_account') {
      return this.processAccountEnrichment(job);
    } else if (job.job_type === 'enrich_contact') {
      return this.processContactEnrichment(job);
    }

    throw new Error(`Unknown job type: ${job.job_type}`);
  }

  /**
   * Process account enrichment
   */
  private async processAccountEnrichment(job: Job): Promise<any> {
    const supabase = await createClient();
    const { account_id, account_name, domain } = job.payload as {
      account_id: string;
      account_name?: string;
      domain?: string;
    };

    if (!account_id) {
      throw new Error('Missing account_id in job payload');
    }

    await logJob(job.id, 'info', `Starting enrichment for account: ${account_name || account_id}`);
    await updateJobProgress(job.id, 10, 'Fetching workspace settings...');

    // Get workspace settings to retrieve Apollo API key
    const { data: settings, error: settingsError } = await supabase
      .from('workspace_settings')
      .select('apollo_api_key_encrypted')
      .eq('workspace_id', job.workspace_id)
      .single();

    if (settingsError || !settings?.apollo_api_key_encrypted) {
      throw new Error('Apollo API key not configured for this workspace');
    }

    await updateJobProgress(job.id, 20, 'Initializing Apollo client...');

    // Create Apollo client
    const apollo = createApolloClient(settings.apollo_api_key_encrypted);

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', account_id)
      .single();

    if (accountError || !account) {
      throw new Error(`Account not found: ${account_id}`);
    }

    // Use domain from payload or account
    const enrichmentDomain = domain || account.domain;

    if (!enrichmentDomain) {
      throw new Error('No domain available for enrichment');
    }

    await updateJobProgress(job.id, 25, `Checking enrichment cache...`);

    // Check cache first
    const cacheResult = await checkCache(
      job.workspace_id,
      'apollo',
      'domain',
      enrichmentDomain
    );

    let org: ApolloOrganization;
    let enrichmentResult: any;

    if (cacheResult.found && cacheResult.data) {
      await logJob(job.id, 'info', `Cache HIT for domain: ${enrichmentDomain}`);
      await updateJobProgress(job.id, 40, 'Using cached enrichment data...');

      org = cacheResult.data as ApolloOrganization;
      enrichmentResult = { organization: org, credits_used: 0 }; // No credits used for cache hit
    } else {
      await logJob(job.id, 'info', `Cache MISS for domain: ${enrichmentDomain}`);
      await updateJobProgress(job.id, 30, `Enriching with domain: ${enrichmentDomain}...`);
      await logJob(job.id, 'info', `Calling Apollo API for domain: ${enrichmentDomain}`);

      // Call Apollo API
      enrichmentResult = await apollo.enrichOrganization({
        domain: enrichmentDomain,
      });

      if (!enrichmentResult.organization) {
        await logJob(job.id, 'warning', 'No organization data returned from Apollo');
        throw new Error('No organization data found for domain');
      }

      org = enrichmentResult.organization;

      // Write to cache for future use
      await logJob(job.id, 'info', 'Writing enrichment data to cache...');
      await writeCache({
        workspace_id: job.workspace_id,
        provider: 'apollo',
        lookup_type: 'domain',
        lookup_value: enrichmentDomain,
        enrichment_data: org,
      });
    }

    await updateJobProgress(job.id, 60, 'Processing enrichment data...');

    // Map Apollo data to our account fields
    const enrichedData: Partial<typeof account> = {
      // Basic info
      name: org.name || account.name,
      domain: org.primary_domain || account.domain,
      website: org.website_url || account.website,

      // Industry
      industry: org.industry || account.industry,

      // Size
      employee_count: org.estimated_num_employees || account.employee_count,

      // Revenue
      annual_revenue: org.annual_revenue || account.annual_revenue,

      // Location
      city: org.city || account.city,
      state: org.state || account.state,
      country: org.country || account.country,
      street_address: org.street_address || account.street_address,
      postal_code: org.postal_code || account.postal_code,

      // Contact
      phone: org.phone || org.primary_phone?.number || account.phone,

      // Social
      linkedin_url: org.linkedin_url || account.linkedin_url,
      twitter_url: org.twitter_url || account.twitter_url,
      facebook_url: org.facebook_url || account.facebook_url,

      // Additional data (stored in metadata)
      metadata: {
        ...account.metadata,
        apollo_enriched_at: new Date().toISOString(),
        apollo_organization_id: org.id,
        founded_year: org.founded_year,
        logo_url: org.logo_url,
        total_funding: org.total_funding,
        latest_funding_stage: org.latest_funding_stage,
        technologies: org.technologies,
        alexa_ranking: org.alexa_ranking,
      },

      // Timestamps
      enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await updateJobProgress(job.id, 80, 'Updating account record...');

    // Update account
    const { error: updateError } = await supabase
      .from('accounts')
      .update(enrichedData)
      .eq('id', account_id);

    if (updateError) {
      throw new Error(`Failed to update account: ${updateError.message}`);
    }

    await logJob(
      job.id,
      'info',
      'Account enrichment completed successfully',
      {
        credits_used: enrichmentResult.credits_used,
        fields_enriched: Object.keys(enrichedData).length,
      }
    );

    // Update workspace credits
    await supabase
      .from('workspace_settings')
      .update({
        enrichment_credits_used: supabase.sql`enrichment_credits_used + ${enrichmentResult.credits_used}`,
        last_enrichment_at: new Date().toISOString(),
      })
      .eq('workspace_id', job.workspace_id);

    await updateJobProgress(job.id, 100, 'Enrichment complete');

    return {
      account_id,
      credits_used: enrichmentResult.credits_used,
      fields_enriched: Object.keys(enrichedData).length,
      enriched_data: {
        name: enrichedData.name,
        industry: enrichedData.industry,
        employee_count: enrichedData.employee_count,
        location: `${enrichedData.city}, ${enrichedData.state}, ${enrichedData.country}`,
      },
    };
  }

  /**
   * Process contact enrichment
   */
  private async processContactEnrichment(job: Job): Promise<any> {
    const supabase = await createClient();
    const { contact_id, email, first_name, last_name, linkedin_url } = job.payload as {
      contact_id: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      linkedin_url?: string;
    };

    if (!contact_id) {
      throw new Error('Missing contact_id in job payload');
    }

    await logJob(job.id, 'info', `Starting enrichment for contact: ${contact_id}`);
    await updateJobProgress(job.id, 10, 'Fetching workspace settings...');

    // Get workspace settings
    const { data: settings, error: settingsError } = await supabase
      .from('workspace_settings')
      .select('apollo_api_key_encrypted')
      .eq('workspace_id', job.workspace_id)
      .single();

    if (settingsError || !settings?.apollo_api_key_encrypted) {
      throw new Error('Apollo API key not configured for this workspace');
    }

    await updateJobProgress(job.id, 20, 'Initializing Apollo client...');

    // Create Apollo client
    const apollo = createApolloClient(settings.apollo_api_key_encrypted);

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*, accounts(domain)')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new Error(`Contact not found: ${contact_id}`);
    }

    // Build enrichment request
    const enrichmentEmail = email || contact.email;
    const enrichmentFirstName = first_name || contact.first_name;
    const enrichmentLastName = last_name || contact.last_name;
    const enrichmentLinkedIn = linkedin_url || contact.linkedin_url;

    if (!enrichmentEmail && !enrichmentLinkedIn) {
      throw new Error('Email or LinkedIn URL required for contact enrichment');
    }

    await updateJobProgress(job.id, 25, 'Checking enrichment cache...');

    // Use email as cache key (most reliable identifier)
    const cacheKey = enrichmentEmail || enrichmentLinkedIn || '';
    const lookupType = enrichmentEmail ? 'email' : 'linkedin_url';

    // Check cache first
    const cacheResult = await checkCache(
      job.workspace_id,
      'apollo',
      lookupType as any,
      cacheKey
    );

    let person: ApolloPerson;
    let enrichmentResult: any;

    if (cacheResult.found && cacheResult.data) {
      await logJob(job.id, 'info', `Cache HIT for contact: ${cacheKey}`);
      await updateJobProgress(job.id, 40, 'Using cached enrichment data...');

      person = cacheResult.data as ApolloPerson;
      enrichmentResult = { person, credits_used: 0 }; // No credits used for cache hit
    } else {
      await logJob(job.id, 'info', `Cache MISS for contact: ${cacheKey}`);
      await updateJobProgress(job.id, 30, 'Enriching contact data...');
      await logJob(
        job.id,
        'info',
        `Calling Apollo API with: ${enrichmentEmail ? `email=${enrichmentEmail}` : `linkedin=${enrichmentLinkedIn}`}`
      );

      // Call Apollo API
      enrichmentResult = await apollo.enrichPerson({
        email: enrichmentEmail,
        first_name: enrichmentFirstName,
        last_name: enrichmentLastName,
        linkedin_url: enrichmentLinkedIn,
        domain: (contact as any).accounts?.domain,
      });

      if (!enrichmentResult.person) {
        await logJob(job.id, 'warning', 'No person data returned from Apollo');
        throw new Error('No person data found');
      }

      person = enrichmentResult.person;

      // Write to cache for future use
      await logJob(job.id, 'info', 'Writing enrichment data to cache...');
      await writeCache({
        workspace_id: job.workspace_id,
        provider: 'apollo',
        lookup_type: lookupType as any,
        lookup_value: cacheKey,
        enrichment_data: person,
      });
    }

    await updateJobProgress(job.id, 60, 'Processing enrichment data...');

    // Map Apollo data to our contact fields
    const enrichedData: Partial<typeof contact> = {
      // Basic info
      first_name: person.first_name || contact.first_name,
      last_name: person.last_name || contact.last_name,
      email: person.email || contact.email,
      phone: person.work_direct_phone || person.mobile_phone || contact.phone,

      // Professional
      title: person.title || contact.title,

      // Social
      linkedin_url: person.linkedin_url || contact.linkedin_url,
      twitter_url: person.twitter_url || contact.twitter_url,

      // Photo
      photo_url: person.photo_url || contact.photo_url,

      // Additional data (stored in metadata)
      metadata: {
        ...contact.metadata,
        apollo_enriched_at: new Date().toISOString(),
        apollo_person_id: person.id,
        headline: person.headline,
        seniority: person.seniority,
        departments: person.departments,
        functions: person.functions,
        email_status: person.email_status,
        employment_history: person.employment_history,
        education: person.education,
      },

      // Timestamps
      enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await updateJobProgress(job.id, 80, 'Updating contact record...');

    // Update contact
    const { error: updateError } = await supabase
      .from('contacts')
      .update(enrichedData)
      .eq('id', contact_id);

    if (updateError) {
      throw new Error(`Failed to update contact: ${updateError.message}`);
    }

    await logJob(
      job.id,
      'info',
      'Contact enrichment completed successfully',
      {
        credits_used: enrichmentResult.credits_used,
        fields_enriched: Object.keys(enrichedData).length,
      }
    );

    // Update workspace credits
    await supabase
      .from('workspace_settings')
      .update({
        enrichment_credits_used: supabase.sql`enrichment_credits_used + ${enrichmentResult.credits_used}`,
        last_enrichment_at: new Date().toISOString(),
      })
      .eq('workspace_id', job.workspace_id);

    await updateJobProgress(job.id, 100, 'Enrichment complete');

    return {
      contact_id,
      credits_used: enrichmentResult.credits_used,
      fields_enriched: Object.keys(enrichedData).length,
      enriched_data: {
        name: `${enrichedData.first_name} ${enrichedData.last_name}`,
        title: enrichedData.title,
        email: enrichedData.email,
        phone: enrichedData.phone,
      },
    };
  }
}
