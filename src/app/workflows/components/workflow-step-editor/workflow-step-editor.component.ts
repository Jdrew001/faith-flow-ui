import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
  @Input() steps: WorkflowStep[] = [];
  @Output() stepAdded = new EventEmitter<WorkflowStep>();
  @Output() stepsChange = new EventEmitter<WorkflowStep[]>();
  
  showEditor = false;
  selectedStepType: WorkflowStepType | null = null;
  stepForm!: FormGroup;
  
  stepTypes = [
    { 
      type: 'manual_task' as WorkflowStepType, 
      label: 'Create Task', 
      icon: 'clipboard-outline',
      description: 'Assign a manual follow-up task'
    },
    { 
      type: 'send_sms' as WorkflowStepType, 
      label: 'Send SMS', 
      icon: 'chatbubble-outline',
      description: 'Send an automated text message'
    },
    { 
      type: 'send_email' as WorkflowStepType, 
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
      type: 'conditional' as WorkflowStepType, 
      label: 'Conditional', 
      icon: 'git-branch-outline',
      description: 'Branch workflow based on conditions'
    },
    { 
      type: 'update_member' as WorkflowStepType, 
      label: 'Update Member', 
      icon: 'person-outline',
      description: 'Update member fields, tags, or groups'
    },
    { 
      type: 'create_note' as WorkflowStepType, 
      label: 'Add Note', 
      icon: 'document-text-outline',
      description: 'Log a note to member profile'
    },
    { 
      type: 'webhook' as WorkflowStepType, 
      label: 'Webhook', 
      icon: 'globe-outline',
      description: 'Call external API'
    }
  ];
  
  assignmentStrategies = [
    { value: 'SPECIFIC_USER', label: 'Specific User' },
    { value: 'ROLE', label: 'Role-based' },
    { value: 'ROUND_ROBIN', label: 'Round Robin' },
    { value: 'LEAST_LOADED', label: 'Least Loaded' },
    { value: 'SELF', label: 'Self-assign' }
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
      assignmentStrategy: ['ROLE'],
      assigneeId: [''],
      roleId: [''],
      dueDateValue: [24],
      dueDateUnit: ['hours'],
      priority: ['MEDIUM'],
      category: ['FOLLOW_UP'],
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
      emailTemplateId: [''],
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
    const defaultNames: Record<string, string> = {
      manual_task: 'Manual Task',
      send_email: 'Email Message',
      send_sms: 'SMS Message',
      wait: 'Wait Period',
      create_note: 'Add Note',
      conditional: 'Conditional Step',
      update_member: 'Update Member',
      webhook: 'Webhook'
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
      case 'manual_task':
        this.stepForm.get('taskTitle')?.setValidators([Validators.required]);
        this.stepForm.get('taskDescription')?.setValidators([Validators.required]);
        break;
      case 'send_sms':
        this.stepForm.get('smsMessage')?.setValidators([Validators.required, Validators.maxLength(160)]);
        break;
      case 'send_email':
        this.stepForm.get('emailSubject')?.setValidators([Validators.required]);
        this.stepForm.get('emailBody')?.setValidators([Validators.required]);
        break;
      case 'wait':
        this.stepForm.get('waitValue')?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case 'create_note':
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
      case 'manual_task':
        config = {
          title: formValue.taskTitle,
          description: formValue.taskDescription,
          assignment_strategy: formValue.assignmentStrategy,
          assigned_to: formValue.assigneeId || formValue.roleId,
          due_offset_hours: formValue.dueDateUnit === 'hours' ? formValue.dueDateValue : formValue.dueDateValue * 24
        };
        break;
      case 'send_sms':
        config = {
          to: formValue.smsRecipientType === 'custom' ? formValue.smsCustomNumber : '{{member.phone}}',
          message: formValue.smsMessage
        };
        break;
      case 'send_email':
        config = {
          to: formValue.emailRecipientType === 'custom' ? formValue.emailCustomEmail : '{{member.email}}',
          subject: formValue.emailSubject,
          body: formValue.emailBody
        };
        break;
      case 'wait':
        if (formValue.waitUnit === 'days') {
          config = {
            duration_days: formValue.waitValue
          };
        } else {
          config = {
            duration_hours: formValue.waitValue
          };
        }
        break;
      case 'create_note':
        config = {
          note: formValue.noteContent,
          category: 'GENERAL',
          visibility: 'STAFF_ONLY'
        };
        break;
    }
    
    const step: WorkflowStep = {
      type: this.selectedStepType!,
      name: formValue.name,
      order: this.steps.length + 1,
      metadata: config
    };
    
    // Add to local steps array
    this.steps = [...this.steps, step];
    
    // Emit both events
    this.stepAdded.emit(step);
    this.stepsChange.emit(this.steps);
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

  removeStep(index: number) {
    this.steps = this.steps.filter((_, i) => i !== index);
    // Re-order remaining steps
    this.steps.forEach((step, i) => {
      step.order = i + 1;
    });
    this.stepsChange.emit(this.steps);
  }

  reorderSteps(event: any) {
    const itemMove = this.steps.splice(event.detail.from, 1)[0];
    this.steps.splice(event.detail.to, 0, itemMove);
    event.detail.complete();
    
    // Update order property
    this.steps.forEach((step, index) => {
      step.order = index + 1;
    });
    this.stepsChange.emit(this.steps);
  }

  getStepIcon(type: WorkflowStepType): string {
    const typeInfo = this.stepTypes.find(t => t.type === type);
    return typeInfo ? typeInfo.icon : 'help-outline';
  }

  getStepDescription(step: WorkflowStep): string {
    switch (step.type) {
      case 'manual_task':
        const taskConfig = step.metadata || {};
        return `${taskConfig.title} - Due in ${taskConfig.due_offset_hours} hours`;
      case 'send_email':
        const emailConfig = step.metadata || {};
        return `Subject: ${emailConfig.subject}`;
      case 'send_sms':
        const smsConfig = step.metadata || {};
        return `Message: ${smsConfig.message?.substring(0, 50)}...`;
      case 'wait':
        const waitConfig = step.metadata || {};
        const days = waitConfig.duration_days || 0;
        const hours = waitConfig.duration_hours || 0;
        return `Wait ${days > 0 ? `${days} days` : `${hours} hours`}`;
      case 'create_note':
        const noteConfig = step.metadata || {};
        return `Note: ${noteConfig.note?.substring(0, 50)}...`;
      default:
        return '';
    }
  }
}