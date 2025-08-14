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
    
    const newStatus = this.workflow.status === 'active' ? 'paused' : 'active';
    const message = newStatus === 'active' 
      ? 'Are you sure you want to activate this workflow?' 
      : 'Are you sure you want to pause this workflow?';
    
    const alert = await this.alertController.create({
      header: newStatus === 'active' ? 'Activate Workflow' : 'Pause Workflow',
      message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: newStatus === 'active' ? 'Activate' : 'Pause',
          handler: () => {
            this.doToggleStatus(newStatus);
          }
        }
      ]
    });
    
    await alert.present();
  }

  doToggleStatus(newStatus: 'active' | 'paused') {
    this.workflowService.toggleWorkflowStatus(this.workflowId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadWorkflow();
            this.showToast(`Workflow ${newStatus === 'active' ? 'activated' : 'paused'}`, 'success');
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

  async deleteWorkflow() {
    const alert = await this.alertController.create({
      header: 'Delete Workflow',
      message: `Are you sure you want to delete "${this.workflow?.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.doDelete();
          }
        }
      ]
    });
    
    await alert.present();
  }

  doDelete() {
    this.workflowService.deleteWorkflow(this.workflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Workflow deleted successfully', 'success');
          this.router.navigate(['/workflows']);
        },
        error: (error) => {
          console.error('Error deleting workflow:', error);
          this.showToast('Failed to delete workflow', 'danger');
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
        next: async (result: { affectedMembers: number; previewData: any }) => {
          const alert = await this.alertController.create({
            header: 'Test Results',
            message: `This workflow would affect ${result.affectedMembers} member(s).`,
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
    } else if (trigger.type === 'schedule') {
      return 'Scheduled trigger - Runs on a schedule';
    } else if (trigger.type === 'attendance') {
      const typeText = trigger.attendanceType === 'missed' ? 'has missed' : 
                       trigger.attendanceType === 'attended' ? 'has attended' : 
                       'is a first-time visitor at';
      const frequencyText = trigger.frequency === 1 ? 'once' : `${trigger.frequency} times`;
      const windowText = `in the past ${trigger.timeWindowDays} days`;
      
      return `Trigger when someone ${typeText} ${frequencyText} ${windowText}`;
    }
    
    return 'Custom trigger configuration';
  }

  getStepIcon(type: string): string {
    const icons: Record<string, string> = {
      task: 'clipboard-outline',
      email: 'mail-outline',
      sms: 'chatbubble-outline',
      wait: 'time-outline',
      note: 'document-text-outline'
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
    if (this.workflow?.trigger?.filters) {
      return (this.workflow.trigger.filters as any)[filterName];
    }
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
}