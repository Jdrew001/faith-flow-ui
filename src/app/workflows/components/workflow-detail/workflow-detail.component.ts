import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkflowService } from '../../services/workflow.service';
import { Workflow, WorkflowHistory, WorkflowInstance, WorkflowStatistics } from '../../models';
import { WorkflowCreatorComponent } from '../workflow-creator/workflow-creator.component';

@Component({
  selector: 'app-workflow-detail',
  templateUrl: './workflow-detail.component.html',
  styleUrls: ['./workflow-detail.component.scss'],
  standalone: false
})
export class WorkflowDetailComponent implements OnInit, OnDestroy {
  workflow: Workflow | null = null;
  history: WorkflowHistory[] = [];
  instances: WorkflowInstance[] = [];
  statistics: WorkflowStatistics | null = null;
  selectedTab = 'overview';
  isLoading = true;
  statisticsPeriod: 'day' | 'week' | 'month' | 'all' = 'all';
  private destroy$ = new Subject<void>();
  private workflowId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.workflowId = params['id'];
        this.loadWorkflow();
        this.loadStatistics();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkflow() {
    this.isLoading = true;
    this.workflowService.getWorkflow(this.workflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workflow) => {
          this.workflow = workflow;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading workflow:', error);
          this.isLoading = false;
          this.showToast('Failed to load workflow', 'danger');
          this.router.navigate(['/workflows']);
        }
      });
  }

  loadHistory() {
    this.workflowService.getWorkflowHistory(this.workflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.history = history;
        },
        error: (error) => {
          console.error('Error loading history:', error);
        }
      });
  }

  loadInstances() {
    this.workflowService.getWorkflowInstances(this.workflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (instances) => {
          this.instances = instances;
        },
        error: (error) => {
          console.error('Error loading instances:', error);
        }
      });
  }

  loadStatistics() {
    this.workflowService.getWorkflowStatistics(this.workflowId, this.statisticsPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
    
    if (this.selectedTab === 'history' && this.history.length === 0) {
      this.loadHistory();
    } else if (this.selectedTab === 'instances' && this.instances.length === 0) {
      this.loadInstances();
    }
  }

  onPeriodChange(event: any) {
    this.statisticsPeriod = event.detail.value;
    this.loadStatistics();
  }

  setPeriod(period: 'day' | 'week' | 'month' | 'all') {
    this.statisticsPeriod = period;
    this.loadStatistics();
  }

  async editWorkflow() {
    const modal = await this.modalController.create({
      component: WorkflowCreatorComponent,
      componentProps: { editingWorkflow: this.workflow },
      cssClass: 'workflow-creator-modal'
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    
    if (data?.workflow) {
      this.loadWorkflow();
      this.showToast('Workflow updated successfully', 'success');
    }
  }

  async toggleStatus() {
    if (!this.workflow) return;
    
    const newStatus = this.workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const message = newStatus === 'ACTIVE' 
      ? 'Are you sure you want to activate this workflow?' 
      : 'Are you sure you want to pause this workflow?';
    
    const alert = await this.alertController.create({
      header: newStatus === 'ACTIVE' ? 'Activate Workflow' : 'Pause Workflow',
      message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: newStatus === 'ACTIVE' ? 'Activate' : 'Pause',
          handler: () => {
            this.doToggleStatus(newStatus);
          }
        }
      ]
    });
    
    await alert.present();
  }

  doToggleStatus(newStatus: 'ACTIVE' | 'PAUSED') {
    this.workflowService.toggleWorkflowStatus(this.workflowId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadWorkflow();
            this.showToast(`Workflow ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`, 'success');
          } else {
            this.showToast('Failed to update workflow status', 'danger');
          }
        },
        error: (error) => {
          console.error('Error toggling status:', error);
          this.showToast('Failed to update workflow status', 'danger');
        }
      });
  }

  async duplicateWorkflow() {
    const alert = await this.alertController.create({
      header: 'Duplicate Workflow',
      message: 'Create a copy of this workflow?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Duplicate',
          handler: () => {
            this.doDuplicate();
          }
        }
      ]
    });
    
    await alert.present();
  }

  doDuplicate() {
    this.workflowService.duplicateWorkflow(this.workflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newWorkflow) => {
          this.showToast('Workflow duplicated successfully', 'success');
          this.router.navigate(['/workflows', newWorkflow.id]);
        },
        error: (error) => {
          console.error('Error duplicating workflow:', error);
          this.showToast('Failed to duplicate workflow', 'danger');
        }
      });
  }

  async archiveWorkflow() {
    const alert = await this.alertController.create({
      header: 'Archive Workflow',
      message: `Are you sure you want to archive "${this.workflow?.name}"? You can restore it later from the archived workflows section.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Archive',
          role: 'destructive',
          handler: () => {
            this.doArchive();
          }
        }
      ]
    });
    
    await alert.present();
  }

  doArchive() {
    this.workflowService.archiveWorkflow(this.workflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Workflow archived successfully', 'success');
          this.router.navigate(['/workflows']);
        },
        error: (error) => {
          console.error('Error archiving workflow:', error);
          this.showToast('Failed to archive workflow', 'danger');
        }
      });
  }

  async testWorkflow() {
    if (!this.workflow) return;
    
    const alert = await this.alertController.create({
      header: 'Test Workflow',
      message: 'Run a test to see which members would be affected by this workflow.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Run Test',
          handler: () => {
            this.doTest();
          }
        }
      ]
    });
    
    await alert.present();
  }

  doTest() {
    if (!this.workflow) return;
    
    this.workflowService.testWorkflow(this.workflow)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (result: any) => {
          console.log('Test workflow result:', result);
          
          // Handle both possible response structures
          const affectedCount = result?.affectedMembers || result?.affected_members || 0;
          const membersList = result?.members || result?.previewData?.members || [];
          
          let message = `This workflow would affect ${affectedCount} member(s).`;
          
          // Add member details if available
          if (membersList.length > 0) {
            const memberNames = membersList.slice(0, 5).map((m: any) => m.name || m.display_name).join(', ');
            message += `\n\nMembers: ${memberNames}`;
            if (membersList.length > 5) {
              message += ` and ${membersList.length - 5} more...`;
            }
          }
          
          const alert = await this.alertController.create({
            header: 'Test Results',
            message: message,
            buttons: ['OK']
          });
          await alert.present();
        },
        error: (error: any) => {
          console.error('Error testing workflow:', error);
          this.showToast('Failed to test workflow', 'danger');
        }
      });
  }

  async manualTrigger() {
    // TODO: Implement member selection dialog
    const alert = await this.alertController.create({
      header: 'Manual Trigger',
      message: 'Select members to trigger this workflow for.',
      inputs: [
        {
          name: 'memberIds',
          type: 'text',
          placeholder: 'Enter member IDs (comma-separated)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Trigger',
          handler: (data) => {
            if (data.memberIds) {
              const ids = data.memberIds.split(',').map((id: string) => id.trim());
              this.doManualTrigger(ids);
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  doManualTrigger(memberIds: string[]) {
    // For manual trigger, we need to start workflow for each member
    const triggers = memberIds.map(memberId => 
      this.workflowService.startWorkflow(this.workflowId, memberId)
    );
    
    Promise.all(triggers.map(t => t.toPromise())).then(
      (instances) => {
        this.showToast(`Workflow triggered for ${instances.length} member(s)`, 'success');
        this.loadInstances();
      },
      (error) => {
        console.error('Error triggering workflow:', error);
        this.showToast('Failed to trigger workflow', 'danger');
      }
    );
  }

  viewInstance(instance: WorkflowInstance) {
    this.router.navigate(['/workflows/instance', instance.id]);
  }

  getTriggerDescription(): string {
    if (!this.workflow?.trigger) return 'No trigger configured';
    
    const trigger = this.workflow.trigger;
    
    if (trigger.type === 'manual') {
      return 'Manual trigger - Start workflow manually for selected members';
    } else if (trigger.type === 'scheduled') {
      return 'Scheduled trigger - Runs on a schedule';
    } else if (trigger.type === 'attendance_rule' && trigger.conditions) {
      if (trigger.conditions.absences_in_period) {
        const { count, period_days } = trigger.conditions.absences_in_period;
        return `Trigger when someone has missed ${count} times in ${period_days} days`;
      } else if (trigger.conditions.consecutive_absences) {
        return `Trigger after ${trigger.conditions.consecutive_absences.count} consecutive absences`;
      } else if (trigger.conditions.no_attendance_days) {
        return `Trigger when no attendance for ${trigger.conditions.no_attendance_days.days} days`;
      } else if (trigger.conditions.attendance_percentage) {
        const { percentage, period_days } = trigger.conditions.attendance_percentage;
        return `Trigger when attendance below ${percentage}% in ${period_days} days`;
      }
    } else if (trigger.type === 'first_time_visitor') {
      return 'Trigger when someone is a first-time visitor';
    } else if (trigger.type === 'member_created') {
      return 'Trigger when a new member is created';
    } else if (trigger.type === 'member_updated') {
      return 'Trigger when member information is updated';
    }
    
    return 'Custom trigger configuration';
  }

  getStepIcon(type: string): string {
    const icons: Record<string, string> = {
      manual_task: 'clipboard-outline',
      send_email: 'mail-outline',
      send_sms: 'chatbubble-outline',
      wait: 'time-outline',
      create_note: 'document-text-outline',
      conditional: 'git-branch-outline',
      update_member: 'person-outline',
      webhook: 'globe-outline'
    };
    return icons[type] || 'help-outline';
  }

  getStepConfig(step: any, property: string): any {
    if (step.config && step.config[property] !== undefined) {
      return step.config[property];
    }
    return null;
  }

  hasStepConfigProperty(step: any, property: string): boolean {
    return step.config && step.config[property] !== undefined;
  }

  getTriggerFilterValue(filterName: string): string[] | undefined {
    // Filters not supported in new API contract
    return undefined;
  }

  hasTriggerFilter(filterName: string): boolean {
    const value = this.getTriggerFilterValue(filterName);
    return value !== undefined && value.length > 0;
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/workflows']);
  }

  doRefresh(event: any) {
    this.loadWorkflow();
    this.loadStatistics();
    
    if (this.selectedTab === 'history') {
      this.loadHistory();
    } else if (this.selectedTab === 'instances') {
      this.loadInstances();
    }
    
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  getStatusIcon(): string {
    switch (this.workflow?.status) {
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

  getLastTriggeredText(): string {
    if (this.workflow?.lastTriggeredAt) {
      const date = new Date(this.workflow.lastTriggeredAt);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      return date.toLocaleDateString();
    }
    return 'Never';
  }

  getSuccessRateStroke(): string {
    const percentage = this.statistics?.successRate || 0;
    const circumference = 100;
    const strokeDasharray = `${percentage} ${circumference - percentage}`;
    return strokeDasharray;
  }

  formatDuration(milliseconds?: number): string {
    if (!milliseconds) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  getTriggerIcon(): string {
    const type = this.workflow?.trigger?.type;
    switch (type) {
      case 'attendance_rule':
      case 'first_time_visitor':
        return 'calendar-outline';
      case 'manual':
        return 'hand-left-outline';
      case 'scheduled':
        return 'time-outline';
      case 'member_created':
      case 'member_updated':
        return 'person-outline';
      default:
        return 'timer-outline';
    }
  }

  hasAnyFilters(): boolean {
    return this.hasTriggerFilter('memberStatus') || 
           this.hasTriggerFilter('ageGroups') || 
           this.hasTriggerFilter('ministries') || 
           this.hasTriggerFilter('tags');
  }

  getStepTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      manual_task: 'Manual Task',
      send_email: 'Send Email',
      send_sms: 'Send SMS',
      wait: 'Wait Period',
      create_note: 'Create Note',
      conditional: 'Conditional',
      update_member: 'Update Member',
      webhook: 'Webhook'
    };
    return labels[type] || type;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getProgressPercentage(instance: any): number {
    if (!instance.steps || instance.steps.length === 0) return 0;
    const completed = instance.steps.filter((s: any) => s.status === 'completed').length;
    return Math.round((completed / instance.steps.length) * 100);
  }

  getCurrentStepName(instance: any): string {
    if (!instance.steps || instance.steps.length === 0) return 'No steps';
    const currentStep = instance.steps[instance.currentStepIndex];
    return currentStep ? currentStep.name : 'Unknown step';
  }

  async showMoreActions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Workflow Actions',
      buttons: [
        {
          text: 'Duplicate',
          icon: 'copy-outline',
          handler: () => {
            this.duplicateWorkflow();
          }
        },
        {
          text: 'Test Workflow',
          icon: 'flask-outline',
          handler: () => {
            this.testWorkflow();
          }
        },
        {
          text: 'Export',
          icon: 'download-outline',
          handler: () => {
            // Export functionality
          }
        },
        {
          text: 'Archive',
          icon: 'archive-outline',
          role: 'destructive',
          handler: () => {
            this.archiveWorkflow();
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async startManualRun() {
    // Implementation for starting manual workflow run
    this.showToast('Starting manual workflow run...', 'success');
  }
}