import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowTemplate } from '../../models';

@Component({
  selector: 'app-workflow-templates',
  templateUrl: './workflow-templates.component.html',
  styleUrls: ['./workflow-templates.component.scss']
})
export class WorkflowTemplatesComponent implements OnInit {
  templates: WorkflowTemplate[] = [];
  selectedTemplate: WorkflowTemplate | null = null;

  constructor(
    private modalController: ModalController,
    private workflowService: WorkflowService
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.workflowService.templates$.subscribe(templates => {
      this.templates = templates;
    });
  }

  selectTemplate(template: WorkflowTemplate) {
    this.selectedTemplate = template;
  }

  useTemplate() {
    if (this.selectedTemplate) {
      this.modalController.dismiss({
        template: this.selectedTemplate
      });
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getTemplateStepsCount(template: WorkflowTemplate): number {
    return template.preset.steps?.length || 0;
  }

  getTemplateTriggerType(template: WorkflowTemplate): string {
    const triggerType = template.preset.triggerType;
    if (triggerType === 'attendance') return 'Attendance-based';
    if (triggerType === 'manual') return 'Manual';
    if (triggerType === 'schedule') return 'Scheduled';
    return 'Custom';
  }
}