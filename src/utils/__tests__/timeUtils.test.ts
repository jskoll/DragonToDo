import {
  MINIMUM_REMINDER_MINUTES,
  getMinimumReminderDateTime,
  isValidReminderDateTime,
  formatDateTimeLocal,
  getRelativeTimeString,
  validateAndAdjustReminderDateTime
} from '../timeUtils';

describe('timeUtils', () => {
  describe('getMinimumReminderDateTime', () => {
    it('should return a date 5 minutes in the future', () => {
      const now = new Date();
      const minDateTime = getMinimumReminderDateTime();
      const diffMinutes = (minDateTime.getTime() - now.getTime()) / (1000 * 60);
      
      expect(diffMinutes).toBeCloseTo(MINIMUM_REMINDER_MINUTES, 0);
    });
  });

  describe('isValidReminderDateTime', () => {
    it('should return false for past dates', () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      expect(isValidReminderDateTime(pastDate)).toBe(false);
    });

    it('should return false for dates less than 5 minutes in the future', () => {
      const nearFutureDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
      expect(isValidReminderDateTime(nearFutureDate)).toBe(false);
    });

    it('should return true for dates 5 or more minutes in the future', () => {
      const validDate = new Date(Date.now() + 6 * 60 * 1000); // 6 minutes from now
      expect(isValidReminderDateTime(validDate)).toBe(true);
    });
  });

  describe('formatDateTimeLocal', () => {
    it('should format date correctly for datetime-local input', () => {
      const date = new Date('2023-12-15T10:30:00');
      const formatted = formatDateTimeLocal(date);
      expect(formatted).toBe('2023-12-15T10:30');
    });

    it('should handle single digit months and days', () => {
      const date = new Date('2023-01-05T09:05:00');
      const formatted = formatDateTimeLocal(date);
      expect(formatted).toBe('2023-01-05T09:05');
    });
  });

  describe('getRelativeTimeString', () => {
    it('should return "in the past" for past dates', () => {
      const pastDate = new Date(Date.now() - 60000);
      expect(getRelativeTimeString(pastDate)).toBe('in the past');
    });

    it('should return minutes for dates less than an hour away', () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      expect(getRelativeTimeString(futureDate)).toBe('in 30 minutes');
    });

    it('should return singular minute for 1 minute', () => {
      const futureDate = new Date(Date.now() + 60 * 1000); // 1 minute
      expect(getRelativeTimeString(futureDate)).toBe('in 1 minute');
    });

    it('should return hours for dates less than a day away', () => {
      const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
      expect(getRelativeTimeString(futureDate)).toBe('in 3 hours');
    });

    it('should return days for dates more than a day away', () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days
      expect(getRelativeTimeString(futureDate)).toBe('in 2 days');
    });
  });

  describe('validateAndAdjustReminderDateTime', () => {
    it('should return valid for future dates meeting minimum requirement', () => {
      const validDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      const result = validateAndAdjustReminderDateTime(validDate);
      
      expect(result.isValid).toBe(true);
      expect(result.adjustedDateTime).toEqual(validDate);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should return invalid for past dates', () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      const result = validateAndAdjustReminderDateTime(pastDate);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Reminder must be at least 5 minutes in the future');
      expect(result.adjustedDateTime.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return invalid for dates too close to now', () => {
      const tooSoonDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
      const result = validateAndAdjustReminderDateTime(tooSoonDate);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Reminder must be at least 5 minutes in the future');
    });

    it('should handle string input', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000);
      const result = validateAndAdjustReminderDateTime(futureTime.toISOString());
      
      expect(result.isValid).toBe(true);
    });

    it('should handle invalid date strings', () => {
      const result = validateAndAdjustReminderDateTime('invalid-date');
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid date format');
    });
  });
});