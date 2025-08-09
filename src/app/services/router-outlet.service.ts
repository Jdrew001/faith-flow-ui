import { Injectable } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class RouterOutletService {
  private routerOutlet: IonRouterOutlet | null = null;

  constructor() {}

  init(routerOutlet: IonRouterOutlet) {
    this.routerOutlet = routerOutlet;
  }

  get swipeBackEnabled(): boolean {
    if (this.routerOutlet) {
      return this.routerOutlet.swipeGesture;
    } else {
      console.warn('RouterOutletService: Call init() first!');
      return false;
    }
  }

  set swipeBackEnabled(value: boolean) {
    if (this.routerOutlet) {
      this.routerOutlet.swipeGesture = value;
    } else {
      console.warn('RouterOutletService: Call init() first!');
    }
  }

  // Convenience methods
  enableSwipeBack() {
    this.swipeBackEnabled = true;
  }

  disableSwipeBack() {
    this.swipeBackEnabled = false;
  }
}