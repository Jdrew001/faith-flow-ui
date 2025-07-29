# Auto-Hide Header Directive

## Overview
The `AutoHideHeaderDirective` provides a reusable YouTube-style auto-hide/show header functionality that can be applied to any component. The header disappears when scrolling down and reappears when scrolling up, with smooth animations and no blank space left behind.

## Features
- ✅ YouTube-style auto-hide/show behavior
- ✅ Smooth CSS transitions
- ✅ Configurable scroll thresholds
- ✅ Works with both regular scroll events and Ionic scroll events
- ✅ No blank space when header is hidden (uses fixed positioning)
- ✅ Customizable via input properties
- ✅ Event emission for component state management
- ✅ RequestAnimationFrame optimization for performance

## Usage

### Basic Implementation
```html
<div class="container" 
     appAutoHideHeader 
     [scrollThreshold]="5"
     [hideAfterScroll]="80"
     [showNearTop]="50"
     (headerVisibilityChange)="onHeaderVisibilityChange($event)">
  
  <ion-header [class.header-hidden]="headerHidden">
    <!-- Your header content -->
  </ion-header>
  
  <ion-content>
    <!-- Your scrollable content -->
  </ion-content>
</div>
```

### Component Integration
```typescript
export class YourComponent {
  headerHidden = false;

  onHeaderVisibilityChange(isHidden: boolean) {
    this.headerHidden = isHidden;
  }
}
```

### Required CSS
```scss
.container {
  &.header-hidden {
    .content {
      --padding-top: 0px;
    }
  }
  
  ion-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    transform: translateY(0);
    transition: transform 0.3s ease-out;
    will-change: transform;
    
    &.header-hidden {
      transform: translateY(-100%);
    }
  }
  
  .content {
    --padding-top: 140px; // Adjust based on your header height
    transition: padding-top 0.3s ease-out;
  }
}
```

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `headerSelector` | string | `'ion-header'` | CSS selector for the header element |
| `scrollThreshold` | number | `5` | Minimum scroll distance to trigger hide/show |
| `hideAfterScroll` | number | `80` | Hide header after scrolling this many pixels down |
| `showNearTop` | number | `50` | Show header when within this many pixels of top |

## Output Events

| Event | Type | Description |
|-------|------|-------------|
| `headerVisibilityChange` | `boolean` | Emits `true` when header is hidden, `false` when shown |

## Public Methods

| Method | Description |
|--------|-------------|
| `showHeader()` | Manually show the header |
| `hideHeader()` | Manually hide the header |
| `isHidden()` | Returns current header visibility state |

## Implementation Details

### Scroll Detection
The directive automatically detects scroll events from:
- Regular DOM scroll events
- Ionic's `ionScroll` events
- Any element with `overflow: auto` or `overflow: scroll`

### Performance Optimization
- Uses `requestAnimationFrame` for smooth scroll handling
- Debounced scroll events to prevent excessive DOM updates
- CSS `will-change` property for optimized animations

### Browser Compatibility
- Works with all modern browsers
- Graceful degradation for older browsers
- Mobile-optimized touch interactions

## Module Import
```typescript
import { AutoHideHeaderDirective } from '../shared/directives';

@NgModule({
  imports: [
    // ... other imports
    AutoHideHeaderDirective
  ],
  // ...
})
export class YourModule {}
```

## Example Implementation
See `session-members.component.ts` for a complete working example with:
- Fixed header positioning
- Sticky search bar
- Bulk actions bar
- Proper content padding management
