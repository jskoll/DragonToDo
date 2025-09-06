/**
 * @fileoverview Update service for handling auto-updates via electron-updater
 * Provides functionality to check for updates, download, and install updates
 */

import { autoUpdater, UpdateInfo as ElectronUpdateInfo } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

/**
 * Service class for managing application updates
 */
export class UpdateService {
  private mainWindow: BrowserWindow | null = null;
  private isUpdateAvailable = false;
  private updateInfo: ElectronUpdateInfo | null = null;

  /**
   * Initialize the update service with the main window reference
   * @param window - The main BrowserWindow instance
   */
  constructor(window: BrowserWindow) {
    this.mainWindow = window;
    this.setupAutoUpdater();
  }

  /**
   * Set up auto-updater event listeners
   */
  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // We'll ask user before downloading
    autoUpdater.autoInstallOnAppQuit = true;

    // Update available
    autoUpdater.on('update-available', (info: ElectronUpdateInfo) => {
      console.log('Update available:', info);
      this.isUpdateAvailable = true;
      this.updateInfo = info;
      this.notifyUpdateAvailable(info);
    });

    // No update available
    autoUpdater.on('update-not-available', (info: ElectronUpdateInfo) => {
      console.log('Update not available:', info);
      this.isUpdateAvailable = false;
      this.updateInfo = null;
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      this.notifyUpdateDownloaded(info);
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      console.log(`Download progress: ${progressObj.percent}%`);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-download-progress', progressObj);
      }
    });

    // Error handling
    autoUpdater.on('error', (error) => {
      console.error('Auto updater error:', error);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-error', error.message);
      }
    });
  }

  /**
   * Check for updates manually
   * @returns Promise that resolves when check is complete
   */
  public async checkForUpdates(): Promise<void> {
    try {
      console.log('Checking for updates...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      throw new Error(`Update check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download the available update
   * @returns Promise that resolves when download is complete
   */
  public async downloadUpdate(): Promise<void> {
    if (!this.isUpdateAvailable) {
      throw new Error('No update available to download');
    }

    try {
      console.log('Starting update download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
      throw new Error(`Update download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Install the downloaded update and restart the app
   */
  public installUpdate(): void {
    console.log('Installing update and restarting...');
    autoUpdater.quitAndInstall();
  }

  /**
   * Get current update availability status
   * @returns True if an update is available
   */
  public isUpdateReady(): boolean {
    return this.isUpdateAvailable;
  }

  /**
   * Get information about the available update
   * @returns Update information or null if no update available
   */
  public getUpdateInfo(): ElectronUpdateInfo | null {
    return this.updateInfo;
  }

  /**
   * Notify the renderer process about available update
   * @param info - Update information
   */
  private async notifyUpdateAvailable(info: ElectronUpdateInfo): Promise<void> {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-available', info);
      
      // Show download dialog
      const shouldDownload = await this.showDownloadDialog(info);
      if (shouldDownload) {
        try {
          await this.downloadUpdate();
        } catch (error) {
          console.error('Failed to download update:', error);
        }
      }
    }
  }

  /**
   * Notify the renderer process that update has been downloaded
   * @param info - Update information
   */
  private async notifyUpdateDownloaded(info: any): Promise<void> {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-downloaded', info);
      
      // Show install dialog
      const shouldInstall = await this.showInstallDialog(info);
      if (shouldInstall) {
        this.installUpdate();
      }
    }
  }

  /**
   * Show a dialog asking user if they want to install the update now
   * @param info - Update information
   * @returns Promise resolving to user's choice
   */
  public async showInstallDialog(info: ElectronUpdateInfo): Promise<boolean> {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return false;
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      buttons: ['Install Now', 'Install Later'],
      defaultId: 0,
      title: 'Update Downloaded',
      message: `DragonToDo ${info.version} is ready to install`,
      detail: 'The update has been downloaded. Would you like to install it now? The application will restart.',
      checkboxLabel: 'Always install updates automatically',
      checkboxChecked: false,
    });

    return result.response === 0;
  }

  /**
   * Show a dialog asking user if they want to download the available update
   * @param info - Update information
   * @returns Promise resolving to user's choice
   */
  public async showDownloadDialog(info: ElectronUpdateInfo): Promise<boolean> {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return false;
    }

    let detailMessage = `A new version of DragonToDo is available: ${info.version}`;
    
    if (info.releaseNotes) {
      if (typeof info.releaseNotes === 'string') {
        detailMessage += `\n\nRelease Notes:\n${info.releaseNotes}`;
      } else if (Array.isArray(info.releaseNotes)) {
        const notes = info.releaseNotes.map((note: any) => `• ${note.note || note}`).join('\n');
        detailMessage += `\n\nWhat's New:\n${notes}`;
      }
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      buttons: ['Download & Install', 'Skip This Version', 'Remind Me Later'],
      defaultId: 0,
      title: 'Update Available',
      message: `DragonToDo ${info.version} is available`,
      detail: detailMessage,
    });

    return result.response === 0;
  }
}

export default UpdateService;