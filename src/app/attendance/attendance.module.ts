import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { AttendancePageRoutingModule } from './attendance-routing.module';
import { AttendancePage } from './attendance.page';
import { AttendanceStatsComponent } from './components/attendance-stats/attendance-stats.component';
import { AttendanceTrendsComponent } from './components/attendance-trends/attendance-trends.component';
import { BulkAttendanceModalComponent } from './components/bulk-attendance-modal/bulk-attendance-modal.component';
import { QuickMarkAttendanceComponent } from './components/quick-mark-attendance/quick-mark-attendance.component';
import { SessionCardComponent } from './components/session-card/session-card.component';
import { SessionDetailModalComponent } from './components/session-detail-modal/session-detail-modal.component';
import { SessionMembersComponent } from './components/session-members/session-members.component';
import { CreateSessionModalComponent } from './components/create-session-modal/create-session-modal.component';
import { AutoHideHeaderDirective } from '../shared/directives';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AttendancePageRoutingModule,
    SharedModule,
    AutoHideHeaderDirective
  ],
  declarations: [
    AttendancePage,
    SessionCardComponent,
    AttendanceStatsComponent,
    SessionDetailModalComponent,
    QuickMarkAttendanceComponent,
    AttendanceTrendsComponent,
    BulkAttendanceModalComponent,
    SessionMembersComponent,
    CreateSessionModalComponent
  ]
})
export class AttendancePageModule {}
