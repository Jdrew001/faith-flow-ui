import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FollowupsPage } from './followups.page';

const routes: Routes = [
  {
    path: '',
    component: FollowupsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FollowupsPageRoutingModule {}
