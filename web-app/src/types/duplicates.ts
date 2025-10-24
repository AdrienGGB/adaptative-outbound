/**
 * Duplicate Detection Types
 * F001: Data Quality & Import System
 */

export type DuplicateEntityType = 'account' | 'contact';

export type DuplicateStatus = 'pending' | 'merged' | 'not_duplicate' | 'ignored';

export type DetectionMethod = 'domain_match' | 'fuzzy_name' | 'email_match' | 'composite';

export interface FieldSimilarities {
  domain_score?: number;
  name_score?: number;
  email_score?: number;
  city_score?: number;
}

export interface DuplicateCandidate {
  id: string;
  workspace_id: string;

  // Entity Information
  entity_type: DuplicateEntityType;
  entity_id_1: string;
  entity_id_2: string;

  // Similarity Metrics
  similarity_score: number; // 0.00 to 100.00
  matching_fields: string[];

  // Detailed Breakdown
  field_similarities: FieldSimilarities;

  // Detection
  detection_method: DetectionMethod;
  detected_at: string;

  // Resolution
  status: DuplicateStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  merged_into: string | null; // entity_id_1 or entity_id_2
}

export interface DuplicateStats {
  pending_count: number;
  merged_count: number;
  not_duplicate_count: number;
  ignored_count: number;
  total_detected: number;
  avg_similarity_score: number;
  highest_similarity: number;
}

export interface SimilarityCalculation {
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: FieldSimilarities;
  matchingFields: string[];
}

export interface CreateDuplicateCandidatePayload {
  workspace_id: string;
  entity_type: DuplicateEntityType;
  entity_id_1: string;
  entity_id_2: string;
  similarity_score: number;
  matching_fields: string[];
  field_similarities: FieldSimilarities;
  detection_method: DetectionMethod;
}

export interface ResolveDuplicatePayload {
  status: 'not_duplicate' | 'ignored';
}

export interface MergeDuplicatePayload {
  keep_id: string; // entity_id_1 or entity_id_2
  merge_id: string; // entity_id_1 or entity_id_2
  merged_data?: Record<string, any>; // Custom field selections
}

export interface DuplicateWithEntities extends DuplicateCandidate {
  entity_1?: any; // Account or Contact
  entity_2?: any; // Account or Contact
}
