/**
 * Duplicate Detection Service
 * F001: Data Quality & Import System
 *
 * Detects duplicate accounts and contacts using fuzzy matching algorithms
 * Based on domain, name, email, and location similarity
 */

import { createClient } from '@/lib/supabase/server';
import * as fuzzball from 'fuzzball';
import type {
  DuplicateCandidate,
  DuplicateEntityType,
  SimilarityCalculation,
  CreateDuplicateCandidatePayload,
  DuplicateStats,
  DuplicateWithEntities,
} from '@/types/duplicates';

/**
 * Normalize domain for comparison
 * Removes www, protocol, trailing slash, and converts to lowercase
 */
export function normalizeDomain(domain: string | null | undefined): string {
  if (!domain) return '';

  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/^www\./, '') // Remove www
    .replace(/\/$/, '') // Remove trailing slash
    .trim();
}

/**
 * Extract domain from email address
 */
export function extractEmailDomain(email: string | null | undefined): string {
  if (!email) return '';

  const parts = email.split('@');
  if (parts.length !== 2) return '';

  return normalizeDomain(parts[1]);
}

/**
 * Calculate fuzzy similarity between two strings using Levenshtein distance
 * Returns a score from 0 to 1 (1 = exact match)
 */
export function fuzzyMatch(str1: string | null | undefined, str2: string | null | undefined): number {
  if (!str1 || !str2) return 0;

  // Normalize strings: lowercase, trim, remove extra spaces
  const normalized1 = str1.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalized2 = str2.toLowerCase().trim().replace(/\s+/g, ' ');

  if (normalized1 === normalized2) return 1;

  // Use fuzzball's token set ratio for better matching
  // This handles word order differences and partial matches
  const score = fuzzball.token_set_ratio(normalized1, normalized2);

  return score / 100; // Convert 0-100 to 0-1
}

/**
 * Calculate similarity between two accounts
 * Returns detailed similarity breakdown and overall score
 */
export function calculateAccountSimilarity(
  account1: any,
  account2: any
): SimilarityCalculation {
  let score = 0;
  let maxScore = 0;
  const breakdown: any = {};
  const matchingFields: string[] = [];

  // Domain exact match (highest weight: 40 points)
  if (account1.domain && account2.domain) {
    maxScore += 40;
    const domain1 = normalizeDomain(account1.domain);
    const domain2 = normalizeDomain(account2.domain);

    if (domain1 && domain2 && domain1 === domain2) {
      score += 40;
      breakdown.domain_score = 100;
      matchingFields.push('domain');
    } else {
      breakdown.domain_score = 0;
    }
  }

  // Name fuzzy match (30 points)
  if (account1.name && account2.name) {
    maxScore += 30;
    const nameSimilarity = fuzzyMatch(account1.name, account2.name);
    const nameScore = 30 * nameSimilarity;
    score += nameScore;
    breakdown.name_score = Math.round(nameSimilarity * 100);

    if (nameSimilarity >= 0.8) {
      matchingFields.push('name');
    }
  }

  // Email domain match (20 points)
  // Check if accounts have contacts with same email domain
  if (account1.email && account2.email) {
    maxScore += 20;
    const emailDomain1 = extractEmailDomain(account1.email);
    const emailDomain2 = extractEmailDomain(account2.email);

    if (emailDomain1 && emailDomain2 && emailDomain1 === emailDomain2) {
      score += 20;
      breakdown.email_score = 100;
      matchingFields.push('email_domain');
    } else {
      breakdown.email_score = 0;
    }
  }

  // City match (10 points)
  if (account1.city && account2.city) {
    maxScore += 10;
    const citySimilarity = fuzzyMatch(account1.city, account2.city);

    if (citySimilarity >= 0.9) {
      score += 10;
      breakdown.city_score = 100;
      matchingFields.push('city');
    } else {
      breakdown.city_score = Math.round(citySimilarity * 100);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    score,
    maxScore,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
    breakdown,
    matchingFields,
  };
}

/**
 * Calculate similarity between two contacts
 */
export function calculateContactSimilarity(
  contact1: any,
  contact2: any
): SimilarityCalculation {
  let score = 0;
  let maxScore = 0;
  const breakdown: any = {};
  const matchingFields: string[] = [];

  // Email exact match (highest weight: 50 points)
  if (contact1.email && contact2.email) {
    maxScore += 50;
    const email1 = contact1.email.toLowerCase().trim();
    const email2 = contact2.email.toLowerCase().trim();

    if (email1 === email2) {
      score += 50;
      breakdown.email_score = 100;
      matchingFields.push('email');
    } else {
      breakdown.email_score = 0;
    }
  }

  // Full name fuzzy match (30 points)
  const fullName1 = `${contact1.first_name || ''} ${contact1.last_name || ''}`.trim();
  const fullName2 = `${contact2.first_name || ''} ${contact2.last_name || ''}`.trim();

  if (fullName1 && fullName2) {
    maxScore += 30;
    const nameSimilarity = fuzzyMatch(fullName1, fullName2);
    const nameScore = 30 * nameSimilarity;
    score += nameScore;
    breakdown.name_score = Math.round(nameSimilarity * 100);

    if (nameSimilarity >= 0.8) {
      matchingFields.push('name');
    }
  }

  // LinkedIn URL match (20 points)
  if (contact1.linkedin_url && contact2.linkedin_url) {
    maxScore += 20;
    const linkedin1 = normalizeDomain(contact1.linkedin_url);
    const linkedin2 = normalizeDomain(contact2.linkedin_url);

    if (linkedin1 && linkedin2 && linkedin1 === linkedin2) {
      score += 20;
      breakdown.linkedin_score = 100;
      matchingFields.push('linkedin');
    } else {
      breakdown.linkedin_score = 0;
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    score,
    maxScore,
    percentage: Math.round(percentage * 100) / 100,
    breakdown,
    matchingFields,
  };
}

/**
 * Find potential duplicates for a single account
 * Returns array of accounts with similarity >= threshold (default 80%)
 */
export async function findDuplicatesForAccount(
  workspaceId: string,
  accountId: string,
  threshold: number = 80
): Promise<Array<{ account: any; similarity: SimilarityCalculation }>> {
  const supabase = await createClient();

  // Get the account we're checking
  const { data: sourceAccount, error: sourceError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (sourceError || !sourceAccount) {
    throw new Error(`Account not found: ${accountId}`);
  }

  // Get all other accounts in the workspace
  const { data: allAccounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .neq('id', accountId); // Exclude the source account

  if (accountsError) {
    throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
  }

  if (!allAccounts || allAccounts.length === 0) {
    return [];
  }

  // Calculate similarity for each account
  const duplicates: Array<{ account: any; similarity: SimilarityCalculation }> = [];

  for (const account of allAccounts) {
    const similarity = calculateAccountSimilarity(sourceAccount, account);

    if (similarity.percentage >= threshold) {
      duplicates.push({ account, similarity });
    }
  }

  // Sort by similarity score (highest first)
  duplicates.sort((a, b) => b.similarity.percentage - a.similarity.percentage);

  return duplicates;
}

/**
 * Find potential duplicates for a single contact
 */
export async function findDuplicatesForContact(
  workspaceId: string,
  contactId: string,
  threshold: number = 80
): Promise<Array<{ contact: any; similarity: SimilarityCalculation }>> {
  const supabase = await createClient();

  const { data: sourceContact, error: sourceError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (sourceError || !sourceContact) {
    throw new Error(`Contact not found: ${contactId}`);
  }

  const { data: allContacts, error: contactsError } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .neq('id', contactId);

  if (contactsError) {
    throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
  }

  if (!allContacts || allContacts.length === 0) {
    return [];
  }

  const duplicates: Array<{ contact: any; similarity: SimilarityCalculation }> = [];

  for (const contact of allContacts) {
    const similarity = calculateContactSimilarity(sourceContact, contact);

    if (similarity.percentage >= threshold) {
      duplicates.push({ contact, similarity });
    }
  }

  duplicates.sort((a, b) => b.similarity.percentage - a.similarity.percentage);

  return duplicates;
}

/**
 * Create a duplicate candidate record in the database
 */
export async function createDuplicateCandidate(
  payload: CreateDuplicateCandidatePayload
): Promise<DuplicateCandidate | null> {
  const supabase = await createClient();

  // Ensure entity_id_1 < entity_id_2 (database constraint)
  const [id1, id2] = [payload.entity_id_1, payload.entity_id_2].sort();

  const { data, error } = await supabase
    .from('duplicate_candidates')
    .upsert({
      ...payload,
      entity_id_1: id1,
      entity_id_2: id2,
    }, {
      onConflict: 'workspace_id,entity_type,entity_id_1,entity_id_2',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating duplicate candidate:', error);
    return null;
  }

  return data as DuplicateCandidate;
}

/**
 * Get duplicate statistics for a workspace
 */
export async function getDuplicateStats(
  workspaceId: string,
  entityType?: DuplicateEntityType
): Promise<DuplicateStats | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_duplicate_stats', {
    p_workspace_id: workspaceId,
    p_entity_type: entityType || null,
  });

  if (error) {
    console.error('Error getting duplicate stats:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return {
      pending_count: 0,
      merged_count: 0,
      not_duplicate_count: 0,
      ignored_count: 0,
      total_detected: 0,
      avg_similarity_score: 0,
      highest_similarity: 0,
    };
  }

  return data[0] as DuplicateStats;
}

/**
 * Get duplicate candidates for a workspace (with pagination and filtering)
 */
export async function getDuplicateCandidates(
  workspaceId: string,
  options?: {
    entityType?: DuplicateEntityType;
    status?: string;
    minScore?: number;
    limit?: number;
    offset?: number;
  }
): Promise<{ candidates: DuplicateCandidate[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('duplicate_candidates')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('similarity_score', { ascending: false });

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.minScore) {
    query = query.gte('similarity_score', options.minScore);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error getting duplicate candidates:', error);
    return { candidates: [], total: 0 };
  }

  return {
    candidates: (data as DuplicateCandidate[]) || [],
    total: count || 0,
  };
}
