import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WorkflowsPageRoutingModule } from './workflows-routing.module';
import { SharedModule } from '../shared/shared.module';

import { WorkflowsPage } from './workflows.page';
import { WorkflowCardComponent } from './components/workflow-card/workflow-card.component';
import { WorkflowCreatorComponent } from './components/workflow-creator/workflow-creator.component';
import { WorkflowDetailComponent } from './components/workflow-detail/workflow-detail.component';
import { WorkflowInstanceComponent } from './components/workflow-instance/workflow-instance.component';
import { WorkflowStepEditorComponent } from './components/workflow-step-editor/workflow-step-editor.component';
import { WorkflowTriggerBuilderComponent } from './components/workflow-trigger-builder/workflow-trigger-builder.component';
import { WorkflowTemplatesComponent } from './components/workflow-templates/workflow-templates.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    WorkflowsPageRoutingModule,
    SharedModule
  ],
  declarations: [
    WorkflowsPage,
    WorkflowCardComponent,
    WorkflowCreatorComponent,
    WorkflowDetailComponent,
    WorkflowInstanceComponent,
    WorkflowStepEditorComponent,
    WorkflowTriggerBuilderComponent,
    WorkflowTemplatesComponent
  ]
})
export class WorkflowsPageModule {}