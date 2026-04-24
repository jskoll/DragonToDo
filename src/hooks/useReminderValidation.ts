import { useState, useEffect } from 'react';
import {
  validateAndAdjustReminderDateTime,
  formatDateTimeLocal,
  getRelativeTimeString
} from '../utils/timeUtils';

interface UseReminderValidationOptions {
  initialEnabled?: boolean;
  initialDateTime?: string;
}

export function useReminderValidation(options: UseReminderValidationOptions = {}) {
  const [reminderEnabled, setReminderEnabled] = useState(options.initialEnabled ?? false);
  const [reminderDateTime, setReminderDateTime] = useState(options.initialDateTime ?? '');
  const [reminderValidation, setReminderValidation] = useState<{
    isValid: boolean;
    errorMessage?: string;
    relativeTime?: string;
  }>({ isValid: true });

  useEffect(() => {
    if (reminderEnabled && reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(reminderDateTime);
      const validation: {
        isValid: boolean;
        errorMessage?: string;
        relativeTime?: string;
      } = {
        isValid: result.isValid,
      };
      if (result.errorMessage) {
        validation.errorMessage = result.errorMessage;
      }
      if (result.isValid) {
        validation.relativeTime = getRelativeTimeString(new Date(reminderDateTime));
      }
      setReminderValidation(validation);
    } else {
      setReminderValidation({ isValid: true });
    }
  }, [reminderEnabled, reminderDateTime]);

  const handleReminderToggle = (enabled: boolean | React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = typeof enabled === 'boolean' ? enabled : enabled.target.checked;
    setReminderEnabled(isEnabled);
    if (isEnabled && !reminderDateTime) {
      const result = validateAndAdjustReminderDateTime(new Date());
      setReminderDateTime(formatDateTimeLocal(result.adjustedDateTime));
    }
  };

  const reset = () => {
    setReminderEnabled(false);
    setReminderDateTime('');
    setReminderValidation({ isValid: true });
  };

  return {
    reminderEnabled,
    reminderDateTime,
    reminderValidation,
    setReminderDateTime,
    handleReminderToggle,
    reset,
  };
}
