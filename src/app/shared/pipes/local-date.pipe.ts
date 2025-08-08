import { Pipe, PipeTransform } from '@angular/core';
import {
  convertUTCToLocalDate,
  convertUTCToLocalDateString,
  formatUTCDateForDisplay
} from '../utils/date-timezone.util';

/**
 * Pipe to convert UTC dates to local timezone for display
 * 
 * Usage:
 * {{ utcDate | localDate }} - Returns local date/time
 * {{ utcDate | localDate:'date' }} - Returns local date only (YYYY-MM-DD)
 * {{ utcDate | localDate:'display' }} - Returns formatted display (Today, Tomorrow, etc.)
 * {{ utcDate | localDate:'display-time' }} - Returns formatted display with time
 */
@Pipe({
  name: 'localDate',
  standalone: false
})
export class LocalDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format?: string): string | Date | null {
    if (!value) {
      return '';
    }

    switch (format) {
      case 'date':
        // Return date string in YYYY-MM-DD format
        return convertUTCToLocalDateString(value);
      
      case 'display':
        // Return formatted display without time
        return formatUTCDateForDisplay(value, false);
      
      case 'display-time':
        // Return formatted display with time
        return formatUTCDateForDisplay(value, true);
      
      default:
        // Return the Date object
        return convertUTCToLocalDate(value);
    }
  }
}