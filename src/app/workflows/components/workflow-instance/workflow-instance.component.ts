import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowInstance, WorkflowInstanceStep } from '../../models';

@Component({
  selector: 'app-workflow-instance',
  templateUrl: './workflow-instance.component.html',
  styleUrls: ['./workflow-instance.component.scss'],
  standalone: false
})
export class WorkflowInstanceComponent implements OnInit, OnDestroy {
  instance: WorkflowInstance | null = null;
  isLoading = true;
  currentUserCanComplete = false; // This would be determined by auth/permissions
  private destroy$ = new Subject<void>();
  private instanceId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['instanceId']) {
        this.instanceId = params['instanceId'];
        this.loadInstance();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInstance() {
    this.isLoading = true;
    this.workflowService.getWorkflowInstance(this.instanceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (instance) => {
          this.instance = instance;
          this.isLoading = false;
          this.checkUserPermissions();
        },
        error: (error) => {
          console.error('Error loading workflow instance:', error);
          this.isLoading = false;
          this.showToast('Failed to load workflow instance', 'danger');
          this.router.navigate(['/workflows']);
        }
      });
  }

  checkUserPermissions() {
    // TODO: Check if current user can complete the current step
    // This would integrate with your auth system
    this.currentUserCanComplete = true; // Placeholder
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

  getStepStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'active':
        return 'play-circle';
      case 'skipped':
        return 'arrow-forward-circle';
      case 'failed':
        return 'close-circle';
      default:
        return 'ellipse-outline';
    }
  }

  getStepStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'skipped':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getProgressPercentage(): number {
    if (!this.instance) return 0;
    const completedSteps = this.instance.steps.filter(
      s => s.status === 'completed' || s.status === 'skipped'
    ).length;
    return (completedSteps / this.instance.steps.length) * 100;
  }

  async showStepActions(step: WorkflowInstanceStep) {
    if (step.status !== 'active') return;

    const buttons = [];

    if (this.currentUserCanComplete) {
      buttons.push({
        text: 'Complete Step',
        icon: 'checkmark-circle-outline',
        handler: () => {
          this.completeStep(step);
        }
      });
    }

    buttons.push({
      text: 'Skip Step',
      icon: 'arrow-forward-circle-outline',
      role: 'warning',
      handler: () => {
        this.confirmSkipStep(step);
      }
    });

    buttons.push({
      text: 'View Details',
      icon: 'information-circle-outline',
      handler: () => {
        this.viewStepDetails(step);
      }
    });

    buttons.push({
      text: 'Cancel',
      icon: 'close',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: step.stepName,
      buttons
    });

    await actionSheet.present();
  }

  async completeStep(step: WorkflowInstanceStep) {
    const alert = await this.alertController.create({
      header: 'Complete Step',
      message: `Mark "${step.stepName}" as completed?`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Add notes (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Complete',
          handler: (data) => {
            this.doCompleteStep(step.id, data.notes);
          }
        }
      ]
    });

    await alert.present();
  }

  doCompleteStep(stepId: string, notes?: string) {
    if (!this.instance) return;

    this.workflowService.completeWorkflowStep(this.instance.id, stepId, notes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Step completed successfully', 'success');
          this.loadInstance();
        },
        error: (error) => {
          console.error('Error completing step:', error);
          this.showToast('Failed to complete step', 'danger');
        }
      });
  }

  async confirmSkipStep(step: WorkflowInstanceStep) {
    const alert = await this.alertController.create({
      header: 'Skip Step',
      message: `Are you sure you want to skip "${step.stepName}"? This action cannot be undone.`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for skipping (required)',
          attributes: {
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Skip',
          role: 'warning',
          handler: (data) => {
            if (data.reason && data.reason.trim()) {
              this.doSkipStep(step.id, data.reason);
              return true;
            } else {
              this.showToast('Please provide a reason for skipping', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  doSkipStep(stepId: string, reason: string) {
    if (!this.instance) return;

    this.workflowService.skipWorkflowStep(this.instance.id, stepId, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Step skipped', 'warning');
          this.loadInstance();
        },
        error: (error) => {
          console.error('Error skipping step:', error);
          this.showToast('Failed to skip step', 'danger');
        }
      });
  }

  async viewStepDetails(step: WorkflowInstanceStep) {
    // TODO: Implement step details view
    // This could show full step configuration, history, etc.
    console.log('View step details:', step);
  }

  async confirmCancelWorkflow() {
    const alert = await this.alertController.create({
      header: 'Cancel Workflow',
      message: 'Are you sure you want to cancel this workflow? All pending steps will be cancelled.',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for cancellation (optional)'
        }
      ],
      buttons: [
        {
          text: 'Keep Active',
          role: 'cancel'
        },
        {
          text: 'Cancel Workflow',
          role: 'destructive',
          handler: (data) => {
            this.cancelWorkflow(data.reason);
          }
        }
      ]
    });

    await alert.present();
  }

  cancelWorkflow(reason?: string) {
    if (!this.instance) return;

    this.workflowService.cancelWorkflowInstance(this.instance.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Workflow cancelled', 'warning');
          this.router.navigate(['/workflows']);
        },
        error: (error) => {
          console.error('Error cancelling workflow:', error);
          this.showToast('Failed to cancel workflow', 'danger');
        }
      });
  }

  async showInstanceActions() {
    const buttons = [];

    if (this.instance?.status === 'active') {
      buttons.push({
        text: 'Cancel Workflow',
        icon: 'close-circle-outline',
        role: 'destructive',
        handler: () => {
          this.confirmCancelWorkflow();
        }
      });
    }

    buttons.push({
      text: 'View Workflow',
      icon: 'git-branch-outline',
      handler: () => {
        if (this.instance) {
          this.router.navigate(['/workflows', this.instance.workflowId]);
        }
      }
    });

    buttons.push({
      text: 'View Member',
      icon: 'person-outline',
      handler: () => {
        // TODO: Navigate to member profile
        console.log('View member:', this.instance?.memberId);
      }
    });

    buttons.push({
      text: 'Close',
      icon: 'close',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Workflow Instance Actions',
      buttons
    });

    await actionSheet.present();
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
    this.loadInstance();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}