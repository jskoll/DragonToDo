export interface ElectronAPI {
  loadTodoFile: () => Promise<string>;
  saveTodoFile: (content: string) => Promise<void>;
  showNotification: (title: string, body: string) => void;
  openFileDialog: () => Promise<string | undefined>;
  
  // Update functionality
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => void;
  getUpdateInfo: () => any;
  isUpdateAvailable: () => boolean;
  
  // Listen for menu events
  onFileLoaded: (callback: (content: string, filePath: string) => void) => void;
  onSaveRequest: (callback: () => void) => void;
  onSaveAsRequest: (callback: (filePath: string) => void) => void;
  
  // Listen for update events
  onUpdateAvailable: (callback: (info: any) => void) => void;
  onUpdateDownloaded: (callback: (info: any) => void) => void;
  onUpdateDownloadProgress: (callback: (progress: any) => void) => void;
  onUpdateError: (callback: (error: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};