import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowTemplatePreset } from '../../models';

@Component({
  selector: 'app-workflow-templates',
  templateUrl: './workflow-templates.component.html',
  styleUrls: ['./workflow-templates.component.scss'],
  standalone: false
})
export class WorkflowTemplatesComponent implements OnInit {
  templates: WorkflowTemplatePreset[] = [];
  selectedTemplate: WorkflowTemplatePreset | null = null;

  constructor(
    private modalController: ModalController,
    private workflowService: WorkflowService
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.workflowService.templates$.subscribe(templates => {
      this.templates = templates as WorkflowTemplatePreset[];
    });
  }

  selectTemplate(template: WorkflowTemplatePreset) {
    this.selectedTemplate = template;
  }

  useTemplate() {
    if (this.selectedTemplate) {
      this.modalController.dismiss({
        template: this.selectedTemplate
      });
    }
  }

  useTemplateDirectly(template: WorkflowTemplatePreset) {
    // Directly use the template without requiring selection first
    this.modalController.dismiss({
      template: template
    });
  }

  createFromScratch() {
    // Dismiss with blank action to create from scratch
    this.modalController.dismiss({
      action: 'blank'
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getTemplateStepsCount(template: WorkflowTemplatePreset): number {
    return template.preset.steps?.length || 0;
  }

  getTemplateTriggerType(template: WorkflowTemplatePreset): string {
    const triggerType = template.preset.trigger?.type;
    if (triggerType === 'attendance_rule') return 'Attendance-based';
    if (triggerType === 'first_time_visitor') return 'First-time visitor';
    if (triggerType === 'manual') return 'Manual';
    if (triggerType === 'scheduled') return 'Scheduled';
    if (triggerType === 'member_created') return 'New member';
    if (triggerType === 'member_updated') return 'Member updated';
    return 'Custom';
  }
}