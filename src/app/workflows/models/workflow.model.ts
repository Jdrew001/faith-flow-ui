export type WorkflowTriggerType = 'attendance' | 'manual' | 'schedule';
export type AttendanceType = 'missed' | 'attended' | 'first_time';
export type WorkflowStatus = 'active' | 'paused' | 'draft';
export type WorkflowStepType = 'task' | 'sms' | 'email' | 'wait' | 'note';
export type AssignmentStrategy = 'admin' | 'role' | 'round-robin' | 'specific';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  attendanceType?: AttendanceType;
  frequency?: number;
  timeWindowDays?: number;
  events?: WorkflowEvent[];
  allEvents?: boolean;
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
  id: string;
  type: WorkflowStepType;
  name: string;
  order: number;
  config: TaskStepConfig | SmsStepConfig | EmailStepConfig | WaitStepConfig | NoteStepConfig;
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

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  testMode: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  stats: {
    totalTriggers: number;
    activeInstances: number;
    completedInstances: number;
    successRate: number;
  };
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