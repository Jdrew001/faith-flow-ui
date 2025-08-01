import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MenuComponent } from './menu.component';
import { PwaInstallModule } from '../../../pwa-install/pwa-install.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CoreModule } from 'src/app/core/core.module';

@NgModule({
  declarations: [MenuComponent],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule,
    PwaInstallModule,
    IonicModule
  ],
  exports: [MenuComponent]
})
export class MenuModule { }
