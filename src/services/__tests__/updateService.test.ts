import { UpdateService } from '../updateService';
import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';

// Mock electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    webContents: {
      send: jest.fn(),
    },
    isDestroyed: jest.fn(() => false),
  })),
  dialog: {
    showMessageBox: jest.fn(),
  },
}));

jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdates: jest.fn(),
    downloadUpdate: jest.fn(),
    quitAndInstall: jest.fn(),
    on: jest.fn(),
    autoDownload: false,
    autoInstallOnAppQuit: false,
  },
}));

const mockAutoUpdater = autoUpdater as jest.Mocked<typeof autoUpdater>;

describe('UpdateService', () => {
  let mockWindow: jest.Mocked<BrowserWindow>;
  let updateService: UpdateService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWindow = new BrowserWindow() as jest.Mocked<BrowserWindow>;
    updateService = new UpdateService(mockWindow);
  });

  it('should initialize with correct configuration', () => {
    expect(mockAutoUpdater.autoDownload).toBe(false);
    expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(true);
  });

  it('should set up event listeners during initialization', () => {
    // autoUpdater.on should have been called multiple times to set up listeners
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-available', expect.any(Function));
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-not-available', expect.any(Function));
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-downloaded', expect.any(Function));
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('download-progress', expect.any(Function));
    expect(mockAutoUpdater.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should check for updates', async () => {
    mockAutoUpdater.checkForUpdates.mockResolvedValue({
      updateInfo: { version: '1.0.1' },
      cancellationToken: {
        cancelled: false,
        cancel: jest.fn(),
      } as any,
    } as any);

    await updateService.checkForUpdates();

    expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
  });

  it('should handle checkForUpdates errors', async () => {
    const error = new Error('Network error');
    mockAutoUpdater.checkForUpdates.mockRejectedValue(error);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await updateService.checkForUpdates();

    expect(consoleSpy).toHaveBeenCalledWith('Error checking for updates:', error);
    
    consoleSpy.mockRestore();
  });

  it('should download update', async () => {
    mockAutoUpdater.downloadUpdate.mockResolvedValue([] as any);

    await updateService.downloadUpdate();

    expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalledTimes(1);
  });

  it('should handle downloadUpdate errors', async () => {
    const error = new Error('Download failed');
    mockAutoUpdater.downloadUpdate.mockRejectedValue(error);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await updateService.downloadUpdate();

    expect(consoleSpy).toHaveBeenCalledWith('Error downloading update:', error);
    
    consoleSpy.mockRestore();
  });

  it('should install update', () => {
    updateService.installUpdate();

    expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalledTimes(1);
  });

  it('should return update availability status', () => {
    // Initially should be false
    expect(updateService.isUpdateReady()).toBe(false);
  });

  it('should return update info', () => {
    // Initially should be null
    expect(updateService.getUpdateInfo()).toBeNull();
  });

  it('should handle download error when no update available', async () => {
    await expect(updateService.downloadUpdate()).rejects.toThrow('No update available to download');
  });

  it('should show download dialog', async () => {
    const mockInfo = { 
      version: '1.0.1', 
      releaseDate: '2024-01-01',
      releaseNotes: 'Bug fixes and improvements'
    } as any;

    const { dialog } = require('electron');
    dialog.showMessageBox.mockResolvedValue({ response: 0 });

    const result = await updateService.showDownloadDialog(mockInfo);

    expect(result).toBe(true);
    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      mockWindow, 
      expect.objectContaining({
        type: 'info',
        title: 'Update Available',
        message: 'DragonToDo 1.0.1 is available',
      })
    );
  });

  it('should show install dialog', async () => {
    const mockInfo = { version: '1.0.1' } as any;

    const { dialog } = require('electron');
    dialog.showMessageBox.mockResolvedValue({ response: 0 });

    const result = await updateService.showInstallDialog(mockInfo);

    expect(result).toBe(true);
    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      mockWindow, 
      expect.objectContaining({
        type: 'info',
        title: 'Update Downloaded',
        message: 'DragonToDo 1.0.1 is ready to install',
      })
    );
  });

  it('should return false for dialogs when window is destroyed', async () => {
    mockWindow.isDestroyed.mockReturnValue(true);

    const mockInfo = { version: '1.0.1' } as any;

    const downloadResult = await updateService.showDownloadDialog(mockInfo);
    const installResult = await updateService.showInstallDialog(mockInfo);

    expect(downloadResult).toBe(false);
    expect(installResult).toBe(false);
  });
});
