import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { WorkflowStep, WorkflowStepType } from '../../models';

@Component({
  selector: 'app-workflow-step-editor',
  templateUrl: './workflow-step-editor.component.html',
  styleUrls: ['./workflow-step-editor.component.scss'],
  standalone: false
})
export class WorkflowStepEditorComponent implements OnInit {
  @Output() stepAdded = new EventEmitter<WorkflowStep>();
  
  showEditor = false;
  selectedStepType: WorkflowStepType | null = null;
  stepForm!: FormGroup;
  
  stepTypes = [
    { 
      type: 'task' as WorkflowStepType, 
      label: 'Create Task', 
      icon: 'clipboard-outline',
      description: 'Assign a manual follow-up task'
    },
    { 
      type: 'sms' as WorkflowStepType, 
      label: 'Send SMS', 
      icon: 'chatbubble-outline',
      description: 'Send an automated text message'
    },
    { 
      type: 'email' as WorkflowStepType, 
      label: 'Send Email', 
      icon: 'mail-outline',
      description: 'Send an automated email'
    },
    { 
      type: 'wait' as WorkflowStepType, 
      label: 'Wait', 
      icon: 'time-outline',
      description: 'Add a delay before next step'
    },
    { 
      type: 'note' as WorkflowStepType, 
      label: 'Add Note', 
      icon: 'document-text-outline',
      description: 'Log a note to member profile'
    }
  ];
  
  assignmentStrategies = [
    { value: 'admin', label: 'Admin' },
    { value: 'role', label: 'Role-based' },
    { value: 'round-robin', label: 'Round-robin' },
    { value: 'specific', label: 'Specific person' }
  ];
  
  recipientTypes = [
    { value: 'member', label: 'Member' },
    { value: 'assignee', label: 'Task Assignee' },
    { value: 'custom', label: 'Custom' }
  ];
  
  timeUnits = [
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.stepForm = this.fb.group({
      name: ['', Validators.required],
      // Task fields
      taskTitle: [''],
      taskDescription: [''],
      assignmentStrategy: ['admin'],
      assigneeId: [''],
      roleId: [''],
      dueDateValue: [24],
      dueDateUnit: ['hours'],
      // SMS fields
      smsMessage: [''],
      smsRecipientType: ['member'],
      smsCustomNumber: [''],
      smsDelayHours: [0],
      // Email fields
      emailSubject: [''],
      emailBody: [''],
      emailRecipientType: ['member'],
      emailCustomEmail: [''],
      emailDelayHours: [0],
      // Wait fields
      waitValue: [1],
      waitUnit: ['days'],
      // Note fields
      noteContent: [''],
      noteAttachToMember: [true]
    });
  }

  openStepEditor(type: WorkflowStepType) {
    this.selectedStepType = type;
    this.showEditor = true;
    
    // Set default name based on type
    const defaultNames: Record<WorkflowStepType, string> = {
      task: 'Follow-up Task',
      sms: 'SMS Message',
      email: 'Email Message',
      wait: 'Wait Period',
      note: 'Add Note'
    };
    
    this.stepForm.patchValue({ name: defaultNames[type] });
    
    // Add validators based on type
    this.updateValidators(type);
  }

  updateValidators(type: WorkflowStepType) {
    // Clear all validators first
    Object.keys(this.stepForm.controls).forEach(key => {
      if (key !== 'name') {
        this.stepForm.get(key)?.clearValidators();
        this.stepForm.get(key)?.updateValueAndValidity();
      }
    });
    
    // Add type-specific validators
    switch (type) {
      case 'task':
        this.stepForm.get('taskTitle')?.setValidators([Validators.required]);
        this.stepForm.get('taskDescription')?.setValidators([Validators.required]);
        break;
      case 'sms':
        this.stepForm.get('smsMessage')?.setValidators([Validators.required, Validators.maxLength(160)]);
        break;
      case 'email':
        this.stepForm.get('emailSubject')?.setValidators([Validators.required]);
        this.stepForm.get('emailBody')?.setValidators([Validators.required]);
        break;
      case 'wait':
        this.stepForm.get('waitValue')?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case 'note':
        this.stepForm.get('noteContent')?.setValidators([Validators.required]);
        break;
    }
    
    this.stepForm.updateValueAndValidity();
  }

  cancelEditor() {
    this.showEditor = false;
    this.selectedStepType = null;
    this.stepForm.reset();
  }

  saveStep() {
    if (!this.stepForm.valid || !this.selectedStepType) return;
    
    const formValue = this.stepForm.value;
    const stepId = this.generateStepId();
    
    let config: any = {};
    
    switch (this.selectedStepType) {
      case 'task':
        config = {
          title: formValue.taskTitle,
          description: formValue.taskDescription,
          assignmentStrategy: formValue.assignmentStrategy,
          assigneeId: formValue.assigneeId,
          roleId: formValue.roleId,
          dueDateOffset: {
            value: formValue.dueDateValue,
            unit: formValue.dueDateUnit
          }
        };
        break;
      case 'sms':
        config = {
          message: formValue.smsMessage,
          recipientType: formValue.smsRecipientType,
          customNumber: formValue.smsCustomNumber,
          delayHours: formValue.smsDelayHours
        };
        break;
      case 'email':
        config = {
          subject: formValue.emailSubject,
          body: formValue.emailBody,
          recipientType: formValue.emailRecipientType,
          customEmail: formValue.emailCustomEmail,
          delayHours: formValue.emailDelayHours
        };
        break;
      case 'wait':
        config = {
          duration: {
            value: formValue.waitValue,
            unit: formValue.waitUnit
          }
        };
        break;
      case 'note':
        config = {
          content: formValue.noteContent,
          attachToMember: formValue.noteAttachToMember
        };
        break;
    }
    
    const step: WorkflowStep = {
      id: stepId,
      type: this.selectedStepType,
      name: formValue.name,
      order: 0, // Will be set by parent component
      config
    };
    
    this.stepAdded.emit(step);
    this.cancelEditor();
  }

  generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getRemainingChars(): number {
    const message = this.stepForm.get('smsMessage')?.value || '';
    return 160 - message.length;
  }

  getStepTypeLabel(type: WorkflowStepType): string {
    const typeInfo = this.stepTypes.find(t => t.type === type);
    return typeInfo ? typeInfo.label : '';
  }
}