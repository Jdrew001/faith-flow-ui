import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FollowUpItem } from '../../followups.page';

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

  assignmentForm!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges() {
    if (this.followupItem && this.assignmentForm) {
      this.updateFormValues();
    }
  }

  initializeForm() {
    this.assignmentForm = this.formBuilder.group({
      assignedTo: ['', Validators.required],
      notes: [''],
      dueDate: [''],
      priority: ['medium', Validators.required]
    });

    if (this.followupItem) {
      this.updateFormValues();
    }
  }

  updateFormValues() {
    if (this.followupItem) {
      this.assignmentForm.patchValue({
        assignedTo: this.followupItem.assignedTo || '',
        notes: this.followupItem.notes || '',
        dueDate: this.followupItem.dueDate ? this.formatDateForInput(this.followupItem.dueDate) : '',
        priority: this.followupItem.priority || 'medium'
      });
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
    if (this.assignmentForm.valid) {
      this.save.emit(this.assignmentForm.value);
      this.resetForm();
    }
  }

  resetForm() {
    this.assignmentForm.reset({
      assignedTo: '',
      notes: '',
      dueDate: '',
      priority: 'medium'
    });
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
    this.assignmentForm.patchValue({ assignedTo: assigneeValue });
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get assignedToControl() {
    return this.assignmentForm.get('assignedTo');
  }

  get notesControl() {
    return this.assignmentForm.get('notes');
  }

  get dueDateControl() {
    return this.assignmentForm.get('dueDate');
  }

  get priorityControl() {
    return this.assignmentForm.get('priority');
  }
}