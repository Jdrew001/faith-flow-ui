import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2, NgZone, HostListener } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { throttleTime, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appAutoHideHeader]',
  standalone: true
})
export class AutoHideHeaderDirective implements OnInit, OnDestroy {
  @Input() headerSelector = 'ion-header';
  @Input() scrollThreshold = 10; // Minimum scroll distance to trigger
  @Input() hideDelay = 150; // Delay before hiding (ms)
  @Input() showDelay = 50; // Delay before showing (ms)
  @Output() headerVisibilityChange = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();
  private scrollElement: HTMLElement | null = null;
  private headerElement: HTMLElement | null = null;
  private lastScrollTop = 0;
  private isHeaderHidden = false;
  private hideTimeout: any;
  private showTimeout: any;
  private ticking = false;
  private scrollVelocity = 0;
  private lastScrollTime = 0;
  private touchStartY = 0;
  private isTouching = false;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Run outside Angular zone for better performance
    this.ngZone.runOutsideAngular(() => {
      this.setupHeaderElement();
      this.setupScrollListener();
      this.setupTouchListeners();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimeouts();
  }

  private setupHeaderElement() {
    const hostElement = this.elementRef.nativeElement;
    this.headerElement = hostElement.querySelector(this.headerSelector);
    
    if (this.headerElement) {
      // Set initial styles for smooth transitions
      this.renderer.setStyle(this.headerElement, 'transition', 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
      this.renderer.setStyle(this.headerElement, 'will-change', 'transform');
      this.renderer.setStyle(this.headerElement, 'transform', 'translateY(0)');
    }
  }

  private setupScrollListener() {
    this.scrollElement = this.findScrollableElement();
    
    if (this.scrollElement) {
      // Use RxJS for better scroll handling
      fromEvent(this.scrollElement, 'scroll', { passive: true })
        .pipe(
          throttleTime(16, undefined, { leading: true, trailing: true }), // ~60fps
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          if (!this.ticking && !this.isTouching) {
            requestAnimationFrame(() => {
              this.handleScroll();
              this.ticking = false;
            });
            this.ticking = true;
          }
        });
    }
  }

  private setupTouchListeners() {
    const element = this.scrollElement || this.elementRef.nativeElement;
    
    // Touch start
    this.renderer.listen(element, 'touchstart', (event: TouchEvent) => {
      this.isTouching = true;
      this.touchStartY = event.touches[0].clientY;
      this.clearTimeouts();
    });
    
    // Touch end
    this.renderer.listen(element, 'touchend', () => {
      this.isTouching = false;
      // Handle any pending scroll after touch ends
      setTimeout(() => {
        this.handleScroll();
      }, 100);
    });
  }

  private findScrollableElement(): HTMLElement | null {
    const hostElement = this.elementRef.nativeElement;
    
    // First try ion-content
    let scrollElement = hostElement.querySelector('ion-content');
    if (scrollElement) {
      // For ion-content, we need to get the actual scroll element
      const shadowRoot = (scrollElement as any).shadowRoot;
      if (shadowRoot) {
        const innerScroll = shadowRoot.querySelector('.inner-scroll');
        if (innerScroll) {
          return innerScroll as HTMLElement;
        }
      }
    }
    
    // Fallback to any scrollable element
    const elements = hostElement.querySelectorAll('*');
    for (const el of Array.from(elements)) {
      const style = window.getComputedStyle(el as Element);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return el as HTMLElement;
      }
    }
    
    return hostElement;
  }

  private handleScroll() {
    if (!this.scrollElement || !this.headerElement) return;
    
    const currentScrollTop = this.scrollElement.scrollTop;
    const scrollDelta = currentScrollTop - this.lastScrollTop;
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastScrollTime;
    
    // Calculate scroll velocity
    if (timeDelta > 0) {
      this.scrollVelocity = Math.abs(scrollDelta) / timeDelta;
    }
    
    // Determine if we should hide or show the header
    if (Math.abs(scrollDelta) >= this.scrollThreshold) {
      this.clearTimeouts();
      
      if (scrollDelta > 0 && currentScrollTop > 100) {
        // Scrolling down - hide header
        if (!this.isHeaderHidden) {
          // Use velocity to determine delay
          const delay = this.scrollVelocity > 0.5 ? 0 : this.hideDelay;
          
          this.hideTimeout = setTimeout(() => {
            this.ngZone.run(() => {
              this.hideHeader();
            });
          }, delay);
        }
      } else if (scrollDelta < 0 || currentScrollTop <= 50) {
        // Scrolling up or near top - show header
        if (this.isHeaderHidden) {
          // Show immediately on scroll up
          this.showTimeout = setTimeout(() => {
            this.ngZone.run(() => {
              this.showHeader();
            });
          }, this.showDelay);
        }
      }
    }
    
    // Always show header when at the very top
    if (currentScrollTop === 0 && this.isHeaderHidden) {
      this.clearTimeouts();
      this.ngZone.run(() => {
        this.showHeader();
      });
    }
    
    this.lastScrollTop = currentScrollTop;
    this.lastScrollTime = currentTime;
  }

  private hideHeader() {
    if (!this.isHeaderHidden && this.headerElement) {
      this.isHeaderHidden = true;
      this.renderer.setStyle(this.headerElement, 'transform', 'translateY(-100%)');
      this.headerVisibilityChange.emit(true);
    }
  }

  private showHeader() {
    if (this.isHeaderHidden && this.headerElement) {
      this.isHeaderHidden = false;
      this.renderer.setStyle(this.headerElement, 'transform', 'translateY(0)');
      this.headerVisibilityChange.emit(false);
    }
  }

  private clearTimeouts() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  // Public methods for manual control
  public forceShowHeader() {
    this.clearTimeouts();
    this.ngZone.run(() => {
      this.showHeader();
    });
  }

  public forceHideHeader() {
    this.clearTimeouts();
    this.ngZone.run(() => {
      this.hideHeader();
    });
  }

  public toggleHeader() {
    if (this.isHeaderHidden) {
      this.forceShowHeader();
    } else {
      this.forceHideHeader();
    }
  }

  // Handle window resize
  @HostListener('window:resize')
  onWindowResize() {
    // Re-setup on resize in case layout changed
    this.setupHeaderElement();
    this.setupScrollListener();
  }
}