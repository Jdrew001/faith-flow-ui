import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { CoreModule } from '../core/core.module';
import { IonicModule } from '@ionic/angular';
import { SummaryComponent } from './summary.component';
import { MenuModule } from '../shared/components/menu/menu.module';
import { SummaryRoutingModule } from './summary-routing.module';



@NgModule({
  declarations: [SummaryComponent],
  imports: [
    CommonModule,
    SummaryRoutingModule,
    SharedModule,
    CoreModule,
    IonicModule.forRoot(),
    MenuModule
  ]
})
export class SummaryModule { }
