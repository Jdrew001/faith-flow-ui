import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { FollowupsPage } from './followups.page';
import { FollowupsPageRoutingModule } from './followups-routing.module';
import { AssignmentModalComponent } from './components/assignment-modal/assignment-modal.component';
import { FollowupModalComponent } from './components/followup-modal/followup-modal.component';
import { AutoHideHeaderDirective } from '../shared/directives/auto-hide-header.directive';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FollowupsPageRoutingModule,
    AutoHideHeaderDirective,
    SharedModule
  ],
  declarations: [
    FollowupsPage,
    AssignmentModalComponent,
    FollowupModalComponent
  ]
})
export class FollowupsPageModule {}
