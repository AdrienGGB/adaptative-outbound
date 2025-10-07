/**
 * Service Layer Index
 * Central export for all service modules
 */

// Account services
export {
  createAccount,
  getAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  getAccountContacts,
  getAccountActivities,
  getAccountHierarchy,
  searchAccounts,
  bulkCreateAccounts,
  bulkUpdateAccounts,
} from './accounts'

// Contact services
export {
  createContact,
  getContact,
  getContacts,
  updateContact,
  deleteContact,
  getContactActivities,
  getContactAccount,
  searchContacts,
  bulkCreateContacts,
} from './contacts'

// Activity services
export {
  logActivity,
  getActivity,
  getActivities,
  updateActivity,
  getAccountTimeline,
  getContactTimeline,
  getWorkspaceTimeline,
  logEmail,
  logCall,
  logMeeting,
} from './activities'

export type {
  EmailActivityCreate,
  CallActivityCreate,
  MeetingActivityCreate,
} from './activities'

// Tag services
export {
  createTag,
  getTags,
  getTag,
  updateTag,
  deleteTag,
  addTagToEntity,
  removeTagFromEntity,
  getEntityTags,
  getEntitiesWithTag,
  bulkTagEntities,
  bulkUntagEntities,
  replaceEntityTags,
  searchTags,
  getTagUsageCount,
} from './tags'

// Task services
export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  cancelTask,
  reopenTask,
  getMyTasks,
  getOverdueTasks,
  getContactTasks,
  getAccountTasks,
  getTasksDueToday,
  bulkCreateTasks,
  bulkUpdateTaskStatus,
  bulkAssignTasks,
} from './tasks'

// Custom field services
export {
  createCustomField,
  getCustomFields,
  getCustomField,
  updateCustomField,
  deleteCustomField,
  hardDeleteCustomField,
  setCustomFieldValue,
  getCustomFieldValue,
  deleteCustomFieldValue,
  getEntityCustomFields,
  bulkSetCustomFieldValues,
  getEntitiesWithCustomFieldValue,
  reorderCustomFields,
  validateCustomFieldValue,
} from './custom-fields'
