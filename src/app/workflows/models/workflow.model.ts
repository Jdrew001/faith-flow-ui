// Workflow Types
export type WorkflowTriggerType = 'manual' | 'attendance_rule' | 'member_created' | 'member_updated' | 'scheduled' | 'first_time_visitor' | 'api' | 'workflow_completion';
export type WorkflowStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';
export type WorkflowStepType = 'manual_task' | 'send_email' | 'send_sms' | 'wait' | 'conditional' | 'update_member' | 'create_note' | 'webhook';
export type AssignmentStrategy = 'SPECIFIC_USER' | 'ROLE' | 'ROUND_ROBIN' | 'LEAST_LOADED' | 'SELF';
export type WorkflowCategory = 'FOLLOW_UP' | 'ONBOARDING' | 'ENGAGEMENT' | 'PASTORAL_CARE' | 'ADMINISTRATION' | 'CUSTOM';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskCategory = 'FOLLOW_UP' | 'PHONE_CALL' | 'EMAIL' | 'VISIT' | 'MEETING' | 'PRAYER' | 'OTHER';
export type InstanceStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'failed';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  enabled?: boolean;
  conditions?: {
    // Simple format for attendance conditions
    absences_in_period?: { 
      count: number;
      period_days: number;
    };
    consecutive_absences?: { 
      count: number;
    };
    no_attendance_days?: { 
      days: number;
    };
    attendance_percentage?: { 
      percentage: number;
      period_days: number;
    };
    // For member update triggers
    field_changed?: string;
    new_value?: any;
    old_value?: any;
  };
  filters?: {
    age_groups?: string[];
    services?: string[];
    member_status?: string[];
    exclude_members?: boolean;
    exclude_tags?: string[];
  };
  schedule?: string; // Cron expression for scheduled type
  evaluation_schedule?: string; // When to evaluate the trigger
}

export interface WorkflowSession {
  id: string;
  name: string;
  type: string;
}

// Deprecated - use WorkflowSession instead
export type WorkflowEvent = WorkflowSession;

export interface WorkflowStep {
  order: number;
  type: WorkflowStepType;
  name: string;
  description?: string;
  metadata: any; // Step-specific metadata
}

// Step Metadata Interfaces
export interface ManualTaskMetadata {
  title: string;
  description: string;
  priority: Priority;
  assignment_strategy: AssignmentStrategy;
  assigned_to?: string;
  due_offset_hours: number;
  category: TaskCategory;
  required_fields?: string[];
  completion_requires_note?: boolean;
  escalation?: {
    after_hours: number;
    escalate_to: string;
  };
  task_template_id?: string;
}

export interface SendEmailMetadata {
  to: string;
  cc?: string[];
  bcc?: string[];
  from?: string;
  subject: string;
  body?: string;
  template_id?: string;
  track_opens?: boolean;
  track_clicks?: boolean;
  attachments?: string[];
  include_attachments?: string[];
}

export interface SendSmsMetadata {
  to: string;
  message: string;
  provider?: 'TWILIO' | 'AWS_SNS' | 'MESSAGEBIRD' | 'NEXMO';
  sender_id?: string;
  delivery_time?: string;
  timezone?: string;
}

export interface WaitMetadata {
  duration_hours?: number;
  duration_days?: number;
  skip_weekends?: boolean;
  skip_holidays?: boolean;
  business_hours_only?: boolean;
  wait_until?: string;
}

export interface ConditionalMetadata {
  conditions: {
    type: 'member_field' | 'email_opened' | 'sms_clicked' | 'step_completed' | 'custom';
    field?: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'is_null' | 'is_not_null' | 'greater_than' | 'less_than';
    value?: any;
    within_hours?: number;
  };
  true_path?: number[];
  false_path?: number[];
}

export interface UpdateMemberMetadata {
  fields?: {
    [key: string]: any;
  };
  add_tags?: string[];
  remove_tags?: string[];
  add_to_groups?: string[];
  remove_from_groups?: string[];
}

export interface CreateNoteMetadata {
  note: string;
  category: 'GENERAL' | 'PASTORAL_CARE' | 'ATTENDANCE' | 'PRAYER_REQUEST' | 'FOLLOW_UP' | 'ADMINISTRATIVE' | 'ENGAGEMENT';
  visibility: 'PUBLIC' | 'PRIVATE' | 'STAFF_ONLY';
  pin_to_profile?: boolean;
}

export interface WebhookMetadata {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: {
    [key: string]: string;
  };
  body?: any;
  auth?: {
    type: 'basic' | 'bearer' | 'api_key';
    credentials: {
      [key: string]: string;
    };
  };
  retry_count?: number;
  timeout_seconds?: number;
}

export interface WorkflowInstance {
  id: string;
  template_id: string;
  template_name: string;
  member_id: string;
  member_name: string;
  status: InstanceStatus;
  current_step_index: number;
  current_step_name?: string;
  started_at: string;
  completed_at?: string;
  progress_percentage: number;
  pending_tasks: number;
  completed_steps: number;
  total_steps: number;
  steps?: WorkflowInstanceStep[];
}

export interface WorkflowInstanceStep {
  id: string;
  step_id: string;
  step_name: string;
  step_type: WorkflowStepType;
  status: StepStatus;
  assignee_id?: string;
  assignee_name?: string;
  started_at?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
}

export interface WorkflowHistory {
  id: string;
  workflowId: string;
  instanceId: string;
  triggeredAt: Date;
  memberName: string;
  memberId: string;
  status: 'success' | 'failed' | 'cancelled';
  completedAt?: Date;
  outcome?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  settings?: {
    max_concurrent_instances?: number;
    allow_multiple_per_member?: boolean;
    auto_cancel_after_days?: number;
    timezone?: string;
    business_hours?: {
      start: string;
      end: string;
      days: string[];
    };
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
  version?: number;
  statistics?: {
    total_runs: number;
    active_instances: number;
    success_rate: number;
    average_completion_time_hours: number;
  };
}

// Workflow (for backward compatibility - maps to WorkflowTemplate)
export interface Workflow extends WorkflowTemplate {
  definition?: {
    name: string;
    steps: WorkflowStep[];
    trigger: WorkflowTrigger;
  };
  status?: WorkflowStatus;
  lastTriggeredAt?: Date;
  stats?: {
    totalTriggers: number;
    activeInstances: number;
    completedInstances: number;
    successRate: number;
  };
  // Convenience properties for easier access
  triggerType?: WorkflowTriggerType;
  testMode?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowWizardState {
  currentStep: number;
  totalSteps: number;
  steps: {
    nameAndTriggerType: {
      name: string;
      description?: string;
      triggerType: WorkflowTriggerType;
    };
    triggerRules: {
      events: WorkflowSession[];
      allEvents: boolean;
      trigger: WorkflowTrigger;
    };
    workflowSteps: {
      steps: WorkflowStep[];
    };
    review: {
      testMode: boolean;
      confirmed: boolean;
    };
  };
}

// Template preset for UI (used for template selection)
export interface WorkflowTemplatePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  preset: Partial<WorkflowTemplate>;
}

export interface WorkflowStatistics {
  workflowId: string;
  period: 'day' | 'week' | 'month' | 'all';
  totalTriggers: number;
  activeInstances: number;
  completedInstances: number;
  cancelledInstances: number;
  failedInstances: number;
  averageCompletionTime: number;
  successRate: number;
  memberCount: number;
}