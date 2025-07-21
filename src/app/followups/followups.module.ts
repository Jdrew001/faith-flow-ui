import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { FollowupsPage } from './followups.page';
import { FollowupsPageRoutingModule } from './followups-routing.module';
import { AssignmentModalComponent } from './components/assignment-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FollowupsPageRoutingModule
  ],
  declarations: [
    FollowupsPage,
    AssignmentModalComponent
  ]
})
export class FollowupsPageModule {}
