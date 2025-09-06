import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  loadTodoFile: () => ipcRenderer.invoke('load-todo-file'),
  saveTodoFile: (content: string) => ipcRenderer.invoke('save-todo-file', content),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // Listen for menu events
  onFileLoaded: (callback: (content: string, filePath: string) => void) => 
    ipcRenderer.on('file-loaded', (_event, content, filePath) => callback(content, filePath)),
  onSaveRequest: (callback: () => void) => 
    ipcRenderer.on('save-request', () => callback()),
  onSaveAsRequest: (callback: (filePath: string) => void) => 
    ipcRenderer.on('save-as-request', (_event, filePath) => callback(filePath)),
});