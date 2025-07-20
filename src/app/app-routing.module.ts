import { inject, NgModule } from '@angular/core';
import { CanMatchFn, PreloadAllModules, RouterModule, Routes, UrlTree } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { Observable, take, tap } from 'rxjs';
import { AuthService } from './services/auth.service';
import { NavController } from '@ionic/angular';

const isAuthenticated = (): | boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const navController = inject(NavController);
  return authService.isAuthenticated$.pipe(
      take(1),
      tap((isAuthenticated: boolean) => {
          if (!isAuthenticated) {
            navController.navigateRoot('/auth/login', { replaceUrl:true });
          }
      }),
  );
}

const canMatch: CanMatchFn = isAuthenticated;

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
    canActivate: [canMatch]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
