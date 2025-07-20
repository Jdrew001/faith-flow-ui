import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private navController: NavController) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('faithflow_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call - replace with actual authentication
      await this.delay(1000);
      
      // Mock validation
      if (credentials.email === 'demo@faithflow.com' && credentials.password === 'password') {
        const user: User = {
          id: '1',
          email: credentials.email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'member',
          churchName: 'Grace Community Church'
        };
        
        this.setCurrentUser(user);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async register(userData: RegisterData): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call
      await this.delay(1000);
      
      const user: User = {
        id: Date.now().toString(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'member',
        churchName: userData.churchName
      };
      
      this.setCurrentUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call
      await this.delay(1000);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }
  }

  logout(): void {
    localStorage.removeItem('faithflow_user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.navigateToLogin();
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem('faithflow_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  navigateToHome(): void {
    this.navController.navigateRoot(['/summary'], { replaceUrl: true });
  }

  navigateToLogin(): void {
    this.navController.navigateRoot(['/auth/login'], { replaceUrl: true });
  }
}
