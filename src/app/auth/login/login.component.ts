import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { VerifyCodeResponse } from '../model/auth.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit {
  showVerificationCode = false;
  phoneNumber = '';
  displayPhoneNumber = '';
  formattedPhoneNumber = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  
  keypadNumbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

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
}
