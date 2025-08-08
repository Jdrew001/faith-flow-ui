import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { convertUTCToLocalDate, convertLocalToUTC, convertUTCToLocalDateString } from '../../utils/date-timezone.util';

/**
 * Enhanced Date Picker Component
 * 
 * IMPORTANT: Date/Time Handling
 * - For 'datetime' mode: Returns an object with:
 *   - localTime: Local datetime string (e.g., "2025-08-10T10:45")
 *   - timezoneOffsetMinutes: Timezone offset in minutes (e.g., -300 for CST)
 *   - utcTime: ISO 8601 UTC string for compatibility
 * - For 'date' mode: Returns date string in YYYY-MM-DD format
 * 
 * This ensures the backend has full context about the user's timezone
 * and can handle scheduling appropriately.
 */
export interface DateTimeValue {
  localTime: string;
  timezoneOffsetMinutes: number;
  utcTime: string;
}
@Component({
  selector: 'app-enhanced-date-picker',
  templateUrl: './enhanced-date-picker.component.html',
  styleUrls: ['./enhanced-date-picker.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EnhancedDatePickerComponent),
      multi: true
    }
  ]
})
export class EnhancedDatePickerComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() placeholder: string = 'Select date';
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() minDate: string = '';
  @Input() maxDate: string = '';
  @Input() mode: 'date' | 'datetime' = 'date';
  @Input() minuteStep: number = 15;
  @Input() returnFullObject: boolean = true; // Return full object with timezone info
  
  @Output() dateChange = new EventEmitter<string>();

  isOpen = false;
  selectedDate: string = '';
  displayValue: string = '';
  activeTab: 'date' | 'time' = 'date';
  
  // Calendar state
  currentMonth: Date;
  selectedDateObj: Date | null = null;
  today: Date;
  
  // Time state
  selectedHour: number = 12;
  selectedMinute: number = 0;
  selectedPeriod: 'AM' | 'PM' = 'PM';
  
  // Cached calendar days to prevent recalculation
  private _calendarDays: (Date | null)[] = [];
  private _monthName: string = '';
  
  // Quick select options
  quickOptions = [
    { label: 'Today', value: 0 },
    { label: 'Tomorrow', value: 1 },
    { label: 'Next Week', value: 7 },
    { label: 'Next Month', value: 30 }
  ];
  
  // Common time options
  commonTimes = [
    { label: '9:00 AM', hour: 9, minute: 0, period: 'AM' as const },
    { label: '12:00 PM', hour: 12, minute: 0, period: 'PM' as const },
    { label: '3:00 PM', hour: 15, minute: 0, period: 'PM' as const },
    { label: '6:00 PM', hour: 18, minute: 0, period: 'PM' as const }
  ];
  
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  private onChange = (value: string) => {};
  private onTouched = () => {};
  private clickListener: any;

  constructor(private cdr: ChangeDetectorRef) {
    // Initialize today's date properly
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    
    // Initialize current month
    this.currentMonth = new Date();
    
    this.updateCalendarDays();
  }

  ngOnInit() {
    // Add global click listener for closing picker
    this.clickListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const pickerEl = target.closest('.enhanced-date-picker');
      if (!pickerEl && this.isOpen) {
        this.closePicker();
      }
    };
    document.addEventListener('click', this.clickListener);
  }

  ngOnDestroy() {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (value) {
      this.selectedDate = value;
      try {
        // Use our timezone utility to properly convert the date
        this.selectedDateObj = convertUTCToLocalDate(value, true);
        this.updateDisplayValue();
        
        // Extract time if datetime mode
        if (this.mode === 'datetime' && this.selectedDateObj) {
          const hours = this.selectedDateObj.getHours();
          this.selectedHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
          this.selectedMinute = this.selectedDateObj.getMinutes();
          this.selectedPeriod = hours >= 12 ? 'PM' : 'AM';
        }
      } catch (e) {
        console.error('Invalid date value:', value);
        this.selectedDateObj = null;
      }
    } else {
      this.selectedDate = '';
      this.selectedDateObj = null;
      this.displayValue = '';
      this.resetTime();
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  togglePicker(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.disabled) return;
    
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Set current month to selected date or today
      this.currentMonth = this.selectedDateObj ? new Date(this.selectedDateObj) : new Date();
      this.updateCalendarDays();
    } else {
      this.onTouched();
    }
    this.cdr.markForCheck();
  }

  closePicker() {
    if (this.isOpen) {
      this.isOpen = false;
      this.onTouched();
      this.cdr.markForCheck();
    }
  }

  selectQuickOption(daysFromToday: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    this.selectDate(date);
  }

  selectDate(date: Date) {
    if (!date || this.isDateDisabled(date)) return;
    
    this.selectedDateObj = new Date(date);
    
    if (this.mode === 'datetime') {
      // Apply selected time to the date
      this.applyTimeToDate();
      // Switch to time tab for time selection
      this.activeTab = 'time';
    } else {
      // For date mode, emit date string in YYYY-MM-DD format
      this.selectedDate = convertUTCToLocalDateString(date);
      this.updateDisplayValue();
      this.onChange(this.selectedDate);
      this.dateChange.emit(this.selectedDate);
      this.isOpen = false;
    }
    this.cdr.markForCheck();
  }

  clearDate() {
    this.selectedDate = '';
    this.selectedDateObj = null;
    this.displayValue = '';
    this.onChange('');
    this.dateChange.emit('');
    this.resetTime();
    this.cdr.markForCheck();
  }
  
  // Time selection methods
  resetTime() {
    this.selectedHour = 12;
    this.selectedMinute = 0;
    this.selectedPeriod = 'PM';
  }
  
  selectCommonTime(time: any) {
    this.selectedHour = time.hour > 12 ? time.hour - 12 : time.hour;
    this.selectedMinute = time.minute;
    this.selectedPeriod = time.period;
    
    if (this.selectedDateObj) {
      this.applyTimeToDate();
    }
    this.cdr.markForCheck();
  }
  
  incrementHour() {
    this.selectedHour = this.selectedHour === 12 ? 1 : this.selectedHour + 1;
    if (this.selectedDateObj) {
      this.applyTimeToDate();
    }
    this.cdr.markForCheck();
  }
  
  decrementHour() {
    this.selectedHour = this.selectedHour === 1 ? 12 : this.selectedHour - 1;
    if (this.selectedDateObj) {
      this.applyTimeToDate();
    }
    this.cdr.markForCheck();
  }
  
  incrementMinute() {
    this.selectedMinute = (this.selectedMinute + this.minuteStep) % 60;
    if (this.selectedDateObj) {
      this.applyTimeToDate();
    }
    this.cdr.markForCheck();
  }
  
  decrementMinute() {
    this.selectedMinute = this.selectedMinute - this.minuteStep;
    if (this.selectedMinute < 0) {
      this.selectedMinute = 60 + this.selectedMinute;
    }
    if (this.selectedDateObj) {
      this.applyTimeToDate();
    }
    this.cdr.markForCheck();
  }
  
  togglePeriod() {
    this.selectedPeriod = this.selectedPeriod === 'AM' ? 'PM' : 'AM';
    if (this.selectedDateObj) {
      this.applyTimeToDate();
    }
    this.cdr.markForCheck();
  }
  
  applyTimeToDate() {
    if (!this.selectedDateObj) return;
    
    let hours = this.selectedHour;
    if (this.selectedPeriod === 'PM' && hours !== 12) {
      hours += 12;
    } else if (this.selectedPeriod === 'AM' && hours === 12) {
      hours = 0;
    }
    
    this.selectedDateObj.setHours(hours);
    this.selectedDateObj.setMinutes(this.selectedMinute);
    this.selectedDateObj.setSeconds(0);
    this.selectedDateObj.setMilliseconds(0);
    
    // Store the value based on returnFullObject setting
    if (this.mode === 'datetime' && this.returnFullObject) {
      this.selectedDate = this.getDateTimeValue();
    } else {
      this.selectedDate = this.selectedDateObj.toISOString();
    }
    this.updateDisplayValue();
  }
  
  private getDateTimeValue(): any {
    if (!this.selectedDateObj) return null;
    
    // Format local time as YYYY-MM-DDTHH:mm
    const year = this.selectedDateObj.getFullYear();
    const month = String(this.selectedDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDateObj.getDate()).padStart(2, '0');
    const hours = String(this.selectedDateObj.getHours()).padStart(2, '0');
    const minutes = String(this.selectedDateObj.getMinutes()).padStart(2, '0');
    const localTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Get timezone offset in minutes (negative for west of UTC)
    const timezoneOffsetMinutes = -this.selectedDateObj.getTimezoneOffset();
    
    return {
      localTime,
      timezoneOffsetMinutes,
      utcTime: this.selectedDateObj.toISOString()
    };
  }
  
  confirmDateTime() {
    if (!this.selectedDateObj) return;
    
    this.applyTimeToDate();
    const value = this.mode === 'datetime' && this.returnFullObject 
      ? this.getDateTimeValue() 
      : this.selectedDate;
    this.onChange(value);
    this.dateChange.emit(value);
    this.isOpen = false;
    this.cdr.markForCheck();
  }
  
  switchTab(tab: 'date' | 'time') {
    if (tab === 'time' && !this.selectedDateObj) {
      return;
    }
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  private updateDisplayValue() {
    if (!this.selectedDateObj) {
      this.displayValue = '';
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selected = new Date(this.selectedDateObj);
      const selectedDate = new Date(selected);
      selectedDate.setHours(0, 0, 0, 0);
      
      const diffTime = selectedDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let dateStr = '';
      if (diffDays === 0) {
        dateStr = 'Today';
      } else if (diffDays === 1) {
        dateStr = 'Tomorrow';
      } else if (diffDays === -1) {
        dateStr = 'Yesterday';
      } else if (diffDays > 0 && diffDays <= 7) {
        dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        dateStr = selectedDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: selectedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
      
      // Add time if in datetime mode
      if (this.mode === 'datetime') {
        const timeStr = selected.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        this.displayValue = `${dateStr} at ${timeStr}`;
      } else {
        this.displayValue = dateStr;
      }
    } catch (e) {
      console.error('Error updating display value:', e);
      this.displayValue = '';
    }
  }
  
  getFormattedTime(): string {
    const hour = this.selectedHour;
    const minute = this.selectedMinute < 10 ? '0' + this.selectedMinute : this.selectedMinute.toString();
    return `${hour}:${minute} ${this.selectedPeriod}`;
  }
  
  getDateTimePreview(): string {
    if (!this.selectedDateObj) return '';
    
    try {
      const dateStr = this.selectedDateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return `${dateStr} at ${this.getFormattedTime()}`;
    } catch (e) {
      return '';
    }
  }

  // Calendar navigation
  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.updateCalendarDays();
    this.cdr.markForCheck();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.updateCalendarDays();
    this.cdr.markForCheck();
  }

  goToToday() {
    const today = new Date();
    this.currentMonth = new Date();
    this.updateCalendarDays();
    // Also select today's date
    this.selectDate(today);
    this.cdr.markForCheck();
  }

  // Calendar helpers
  get monthName(): string {
    return this._monthName;
  }

  get calendarDays(): (Date | null)[] {
    return this._calendarDays;
  }

  private updateCalendarDays() {
    if (!this.currentMonth) {
      this._calendarDays = [];
      this._monthName = '';
      return;
    }

    // Update month name
    this._monthName = this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: (Date | null)[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks) for consistent grid
    for (let i = 0; i < 42; i++) {
      if (currentDate.getMonth() === month) {
        days.push(new Date(currentDate));
      } else {
        days.push(null);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this._calendarDays = days;
  }

  isDateDisabled(date: Date): boolean {
    if (!date) return true;
    
    const dateStr = convertUTCToLocalDateString(date);
    
    if (this.minDate && dateStr < this.minDate) return true;
    if (this.maxDate && dateStr > this.maxDate) return true;
    
    return false;
  }

  isToday(date: Date): boolean {
    if (!date || !this.today) return false;
    return date.toDateString() === this.today.toDateString();
  }

  isSelected(date: Date): boolean {
    if (!date || !this.selectedDateObj) return false;
    return date.toDateString() === this.selectedDateObj.toDateString();
  }

  showTodayButton(): boolean {
    if (!this.currentMonth || !this.today) return false;
    return this.currentMonth.getMonth() !== this.today.getMonth() || 
           this.currentMonth.getFullYear() !== this.today.getFullYear();
  }

  trackByIndex(index: number): number {
    return index;
  }
}