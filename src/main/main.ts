import { app, BrowserWindow, globalShortcut } from 'electron';
import { createWindow, getMainWindow } from './window';
import { createMenu } from './menu';
import { registerIpcHandlers } from './ipcHandlers';
import { IPC_CHANNELS } from '../constants/ipcChannels';

if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module);
  } catch {
    // Ignore errors from electron-reloader
  }
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  registerIpcHandlers();

  // Register a global shortcut
  const ret = globalShortcut.register('CommandOrControl+Shift+D', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send(IPC_CHANNELS.SHOW_ADD_TASK_DIALOG);
    }
  });

  if (!ret) {
    console.log('Global shortcut registration failed');
  }

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

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
