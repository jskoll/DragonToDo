import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  loadTodoFile: () => ipcRenderer.invoke('load-todo-file'),
  saveTodoFile: (content: string) => ipcRenderer.invoke('save-todo-file', content),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  
  // Update functionality
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getUpdateInfo: () => ipcRenderer.invoke('get-update-info'),
  isUpdateAvailable: () => ipcRenderer.invoke('is-update-available'),
  
  // Listen for menu events
  onFileLoaded: (callback: (content: string, filePath: string) => void) => 
    ipcRenderer.on('file-loaded', (_event, content, filePath) => callback(content, filePath)),
  onSaveRequest: (callback: () => void) => 
    ipcRenderer.on('save-request', () => callback()),
  onSaveAsRequest: (callback: (filePath: string) => void) => 
    ipcRenderer.on('save-as-request', (_event, filePath) => callback(filePath)),
    
  // Listen for update events
  onUpdateAvailable: (callback: (info: any) => void) => 
    ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateDownloaded: (callback: (info: any) => void) => 
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  onUpdateDownloadProgress: (callback: (progress: any) => void) => 
    ipcRenderer.on('update-download-progress', (_event, progress) => callback(progress)),
  onUpdateError: (callback: (error: string) => void) => 
    ipcRenderer.on('update-error', (_event, error) => callback(error)),
});