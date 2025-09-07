import { app, BrowserWindow, Menu, ipcMain, dialog, Notification } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

try {
  require('electron-reloader')(module);
} catch (_) {}

interface ElectronAPI {
  loadTodoFile: () => Promise<string>;
  saveTodoFile: (content: string) => Promise<void>;
  showNotification: (title: string, body: string) => void;
  openFileDialog: () => Promise<string | undefined>;
  showSaveDialog: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

let mainWindow: BrowserWindow;
let currentFilePath: string | null = null;

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
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => {
            if (mainWindow) {
              const isFullScreen = mainWindow.isFullScreen();
              mainWindow.setFullScreen(!isFullScreen);
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/jskoll/DragonToDo');
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