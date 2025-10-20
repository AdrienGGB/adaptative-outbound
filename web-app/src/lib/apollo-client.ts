/**
 * Apollo.io API Client
 *
 * Provides methods to enrich accounts and contacts using Apollo.io API.
 * Requires BYOK (Bring Your Own Key) - workspace must configure their own Apollo API key.
 *
 * API Documentation: https://apolloio.github.io/apollo-api-docs/
 */

const APOLLO_API_BASE_URL = 'https://api.apollo.io/v1';

export interface ApolloApiKey {
  key: string;
}

export interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  blog_url?: string;
  angellist_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  primary_phone?: {
    number?: string;
    source?: string;
  };
  languages?: string[];
  alexa_ranking?: number;
  phone?: string;
  linkedin_uid?: string;
  founded_year?: number;
  publicly_traded_symbol?: string;
  publicly_traded_exchange?: string;
  logo_url?: string;
  crunchbase_url?: string;
  primary_domain?: string;

  // Industry & Classification
  industry?: string;
  keywords?: string[];
  estimated_num_employees?: number;

  // Location
  city?: string;
  state?: string;
  country?: string;
  street_address?: string;
  postal_code?: string;

  // Financials
  annual_revenue?: number;
  total_funding?: number;
  latest_funding_round_date?: string;
  latest_funding_stage?: string;

  // Technology
  technologies?: string[];
  tech_stack?: string[];

  // Social
  twitter_followers?: number;
  facebook_likes?: number;
}

export interface ApolloPerson {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
  email_status?: 'verified' | 'guessed' | 'unavailable';
  photo_url?: string;
  twitter_url?: string;
  github_url?: string;
  facebook_url?: string;

  // Contact Info
  personal_emails?: string[];
  work_direct_phone?: string;
  mobile_phone?: string;
  corporate_phone?: string;

  // Professional Info
  headline?: string;
  seniority?: string;
  departments?: string[];
  functions?: string[];

  // Organization
  organization_id?: string;
  organization?: ApolloOrganization;
  employment_history?: Array<{
    id?: string;
    created_at?: string;
    current?: boolean;
    degree?: string;
    description?: string;
    emails?: string[];
    end_date?: string;
    grade_level?: string;
    kind?: string;
    major?: string;
    organization_id?: string;
    organization_name?: string;
    raw_address?: string;
    start_date?: string;
    title?: string;
    updated_at?: string;
  }>;

  // Education
  education?: Array<{
    id?: string;
    created_at?: string;
    current?: boolean;
    degree?: string;
    description?: string;
    emails?: string[];
    end_date?: string;
    grade_level?: string;
    kind?: string;
    major?: string;
    organization_id?: string;
    organization_name?: string;
    raw_address?: string;
    start_date?: string;
    title?: string;
    updated_at?: string;
  }>;
}

export interface ApolloEnrichOrganizationRequest {
  domain: string;
}

export interface ApolloEnrichOrganizationResponse {
  organization: ApolloOrganization | null;
  credits_used: number;
}

export interface ApolloEnrichPersonRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  domain?: string;
  organization_name?: string;
  linkedin_url?: string;
}

export interface ApolloEnrichPersonResponse {
  person: ApolloPerson | null;
  credits_used: number;
}

export interface ApolloHealthResponse {
  status: 'ok' | 'error';
  credits_remaining?: number;
  rate_limit_remaining?: number;
  message?: string;
}

export interface ApolloError {
  error: string;
  message: string;
  status_code: number;
}

/**
 * Apollo.io API Client Class
 */
export class ApolloClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Apollo API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Test API connection and get remaining credits
   */
  async healthCheck(): Promise<ApolloHealthResponse> {
    try {
      // Apollo doesn't have a dedicated health endpoint, so we'll use the credits endpoint
      const response = await fetch(`${APOLLO_API_BASE_URL}/auth/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            status: 'error',
            message: 'Invalid API key',
          };
        }
        if (response.status === 429) {
          return {
            status: 'error',
            message: 'Rate limit exceeded',
          };
        }
        return {
          status: 'error',
          message: `API error: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        status: 'ok',
        credits_remaining: data.credits_remaining,
        rate_limit_remaining: data.rate_limit_remaining,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enrich organization by domain
   */
  async enrichOrganization(
    request: ApolloEnrichOrganizationRequest
  ): Promise<ApolloEnrichOrganizationResponse> {
    try {
      const response = await fetch(`${APOLLO_API_BASE_URL}/organizations/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          domain: request.domain,
          reveal_personal_emails: false, // Don't reveal personal emails for org enrichment
        }),
      });

      if (!response.ok) {
        const errorData: ApolloError = await response.json();
        throw new Error(errorData.message || `Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        organization: data.organization || null,
        credits_used: 1, // Organization enrichment costs 1 credit
      };
    } catch (error) {
      throw new Error(
        `Failed to enrich organization: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Enrich person by email, name, or LinkedIn URL
   */
  async enrichPerson(
    request: ApolloEnrichPersonRequest
  ): Promise<ApolloEnrichPersonResponse> {
    try {
      // Build the request body - Apollo requires at least one identifier
      const requestBody: Record<string, any> = {
        reveal_personal_emails: true,
      };

      if (request.email) {
        requestBody.email = request.email;
      }
      if (request.first_name) {
        requestBody.first_name = request.first_name;
      }
      if (request.last_name) {
        requestBody.last_name = request.last_name;
      }
      if (request.domain) {
        requestBody.domain = request.domain;
      }
      if (request.organization_name) {
        requestBody.organization_name = request.organization_name;
      }
      if (request.linkedin_url) {
        requestBody.linkedin_url = request.linkedin_url;
      }

      const response = await fetch(`${APOLLO_API_BASE_URL}/people/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: ApolloError = await response.json();
        throw new Error(errorData.message || `Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        person: data.person || null,
        credits_used: 1, // Person enrichment costs 1 credit
      };
    } catch (error) {
      throw new Error(
        `Failed to enrich person: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search for people matching criteria
   * Note: This is more expensive (credits-wise) than enrichment
   */
  async searchPeople(
    searchCriteria: {
      person_titles?: string[];
      organization_ids?: string[];
      q_keywords?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<{ people: ApolloPerson[]; total_results: number; credits_used: number }> {
    try {
      const response = await fetch(`${APOLLO_API_BASE_URL}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          ...searchCriteria,
          page: searchCriteria.page || 1,
          per_page: searchCriteria.per_page || 10,
        }),
      });

      if (!response.ok) {
        const errorData: ApolloError = await response.json();
        throw new Error(errorData.message || `Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        people: data.people || [],
        total_results: data.pagination?.total_entries || 0,
        credits_used: data.people?.length || 0, // Each result costs 1 credit
      };
    } catch (error) {
      throw new Error(
        `Failed to search people: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Decrypt API key from base64 encoding
 * In production, this should use proper encryption (AWS KMS, Vault, etc.)
 */
export function decryptApiKey(encryptedKey: string): string {
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Create Apollo client instance from encrypted key
 */
export function createApolloClient(encryptedKey: string): ApolloClient {
  const apiKey = decryptApiKey(encryptedKey);
  return new ApolloClient(apiKey);
}
