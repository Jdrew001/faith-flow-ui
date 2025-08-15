export type WorkflowTriggerType = 'attendance' | 'attendance_rule' | 'manual' | 'schedule';
export type AttendanceCondition = 'missed_3_in_21_days' | 'first_time_visitor' | 'consistent_attendance';
export type AttendanceType = 'missed' | 'first_time' | 'consistent';
export type WorkflowStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';
export type WorkflowStepType = 'manual_task' | 'task' | 'sms' | 'email' | 'wait' | 'note';
export type AssignmentStrategy = 'admin' | 'role' | 'round-robin' | 'specific';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  condition?: AttendanceCondition;
  events?: WorkflowEvent[];
  allEvents?: boolean;
  attendanceType?: AttendanceType;
  frequency?: number;
  timeWindowDays?: number;
  filters?: {
    memberStatus?: ('active' | 'inactive' | 'visitor')[];
    ageGroups?: string[];
    ministries?: string[];
    tags?: string[];
  };
}

export interface WorkflowEvent {
  id: string;
  name: string;
  type: string;
}

export interface WorkflowStep {
  id?: string;
  name: string;
  type: WorkflowStepType;
  order: number;
  description?: string;
  due_offset_hours?: number;
  assignment_strategy?: AssignmentStrategy;
  wait_hours?: number;
  message?: string;
  subject?: string;
  body?: string;
  content?: string;
  config?: TaskStepConfig | SmsStepConfig | EmailStepConfig | WaitStepConfig | NoteStepConfig;
}

export interface TaskStepConfig {
  title: string;
  description: string;
  assignmentStrategy: AssignmentStrategy;
  assigneeId?: string;
  roleId?: string;
  dueDateOffset: {
    value: number;
    unit: 'hours' | 'days';
  };
}

export interface SmsStepConfig {
  message: string;
  recipientType: 'member' | 'assignee' | 'custom';
  customNumber?: string;
  delayHours?: number;
}

export interface EmailStepConfig {
  subject: string;
  body: string;
  recipientType: 'member' | 'assignee' | 'custom';
  customEmail?: string;
  delayHours?: number;
}

export interface WaitStepConfig {
  duration: {
    value: number;
    unit: 'hours' | 'days';
  };
}

export interface NoteStepConfig {
  content: string;
  attachToMember: boolean;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  memberId: string;
  memberName: string;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  currentStepId: string;
  currentStepIndex: number;
  startedAt: Date;
  completedAt?: Date;
  steps: WorkflowInstanceStep[];
}

export interface WorkflowInstanceStep {
  id: string;
  stepId: string;
  stepName: string;
  stepType: WorkflowStepType;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
  assigneeId?: string;
  assigneeName?: string;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
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

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
  trigger: WorkflowTrigger;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lastTriggeredAt?: Date;
  stats?: {
    totalTriggers: number;
    activeInstances: number;
    completedInstances: number;
    successRate: number;
  };
  // Convenience properties for easier access
  trigger?: WorkflowTrigger;
  triggerType?: WorkflowTriggerType;
  steps?: WorkflowStep[];
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
      events: WorkflowEvent[];
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

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  preset: Partial<Workflow>;
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