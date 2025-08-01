import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appAutoHideHeader]',
  standalone: true
})
export class AutoHideHeaderDirective implements OnInit, OnDestroy {
  @Input() headerSelector = 'ion-header'; // CSS selector for the header element
  @Input() scrollThreshold = 5; // Minimum scroll distance to trigger hide/show
  @Input() hideAfterScroll = 60; // Hide header after scrolling this many pixels down
  @Input() showNearTop = 30; // Show header when within this many pixels of top
  @Input() hysteresis = 20; // Additional buffer to prevent jittering
  @Output() headerVisibilityChange = new EventEmitter<boolean>(); // Emits true when hidden, false when shown

  private lastScrollY = 0;
  private ticking = false;
  private headerElement: HTMLElement | null = null;
  private isHeaderHidden = false;
  private debounceTimeout: any;
  private isTransitioning = false; // Prevent changes during transitions
  private lastChangeTime = 0; // Track when last change occurred

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.setupHeaderElement();
    this.setupScrollListener();
  }

  ngOnDestroy() {
    // Cleanup timeouts
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }

  private setupHeaderElement() {
    // Find the header element within the directive's host element
    const hostElement = this.elementRef.nativeElement;
    this.headerElement = hostElement.querySelector(this.headerSelector);
    
    if (this.headerElement) {
      // Add CSS styles for smooth animation
      this.renderer.setStyle(this.headerElement, 'transition', 'transform 0.3s ease-out');
      this.renderer.setStyle(this.headerElement, 'will-change', 'transform');
      this.renderer.setStyle(this.headerElement, 'z-index', '100');
    }
  }

  private setupScrollListener() {
    const scrollableElement = this.findScrollableElement();
    if (scrollableElement) {
      // Handle both regular scroll events and Ionic scroll events
      this.renderer.listen(scrollableElement, 'scroll', (event) => {
        this.onScroll(event);
      });
      
      // Also listen for Ionic's ionScroll event specifically
      this.renderer.listen(scrollableElement, 'ionScroll', (event) => {
        this.onIonicScroll(event);
      });
    }
  }

  private findScrollableElement(): HTMLElement | null {
    // Look for ion-content or any element with scroll capability
    const hostElement = this.elementRef.nativeElement;
    
    // Try to find ion-content first
    let scrollElement = hostElement.querySelector('ion-content');
    
    // If no ion-content, look for any element with overflow
    if (!scrollElement) {
      const elements = hostElement.querySelectorAll('*');
      for (const el of Array.from(elements)) {
        const computedStyle = window.getComputedStyle(el as Element);
        if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
          scrollElement = el as HTMLElement;
          break;
        }
      }
    }
    
    return scrollElement || hostElement;
  }

  private onScroll(event: Event) {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateHeaderVisibility(event);
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private updateHeaderVisibility(event: Event) {
    if (!this.headerElement || this.isTransitioning) return;

    let currentScrollY = 0;
    
    // Get scroll position from different possible sources
    if (event.target instanceof HTMLElement) {
      currentScrollY = event.target.scrollTop;
    } else if ((event as any).detail?.scrollTop !== undefined) {
      // Ionic scroll event
      currentScrollY = (event as any).detail.scrollTop;
    }

    const scrollDelta = currentScrollY - this.lastScrollY;
    
    // Only process significant scroll changes
    if (Math.abs(scrollDelta) > this.scrollThreshold) {
      let shouldHide = false;
      
      // Use larger hysteresis and more conservative thresholds
      const hideThreshold = this.isHeaderHidden ? this.hideAfterScroll - (this.hysteresis * 2) : this.hideAfterScroll;
      const showThreshold = this.isHeaderHidden ? this.showNearTop + (this.hysteresis * 2) : this.showNearTop;
      
      // Only change state for more significant scroll movements
      if (scrollDelta > this.scrollThreshold * 2 && currentScrollY > hideThreshold) {
        // Scrolling down significantly - hide header
        shouldHide = true;
      } else if (scrollDelta < -(this.scrollThreshold * 2) || currentScrollY <= showThreshold) {
        // Scrolling up significantly or at top - show header
        shouldHide = false;
      } else {
        // In the neutral zone - don't change state
        this.lastScrollY = currentScrollY;
        return;
      }
      
      this.applyVisibilityChange(shouldHide);
      this.lastScrollY = currentScrollY;
    }
  }

  private onIonicScroll(event: any) {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateHeaderVisibilityFromIonic(event);
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private updateHeaderVisibilityFromIonic(event: any) {
    if (!this.headerElement || this.isTransitioning) return;

    // Get scroll position from Ionic event detail
    const currentScrollY = event.detail?.scrollTop || 0;
    const scrollDelta = currentScrollY - this.lastScrollY;
    
    // Only process significant scroll changes to prevent micro-scrolling issues
    if (Math.abs(scrollDelta) > this.scrollThreshold) {
      let shouldHide = false;
      
      // Use larger hysteresis and more conservative thresholds
      const hideThreshold = this.isHeaderHidden ? this.hideAfterScroll - (this.hysteresis * 2) : this.hideAfterScroll;
      const showThreshold = this.isHeaderHidden ? this.showNearTop + (this.hysteresis * 2) : this.showNearTop;
      
      // Only change state for more significant scroll movements
      if (scrollDelta > this.scrollThreshold * 2 && currentScrollY > hideThreshold) {
        // Scrolling down significantly - hide header
        shouldHide = true;
      } else if (scrollDelta < -(this.scrollThreshold * 2) || currentScrollY <= showThreshold) {
        // Scrolling up significantly or at top - show header
        shouldHide = false;
      } else {
        // In the neutral zone - don't change state, just update position
        this.lastScrollY = currentScrollY;
        return;
      }
      
      this.applyVisibilityChange(shouldHide);
      this.lastScrollY = currentScrollY;
    }
  }

  private applyVisibilityChange(shouldHide: boolean) {
    // Prevent rapid state changes (minimum 500ms between changes)
    const now = Date.now();
    if (now - this.lastChangeTime < 500) {
      return;
    }
    
    // Clear any pending visibility change
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // Apply change immediately if it's different from current state
    if (shouldHide !== this.isHeaderHidden && !this.isTransitioning) {
      this.isTransitioning = true;
      this.lastChangeTime = now;
      
      this.debounceTimeout = setTimeout(() => {
        this.isHeaderHidden = shouldHide;
        this.setHeaderVisibility(!shouldHide);
        this.headerVisibilityChange.emit(shouldHide);
        
        // Allow new transitions after animation completes
        setTimeout(() => {
          this.isTransitioning = false;
        }, 300); // Match the CSS transition duration
      }, 100); // Increased debounce to prevent rapid toggling
    }
  }

  private setHeaderVisibility(visible: boolean) {
    if (!this.headerElement) return;
    
    if (visible) {
      this.renderer.setStyle(this.headerElement, 'transform', 'translateY(0)');
    } else {
      this.renderer.setStyle(this.headerElement, 'transform', 'translateY(-100%)');
    }
  }

  // Public methods for manual control
  public showHeader() {
    this.isHeaderHidden = false;
    this.setHeaderVisibility(true);
    this.headerVisibilityChange.emit(false);
  }

  public hideHeader() {
    this.isHeaderHidden = true;
    this.setHeaderVisibility(false);
    this.headerVisibilityChange.emit(true);
  }

  public isHidden(): boolean {
    return this.isHeaderHidden;
  }
}
