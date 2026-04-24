import { ipcMain, dialog, Notification } from 'electron';
import * as fs from 'fs/promises';
import { IPC_CHANNELS } from '../constants/ipcChannels';

let currentFilePath: string | null = null;

export function getCurrentFilePath(): string | null {
  return currentFilePath;
}

export function setCurrentFilePath(filePath: string): void {
  currentFilePath = filePath;
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LOAD_TODO_FILE, async (): Promise<string> => {
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

  ipcMain.handle(IPC_CHANNELS.SAVE_TODO_FILE, async (_event, content: string): Promise<void> => {
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

  ipcMain.handle(IPC_CHANNELS.SHOW_NOTIFICATION, (_event, title: string, body: string): void => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_FILE_DIALOG, async () => {
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

  ipcMain.handle(IPC_CHANNELS.SHOW_SAVE_DIALOG, async () => {
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
}
