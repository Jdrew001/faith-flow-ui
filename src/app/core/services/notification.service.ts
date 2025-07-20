import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { SwUpdate } from '@angular/service-worker';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private swUpdate: SwUpdate
  ) {
    this.initUpdatePrompt();
  }

  private initUpdatePrompt(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(async event => {
        if (event.type === 'VERSION_READY') {
          await this.showUpdateAlert();
        }
      });
    }
  }

  private async showUpdateAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'App Update Available',
      message: 'A new version of Faith Flow is available. Would you like to update now?',
      buttons: [
        {
          text: 'Later',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: () => {
            window.location.reload();
          }
        }
      ]
    });

    await alert.present();
  }

  async showToast(message: string, color: string = 'primary', duration: number = 2000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'bottom'
    });

    await toast.present();
  }

  async showInstallPrompt(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Install Faith Flow',
      message: 'Install Faith Flow on your device for a better experience. You can access it directly from your home screen!',
      buttons: [
        {
          text: 'Not Now',
          role: 'cancel'
        },
        {
          text: 'Install',
          handler: () => {
            // This will be handled by the PWA service
            return true;
          }
        }
      ]
    });

    await alert.present();
  }
}
