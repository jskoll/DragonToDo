export interface UpdateInfo {
  version: string;
  releaseNotes?: string | null;
  releaseName?: string;
  releaseDate?: string;
}

export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

export interface ElectronAPI {
  loadTodoFile: () => Promise<string>;
  saveTodoFile: (content: string) => Promise<void>;
  showNotification: (title: string, body: string) => void;
  openFileDialog: () => Promise<string | undefined>;
  showSaveDialog: () => Promise<string | null>;
  onShowAddTaskDialog: (callback: () => void) => () => void;
  removeShowAddTaskDialogListener: (callback: () => void) => void;

  // Update functionality
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => void;
  getUpdateInfo: () => UpdateInfo | null;
  isUpdateAvailable: () => boolean;

  // Listen for menu events
  onFileLoaded: (callback: (content: string, filePath: string) => void) => void;
  removeFileLoadedListener: () => void;
  onSaveRequest: (callback: () => void) => void;
  removeSaveRequestListener: () => void;
  onSaveAsRequest: (callback: (filePath: string) => void) => void;
  removeSaveAsRequestListener: () => void;

  // Listen for update events
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
  onUpdateDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
  onUpdateError: (callback: (error: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};