export class TimeUtils {
  /**
   * Format time to 12-hour format with AM/PM
   * @param date Date object or time string
   * @returns Formatted time string (e.g., "10:45 AM")
   */
  static formatTime12Hour(date: Date | string): string {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle time string (HH:MM or HH:MM:SS)
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        // Create a date with the time
        dateObj = new Date(`2000-01-01 ${date}`);
      }
    } else {
      dateObj = date;
    }
    
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    // Format with leading zeros
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
    
    return `${hours}:${minutesStr} ${ampm}`;
  }

  /**
   * Parse 12-hour time string to 24-hour format
   * @param time12 Time string in 12-hour format (e.g., "10:45 AM")
   * @returns Time string in 24-hour format (HH:MM)
   */
  static parse12HourTo24Hour(time12: string): string {
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate duration between two times
   * @param startTime Start time string
   * @param endTime End time string
   * @returns Duration in minutes
   */
  static calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    // Handle case where end time is next day
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }
}