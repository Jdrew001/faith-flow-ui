import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MenuModule } from './components/menu/menu.module';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';
import { MemberSearchComponent } from './components/member-search/member-search.component';
import { EnhancedDatePickerComponent } from './components/enhanced-date-picker/enhanced-date-picker.component';
import { CustomSelectComponent } from './components/custom-select/custom-select.component';
import { LocalDatePipe } from './pipes/local-date.pipe';

@NgModule({
  declarations: [UpdateModalComponent, MemberSearchComponent, EnhancedDatePickerComponent, CustomSelectComponent, LocalDatePipe],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [IonicModule, CommonModule, UpdateModalComponent, MemberSearchComponent, EnhancedDatePickerComponent, CustomSelectComponent, LocalDatePipe, ReactiveFormsModule, FormsModule]
})
export class SharedModule { }
