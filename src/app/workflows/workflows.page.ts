import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WorkflowService } from './services/workflow.service';
import { Workflow, WorkflowTemplate, WorkflowInstance } from './models';
import { WorkflowCreatorComponent } from './components/workflow-creator/workflow-creator.component';
import { WorkflowTemplatesComponent } from './components/workflow-templates/workflow-templates.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workflows',
  templateUrl: './workflows.page.html',
  styleUrls: ['./workflows.page.scss'],
  standalone: false
})
export class WorkflowsPage implements OnInit, OnDestroy {
  workflows: Workflow[] = [];
  activeInstances: WorkflowInstance[] = [];
  filteredWorkflows: Workflow[] = [];
  searchQuery = '';
  filterStatus: 'all' | 'ACTIVE' | 'PAUSED' | 'DRAFT' = 'all';
  isLoading = true;
  showInstances = false;
  showSortMenu = false;
  showFilterMenu = false;
  sortField: 'name' | 'created' | 'lastRun' | 'status' = 'name';
  private destroy$ = new Subject<void>();

  constructor(
    private workflowService: WorkflowService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWorkflows();
    this.loadActiveInstances();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkflows() {
    this.isLoading = true;
    this.workflowService.getWorkflows()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workflows) => {
          this.workflows = workflows;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading workflows:', error);
          this.isLoading = false;
          this.showToast('Failed to load workflows', 'danger');
        }
      });
  }

  loadActiveInstances() {
    this.workflowService.getWorkflowInstances()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (instances) => {
          this.activeInstances = instances.filter(i => i.status === 'active');
        },
        error: (error) => {
          console.error('Error loading instances:', error);
        }
      });
  }

  async openWorkflowCreator(template?: WorkflowTemplate) {
    const modal = await this.modalController.create({
      component: WorkflowCreatorComponent,
      componentProps: { template }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    
    if (data?.workflow) {
      this.loadWorkflows();
      this.showToast('Workflow created successfully', 'success');
    }
  }

  async openTemplates() {
    const modal = await this.modalController.create({
      component: WorkflowTemplatesComponent
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    
    if (data?.template) {
      this.openWorkflowCreator(data.template);
    }
  }

  async showWorkflowActions(workflow: Workflow) {
    const actionSheet = await this.actionSheetController.create({
      header: workflow.name,
      buttons: [
        {
          text: workflow.status === 'ACTIVE' ? 'Pause' : 'Activate',
          icon: workflow.status === 'ACTIVE' ? 'pause-outline' : 'play-outline',
          handler: () => {
            this.toggleWorkflowStatus(workflow);
          }
        },
        {
          text: 'View Details',
          icon: 'information-circle-outline',
          handler: () => {
            this.viewWorkflowDetail(workflow);
          }
        },
        {
          text: 'Duplicate',
          icon: 'copy-outline',
          handler: () => {
            this.duplicateWorkflow(workflow);
          }
        },
        {
          text: 'Test Workflow',
          icon: 'flask-outline',
          handler: () => {
            this.testWorkflow(workflow);
          }
        },
        {
          text: 'Delete',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.confirmDelete(workflow);
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

  viewWorkflowDetail(workflow: Workflow) {
    this.router.navigate(['/workflows', workflow.id]);
  }

  viewInstance(instance: WorkflowInstance) {
    this.router.navigate(['/workflows/instance', instance.id]);
  }

  toggleWorkflowStatus(workflow: Workflow) {
    const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.workflowService.toggleWorkflowStatus(workflow.id!, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          workflow.status = newStatus;
          this.loadWorkflows();
          this.showToast(`Workflow ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`, 'success');
        },
        error: (error: any) => {
          console.error('Error toggling workflow status:', error);
          this.showToast('Failed to update workflow status', 'danger');
        }
      });
  }

  duplicateWorkflow(workflow: Workflow) {
    this.workflowService.duplicateWorkflow(workflow.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWorkflows();
          this.showToast('Workflow duplicated successfully', 'success');
        },
        error: (error) => {
          console.error('Error duplicating workflow:', error);
          this.showToast('Failed to duplicate workflow', 'danger');
        }
      });
  }

  async testWorkflow(workflow: Workflow) {
    const alert = await this.alertController.create({
      header: 'Test Workflow',
      message: 'This will run the workflow in test mode to show you which members would be affected.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Run Test',
          handler: () => {
            this.runWorkflowTest(workflow);
          }
        }
      ]
    });
    await alert.present();
  }

  runWorkflowTest(workflow: Workflow) {
    this.workflowService.testWorkflow(workflow)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: { affectedMembers: number; previewData: any }) => {
          this.showTestResults(result);
        },
        error: (error: any) => {
          console.error('Error testing workflow:', error);
          this.showToast('Failed to test workflow', 'danger');
        }
      });
  }

  async showTestResults(result: { affectedMembers: number; previewData: any }) {
    const alert = await this.alertController.create({
      header: 'Test Results',
      message: `This workflow would affect ${result.affectedMembers} member(s).`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async confirmDelete(workflow: Workflow) {
    const alert = await this.alertController.create({
      header: 'Delete Workflow',
      message: `Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteWorkflow(workflow);
          }
        }
      ]
    });
    await alert.present();
  }


  getCurrentStepName(instance: any): string {
    if (!instance.steps || instance.steps.length === 0) return 'No steps';
    const currentStep = instance.steps[instance.currentStepIndex];
    return currentStep ? currentStep.name : 'Unknown step';
  }

  getProgressPercentage(instance: any): number {
    if (!instance.steps || instance.steps.length === 0) return 0;
    return ((instance.currentStepIndex + 1) / instance.steps.length) * 100;
  }

  deleteWorkflow(workflow: Workflow) {
    this.workflowService.deleteWorkflow(workflow.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWorkflows();
          this.showToast('Workflow deleted successfully', 'success');
        },
        error: (error) => {
          console.error('Error deleting workflow:', error);
          this.showToast('Failed to delete workflow', 'danger');
        }
      });
  }

  applyFilters() {
    this.filteredWorkflows = this.workflows.filter(workflow => {
      const matchesSearch = !this.searchQuery || 
        workflow.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = this.filterStatus === 'all' || workflow.status === this.filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  toggleView() {
    this.showInstances = !this.showInstances;
    if (this.showInstances) {
      this.loadActiveInstances();
    }
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

  doRefresh(event: any) {
    this.loadWorkflows();
    this.loadActiveInstances();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  getStatusCount(status: 'ACTIVE' | 'PAUSED' | 'DRAFT'): number {
    return this.workflows.filter(w => w.status === status).length;
  }

  getTriggerText(trigger: any): string {
    if (!trigger) return 'No trigger configured';
    
    if (trigger.type === 'manual') {
      return 'Manual trigger';
    } else if (trigger.type === 'schedule') {
      return 'Scheduled trigger';
    } else if (trigger.type === 'attendance' || trigger.type === 'attendance_rule') {
      const typeText = trigger.attendanceType === 'missed' ? 'Missed' : 
                       trigger.attendanceType === 'first_time' ? 'First-time visitor' : 
                       trigger.attendanceType === 'consistent' ? 'Consistent' : 'Attendance';
      const frequencyText = trigger.frequency === 1 ? 'once' : `${trigger.frequency}+ times`;
      const windowText = `in ${trigger.timeWindowDays} days`;
      
      return `${typeText} ${frequencyText} ${windowText}`;
    }
    
    return 'Custom trigger';
  }

  getTriggerIcon(trigger: any): string {
    if (!trigger) return 'help-circle-outline';
    
    switch (trigger.type) {
      case 'manual': return 'hand-left-outline';
      case 'schedule': return 'calendar-outline';
      case 'attendance':
      case 'attendance_rule': return 'people-outline';
      default: return 'git-branch-outline';
    }
  }

  getStepIcon(type: string): string {
    switch (type) {
      case 'task':
      case 'manual_task': return 'clipboard-outline';
      case 'email': return 'mail-outline';
      case 'sms': return 'chatbubble-outline';
      case 'wait': return 'hourglass-outline';
      case 'note': return 'document-text-outline';
      default: return 'help-circle-outline';
    }
  }

  getRelativeTime(date: any): string {
    if (!date) return 'Never';
    
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  getAvatarGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)',
      'linear-gradient(135deg, #a8edea, #fed6e3)',
      'linear-gradient(135deg, #ff9a9e, #fecfef)'
    ];
    
    const index = name ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'play-circle';
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'cancelled': return 'stop-circle';
      default: return 'time';
    }
  }

  toggleSortMenu() {
    this.showSortMenu = !this.showSortMenu;
  }

  sortBy(field: 'name' | 'created' | 'lastRun' | 'performance') {
    this.sortField = field as any;
    this.showSortMenu = false;
    
    this.filteredWorkflows.sort((a, b) => {
      switch (field) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'lastRun':
          const aTime = a.lastTriggeredAt ? new Date(a.lastTriggeredAt).getTime() : 0;
          const bTime = b.lastTriggeredAt ? new Date(b.lastTriggeredAt).getTime() : 0;
          return bTime - aTime;
        case 'performance':
          const aRate = a.stats?.successRate || 100;
          const bRate = b.stats?.successRate || 100;
          return bRate - aRate;
        default:
          return 0;
      }
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = 'all';
    this.applyFilters();
  }

  editWorkflow(workflow: Workflow) {
    this.router.navigate(['/workflows', workflow.id, 'edit']);
  }

  createFromTemplate() {
    this.openTemplates();
  }

  async importWorkflow() {
    const alert = await this.alertController.create({
      header: 'Import Workflow',
      message: 'Import a workflow from a JSON file or template library',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Choose File',
          handler: () => {
            // TODO: Implement file import
            this.showToast('Import feature coming soon', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

}