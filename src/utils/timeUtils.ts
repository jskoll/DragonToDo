/**
 * Utility functions for time validation and formatting
 */

export const MINIMUM_REMINDER_MINUTES = 5;

/**
 * Get the minimum allowed reminder date time (5 minutes from now)
 */
export function getMinimumReminderDateTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + MINIMUM_REMINDER_MINUTES * 60 * 1000);
}

/**
 * Check if a given date time is at least 5 minutes in the future
 */
export function isValidReminderDateTime(dateTime: Date): boolean {
  const minimum = getMinimumReminderDateTime();
  return dateTime >= minimum;
}

/**
 * Format a date for the datetime-local input
 */
export function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get a human-readable relative time string
 */
export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  if (diffMinutes < 0) {
    return 'in the past';
  }
  
  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  }
  
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  }
  
  const diffDays = Math.round(diffHours / 24);
  return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

/**
 * Validate and adjust a reminder date time to meet minimum requirements
 */
export function validateAndAdjustReminderDateTime(dateTime: string | Date): {
  isValid: boolean;
  adjustedDateTime: Date;
  errorMessage?: string;
} {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      adjustedDateTime: getMinimumReminderDateTime(),
      errorMessage: 'Invalid date format'
    };
  }
  
  // Check if it's at least 5 minutes in the future
  if (!isValidReminderDateTime(date)) {
    const minimum = getMinimumReminderDateTime();
    return {
      isValid: false,
      adjustedDateTime: minimum,
      errorMessage: `Reminder must be at least ${MINIMUM_REMINDER_MINUTES} minutes in the future`
    };
  }
  
  return {
    isValid: true,
    adjustedDateTime: date
  };
}