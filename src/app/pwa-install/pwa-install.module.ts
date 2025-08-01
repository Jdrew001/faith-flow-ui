import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PwaInstallComponent } from './pwa-install.component';
import { PwaService } from './pwa.service';
import { SharedModule } from '../shared/shared.module';
import { CoreModule } from '../core/core.module';

@NgModule({
  declarations: [
    PwaInstallComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CoreModule
  ],
  providers: [
    PwaService
  ],
  exports: [
    PwaInstallComponent
  ]
})
export class PwaInstallModule { }
