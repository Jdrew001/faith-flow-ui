import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MenuModule } from './components/menu/menu.module';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';
import { MemberSearchComponent } from './components/member-search/member-search.component';
import { EnhancedDatePickerComponent } from './components/enhanced-date-picker/enhanced-date-picker.component';

@NgModule({
  declarations: [UpdateModalComponent, MemberSearchComponent, EnhancedDatePickerComponent],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [IonicModule, CommonModule, UpdateModalComponent, MemberSearchComponent, EnhancedDatePickerComponent, ReactiveFormsModule, FormsModule]
})
export class SharedModule { }
