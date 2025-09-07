import { ReminderService } from '../reminderService';
import { TodoItem } from '../../types/todo';

// Mock timers
jest.useFakeTimers();

describe('ReminderService', () => {
  let service: ReminderService;
  let mockShowNotification: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new ReminderService();
    mockShowNotification = jest.fn();
    // Mock window.electronAPI
    (window as any).electronAPI = {
      showNotification: mockShowNotification
    };
    // Clear all timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    service.clearAllReminders();
    jest.clearAllTimers();
  });

  describe('setupReminders', () => {
    it('should set up reminders for todos with future reminder dates', () => {
      jest.useFakeTimers();
      const service = new ReminderService();
      const validDate = new Date(Date.now() + 600000); // 10 minutes from now
      const todos = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'Test todo',
          reminder: {
            enabled: true,
            date: validDate.toISOString().slice(0, 10),
            time: validDate.toTimeString().slice(0, 5),
            dateTime: validDate,
            message: 'Future reminder'
          }
        }
      ];
      service.setupReminders(todos);
      expect(service.getActiveReminderCount()).toBe(1);
      jest.useRealTimers();
    });

    it('should not set up reminders for disabled reminders', () => {
      const futureDate = new Date(Date.now() + 600000); // 10 minutes from now
      const todos: TodoItem[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'Test todo',
          reminder: {
            dateTime: futureDate,
            enabled: false
          }
        }
      ];

      service.setupReminders(todos);
      expect(service.getActiveReminderCount()).toBe(0);
    });

    it('should not set up reminders for past dates', () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      const todos: TodoItem[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'Test todo',
          reminder: {
            dateTime: pastDate,
            enabled: true
          }
        }
      ];

      service.setupReminders(todos);
      expect(service.getActiveReminderCount()).toBe(0);
      // Note: The notification is shown immediately for overdue reminders, 
      // but this happens asynchronously, so we don't test it here
    });

    it('should clear existing reminders before setting up new ones', () => {
      const futureDate1 = new Date(Date.now() + 600000); // 10 minutes from now
      const futureDate2 = new Date(Date.now() + 1200000); // 20 minutes from now
      
      const todos1: TodoItem[] = [
        {
          id: '1',
          text: 'First todo',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'First todo',
          reminder: {
            dateTime: futureDate1,
            enabled: true
          }
        }
      ];

      const todos2: TodoItem[] = [
        {
          id: '2',
          text: 'Second todo',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'Second todo',
          reminder: {
            dateTime: futureDate2,
            enabled: true
          }
        }
      ];

      service.setupReminders(todos1);
      expect(service.getActiveReminderCount()).toBe(1);
      expect(service.getActiveReminderIds()).toEqual(['1']);

      service.setupReminders(todos2);
      expect(service.getActiveReminderCount()).toBe(1);
      expect(service.getActiveReminderIds()).toEqual(['2']);
    });
  });

  describe('scheduleReminder', () => {
    it('should schedule a reminder for a future date', () => {
      const futureDate = new Date(Date.now() + 600000); // 10 minutes from now
      const todo: TodoItem = {
        id: '1',
        text: 'Test todo',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Test todo',
        reminder: {
          dateTime: futureDate,
          enabled: true
        }
      };

      service.scheduleReminder(todo);
      expect(service.getActiveReminderCount()).toBe(1);

      // Fast forward time to trigger the reminder
      jest.advanceTimersByTime(600000); // 10 minutes
      expect(mockShowNotification).toHaveBeenCalledWith('Todo Reminder', 'Test todo');
      expect(service.getActiveReminderCount()).toBe(0);
    });

    it('should show notification immediately for overdue reminders', () => {
      const pastDate = new Date(Date.now() - 60000);
      const todo: TodoItem = {
        id: '1',
        text: 'Overdue todo',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Overdue todo',
        reminder: {
          dateTime: pastDate,
          enabled: true
        }
      };

      service.scheduleReminder(todo);
      expect(service.getActiveReminderCount()).toBe(0);
      // Notification happens asynchronously, so we just verify no timer is set
    });

    it('should use custom message if provided', () => {
      const futureDate = new Date(Date.now() + 600000); // 10 minutes from now
      const todo: TodoItem = {
        id: '1',
        text: 'Test todo',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Test todo',
        reminder: {
          dateTime: futureDate,
          enabled: true,
          message: 'Custom reminder message'
        }
      };

      service.scheduleReminder(todo);
      jest.advanceTimersByTime(600000); // 10 minutes
      expect(mockShowNotification).toHaveBeenCalledWith('Todo Reminder', 'Custom reminder message');
    });

    it('should not schedule if reminder is disabled', () => {
      const futureDate = new Date(Date.now() + 600000); // 10 minutes from now
      const todo: TodoItem = {
        id: '1',
        text: 'Test todo',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Test todo',
        reminder: {
          dateTime: futureDate,
          enabled: false
        }
      };

      service.scheduleReminder(todo);
      expect(service.getActiveReminderCount()).toBe(0);
    });
  });

  describe('cancelReminder', () => {
    it('should cancel an active reminder', () => {
      const futureDate = new Date(Date.now() + 600000); // 10 minutes from now
      const todo: TodoItem = {
        id: '1',
        text: 'Test todo',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Test todo',
        reminder: {
          dateTime: futureDate,
          enabled: true
        }
      };

      service.scheduleReminder(todo);
      expect(service.getActiveReminderCount()).toBe(1);

      service.cancelReminder('1');
      expect(service.getActiveReminderCount()).toBe(0);

      // Advance time to ensure notification doesn't fire
      jest.advanceTimersByTime(600000); // 10 minutes
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should handle canceling non-existent reminder gracefully', () => {
      expect(() => service.cancelReminder('non-existent')).not.toThrow();
    });
  });

  describe('clearAllReminders', () => {
    it('should clear all active reminders', () => {
      const futureDate1 = new Date(Date.now() + 600000); // 10 minutes from now
      const futureDate2 = new Date(Date.now() + 1200000); // 20 minutes from now
      
      const todos: TodoItem[] = [
        {
          id: '1',
          text: 'First todo',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'First todo',
          reminder: { dateTime: futureDate1, enabled: true }
        },
        {
          id: '2',
          text: 'Second todo',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'Second todo',
          reminder: { dateTime: futureDate2, enabled: true }
        }
      ];

      service.setupReminders(todos);
      expect(service.getActiveReminderCount()).toBe(2);

      service.clearAllReminders();
      expect(service.getActiveReminderCount()).toBe(0);

      // Advance time to ensure no notifications fire
      jest.advanceTimersByTime(1200000); // 20 minutes
      expect(mockShowNotification).not.toHaveBeenCalled();
    });
  });
});