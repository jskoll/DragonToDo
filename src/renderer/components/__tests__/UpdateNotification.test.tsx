import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { UpdateNotification } from '../UpdateNotification';

// Mock electron API
const mockElectronAPI = {
  onUpdateAvailable: jest.fn(),
  onUpdateDownloaded: jest.fn(),
  onUpdateError: jest.fn(),
  onDownloadProgress: jest.fn(),
  downloadUpdate: jest.fn(),
  installUpdate: jest.fn(),
  checkForUpdates: jest.fn(),
} as any;

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('UpdateNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset any state
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<UpdateNotification />);
    // Component renders without visible content initially
    expect(document.body).toBeInTheDocument();
  });

  it('should set up event listeners on mount', () => {
    render(<UpdateNotification />);

    expect(mockElectronAPI.onUpdateAvailable).toHaveBeenCalledWith(expect.any(Function));
    expect(mockElectronAPI.onUpdateDownloaded).toHaveBeenCalledWith(expect.any(Function));
    expect(mockElectronAPI.onUpdateError).toHaveBeenCalledWith(expect.any(Function));
    expect(mockElectronAPI.onDownloadProgress).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should show update available dialog when update is available', async () => {
    render(<UpdateNotification />);

    const updateInfo = {
      version: '1.2.0',
      releaseNotes: 'New features and bug fixes',
      releaseName: 'Major Update',
      releaseDate: '2024-01-15',
    };

    // Simulate update available event
    const onUpdateAvailableCallback = mockElectronAPI.onUpdateAvailable.mock.calls[0][0];
    onUpdateAvailableCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/update available/i)).toBeInTheDocument();
      expect(screen.getByText('1.2.0')).toBeInTheDocument();
      expect(screen.getByText(/major update/i)).toBeInTheDocument();
    });
  });

  it('should handle download button click', async () => {
    const user = userEvent.setup();
    render(<UpdateNotification />);

    const updateInfo = {
      version: '1.2.0',
      releaseNotes: 'New features',
    };

    // Trigger update available
    const onUpdateAvailableCallback = mockElectronAPI.onUpdateAvailable.mock.calls[0][0];
    onUpdateAvailableCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/update available/i)).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    expect(mockElectronAPI.downloadUpdate).toHaveBeenCalled();
  });

  it('should show download progress', async () => {
    render(<UpdateNotification />);

    const updateInfo = { version: '1.2.0' };

    // Trigger update available and start download
    const onUpdateAvailableCallback = mockElectronAPI.onUpdateAvailable.mock.calls[0][0];
    onUpdateAvailableCallback(updateInfo);

    // Simulate download progress
    const onDownloadProgressCallback = mockElectronAPI.onDownloadProgress.mock.calls[0][0];
    onDownloadProgressCallback({ percent: 50, transferred: 50000, total: 100000 });

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should show update downloaded dialog when download completes', async () => {
    render(<UpdateNotification />);

    const updateInfo = {
      version: '1.2.0',
      releaseNotes: 'New features',
    };

    // Simulate update downloaded event
    const onUpdateDownloadedCallback = mockElectronAPI.onUpdateDownloaded.mock.calls[0][0];
    onUpdateDownloadedCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/update downloaded/i)).toBeInTheDocument();
      expect(screen.getByText(/restart to install/i)).toBeInTheDocument();
    });
  });

  it('should handle install and restart button', async () => {
    const user = userEvent.setup();
    render(<UpdateNotification />);

    const updateInfo = { version: '1.2.0' };

    // Trigger update downloaded
    const onUpdateDownloadedCallback = mockElectronAPI.onUpdateDownloaded.mock.calls[0][0];
    onUpdateDownloadedCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/update downloaded/i)).toBeInTheDocument();
    });

    const installButton = screen.getByRole('button', { name: /install.*restart/i });
    await user.click(installButton);

    expect(mockElectronAPI.installUpdate).toHaveBeenCalled();
  });

  it('should handle later button in download dialog', async () => {
    const user = userEvent.setup();
    render(<UpdateNotification />);

    const updateInfo = { version: '1.2.0' };

    // Trigger update downloaded
    const onUpdateDownloadedCallback = mockElectronAPI.onUpdateDownloaded.mock.calls[0][0];
    onUpdateDownloadedCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/update downloaded/i)).toBeInTheDocument();
    });

    const laterButton = screen.getByRole('button', { name: /later/i });
    await user.click(laterButton);

    await waitFor(() => {
      expect(screen.queryByText(/update downloaded/i)).not.toBeInTheDocument();
    });
  });

  it('should show error snackbar on update error', async () => {
    render(<UpdateNotification />);

    const errorMessage = 'Failed to download update';

    // Simulate update error event
    const onUpdateErrorCallback = mockElectronAPI.onUpdateError.mock.calls[0][0];
    onUpdateErrorCallback(errorMessage);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should close error snackbar', async () => {
    const user = userEvent.setup();
    render(<UpdateNotification />);

    // Trigger error
    const onUpdateErrorCallback = mockElectronAPI.onUpdateError.mock.calls[0][0];
    onUpdateErrorCallback('Test error');

    await waitFor(() => {
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
    });
  });

  it('should handle skip button in update available dialog', async () => {
    const user = userEvent.setup();
    render(<UpdateNotification />);

    const updateInfo = { version: '1.2.0' };

    // Trigger update available
    const onUpdateAvailableCallback = mockElectronAPI.onUpdateAvailable.mock.calls[0][0];
    onUpdateAvailableCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/update available/i)).toBeInTheDocument();
    });

    const skipButton = screen.getByRole('button', { name: /skip/i });
    await user.click(skipButton);

    await waitFor(() => {
      expect(screen.queryByText(/update available/i)).not.toBeInTheDocument();
    });
  });

  it('should handle missing electronAPI gracefully', () => {
    // Temporarily remove electronAPI
    const originalAPI = window.electronAPI;
    delete (window as any).electronAPI;

    expect(() => {
      render(<UpdateNotification />);
    }).not.toThrow();

    // Restore electronAPI
    (window as any).electronAPI = originalAPI;
  });

  it('should handle missing update methods gracefully', () => {
    // Mock incomplete electronAPI
    const incompleteAPI = {
      onUpdateAvailable: jest.fn(),
      // Missing other methods
    };
    
    Object.defineProperty(window, 'electronAPI', {
      value: incompleteAPI,
      writable: true,
    });

    expect(() => {
      render(<UpdateNotification />);
    }).not.toThrow();

    // Restore full API
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
    });
  });

  it('should display release notes when available', async () => {
    render(<UpdateNotification />);

    const updateInfo = {
      version: '1.2.0',
      releaseNotes: '- Added new feature\n- Fixed bug\n- Improved performance',
    };

    // Trigger update available
    const onUpdateAvailableCallback = mockElectronAPI.onUpdateAvailable.mock.calls[0][0];
    onUpdateAvailableCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/added new feature/i)).toBeInTheDocument();
      expect(screen.getByText(/fixed bug/i)).toBeInTheDocument();
      expect(screen.getByText(/improved performance/i)).toBeInTheDocument();
    });
  });

  it('should display release date when available', async () => {
    render(<UpdateNotification />);

    const updateInfo = {
      version: '1.2.0',
      releaseDate: '2024-01-15',
    };

    // Trigger update available
    const onUpdateAvailableCallback = mockElectronAPI.onUpdateAvailable.mock.calls[0][0];
    onUpdateAvailableCallback(updateInfo);

    await waitFor(() => {
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
    });
  });

  it('should handle download progress updates', async () => {
    render(<UpdateNotification />);

    // Start downloading
    const updateInfo = { version: '1.2.0' };
    const onUpdateAvailableCallback = mockElectronAPI.onUpdateAvailable.mock.calls[0][0];
    onUpdateAvailableCallback(updateInfo);

    // Simulate download progress
    const onDownloadProgressCallback = mockElectronAPI.onDownloadProgress.mock.calls[0][0];
    
    // 25% progress
    onDownloadProgressCallback({ percent: 25, transferred: 250000, total: 1000000 });
    
    await waitFor(() => {
      expect(screen.getByText(/25%/)).toBeInTheDocument();
    });

    // 75% progress
    onDownloadProgressCallback({ percent: 75, transferred: 750000, total: 1000000 });
    
    await waitFor(() => {
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });

  it('should check for updates on mount if method available', () => {
    render(<UpdateNotification />);

    // Should attempt to check for updates on mount
    expect(mockElectronAPI.checkForUpdates).toHaveBeenCalled();
  });
});
