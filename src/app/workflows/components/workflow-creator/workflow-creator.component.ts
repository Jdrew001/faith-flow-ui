import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { WorkflowService } from '../../services/workflow.service';
import { 
  Workflow, 
  WorkflowTemplate, 
  WorkflowWizardState,
  WorkflowSession,
  WorkflowStep,
  WorkflowStepType,
  WorkflowTriggerType,
  WorkflowTemplatePreset,
  WorkflowTrigger
} from '../../models';

@Component({
  selector: 'app-workflow-creator',
  templateUrl: './workflow-creator.component.html',
  styleUrls: ['./workflow-creator.component.scss'],
  standalone: false
})
export class WorkflowCreatorComponent implements OnInit {
  @Input() template?: WorkflowTemplatePreset;
  @Input() editingWorkflow?: Workflow;

  currentStep = 1;
  totalSteps = 4;
  
  nameAndTriggerForm!: FormGroup;
  triggerRulesForm!: FormGroup;
  workflowStepsForm!: FormGroup;
  reviewForm!: FormGroup;
  
  availableSessions: WorkflowSession[] = [];
  workflowSteps: WorkflowStep[] = [];
  currentTrigger?: WorkflowTrigger;
  
  triggerTypes = [
    { value: 'attendance_rule', label: 'Attendance-based', icon: 'calendar-outline', description: 'Trigger based on attendance patterns' },
    { value: 'first_time_visitor', label: 'First-time Visitor', icon: 'person-add-outline', description: 'Trigger for first-time visitors' },
    { value: 'manual', label: 'Manual', icon: 'hand-left-outline', description: 'Start workflow manually for selected members' },
    { value: 'scheduled', label: 'Schedule-based', icon: 'time-outline', description: 'Trigger on a schedule (Coming soon)', disabled: true },
    { value: 'member_created', label: 'New Member', icon: 'person-add-outline', description: 'Trigger when new member is created', disabled: true },
    { value: 'member_updated', label: 'Member Updated', icon: 'create-outline', description: 'Trigger when member is updated', disabled: true }
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
    this.loadSessions();
    
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
      triggerType: ['attendance_rule', Validators.required]
    });

    // Step 2: Trigger Rules - simplified for trigger configuration
    this.triggerRulesForm = this.fb.group({
      // This form is primarily used for validation
      // Actual trigger configuration is handled by WorkflowTriggerBuilderComponent
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

  loadSessions() {
    this.workflowService.getSessions().subscribe(sessions => {
      this.availableSessions = sessions;
    });
  }

  applyTemplate() {
    if (!this.template) return;
    
    const preset = this.template.preset;
    
    // Apply name and trigger type
    this.nameAndTriggerForm.patchValue({
      name: preset.name,
      description: preset.description,
      triggerType: preset.trigger?.type || 'manual'
    });
    
    // Apply trigger rules if needed
    if (preset.trigger) {
      this.currentTrigger = preset.trigger;
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
      triggerType: this.editingWorkflow.trigger?.type || 'manual'
    });
    
    if (this.editingWorkflow.trigger) {
      this.currentTrigger = this.editingWorkflow.trigger;
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
    
    if (triggerType === 'attendance_rule') {
      // Check if we have a valid trigger configuration
      return this.currentTrigger !== undefined && 
             this.currentTrigger.conditions !== undefined &&
             Object.keys(this.currentTrigger.conditions).length > 0;
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

  onTriggerChange(trigger: WorkflowTrigger) {
    this.currentTrigger = trigger;
  }

  onTriggerTypeChange(event: any) {
    const triggerType = event.detail.value;
    console.log('Trigger type changed to:', triggerType);
    
    // Reset trigger when changing type
    if (triggerType === 'manual') {
      this.currentTrigger = {
        type: 'manual',
        enabled: true
      };
    } else if (triggerType === 'attendance_rule') {
      this.currentTrigger = {
        type: 'attendance_rule',
        enabled: true,
        conditions: {}
      };
    }
  }

  selectTriggerType(value: string) {
    this.nameAndTriggerForm.patchValue({ triggerType: value });
    this.onTriggerTypeChange({ detail: { value } });
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
    
    if (triggerType === 'attendance_rule' && this.currentTrigger?.conditions) {
      const conditions = this.currentTrigger.conditions;
      
      if (conditions.absences_in_period) {
        const { count, period_days } = conditions.absences_in_period;
        return `Trigger when someone has ${count} absences in ${period_days} days`;
      }
      
      if (conditions.consecutive_absences) {
        const { count } = conditions.consecutive_absences;
        return `Trigger when someone has ${count} consecutive absences`;
      }
      
      if (conditions.no_attendance_days) {
        const { days } = conditions.no_attendance_days;
        return `Trigger when someone has not attended for ${days} days`;
      }
      
      if (conditions.attendance_percentage) {
        const { percentage, period_days } = conditions.attendance_percentage;
        return `Trigger when attendance falls below ${percentage}% in ${period_days} days`;
      }
    }
    
    return 'Configure trigger conditions';
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
    const review = this.reviewForm.value;
    
    const workflow: Partial<Workflow> = {
      name: nameAndTrigger.name,
      description: nameAndTrigger.description,
      status: status,
      trigger: this.currentTrigger || {
        type: nameAndTrigger.triggerType as WorkflowTriggerType,
        enabled: true
      },
      steps: this.workflowSteps,
      enabled: status === 'ACTIVE'
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
      send_email: 'mail-outline',
      send_sms: 'chatbubble-outline',
      wait: 'time-outline',
      conditional: 'git-branch-outline',
      update_member: 'person-outline',
      create_note: 'document-text-outline',
      webhook: 'link-outline'
    };
    return icons[type] || 'help-outline';
  }

  getStepDescription(step: WorkflowStep): string {
    const metadata = step.metadata || {};
    
    switch (step.type) {
      case 'manual_task':
        return `${metadata.title} - Due in ${metadata.due_offset_hours || 24} hours`;
      case 'send_email':
        return `Subject: ${metadata.subject || 'No subject'}`;
      case 'send_sms':
        return `Message: ${(metadata.message || '').substring(0, 50)}...`;
      case 'wait':
        const days = metadata.duration_days || 0;
        const hours = metadata.duration_hours || 0;
        if (days > 0) {
          return `Wait ${days} day${days !== 1 ? 's' : ''}`;
        } else {
          return `Wait ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
      case 'create_note':
        return `Note: ${(metadata.note || '').substring(0, 50)}...`;
      case 'conditional':
        return 'Conditional logic';
      case 'update_member':
        return 'Update member data';
      case 'webhook':
        return `Webhook: ${metadata.url || 'Not configured'}`;
      default:
        return '';
    }
  }
}