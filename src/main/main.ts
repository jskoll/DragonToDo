import { app, BrowserWindow, Menu, dialog, ipcMain, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ElectronAPI {
  loadTodoFile: () => Promise<string>;
  saveTodoFile: (content: string) => Promise<void>;
  showNotification: (title: string, body: string) => void;
  openFileDialog: () => Promise<string | undefined>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

let mainWindow: BrowserWindow;
let currentFilePath: string | undefined;

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

ipcMain.handle('open-file-dialog', async (): Promise<string | undefined> => {
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
    return currentFilePath;
  }

  return undefined;
});