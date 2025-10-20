// F044: Workspace Settings TypeScript Types

export interface WorkspaceSettings {
  id: string;
  workspace_id: string;

  // Apollo.io API Configuration
  apollo_api_key_configured: boolean; // Frontend doesn't get the actual key
  apollo_auto_enrich: boolean;

  // Usage Tracking
  enrichment_credits_used: number;
  last_enrichment_at?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkspaceSettingsRequest {
  apollo_auto_enrich?: boolean;
}

export interface SetApolloApiKeyRequest {
  api_key: string;
}

export interface TestApolloConnectionResponse {
  success: boolean;
  credits_remaining?: number;
  error_message?: string;
  plan_name?: string;
}

export interface EnrichmentUsage {
  credits_used: number;
  accounts_enriched: number;
  contacts_enriched: number;
  last_30_days: DailyUsage[];
  daily_average: number;
}

export interface DailyUsage {
  date: string;
  credits: number;
  accounts: number;
  contacts: number;
}

// Apollo.io API Types (for reference)
export interface ApolloOrganizationResponse {
  organization: {
    id: string;
    name: string;
    website_url: string;
    blog_url?: string;
    angellist_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    facebook_url?: string;

    // Firmographics
    primary_phone?: {
      number: string;
      sanitized_number: string;
      type: string;
    };
    languages?: string[];
    alexa_ranking?: number;
    phone?: string;
    linkedin_uid?: string;

    // Size & Revenue
    founded_year?: number;
    publicly_traded_symbol?: string;
    publicly_traded_exchange?: string;
    logo_url?: string;
    crunchbase_url?: string;
    primary_domain: string;
    sanitized_phone?: string;

    // Employee Info
    estimated_num_employees?: number;
    employee_count?: number;

    // Location
    city?: string;
    state?: string;
    country?: string;
    street_address?: string;
    postal_code?: string;

    // Business Info
    industry?: string;
    keywords?: string[];
    seo_description?: string;
    short_description?: string;
    annual_revenue_printed?: string;
    annual_revenue?: number;
    technology_names?: string[];

    // Additional
    retail_location_count?: number;
    raw_address?: string;
    total_funding?: number;
    latest_funding_round_date?: string;
    latest_funding_stage?: string;
  };
}

export interface ApolloPersonResponse {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    linkedin_url?: string;
    title?: string;
    city?: string;
    state?: string;
    country?: string;

    // Contact Info
    email?: string;
    email_status?: 'verified' | 'guessed' | 'unavailable';
    photo_url?: string;
    twitter_url?: string;
    github_url?: string;
    facebook_url?: string;

    // Work Info
    organization_id?: string;
    organization_name?: string;
    headline?: string;

    // Phone Numbers
    phone_numbers?: Array<{
      raw_number: string;
      sanitized_number: string;
      type: 'work' | 'mobile' | 'home' | 'other';
      position: number;
      status: 'valid' | 'invalid' | 'unknown';
    }>;

    // Social
    intent_strength?: number;
    show_intent?: boolean;
  };
}

export interface ApolloRateLimitInfo {
  daily_request_limit: number;
  hourly_request_limit: number;
  daily_requests_used: number;
  hourly_requests_used: number;
  daily_requests_remaining: number;
  hourly_requests_remaining: number;
}

// Error types
export class ApolloApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'ApolloApiError';
  }
}

export class ApolloRateLimitError extends ApolloApiError {
  constructor(message: string = 'Apollo API rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'ApolloRateLimitError';
  }
}

export class ApolloAuthenticationError extends ApolloApiError {
  constructor(message: string = 'Invalid Apollo API key') {
    super(message, 401, 'INVALID_API_KEY');
    this.name = 'ApolloAuthenticationError';
  }
}
