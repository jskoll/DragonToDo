export interface ElectronAPI {
  loadTodoFile: () => Promise<string>;
  saveTodoFile: (content: string) => Promise<void>;
  showNotification: (title: string, body: string) => void;
  openFileDialog: () => Promise<string | undefined>;
  
  // Listen for menu events
  onFileLoaded: (callback: (content: string, filePath: string) => void) => void;
  onSaveRequest: (callback: () => void) => void;
  onSaveAsRequest: (callback: (filePath: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};