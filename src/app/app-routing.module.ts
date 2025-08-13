import { inject, NgModule } from '@angular/core';
import { CanMatchFn, PreloadAllModules, RouterModule, Routes, UrlTree } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { IonicRouteStrategy } from '@ionic/angular';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'summary',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'summary',
    loadChildren: () => import('./summary/summary.module').then(m => m.SummaryModule),
    canActivate: [AuthGuard]
  },
  // {
  //   path: 'events',
  //   loadChildren: () => import('./events/events.module').then(m => m.EventsPageModule),
  //   canActivate: [AuthGuard]
  // },
  {
    path: 'events',
    redirectTo: '/attendance',
    pathMatch: 'full'
  },
  {
    path: 'followups',
    loadChildren: () => import('./followups/followups.module').then(m => m.FollowupsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'attendance',
    loadChildren: () => import('./attendance/attendance.module').then(m => m.AttendancePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'workflows',
    loadChildren: () => import('./workflows/workflows.module').then(m => m.WorkflowsPageModule),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
