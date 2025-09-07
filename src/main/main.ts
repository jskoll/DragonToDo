import { app, BrowserWindow, Menu, dialog, ipcMain, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { UpdateService } from '../services/updateService';

interface ElectronAPI {
  loadTodoFile: () => Promise<string>;
  saveTodoFile: (content: string) => Promise<void>;
  showNotification: (title: string, body: string) => void;
  openFileDialog: () => Promise<string | undefined>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => void;
  getUpdateInfo: () => any;
  isUpdateAvailable: () => boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

let mainWindow: BrowserWindow;
let currentFilePath: string | undefined;
let updateService: UpdateService;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });

  // Initialize update service
  updateService = new UpdateService(mainWindow);

  // Check for updates on app startup (after a delay to let the app load)
  setTimeout(() => {
    if (process.env.NODE_ENV !== 'development') {
      updateService.checkForUpdates().catch(error => {
        console.log('Update check failed:', error);
      });
    }
  }, 5000);
}

function createMenu(): void {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'DragonToDo files', extensions: ['dtd'] },
                { name: 'Todo.txt files', extensions: ['txt'] },
                { name: 'All files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
              currentFilePath = result.filePaths[0];
              const content = await fs.readFile(currentFilePath, 'utf-8');
              mainWindow.webContents.send('file-loaded', content, currentFilePath);
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-request');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              filters: [
                { name: 'DragonToDo files', extensions: ['dtd'] },
                { name: 'Todo.txt files', extensions: ['txt'] },
                { name: 'All files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePath) {
              currentFilePath = result.filePath;
              mainWindow.webContents.send('save-as-request', currentFilePath);
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: async () => {
            try {
              await updateService.checkForUpdates();
              if (!updateService.isUpdateReady()) {
                await dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'No Updates',
                  message: 'DragonToDo is up to date',
                  detail: 'You have the latest version installed.'
                });
              }
            } catch (error) {
              await dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Update Check Failed',
                message: 'Unable to check for updates',
                detail: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('load-todo-file', async (): Promise<string> => {
  if (currentFilePath) {
    try {
      return await fs.readFile(currentFilePath, 'utf-8');
    } catch (error) {
      console.error('Error loading file:', error);
      throw error;
    }
  }
  return '';
});

ipcMain.handle('save-todo-file', async (_event, content: string): Promise<void> => {
  if (currentFilePath) {
    try {
      await fs.writeFile(currentFilePath, content, 'utf-8');
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  } else {
    throw new Error('No file path set');
  }
});

ipcMain.handle('show-notification', (_event, title: string, body: string): void => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Todo Files', extensions: ['dtd', 'txt'] }],
  });
  if (!canceled && filePaths.length > 0) {
    currentFilePath = filePaths[0];
    return currentFilePath;
  }
  return null;
});

ipcMain.handle('show-save-dialog', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: 'untitled.dtd',
    filters: [{ name: 'Todo Files', extensions: ['dtd', 'txt'] }],
  });
  if (!canceled && filePath) {
    currentFilePath = filePath;
    return filePath;
  }
  return null;
});

// Update-related IPC handlers
ipcMain.handle('check-for-updates', async (): Promise<void> => {
  try {
    await updateService.checkForUpdates();
  } catch (error) {
    console.error('Manual update check failed:', error);
    throw error;
  }
});

ipcMain.handle('download-update', async (): Promise<void> => {
  try {
    await updateService.downloadUpdate();
  } catch (error) {
    console.error('Update download failed:', error);
    throw error;
  }
});

ipcMain.handle('install-update', (): void => {
  updateService.installUpdate();
});

ipcMain.handle('get-update-info', (): any => {
  return updateService.getUpdateInfo();
});

ipcMain.handle('is-update-available', (): boolean => {
  return updateService.isUpdateReady();
});