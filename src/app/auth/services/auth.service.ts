import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthResponse, LoginCredentials, RegisterData, User, VerifyCodeResponse } from '../model/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private navController: NavController
  ) {
    // Check initial authentication state
    this.checkAuthStatus();
    this.loadStoredUser();
  }

  private checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.isAuthenticatedSubject.next(true);
      this.loadStoredUser();
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  requestLoginCode(phoneNumber: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/request-code`, { 
      phoneNumber: this.formatPhoneNumber(phoneNumber) 
    });
  }

  verifyLoginCode(phoneNumber: string, verificationCode: string): Observable<VerifyCodeResponse> {
    return this.http.post<VerifyCodeResponse>(`${this.apiUrl}/verify-code`, { 
      phoneNumber: this.formatPhoneNumber(phoneNumber),
      verificationCode 
    }).pipe(
      tap((response: VerifyCodeResponse) => {
        if (response.success && response.accessToken) {
          // Map the backend user format to our frontend User interface
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.name.split(' ')[0] || response.user.name,
            lastName: response.user.name.split(' ').slice(1).join(' ') || '',
            role: response.user.role.toLowerCase() as 'member' | 'leader' | 'admin'
          };
          
          this.setAuthentication(response.accessToken, user);
          
          // Store refresh token
          localStorage.setItem('refresh_token', response.refreshToken);
        }
      })
    );
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    return phoneNumber.replace(/\D/g, '');
  }

  private setAuthentication(token: string, user?: User) {
    localStorage.setItem('auth_token', token);
    this.isAuthenticatedSubject.next(true);
    
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.navController.navigateRoot(['/auth/login']);
  }

  private loadStoredUser() {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('current_user');
      }
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Mock authentication for development - replace with real API calls
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // This is a mock implementation - replace with real API call
    return new Observable(observer => {
      setTimeout(() => {
        const mockUser: User = {
          id: '1',
          email: credentials.email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'member',
          churchName: 'Sample Church'
        };
        
        const token = 'mock-jwt-token';
        this.setAuthentication(token, mockUser);
        
        observer.next({ success: true, token });
        observer.complete();
      }, 1000);
    });
  }

  register(data: RegisterData): Observable<AuthResponse> {
    // This is a mock implementation - replace with real API call
    return new Observable(observer => {
      setTimeout(() => {
        const mockUser: User = {
          id: '1',
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'member',
          churchName: data.churchName
        };
        
        const token = 'mock-jwt-token';
        this.setAuthentication(token, mockUser);
        
        observer.next({ success: true, token });
        observer.complete();
      }, 1000);
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setAccessToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  refreshAccessToken(): Observable<VerifyCodeResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<VerifyCodeResponse>(`${this.apiUrl}/refresh`, { 
      refreshToken 
    }).pipe(
      tap((response: VerifyCodeResponse) => {
        if (response.success && response.accessToken) {
          this.setAccessToken(response.accessToken);
          
          // Update refresh token if provided
          if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken);
          }
        }
      })
    );
  }
}
