import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Workflow } from '../../models';

@Component({
  selector: 'app-workflow-card',
  templateUrl: './workflow-card.component.html',
  styleUrls: ['./workflow-card.component.scss'],
  standalone: false
})
export class WorkflowCardComponent {
  @Input() workflow!: Workflow;
  @Output() action = new EventEmitter<void>();

  get statusColor(): string {
    switch (this.workflow.status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'DRAFT':
        return 'medium';
      default:
        return 'medium';
    }
  }

  get statusIcon(): string {
    switch (this.workflow.status) {
      case 'ACTIVE':
        return 'checkmark-circle';
      case 'PAUSED':
        return 'pause-circle';
      case 'DRAFT':
        return 'create-outline';
      default:
        return 'help-circle';
    }
  }

  get triggerDescription(): string {
    if (!this.workflow.trigger) return 'No trigger configured';
    
    const trigger = this.workflow.trigger;
    
    if (trigger.type === 'manual') {
      return 'Manual trigger';
    } else if (trigger.type === 'scheduled') {
      return 'Scheduled trigger';
    } else if (trigger.type === 'attendance_rule' && trigger.conditions) {
      if (trigger.conditions.absences_in_period) {
        const { count, period_days } = trigger.conditions.absences_in_period;
        return `Missed ${count}+ times in ${period_days} days`;
      }
      return 'Attendance rule';
    } else if (trigger.type === 'first_time_visitor') {
      return 'First-time visitor';
    } else if (trigger.type === 'member_created') {
      return 'New member';
    } else if (trigger.type === 'member_updated') {
      return 'Member updated';
    }
    
    return 'Custom trigger';
  }

  get stepsSummary(): string {
    if (!this.workflow.steps || this.workflow.steps.length === 0) {
      return 'No steps configured';
    }
    
    const stepTypes = this.workflow.steps.reduce((acc, step) => {
      acc[step.type] = (acc[step.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summaryParts = [];
    if (stepTypes['task']) summaryParts.push(`${stepTypes['task']} task${stepTypes['task'] > 1 ? 's' : ''}`);
    if (stepTypes['email']) summaryParts.push(`${stepTypes['email']} email${stepTypes['email'] > 1 ? 's' : ''}`);
    if (stepTypes['sms']) summaryParts.push(`${stepTypes['sms']} SMS`);
    if (stepTypes['wait']) summaryParts.push(`${stepTypes['wait']} wait${stepTypes['wait'] > 1 ? 's' : ''}`);
    if (stepTypes['note']) summaryParts.push(`${stepTypes['note']} note${stepTypes['note'] > 1 ? 's' : ''}`);
    
    return summaryParts.join(', ') || 'No steps';
  }

  onActionClick(event: Event) {
    event.stopPropagation();
    this.action.emit();
  }
}