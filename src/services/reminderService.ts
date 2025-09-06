import { TodoItem } from '../types/todo';
import { isValidReminderDateTime } from '../utils/timeUtils';

export class ReminderService {
  private activeReminders = new Map<string, NodeJS.Timeout>();

  setupReminders(todos: TodoItem[]): void {
    // Clear existing reminders
    this.clearAllReminders();

    // Set up new reminders
    todos.forEach(todo => {
      if (todo.reminder?.enabled && isValidReminderDateTime(todo.reminder.dateTime)) {
        this.scheduleReminder(todo);
      }
    });
  }

  scheduleReminder(todo: TodoItem): void {
    if (!todo.reminder?.enabled) return;

    const reminderTime = todo.reminder.dateTime;
    
    // Validate that the reminder time meets minimum requirements
    if (!isValidReminderDateTime(reminderTime)) {
      console.warn(`Reminder for todo "${todo.text}" does not meet minimum time requirement (${reminderTime})`);
      return;
    }
    
    const now = new Date();
    if (reminderTime <= now) {
      // Show notification immediately if reminder is overdue
      this.showNotification(todo);
      return;
    }

    const delay = reminderTime.getTime() - now.getTime();
    
    // Only schedule if within reasonable time (30 days)
    if (delay > 30 * 24 * 60 * 60 * 1000) {
      console.warn(`Reminder for todo "${todo.text}" is too far in the future (${reminderTime})`);
      return;
    }

    const timeoutId = setTimeout(() => {
      this.showNotification(todo);
      this.activeReminders.delete(todo.id);
    }, delay);

    // Store the timeout ID so we can cancel it later
    this.activeReminders.set(todo.id, timeoutId);
  }

  cancelReminder(todoId: string): void {
    const timeoutId = this.activeReminders.get(todoId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeReminders.delete(todoId);
    }
  }

  clearAllReminders(): void {
    this.activeReminders.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.activeReminders.clear();
  }

  private async showNotification(todo: TodoItem): Promise<void> {
    try {
      const title = 'Todo Reminder';
      const body = todo.reminder?.message || todo.text;
      
      // Use Electron's notification system
      await window.electronAPI.showNotification(title, body);
      
      // Also try to use browser notification API as fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: todo.id,
          requireInteraction: true
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        // Request permission for future notifications
        Notification.requestPermission();
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Get active reminder count for debugging/stats
  getActiveReminderCount(): number {
    return this.activeReminders.size;
  }

  // Get all active reminder IDs
  getActiveReminderIds(): string[] {
    return Array.from(this.activeReminders.keys());
  }
}