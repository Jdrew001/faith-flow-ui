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
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'draft':
        return 'medium';
      default:
        return 'medium';
    }
  }

  get statusIcon(): string {
    switch (this.workflow.status) {
      case 'active':
        return 'checkmark-circle';
      case 'paused':
        return 'pause-circle';
      case 'draft':
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
    } else if (trigger.type === 'schedule') {
      return 'Scheduled trigger';
    } else if (trigger.type === 'attendance') {
      const typeText = trigger.attendanceType === 'missed' ? 'Missed' : 
                       trigger.attendanceType === 'attended' ? 'Attended' : 
                       'First-time visitor';
      const frequencyText = trigger.frequency === 1 ? 'once' : `${trigger.frequency}+ times`;
      const windowText = `in ${trigger.timeWindowDays} days`;
      
      return `${typeText} ${frequencyText} ${windowText}`;
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