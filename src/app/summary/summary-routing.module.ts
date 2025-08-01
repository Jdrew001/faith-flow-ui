import { RouterModule, Routes } from "@angular/router";
import { SummaryComponent } from "./summary.component";
import { NgModule } from "@angular/core";

const routes: Routes = [
  {
    path: '',
    component: SummaryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SummaryRoutingModule {}