import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { FollowUpItem } from '../followups.page';

export interface AssignmentForm {
  assignedTo: string;
  notes: string;
  dueDate: string;
  priority: string;
}

export interface Assignee {
  value: string;
  label: string;
  role?: string;
  avatar?: string;
  color?: string;
}

@Component({
  selector: 'app-assignment-modal',
  templateUrl: './assignment-modal.component.html',
  styleUrls: ['./assignment-modal.component.scss'],
  standalone: false
})
export class AssignmentModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() followupItem: FollowUpItem | null = null;
  @Input() assignees: Assignee[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<AssignmentForm>();

  assignmentForm: AssignmentForm = {
    assignedTo: '',
    notes: '',
    dueDate: '',
    priority: ''
  };

  constructor() {}

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges() {
    if (this.followupItem) {
      this.initializeForm();
    }
  }

  initializeForm() {
    if (this.followupItem) {
      this.assignmentForm = {
        assignedTo: this.followupItem.assignedTo || '',
        notes: this.followupItem.notes || '',
        dueDate: this.followupItem.dueDate ? this.formatDateForInput(this.followupItem.dueDate) : '',
        priority: this.followupItem.priority
      };
    }
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  closeModal() {
    this.close.emit();
    this.resetForm();
  }

  saveAssignment() {
    this.save.emit({ ...this.assignmentForm });
    this.resetForm();
  }

  resetForm() {
    this.assignmentForm = {
      assignedTo: '',
      notes: '',
      dueDate: '',
      priority: ''
    };
  }

  getAvailableAssignees(): Assignee[] {
    return this.assignees.filter(a => a.value !== 'all' && a.value !== 'unassigned');
  }

  getAssigneeDetails(assigneeName: string): Assignee | null {
    return this.assignees.find(a => a.value === assigneeName) || null;
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'new visitor follow-up':
        return 'person-add-outline';
      case 'prayer request follow-up':
        return 'heart-outline';
      case 'pastoral care':
        return 'medical-outline';
      case 'volunteer follow-up':
        return 'people-outline';
      default:
        return 'chatbubble-outline';
    }
  }

  selectAssignee(assigneeValue: string) {
    this.assignmentForm.assignedTo = assigneeValue;
  }
}
