import '@testing-library/jest-dom';

// Mock Electron APIs
const mockElectronAPI = {
  loadTodoFile: jest.fn(() => Promise.resolve('')),
  saveTodoFile: jest.fn(() => Promise.resolve()),
  showNotification: jest.fn(() => Promise.resolve()),
  openFileDialog: jest.fn(() => Promise.resolve()),
  onFileLoaded: jest.fn(),
  onSaveRequest: jest.fn(),
  onSaveAsRequest: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    static permission = 'granted';
    static requestPermission = jest.fn(() => Promise.resolve('granted'));
    
    constructor(public title: string, public options?: NotificationOptions) {}
    close = jest.fn();
    
    static show = jest.fn();
  },
  writable: true,
});

export { mockElectronAPI };