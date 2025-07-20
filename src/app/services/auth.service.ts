import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'leader' | 'admin';
  churchName?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  churchName?: string;
}

export interface LoginRequest {
  phoneNumber: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  verificationCode: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
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

  verifyLoginCode(phoneNumber: string, verificationCode: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-code`, { 
      phoneNumber: this.formatPhoneNumber(phoneNumber),
      verificationCode 
    }).pipe(
      tap((response: any) => {
        if (response.success && response.token) {
          this.setAuthentication(response.token);
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
    localStorage.removeItem('current_user');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
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
}
