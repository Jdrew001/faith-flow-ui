import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { Platform } from '@ionic/angular';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  public installable = false;

  constructor(
    private swUpdate: SwUpdate,
    private platform: Platform
  ) {
    this.initPWA();
    this.checkForAppUpdate();
  }

  private initPWA(): void {
    if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt event fired');
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        this.installable = true;
      });

      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        this.installable = false;
        this.deferredPrompt = null;
      });
    }
  }

  public async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      this.installable = false;
      return true;
    }
    
    return false;
  }

  private checkForAppUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(evt => {
          console.log('New version available');
          if (confirm('New version available. Load?')) {
            window.location.reload();
          }
        });

      this.swUpdate.checkForUpdate().then(() => {
        console.log('Checked for app update');
      });
    }
  }

  public isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  public getPlatformInfo(): { isInstallable: boolean; isStandalone: boolean; platform: string } {
    return {
      isInstallable: this.installable,
      isStandalone: this.isStandalone(),
      platform: this.platform.platforms().join(', ')
    };
  }
}
