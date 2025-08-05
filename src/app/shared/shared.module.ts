import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { MenuModule } from './components/menu/menu.module';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';
import { MemberSearchComponent } from './components/member-search/member-search.component';

@NgModule({
  declarations: [UpdateModalComponent, MemberSearchComponent],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ],
  exports: [IonicModule, CommonModule, UpdateModalComponent, MemberSearchComponent, ReactiveFormsModule]
})
export class SharedModule { }
