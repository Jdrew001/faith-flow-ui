import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { MenuModule } from '../shared/components/menu/menu.module';

@NgModule({
  declarations: [MainLayoutComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    MenuModule
  ],
  exports: [MainLayoutComponent]
})
export class LayoutsModule { }
