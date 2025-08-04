import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { VerifyCodeResponse } from '../model/auth.model';
import { OtpService } from '../services/otp.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('otpInput') otpInputElement?: ElementRef<HTMLInputElement>;
  
  showVerificationCode = false;
  phoneNumber = '';
  displayPhoneNumber = '';
  formattedPhoneNumber = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  private otpSubscription?: Subscription;
  isWebOtpSupported = false;
  
  keypadNumbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private otpService: OtpService
  ) {}

  ngOnInit() {
    // Check if Web OTP is supported
    this.isWebOtpSupported = this.otpService.isWebOtpSupported();
    
    // Subscribe to OTP detection
    this.otpSubscription = this.otpService.otpDetected$
      .pipe(filter(otp => otp.length === 6))
      .subscribe(otp => {
        this.fillOtpDigits(otp);
      });
  }

  ngOnDestroy() {
    // Clean up
    this.otpSubscription?.unsubscribe();
    this.otpService.stopOtpListener();
  }

  onKeypadPress(num: number) {
    if (this.phoneNumber.length < 10) {
      this.phoneNumber += num.toString();
      this.updateDisplayPhoneNumber();
    }
  }

  onDeletePress() {
    if (this.phoneNumber.length > 0) {
      this.phoneNumber = this.phoneNumber.slice(0, -1);
      this.updateDisplayPhoneNumber();
    }
  }

  updateDisplayPhoneNumber() {
    if (this.phoneNumber.length === 0) {
      this.displayPhoneNumber = '+1';
    } else if (this.phoneNumber.length <= 3) {
      this.displayPhoneNumber = `+1 (${this.phoneNumber}`;
    } else if (this.phoneNumber.length <= 6) {
      this.displayPhoneNumber = `+1 (${this.phoneNumber.slice(0, 3)}) ${this.phoneNumber.slice(3)}`;
    } else {
      this.displayPhoneNumber = `+1 (${this.phoneNumber.slice(0, 3)}) ${this.phoneNumber.slice(3, 6)}-${this.phoneNumber.slice(6)}`;
    }
  }

  onOtpKeypadPress(num: number) {
    const emptyIndex = this.otpDigits.findIndex(digit => digit === '');
    if (emptyIndex !== -1) {
      this.otpDigits[emptyIndex] = num.toString();
      
      // Auto-verify when all digits are entered
      if (this.otpDigits.every(digit => digit !== '')) {
        this.verifyLoginCode();
      }
    }
  }

  onOtpDeletePress() {
    for (let i = this.otpDigits.length - 1; i >= 0; i--) {
      if (this.otpDigits[i] !== '') {
        this.otpDigits[i] = '';
        break;
      }
    }
  }

  requestLoginCode() {
    if (this.phoneNumber.length === 10) {
      this.formattedPhoneNumber = this.displayPhoneNumber;
      
      this.authService.requestLoginCode(this.displayPhoneNumber).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showVerificationCode = true;
            
            // Start listening for OTP if supported
            if (this.isWebOtpSupported) {
              this.otpService.startOtpListener();
              this.showInfoToast('Waiting for SMS code...');
            }
          } else {
            this.showErrorToast('Unable to send verification code');
          }
        },
        error: (err: any) => {
          this.showErrorToast('Network error. Please try again.');
        }
      });
    }
  }

  verifyLoginCode() {
    const verificationCode = this.otpDigits.join('');
    if (verificationCode.length === 6) {
      this.authService.verifyLoginCode(this.formattedPhoneNumber, verificationCode).subscribe({
        next: (response: VerifyCodeResponse) => {
          if (response.success) {
            this.showSuccessToast(`Welcome, ${response.user.name}!`);
            this.router.navigate(['/summary'], { replaceUrl: true });
          } else {
            this.showErrorToast('Invalid verification code');
            this.clearOtp();
          }
        },
        error: (err: any) => {
          console.error('Verification error:', err);
          this.showErrorToast('Verification failed. Please try again.');
          this.clearOtp();
        }
      });
    }
  }

  clearOtp() {
    this.otpDigits = ['', '', '', '', '', ''];
  }

  resendOtp() {
    this.requestLoginCode();
    this.showSuccessToast('OTP sent successfully');
  }

  goBack() {
    if (this.showVerificationCode) {
      this.showVerificationCode = false;
      this.clearOtp();
      // Stop OTP listener when going back
      this.otpService.stopOtpListener();
    } else {
      this.router.navigate(['/welcome'], { replaceUrl: true });
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    toast.present();
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    toast.present();
  }

  private async showInfoToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'primary',
      position: 'top'
    });
    toast.present();
  }

  private fillOtpDigits(otp: string) {
    if (otp.length === 6) {
      // Fill the OTP digits
      this.otpDigits = otp.split('');
      
      // Show success message
      this.showSuccessToast('Code detected automatically!');
      
      // Auto-verify after a short delay
      setTimeout(() => {
        this.verifyLoginCode();
      }, 500);
    }
  }

  focusHiddenInput() {
    // Focus the hidden input to trigger iOS keyboard and autofill
    if (this.otpInputElement) {
      this.otpInputElement.nativeElement.focus();
    }
  }

  onHiddenOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length <= 6) {
      // Update OTP digits display
      this.otpDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < value.length; i++) {
        this.otpDigits[i] = value[i];
      }
      
      // Auto-verify when complete
      if (value.length === 6) {
        this.verifyLoginCode();
      }
    } else {
      // Prevent more than 6 digits
      input.value = value.slice(0, 6);
    }
  }
}
