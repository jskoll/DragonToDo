import { Menu, dialog } from 'electron';
import * as fs from 'fs/promises';
import { getMainWindow } from './window';
import { setCurrentFilePath, getCurrentFilePath } from './ipcHandlers';
import { IPC_CHANNELS } from '../constants/ipcChannels';

export function createMenu(): void {
  const mainWindow = getMainWindow();

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (!mainWindow) return;

            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'DragonToDo files', extensions: ['dtd'] },
                { name: 'Todo.txt files', extensions: ['txt'] },
                { name: 'All files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              setCurrentFilePath(filePath);
              const content = await fs.readFile(filePath, 'utf-8');
              mainWindow.webContents.send(IPC_CHANNELS.FILE_LOADED, content, filePath);
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send(IPC_CHANNELS.SAVE_REQUEST);
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            if (!mainWindow) return;

            const result = await dialog.showSaveDialog(mainWindow, {
              defaultPath: getCurrentFilePath() || 'untitled.dtd',
              filters: [
                { name: 'DragonToDo files', extensions: ['dtd'] },
                { name: 'Todo.txt files', extensions: ['txt'] }
              ]
            });

            if (!result.canceled && result.filePath) {
              setCurrentFilePath(result.filePath);
              mainWindow.webContents.send(IPC_CHANNELS.SAVE_AS_REQUEST, result.filePath);
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
