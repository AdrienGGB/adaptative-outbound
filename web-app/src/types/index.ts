/**
 * Central export file for all type definitions
 *
 * This file exports all types from F001 (Auth & Workspaces) and F002 (Core Data Schema)
 * organized by entity/domain
 */

// ============================================================================
// RE-EXPORT DATABASE & AUTH TYPES (from F001)
// ============================================================================
export type { Database, Json } from './database'
export type {
  Profile,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  UserRole,
  WorkspaceWithRole,
  MemberWithProfile
} from './auth'

// ============================================================================
// ACCOUNT TYPES (F002)
// ============================================================================
export type {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountFilters,
  AccountStatus,
  AccountTier,
  LifecycleStage,
  BusinessModel,
  CompanyType,
  FundingStage,
  FundingType,
  EmployeeRange,
  RevenueRange,
  AccountSource,
  TechnologyStack,
  AccountHierarchy,
  AccountHierarchyCreate,
  AccountHierarchyRelationshipType,
  AccountVersion,
  AccountChangeType,
  AccountChangeSource,
  ImportAccountMapping,
  AccountWithRelations,
  AccountListItem,
  AccountMetrics
} from './account'

// ============================================================================
// CONTACT TYPES (F002)
// ============================================================================
export type {
  Contact,
  ContactCreate,
  ContactUpdate,
  ContactFilters,
  ContactStatus,
  EmailStatus,
  PhoneStatus,
  Department,
  SeniorityLevel,
  BuyingRole,
  EngagementLevel,
  ContactSource,
  ContactVersion,
  ContactChangeType,
  ContactChangeSource,
  ContactWithRelations,
  ContactListItem,
  ContactMetrics,
  ContactEngagement,
  ContactHierarchy
} from './contact'

// ============================================================================
// ACTIVITY TYPES (F002)
// ============================================================================
export type {
  Activity,
  ActivityCreate,
  ActivityUpdate,
  ActivityFilters,
  ActivityType,
  ActivityCategory,
  ActivityOutcome,
  ActivitySource,
  ActivityData,
  EmailActivityData,
  CallActivityData,
  MeetingActivityData,
  LinkedInActivityData,
  WebsiteActivityData,
  ContentDownloadData,
  NoteActivityData,
  ActivityWithRelations,
  ActivityTimelineItem,
  ActivityMetrics,
  EmailMetrics,
  CallMetrics,
  MeetingMetrics,
  ActivitySummary
} from './activity'

// ============================================================================
// CUSTOM FIELD TYPES (F002)
// ============================================================================
export type {
  CustomField,
  CustomFieldCreate,
  CustomFieldUpdate,
  CustomFieldEntityType,
  CustomFieldType,
  CustomFieldOption,
  CustomFieldValidationRules,
  CustomFieldValue,
  CustomFieldValueCreate,
  CustomFieldValueUpdate,
  CustomFieldWithValue,
  TypedCustomFieldValue,
  CustomFieldsByEntity,
  CustomFieldValueMap,
  CustomFieldFormField,
  CustomFieldFilter,
  BulkCustomFieldValueUpdate,
  CustomFieldValidationResult,
  CustomFieldStats,
  CustomFieldExport,
  CustomFieldTemplate
} from './custom-field'

export {
  COMMON_ACCOUNT_FIELDS,
  COMMON_CONTACT_FIELDS
} from './custom-field'

// ============================================================================
// TAG TYPES (F002)
// ============================================================================
export type {
  Tag,
  TagCreate,
  TagUpdate,
  TagFilters,
  EntityType,
  EntityTag,
  EntityTagCreate,
  EntityTagFilters,
  BulkEntityTagCreate,
  BulkEntityTagDelete,
  TagWithCount,
  TagWithEntity,
  EntityWithTags,
  TagStats,
  TagGroup,
  TagCloudItem,
  TagColor,
  TagSuggestion,
  BulkTagResult,
  TagFilterCondition,
  EntityTagQuery,
  TagTemplate
} from './tag'

export {
  TAG_COLORS,
  ACCOUNT_TAG_TEMPLATES,
  CONTACT_TAG_TEMPLATES,
  OPPORTUNITY_TAG_TEMPLATES,
  ALL_TAG_TEMPLATES
} from './tag'

// ============================================================================
// TASK TYPES (F002)
// ============================================================================
export type {
  Task,
  TaskCreate,
  TaskUpdate,
  TaskFilters,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskWithRelations,
  TaskListItem,
  TaskGroup,
  TaskMetrics,
  UserTaskSummary,
  TaskTemplate,
  BulkTaskCreate,
  BulkTaskUpdate,
  TaskCompletion,
  TaskReminderConfig,
  TaskActivity,
  TaskComment
} from './task'

export {
  TASK_PRIORITY_ORDER,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  COMMON_TASK_TEMPLATES
} from './task'

// ============================================================================
// TEAM TYPES (F002)
// ============================================================================
export type {
  Team,
  TeamCreate,
  TeamUpdate,
  TeamFilters,
  TeamWithRelations,
  TeamMember,
  TeamStats,
  TeamPerformance,
  TeamAssignmentChange,
  TeamQuota,
  TeamHierarchy,
  TeamListItem,
  BulkTeamAssignment
} from './team'

export {
  isTeamLead,
  getTeamMemberCount
} from './team'

// ============================================================================
// DEAD LETTER QUEUE TYPES (F002)
// ============================================================================
export type {
  DeadLetterQueueEntry,
  DeadLetterQueueCreate,
  DeadLetterQueueUpdate,
  DeadLetterQueueFilters,
  DLQStatus,
  DLQJobType,
  DeadLetterQueueWithRelations,
  DeadLetterQueueStats,
  DeadLetterQueueRetry,
  BulkDeadLetterQueueResolve,
  DeadLetterQueueAlert,
  DeadLetterQueueErrorPattern
} from './dead-letter-queue'

export {
  DLQ_STATUS_LABELS,
  DLQ_STATUS_COLORS,
  DLQ_JOB_TYPE_LABELS,
  DLQ_JOB_TYPE_ICONS
} from './dead-letter-queue'
