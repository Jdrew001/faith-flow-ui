import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { MembersPageRoutingModule } from './members-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MembersPage } from './members.page';
import { MemberDetailModalComponent } from './components/member-detail-modal/member-detail-modal.component';
import { MemberCreateModalComponent } from './components/member-create-modal/member-create-modal.component';
import { MemberNoteModalComponent } from './components/member-note-modal/member-note-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MembersPageRoutingModule,
    SharedModule
  ],
  declarations: [
    MembersPage,
    MemberDetailModalComponent,
    MemberCreateModalComponent,
    MemberNoteModalComponent
  ]
})
export class MembersPageModule {}