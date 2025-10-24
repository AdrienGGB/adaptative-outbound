/**
 * Duplicate Detection Worker
 * F001: Data Quality & Import System
 *
 * Background job processor for detecting duplicate accounts and contacts
 * Scans all entities in a workspace and creates duplicate_candidates records
 */

import { createClient } from '@/lib/supabase/server';
import { JobProcessor, updateJobProgress, logJob } from './job-worker';
import {
  calculateAccountSimilarity,
  calculateContactSimilarity,
  createDuplicateCandidate,
} from '@/services/duplicate-detection';
import type { Job } from '@/types/jobs';
import type { DuplicateEntityType } from '@/types/duplicates';

export class DuplicateDetector implements JobProcessor {
  getJobTypes(): string[] {
    return ['detect_duplicates', 'detect_account_duplicates', 'detect_contact_duplicates'];
  }

  async process(job: Job): Promise<any> {
    if (job.job_type === 'detect_duplicates') {
      return this.detectAllDuplicates(job);
    } else if (job.job_type === 'detect_account_duplicates') {
      return this.detectAccountDuplicates(job);
    } else if (job.job_type === 'detect_contact_duplicates') {
      return this.detectContactDuplicates(job);
    }

    throw new Error(`Unknown job type: ${job.job_type}`);
  }

  /**
   * Detect duplicates for all entity types (accounts + contacts)
   */
  private async detectAllDuplicates(job: Job): Promise<any> {
    await logJob(job.id, 'info', 'Starting duplicate detection for all entities');
    await updateJobProgress(job.id, 5, 'Scanning workspace...');

    const accountsResult = await this.detectAccountDuplicates(job, 50);
    const contactsResult = await this.detectContactDuplicates(job, 50);

    await updateJobProgress(job.id, 100, 'Duplicate detection complete');

    return {
      accounts_scanned: accountsResult.accounts_scanned,
      account_duplicates_found: accountsResult.duplicates_found,
      contacts_scanned: contactsResult.contacts_scanned,
      contact_duplicates_found: contactsResult.duplicates_found,
      total_duplicates: accountsResult.duplicates_found + contactsResult.duplicates_found,
    };
  }

  /**
   * Detect duplicate accounts
   */
  private async detectAccountDuplicates(job: Job, progressOffset: number = 0): Promise<any> {
    const supabase = await createClient();
    const threshold = (job.payload?.threshold as number) || 80; // Default 80% similarity
    const batchSize = 100;

    await updateJobProgress(
      job.id,
      progressOffset + 5,
      'Fetching accounts...'
    );

    // Get all accounts in workspace
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('workspace_id', job.workspace_id)
      .order('created_at', { ascending: true });

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      await logJob(job.id, 'info', 'No accounts found in workspace');
      return { accounts_scanned: 0, duplicates_found: 0 };
    }

    await logJob(job.id, 'info', `Scanning ${accounts.length} accounts for duplicates...`);

    let totalDuplicates = 0;
    let processedCount = 0;

    // Process accounts in batches to avoid memory issues
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);

      await updateJobProgress(
        job.id,
        progressOffset + 10 + Math.floor(((i / accounts.length) * 30)),
        `Processing accounts ${i + 1}-${Math.min(i + batchSize, accounts.length)} of ${accounts.length}...`
      );

      // Compare each account in batch with all subsequent accounts
      for (let j = 0; j < batch.length; j++) {
        const sourceAccount = batch[j];
        const sourceIndex = i + j;

        // Only compare with accounts that come after (avoid duplicate comparisons)
        for (let k = sourceIndex + 1; k < accounts.length; k++) {
          const compareAccount = accounts[k];

          // Calculate similarity
          const similarity = calculateAccountSimilarity(sourceAccount, compareAccount);

          // If similarity >= threshold, create duplicate candidate
          if (similarity.percentage >= threshold) {
            await createDuplicateCandidate({
              workspace_id: job.workspace_id,
              entity_type: 'account',
              entity_id_1: sourceAccount.id,
              entity_id_2: compareAccount.id,
              similarity_score: similarity.percentage,
              matching_fields: similarity.matchingFields,
              field_similarities: similarity.breakdown,
              detection_method: similarity.matchingFields.includes('domain')
                ? 'domain_match'
                : similarity.matchingFields.includes('name')
                ? 'fuzzy_name'
                : 'composite',
            });

            totalDuplicates++;

            await logJob(
              job.id,
              'info',
              `Duplicate found: "${sourceAccount.name}" ↔ "${compareAccount.name}" (${similarity.percentage}% match)`,
              {
                account_id_1: sourceAccount.id,
                account_id_2: compareAccount.id,
                similarity_score: similarity.percentage,
                matching_fields: similarity.matchingFields,
              }
            );
          }
        }

        processedCount++;
      }
    }

    await logJob(
      job.id,
      'info',
      `Account duplicate detection complete: ${totalDuplicates} duplicates found`
    );

    return {
      accounts_scanned: accounts.length,
      duplicates_found: totalDuplicates,
    };
  }

  /**
   * Detect duplicate contacts
   */
  private async detectContactDuplicates(job: Job, progressOffset: number = 0): Promise<any> {
    const supabase = await createClient();
    const threshold = (job.payload?.threshold as number) || 80;
    const batchSize = 100;

    await updateJobProgress(
      job.id,
      progressOffset + 5,
      'Fetching contacts...'
    );

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', job.workspace_id)
      .order('created_at', { ascending: true });

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      await logJob(job.id, 'info', 'No contacts found in workspace');
      return { contacts_scanned: 0, duplicates_found: 0 };
    }

    await logJob(job.id, 'info', `Scanning ${contacts.length} contacts for duplicates...`);

    let totalDuplicates = 0;
    let processedCount = 0;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      await updateJobProgress(
        job.id,
        progressOffset + 10 + Math.floor(((i / contacts.length) * 30)),
        `Processing contacts ${i + 1}-${Math.min(i + batchSize, contacts.length)} of ${contacts.length}...`
      );

      for (let j = 0; j < batch.length; j++) {
        const sourceContact = batch[j];
        const sourceIndex = i + j;

        for (let k = sourceIndex + 1; k < contacts.length; k++) {
          const compareContact = contacts[k];

          const similarity = calculateContactSimilarity(sourceContact, compareContact);

          if (similarity.percentage >= threshold) {
            await createDuplicateCandidate({
              workspace_id: job.workspace_id,
              entity_type: 'contact',
              entity_id_1: sourceContact.id,
              entity_id_2: compareContact.id,
              similarity_score: similarity.percentage,
              matching_fields: similarity.matchingFields,
              field_similarities: similarity.breakdown,
              detection_method: similarity.matchingFields.includes('email')
                ? 'email_match'
                : similarity.matchingFields.includes('name')
                ? 'fuzzy_name'
                : 'composite',
            });

            totalDuplicates++;

            await logJob(
              job.id,
              'info',
              `Duplicate found: "${sourceContact.first_name} ${sourceContact.last_name}" ↔ "${compareContact.first_name} ${compareContact.last_name}" (${similarity.percentage}% match)`,
              {
                contact_id_1: sourceContact.id,
                contact_id_2: compareContact.id,
                similarity_score: similarity.percentage,
                matching_fields: similarity.matchingFields,
              }
            );
          }
        }

        processedCount++;
      }
    }

    await logJob(
      job.id,
      'info',
      `Contact duplicate detection complete: ${totalDuplicates} duplicates found`
    );

    return {
      contacts_scanned: contacts.length,
      duplicates_found: totalDuplicates,
    };
  }
}
