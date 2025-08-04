import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MenuModule } from './components/menu/menu.module';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';

@NgModule({
  declarations: [UpdateModalComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [IonicModule, CommonModule, UpdateModalComponent]
})
export class SharedModule { }
