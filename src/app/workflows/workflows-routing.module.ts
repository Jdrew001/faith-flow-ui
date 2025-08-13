import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkflowsPage } from './workflows.page';
import { WorkflowDetailComponent } from './components/workflow-detail/workflow-detail.component';
import { WorkflowInstanceComponent } from './components/workflow-instance/workflow-instance.component';

const routes: Routes = [
  {
    path: '',
    component: WorkflowsPage
  },
  {
    path: ':id',
    component: WorkflowDetailComponent
  },
  {
    path: 'instance/:instanceId',
    component: WorkflowInstanceComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkflowsPageRoutingModule {}