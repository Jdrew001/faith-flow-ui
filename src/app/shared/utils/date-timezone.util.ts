/**
 * Utility functions for handling date timezone conversions
 */

/**
 * Converts a UTC date string to the client's local timezone
 * @param utcDateString - ISO date string in UTC format (e.g., "2025-08-13T00:00:00.000Z")
 * @param preserveDate - If true, extracts just the date portion from UTC
 * @returns Date object in client's local timezone
 */
export function convertUTCToLocalDate(utcDateString: string | Date | null | undefined, preserveDate: boolean = false): Date | null {
  if (!utcDateString) {
    return null;
  }

  try {
    const date = typeof utcDateString === 'string' ? new Date(utcDateString) : utcDateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date provided:', utcDateString);
      return null;
    }

    if (preserveDate && typeof utcDateString === 'string') {
      // If the UTC date looks like it was meant to represent a specific date (time at noon UTC)
      // extract just the date portion and create a local date
      const utcHours = date.getUTCHours();
      if (utcHours === 12) {
        // This was likely a date-only value stored at noon UTC
        // Extract the UTC date components and create a local date
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }

    return date;
  } catch (error) {
    console.error('Error converting UTC to local date:', error);
    return null;
  }
}

/**
 * Converts a UTC date to local date string in YYYY-MM-DD format
 * @param utcDateString - ISO date string in UTC format
 * @returns Local date string in YYYY-MM-DD format
 */
export function convertUTCToLocalDateString(utcDateString: string | Date | null | undefined): string {
  if (!utcDateString) {
    return '';
  }

  try {
    const date = typeof utcDateString === 'string' ? new Date(utcDateString) : utcDateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    // Check if this looks like a date-only value stored at noon UTC
    const utcHours = date.getUTCHours();
    if (utcHours === 12 || utcHours === 0) {
      // Use UTC date components to preserve the intended date
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else {
      // Use local date components for datetime values
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Error converting UTC to local date string:', error);
    return '';
  }
}

/**
 * Converts a local date to UTC ISO string, preserving the intended date
 * @param localDate - Date object or date string in local timezone
 * @param preserveDate - If true, ensures the date portion stays the same regardless of timezone
 * @returns ISO string in UTC format
 */
export function convertLocalToUTC(localDate: string | Date | null | undefined, preserveDate: boolean = true): string {
  if (!localDate) {
    return '';
  }

  try {
    let date: Date;
    
    if (typeof localDate === 'string') {
      // If it's a date-only string (YYYY-MM-DD), we want to preserve this date
      if (localDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        if (preserveDate) {
          // Create a date in UTC at noon to avoid timezone shift issues
          // This ensures the date stays the same regardless of timezone
          const [year, month, day] = localDate.split('-').map(Number);
          date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
        } else {
          // Create date at midnight local time
          date = new Date(localDate + 'T00:00:00');
        }
      } else {
        date = new Date(localDate);
      }
    } else {
      date = localDate;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date provided:', localDate);
      return '';
    }

    return date.toISOString();
  } catch (error) {
    console.error('Error converting local to UTC:', error);
    return '';
  }
}

/**
 * Formats a UTC date for display with relative date information
 * @param utcDateString - ISO date string in UTC format
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string (e.g., "Tomorrow", "In 7 days", "Dec 25, 2025")
 */
export function formatUTCDateForDisplay(utcDateString: string | Date | null | undefined, includeTime: boolean = false): string {
  if (!utcDateString) {
    return '';
  }

  // For date-only comparisons, we need to extract the actual intended date
  const localDateStr = convertUTCToLocalDateString(utcDateString);
  if (!localDateStr) {
    return '';
  }
  
  // Create a local date from the extracted date string
  const localDate = new Date(localDateStr + 'T00:00:00');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(localDate);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  let dateStr = '';
  
  // Handle relative dates
  if (diffDays === 0) {
    dateStr = 'Today';
  } else if (diffDays === 1) {
    dateStr = 'Tomorrow';
  } else if (diffDays === -1) {
    dateStr = 'Yesterday';
  } else if (diffDays > 1 && diffDays <= 7) {
    dateStr = `In ${diffDays} days`;
  } else if (diffDays < -1 && diffDays >= -7) {
    dateStr = `${Math.abs(diffDays)} days ago`;
  } else if (diffDays > 7 && diffDays <= 14) {
    dateStr = 'Next week';
  } else if (diffDays < -7 && diffDays >= -14) {
    dateStr = 'Last week';
  } else {
    // For dates further away, use standard formatting
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };
    
    // Add year if it's different from current year
    if (localDate.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }
    
    dateStr = localDate.toLocaleDateString('en-US', options);
  }
  
  // Add time if requested
  if (includeTime) {
    const timeStr = localDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    dateStr = `${dateStr} at ${timeStr}`;
  }
  
  return dateStr;
}

/**
 * Adds days to a date and returns UTC ISO string
 * @param date - Starting date (defaults to today)
 * @param days - Number of days to add
 * @returns ISO string in UTC format
 */
export function addDaysToDate(date: Date | string | null | undefined, days: number): string {
  const startDate = date ? convertUTCToLocalDate(date) : new Date();
  
  if (!startDate) {
    return '';
  }
  
  const resultDate = new Date(startDate);
  resultDate.setDate(resultDate.getDate() + days);
  
  return convertLocalToUTC(resultDate);
}

/**
 * Gets the start of day in UTC for a given date
 * @param date - Date to get start of day for
 * @returns ISO string in UTC format at midnight local time
 */
export function getStartOfDayUTC(date: Date | string | null | undefined): string {
  const localDate = date ? convertUTCToLocalDate(date) : new Date();
  
  if (!localDate) {
    return '';
  }
  
  localDate.setHours(0, 0, 0, 0);
  return convertLocalToUTC(localDate);
}

/**
 * Gets the end of day in UTC for a given date
 * @param date - Date to get end of day for
 * @returns ISO string in UTC format at 23:59:59 local time
 */
export function getEndOfDayUTC(date: Date | string | null | undefined): string {
  const localDate = date ? convertUTCToLocalDate(date) : new Date();
  
  if (!localDate) {
    return '';
  }
  
  localDate.setHours(23, 59, 59, 999);
  return convertLocalToUTC(localDate);
}