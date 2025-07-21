import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { VerifyCodeResponse } from '../../auth/model/auth.model';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private hasRedirected = false; // Prevents multiple redirects
  private handlingError = false; // Prevents re-entrance

  constructor(
    private authService: AuthService, 
    private navController: NavController) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.handlingError) {
          return this.redirectToLogin(); // Redirect to login if already handling an error
        }
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.handlingError = true;
    return this.authService.refreshAccessToken().pipe(
      switchMap((response: VerifyCodeResponse) => {
        if (response.success && response.accessToken) {
          this.authService.setAccessToken(response.accessToken);
          req = req.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } });
          this.handlingError = false; // Reset flag on success
          return next.handle(req);
        } else {
          this.handlingError = false;
          return this.redirectToLogin();
        }
      }),
      catchError((refreshError: HttpErrorResponse) => {
        console.error('Refresh token failed:', refreshError);
        this.handlingError = false; // Reset flag on error
        return this.redirectToLogin(); // Refresh failed → Redirect to login
      })
    );
  }

  private redirectToLogin(): Observable<never> {
    if (!this.hasRedirected) {
      this.hasRedirected = true; // Ensure we redirect only once
      this.authService.logout();
      this.navController.navigateRoot(['/auth/login']);
    }
    return throwError(() => new Error('Redirecting to login...'));
  }
}
