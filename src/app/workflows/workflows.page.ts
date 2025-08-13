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
  filterStatus: 'all' | 'active' | 'paused' | 'draft' = 'all';
  isLoading = true;
  showInstances = false;
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
      componentProps: { template },
      cssClass: 'workflow-creator-modal'
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
      component: WorkflowTemplatesComponent,
      cssClass: 'workflow-templates-modal'
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
          text: workflow.status === 'active' ? 'Pause' : 'Activate',
          icon: workflow.status === 'active' ? 'pause-outline' : 'play-outline',
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
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    this.workflowService.toggleWorkflowStatus(workflow.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWorkflows();
          this.showToast(`Workflow ${newStatus === 'active' ? 'activated' : 'paused'}`, 'success');
        },
        error: (error) => {
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
        next: (result) => {
          this.showTestResults(result);
        },
        error: (error) => {
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
}