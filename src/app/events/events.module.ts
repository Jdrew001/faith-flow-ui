import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { EventsPageRoutingModule } from './events-routing.module';
import { EventsPage } from './events.page';
import { CreateEventModalComponent } from './components/create-event-modal/create-event-modal.component';
import { EventDetailModalComponent } from './components/event-detail-modal/event-detail-modal.component';
import { EventFiltersComponent } from './components/event-filters/event-filters.component';
import { AttendanceModalComponent } from './components/attendance-modal/attendance-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    EventsPageRoutingModule,
    SharedModule
  ],
  declarations: [
    EventsPage,
    // EventCardComponent,
    // EventCalendarComponent,
    EventFiltersComponent,
    EventDetailModalComponent,
    CreateEventModalComponent,
    AttendanceModalComponent
  ]
})
export class EventsPageModule {}
