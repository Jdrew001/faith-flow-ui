import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { WorkflowService } from '../../services/workflow.service';
import { 
  Workflow, 
  WorkflowTemplate, 
  WorkflowWizardState,
  WorkflowEvent,
  WorkflowStep,
  WorkflowStepType,
  WorkflowTriggerType,
  AttendanceType
} from '../../models';

@Component({
  selector: 'app-workflow-creator',
  templateUrl: './workflow-creator.component.html',
  styleUrls: ['./workflow-creator.component.scss'],
  standalone: false
})
export class WorkflowCreatorComponent implements OnInit {
  @Input() template?: WorkflowTemplate;
  @Input() editingWorkflow?: Workflow;

  currentStep = 1;
  totalSteps = 4;
  
  nameAndTriggerForm!: FormGroup;
  triggerRulesForm!: FormGroup;
  workflowStepsForm!: FormGroup;
  reviewForm!: FormGroup;
  
  availableEvents: WorkflowEvent[] = [];
  workflowSteps: WorkflowStep[] = [];
  
  triggerTypes = [
    { value: 'attendance', label: 'Attendance-based', icon: 'calendar-outline', description: 'Trigger based on attendance patterns' },
    { value: 'manual', label: 'Manual', icon: 'hand-left-outline', description: 'Start workflow manually for selected members' },
    { value: 'schedule', label: 'Schedule-based', icon: 'time-outline', description: 'Trigger on a schedule (Coming soon)', disabled: true }
  ];
  
  attendanceTypes = [
    { value: 'missed', label: 'Missed', icon: 'close-circle-outline' },
    { value: 'attended', label: 'Attended', icon: 'checkmark-circle-outline' },
    { value: 'first_time', label: 'First Time', icon: 'person-add-outline' }
  ];
  
  timeWindows = [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 21, label: '21 days' },
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' }
  ];

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private workflowService: WorkflowService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.loadEvents();
    
    if (this.template) {
      this.applyTemplate();
    } else if (this.editingWorkflow) {
      this.loadWorkflowData();
    }
  }

  initializeForms() {
    // Step 1: Name and Trigger Type
    this.nameAndTriggerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      triggerType: ['attendance', Validators.required]
    });

    // Step 2: Trigger Rules
    this.triggerRulesForm = this.fb.group({
      events: [[], Validators.required],
      allEvents: [false],
      attendanceType: ['missed'],
      frequency: [3, [Validators.required, Validators.min(1)]],
      timeWindowDays: [21, Validators.required],
      memberStatus: [[]],
      ageGroups: [[]],
      ministries: [[]],
      tags: [[]]
    });

    // Step 3: Workflow Steps
    this.workflowStepsForm = this.fb.group({
      steps: this.fb.array([])
    });

    // Step 4: Review
    this.reviewForm = this.fb.group({
      testMode: [false],
      confirmed: [false]
    });
  }

  loadEvents() {
    this.workflowService.getEvents().subscribe(events => {
      this.availableEvents = events;
    });
  }

  applyTemplate() {
    if (!this.template) return;
    
    const preset = this.template.preset;
    
    // Apply name and trigger type
    this.nameAndTriggerForm.patchValue({
      name: preset.name,
      description: preset.description,
      triggerType: preset.triggerType
    });
    
    // Apply trigger rules if attendance-based
    if (preset.trigger && preset.triggerType === 'attendance') {
      this.triggerRulesForm.patchValue({
        attendanceType: preset.trigger.attendanceType,
        frequency: preset.trigger.frequency,
        timeWindowDays: preset.trigger.timeWindowDays,
        allEvents: preset.trigger.allEvents || false
      });
    }
    
    // Apply workflow steps
    if (preset.steps) {
      this.workflowSteps = [...preset.steps];
    }
  }

  loadWorkflowData() {
    if (!this.editingWorkflow) return;
    
    // Load existing workflow data for editing
    this.nameAndTriggerForm.patchValue({
      name: this.editingWorkflow.name,
      description: this.editingWorkflow.description,
      triggerType: this.editingWorkflow.triggerType
    });
    
    if (this.editingWorkflow.trigger) {
      this.triggerRulesForm.patchValue({
        events: this.editingWorkflow.trigger.events || [],
        allEvents: this.editingWorkflow.trigger.allEvents || false,
        attendanceType: this.editingWorkflow.trigger.attendanceType,
        frequency: this.editingWorkflow.trigger.frequency,
        timeWindowDays: this.editingWorkflow.trigger.timeWindowDays
      });
    }
    
    if (this.editingWorkflow.steps) {
      this.workflowSteps = [...this.editingWorkflow.steps];
    }
  }

  nextStep() {
    if (this.currentStep === 1 && this.nameAndTriggerForm.valid) {
      this.currentStep++;
    } else if (this.currentStep === 2 && this.validateTriggerRules()) {
      this.currentStep++;
    } else if (this.currentStep === 3 && this.workflowSteps.length > 0) {
      this.currentStep++;
    } else {
      this.showValidationError();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateTriggerRules(): boolean {
    const triggerType = this.nameAndTriggerForm.get('triggerType')?.value;
    
    if (triggerType === 'manual') {
      return true; // No additional validation needed for manual triggers
    }
    
    if (triggerType === 'attendance') {
      const allEvents = this.triggerRulesForm.get('allEvents')?.value;
      const events = this.triggerRulesForm.get('events')?.value;
      
      if (!allEvents && (!events || events.length === 0)) {
        return false;
      }
      
      return this.triggerRulesForm.valid;
    }
    
    return true;
  }

  async showValidationError() {
    const toast = await this.toastController.create({
      message: 'Please complete all required fields',
      duration: 2000,
      color: 'warning',
      position: 'bottom'
    });
    await toast.present();
  }

  onEventSelectionChange(event: any) {
    const selectedEvents = event.detail.value;
    this.triggerRulesForm.patchValue({ events: selectedEvents });
  }

  onAllEventsChange(event: any) {
    const allEvents = event.detail.checked;
    this.triggerRulesForm.patchValue({ allEvents });
    
    if (allEvents) {
      this.triggerRulesForm.patchValue({ events: [] });
    }
  }

  onTriggerTypeChange(event: any) {
    const triggerType = event.detail.value;
    console.log('Trigger type changed to:', triggerType);
    
    // Clear trigger rules when changing type
    if (triggerType === 'manual') {
      // Clear attendance-specific fields
      this.triggerRulesForm.patchValue({
        events: [],
        allEvents: false,
        attendanceType: 'missed',
        frequency: 3,
        timeWindowDays: 21
      });
    }
  }

  selectTriggerType(value: string) {
    this.nameAndTriggerForm.patchValue({ triggerType: value });
    this.onTriggerTypeChange({ detail: { value } });
  }

  selectAttendanceType(value: string) {
    this.triggerRulesForm.patchValue({ attendanceType: value });
  }

  onStepsChange(steps: WorkflowStep[]) {
    this.workflowSteps = steps;
  }

  async createWorkflow() {
    // Determine if we should save as active or draft based on button clicked
    const workflow = this.buildWorkflowObject('ACTIVE');
    await this.saveWorkflow(workflow);
  }

  getTriggerTypeLabel(): string {
    const type = this.nameAndTriggerForm.get('triggerType')?.value;
    const triggerType = this.triggerTypes.find(t => t.value === type);
    return triggerType?.label || '';
  }

  getStepTitle(): string {
    switch(this.currentStep) {
      case 1:
        return 'Basic Information';
      case 2:
        return 'Trigger Configuration';
      case 3:
        return 'Workflow Steps';
      case 4:
        return 'Review & Activate';
      default:
        return '';
    }
  }

  incrementFrequency() {
    const current = this.triggerRulesForm.get('frequency')?.value || 1;
    this.triggerRulesForm.patchValue({ frequency: current + 1 });
  }

  decrementFrequency() {
    const current = this.triggerRulesForm.get('frequency')?.value || 1;
    if (current > 1) {
      this.triggerRulesForm.patchValue({ frequency: current - 1 });
    }
  }

  addWorkflowStep(step: WorkflowStep) {
    // Set the order for the new step
    step.order = this.workflowSteps.length + 1;
    this.workflowSteps.push(step);
    // Emit the change
    this.onStepsChange([...this.workflowSteps]);
  }

  removeWorkflowStep(index: number) {
    this.workflowSteps.splice(index, 1);
  }

  reorderSteps(event: any) {
    const itemMove = this.workflowSteps.splice(event.detail.from, 1)[0];
    this.workflowSteps.splice(event.detail.to, 0, itemMove);
    event.detail.complete();
    
    // Update order property
    this.workflowSteps.forEach((step, index) => {
      step.order = index + 1;
    });
  }

  getTriggerDescription(): string {
    const triggerType = this.nameAndTriggerForm.get('triggerType')?.value;
    
    if (triggerType === 'manual') {
      return 'Workflow will be triggered manually for selected members';
    }
    
    if (triggerType === 'attendance') {
      const attendanceType = this.triggerRulesForm.get('attendanceType')?.value;
      const frequency = this.triggerRulesForm.get('frequency')?.value;
      const timeWindow = this.triggerRulesForm.get('timeWindowDays')?.value;
      const allEvents = this.triggerRulesForm.get('allEvents')?.value;
      const events = this.triggerRulesForm.get('events')?.value || [];
      
      let typeText = '';
      switch (attendanceType) {
        case 'missed':
          typeText = 'has missed';
          break;
        case 'attended':
          typeText = 'has attended';
          break;
        case 'first_time':
          typeText = 'is a first-time visitor at';
          break;
      }
      
      const frequencyText = frequency === 1 ? 'once' : `${frequency} times`;
      const windowText = `in the past ${timeWindow} days`;
      const eventText = allEvents ? 'any event' : events.length === 1 ? events[0].name : `${events.length} selected events`;
      
      return `Trigger when someone ${typeText} ${eventText} ${frequencyText} ${windowText}`;
    }
    
    return 'Custom trigger configuration';
  }

  getStepsSummary(): string {
    if (this.workflowSteps.length === 0) {
      return 'No steps configured';
    }
    
    const stepTypes = this.workflowSteps.reduce((acc, step) => {
      acc[step.type] = (acc[step.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summaryParts = [];
    if (stepTypes['task']) summaryParts.push(`${stepTypes['task']} task${stepTypes['task'] > 1 ? 's' : ''}`);
    if (stepTypes['email']) summaryParts.push(`${stepTypes['email']} email${stepTypes['email'] > 1 ? 's' : ''}`);
    if (stepTypes['sms']) summaryParts.push(`${stepTypes['sms']} SMS`);
    if (stepTypes['wait']) summaryParts.push(`${stepTypes['wait']} wait period${stepTypes['wait'] > 1 ? 's' : ''}`);
    if (stepTypes['note']) summaryParts.push(`${stepTypes['note']} note${stepTypes['note'] > 1 ? 's' : ''}`);
    
    return summaryParts.join(', ');
  }

  async saveAsDraft() {
    const workflow = this.buildWorkflowObject('DRAFT');
    await this.saveWorkflow(workflow);
  }

  async activateWorkflow() {
    const workflow = this.buildWorkflowObject('ACTIVE');
    await this.saveWorkflow(workflow);
  }

  buildWorkflowObject(status: 'ACTIVE' | 'DRAFT'): Partial<Workflow> {
    const nameAndTrigger = this.nameAndTriggerForm.value;
    const triggerRules = this.triggerRulesForm.value;
    const review = this.reviewForm.value;
    
    const workflow: Partial<Workflow> = {
      name: nameAndTrigger.name,
      description: nameAndTrigger.description,
      status: status,
      triggerType: nameAndTrigger.triggerType,
      trigger: {
        type: nameAndTrigger.triggerType,
        attendanceType: triggerRules.attendanceType,
        frequency: triggerRules.frequency,
        timeWindowDays: triggerRules.timeWindowDays,
        events: triggerRules.allEvents ? [] : triggerRules.events,
        allEvents: triggerRules.allEvents,
        filters: {
          memberStatus: triggerRules.memberStatus,
          ageGroups: triggerRules.ageGroups,
          ministries: triggerRules.ministries,
          tags: triggerRules.tags
        }
      },
      steps: this.workflowSteps,
      testMode: review.testMode
    };
    
    if (this.editingWorkflow) {
      workflow.id = this.editingWorkflow.id;
    }
    
    return workflow;
  }

  async saveWorkflow(workflow: Partial<Workflow>) {
    const loading = await this.loadingController.create({
      message: 'Saving workflow...'
    });
    await loading.present();
    
    try {
      const operation = this.editingWorkflow 
        ? this.workflowService.updateWorkflow(this.editingWorkflow.id, workflow)
        : this.workflowService.createWorkflow(workflow);
      
      operation.subscribe({
        next: async (savedWorkflow) => {
          await loading.dismiss();
          await this.showSuccessToast();
          this.modalController.dismiss({ workflow: savedWorkflow });
        },
        error: async (error) => {
          await loading.dismiss();
          await this.showErrorToast(error.message);
        }
      });
    } catch (error) {
      await loading.dismiss();
      await this.showErrorToast('Failed to save workflow');
    }
  }

  async showSuccessToast() {
    const toast = await this.toastController.create({
      message: this.editingWorkflow ? 'Workflow updated successfully' : 'Workflow created successfully',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message || 'Failed to save workflow',
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }

  dismiss() {
    this.modalController.dismiss();
  }

  get isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.nameAndTriggerForm.valid;
      case 2:
        return this.validateTriggerRules();
      case 3:
        return this.workflowSteps.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }

  get stepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Name & Trigger Type';
      case 2:
        return 'Define Trigger Rules';
      case 3:
        return 'Define Workflow Steps';
      case 4:
        return 'Review & Activate';
      default:
        return '';
    }
  }

  getStepIcon(type: WorkflowStepType): string {
    const icons: Record<WorkflowStepType, string> = {
      manual_task: 'clipboard-outline',
      task: 'clipboard-outline',
      email: 'mail-outline',
      sms: 'chatbubble-outline',
      wait: 'time-outline',
      note: 'document-text-outline'
    };
    return icons[type] || 'help-outline';
  }

  getStepDescription(step: WorkflowStep): string {
    switch (step.type) {
      case 'task':
        const taskConfig = step.config as any;
        return `${taskConfig.title} - Due in ${taskConfig.dueDateOffset.value} ${taskConfig.dueDateOffset.unit}`;
      case 'email':
        const emailConfig = step.config as any;
        return `Subject: ${emailConfig.subject}`;
      case 'sms':
        const smsConfig = step.config as any;
        return `Message: ${smsConfig.message.substring(0, 50)}...`;
      case 'wait':
        const waitConfig = step.config as any;
        return `Wait ${waitConfig.duration.value} ${waitConfig.duration.unit}`;
      case 'note':
        const noteConfig = step.config as any;
        return `Note: ${noteConfig.content.substring(0, 50)}...`;
      default:
        return '';
    }
  }
}