import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OtpService {
  private otpDetectedSubject = new BehaviorSubject<string>('');
  otpDetected$ = this.otpDetectedSubject.asObservable();

  constructor() {}

  /**
   * Start listening for OTP via Web OTP API
   * This works on Android Chrome and other supported browsers
   */
  async startOtpListener(): Promise<void> {
    // Check if Web OTP API is available
    if ('OTPCredential' in window) {
      try {
        const abortController = new AbortController();
        
        // Store the controller so we can abort if needed
        (window as any).otpAbortController = abortController;

        const otp = await navigator.credentials.get({
          otp: { transport: ['sms'] },
          signal: abortController.signal
        } as any);

        if (otp && 'code' in otp) {
          // Emit the detected OTP code
          this.otpDetectedSubject.next((otp as any).code);
        }
      } catch (error) {
        // User cancelled or other error
        console.log('OTP detection cancelled or failed:', error);
      }
    }
  }

  /**
   * Stop listening for OTP
   */
  stopOtpListener(): void {
    if ((window as any).otpAbortController) {
      (window as any).otpAbortController.abort();
      delete (window as any).otpAbortController;
    }
  }

  /**
   * Check if Web OTP API is supported
   */
  isWebOtpSupported(): boolean {
    return 'OTPCredential' in window;
  }

  /**
   * Format phone number for backend
   * Ensures the phone number has the correct format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If already has country code
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return `+${cleaned}`;
  }
}