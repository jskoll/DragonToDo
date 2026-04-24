import { contextBridge, ipcRenderer } from 'electron';
import { UpdateInfo, DownloadProgress } from '../types/electron';
import { IPC_CHANNELS } from '../constants/ipcChannels';

contextBridge.exposeInMainWorld('electronAPI', {
  loadTodoFile: () => ipcRenderer.invoke(IPC_CHANNELS.LOAD_TODO_FILE),
  saveTodoFile: (content: string) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_TODO_FILE, content),
  showNotification: (title: string, body: string) => ipcRenderer.invoke(IPC_CHANNELS.SHOW_NOTIFICATION, title, body),
  openFileDialog: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE_DIALOG),
  showSaveDialog: () => ipcRenderer.invoke(IPC_CHANNELS.SHOW_SAVE_DIALOG),

  onShowAddTaskDialog: (callback: () => void) =>
    ipcRenderer.on(IPC_CHANNELS.SHOW_ADD_TASK_DIALOG, callback),

  removeShowAddTaskDialogListener: (callback: () => void) =>
    ipcRenderer.removeListener(IPC_CHANNELS.SHOW_ADD_TASK_DIALOG, callback),

  // Update functionality
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.CHECK_FOR_UPDATES),
  downloadUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_UPDATE),
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.INSTALL_UPDATE),
  getUpdateInfo: () => ipcRenderer.invoke(IPC_CHANNELS.GET_UPDATE_INFO),
  isUpdateAvailable: () => ipcRenderer.invoke(IPC_CHANNELS.IS_UPDATE_AVAILABLE),

  // Listen for menu events
  onFileLoaded: (callback: (content: string, filePath: string) => void) =>
    ipcRenderer.on(IPC_CHANNELS.FILE_LOADED, (_event, content, filePath) => callback(content, filePath)),
  removeFileLoadedListener: () =>
    ipcRenderer.removeAllListeners(IPC_CHANNELS.FILE_LOADED),
  onSaveRequest: (callback: () => void) =>
    ipcRenderer.on(IPC_CHANNELS.SAVE_REQUEST, () => callback()),
  removeSaveRequestListener: () =>
    ipcRenderer.removeAllListeners(IPC_CHANNELS.SAVE_REQUEST),
  onSaveAsRequest: (callback: (filePath: string) => void) =>
    ipcRenderer.on(IPC_CHANNELS.SAVE_AS_REQUEST, (_event, filePath) => callback(filePath)),
  removeSaveAsRequestListener: () =>
    ipcRenderer.removeAllListeners(IPC_CHANNELS.SAVE_AS_REQUEST),

  // Listen for update events
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, (_event, info) => callback(info)),
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, (_event, info) => callback(info)),
  onUpdateDownloadProgress: (callback: (progress: DownloadProgress) => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOAD_PROGRESS, (_event, progress) => callback(progress)),
  onUpdateError: (callback: (error: string) => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_ERROR, (_event, error) => callback(error)),
});