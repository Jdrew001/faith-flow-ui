import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
}

@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class CustomSelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() searchable: boolean = false;
  @Input() showColors: boolean = false;
  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;
  selectedOption: SelectOption | null = null;
  searchTerm = '';
  filteredOptions: SelectOption[] = [];

  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  writeValue(value: string): void {
    if (value) {
      this.selectedOption = this.options.find(opt => opt.value === value) || null;
    } else {
      this.selectedOption = null;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.disabled) return;
    
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }
  
  private openDropdown() {
    this.isOpen = true;
    this.searchTerm = '';
    this.filteredOptions = [...this.options];
    
    // Add listeners when opening
    setTimeout(() => {
      document.addEventListener('click', this.documentClickListener);
      document.addEventListener('scroll', this.scrollListener, true);
    }, 0);
  }
  
  private closeDropdown() {
    if (this.isOpen) {
      this.isOpen = false;
      this.searchTerm = '';
      this.filteredOptions = [...this.options];
      this.onTouched();
      
      // Remove listeners when closing
      document.removeEventListener('click', this.documentClickListener);
      document.removeEventListener('scroll', this.scrollListener, true);
    }
  }
  
  private documentClickListener = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);
    
    if (!clickedInside) {
      this.closeDropdown();
    }
  };
  
  private scrollListener = (event: Event) => {
    const target = event.target as HTMLElement;
    // Only close if scrolling outside the component and not in a modal
    const scrollingInside = this.elementRef.nativeElement.contains(target);
    const scrollingInModal = target.closest('ion-modal') !== null;
    
    if (!scrollingInside && !scrollingInModal) {
      this.closeDropdown();
    }
  };

  selectOption(option: SelectOption, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.selectedOption = option;
    this.onChange(option.value);
    this.selectionChange.emit(option.value);
    this.closeDropdown();
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredOptions = [...this.options];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredOptions = this.options.filter(opt => 
        opt.label.toLowerCase().includes(term) ||
        (opt.description && opt.description.toLowerCase().includes(term))
      );
    }
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.selectedOption = null;
    this.onChange('');
    this.selectionChange.emit('');
  }

  @HostListener('keydown.escape')
  onEscapeKey() {
    this.closeDropdown();
  }
  
  onFocusOut(event: FocusEvent) {
    // Check if the focus is moving outside the component
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (!this.elementRef.nativeElement.contains(activeElement)) {
        this.closeDropdown();
      }
    }, 100);
  }
  
  ngOnDestroy() {
    // Clean up event listeners if component is destroyed while open
    document.removeEventListener('click', this.documentClickListener);
    document.removeEventListener('scroll', this.scrollListener, true);
  }

  getDisplayValue(): string {
    return this.selectedOption ? this.selectedOption.label : '';
  }

  getPriorityColor(value: string): string {
    switch(value) {
      case 'HIGH': return '#ff3b30';
      case 'MEDIUM': return '#ff9500';
      case 'LOW': return '#34c759';
      default: return '#007aff';
    }
  }

  getStatusColor(value: string): string {
    switch(value) {
      case 'OPEN': return '#ff9500';
      case 'IN_PROGRESS': return '#007aff';
      case 'COMPLETED': return '#34c759';
      default: return '#8e8e93';
    }
  }
}