import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import { SystemUpdateAlt, Download, Refresh } from '@mui/icons-material';

interface UpdateInfo {
  version: string;
  releaseNotes?: string | null;
  releaseName?: string;
  releaseDate?: string;
}

interface UpdateNotificationProps {
  // No props needed - this component manages its own state via Electron API
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);

  useEffect(() => {
    // Set up event listeners for update events
    if (window.electronAPI && window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
        setUpdateAvailable(info);
        setShowUpdateDialog(true);
      });

      if (window.electronAPI.onUpdateDownloaded) {
        window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
          setUpdateDownloaded(info);
          setDownloading(false);
          setShowDownloadDialog(true);
        });
      }

      if (window.electronAPI.onUpdateDownloadProgress) {
        window.electronAPI.onUpdateDownloadProgress((progress: { percent: number }) => {
          setDownloadProgress(progress.percent);
        });
      }

      if (window.electronAPI.onUpdateError) {
        window.electronAPI.onUpdateError((errorMessage: string) => {
          setError(errorMessage);
          setDownloading(false);
          setShowErrorSnackbar(true);
        });
      }
    }

    return () => {
      // Clean up listeners if needed
    };
  }, []);

  const handleDownloadUpdate = async () => {
    if (!window.electronAPI || !window.electronAPI.downloadUpdate) return;
    
    try {
      setDownloading(true);
      setDownloadProgress(0);
      await window.electronAPI.downloadUpdate();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download update');
      setDownloading(false);
      setShowErrorSnackbar(true);
    }
  };

  const handleInstallUpdate = async () => {
    if (!window.electronAPI || !window.electronAPI.installUpdate) return;
    
    try {
      await window.electronAPI.installUpdate();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to install update');
      setShowErrorSnackbar(true);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI || !window.electronAPI.checkForUpdates) return;
    
    try {
      await window.electronAPI.checkForUpdates();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check for updates');
      setShowErrorSnackbar(true);
    }
  };

  return (
    <>
      {/* Update Available Dialog */}
      <Dialog 
        open={showUpdateDialog && updateAvailable !== null}
        onClose={() => setShowUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SystemUpdateAlt color="primary" />
          Update Available
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            DragonToDo {updateAvailable?.version} is available
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            A new version of DragonToDo is ready to download.
          </Typography>
          {updateAvailable?.releaseNotes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Release Notes:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {updateAvailable.releaseNotes}
              </Typography>
            </Box>
          )}
          {downloading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Downloading update... {Math.round(downloadProgress)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={downloadProgress} 
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>
            Remind Me Later
          </Button>
          <Button 
            onClick={() => {
              setShowUpdateDialog(false);
              handleDownloadUpdate();
            }}
            variant="contained"
            startIcon={<Download />}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download & Install'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Downloaded Dialog */}
      <Dialog 
        open={showDownloadDialog && updateDownloaded !== null}
        onClose={() => setShowDownloadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Refresh color="primary" />
          Update Downloaded
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            DragonToDo {updateDownloaded?.version} is ready to install
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The update has been downloaded successfully. Would you like to install it now? 
            The application will restart to complete the installation.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDownloadDialog(false)}>
            Install Later
          </Button>
          <Button 
            onClick={() => {
              setShowDownloadDialog(false);
              handleInstallUpdate();
            }}
            variant="contained"
            startIcon={<Refresh />}
          >
            Install Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setShowErrorSnackbar(false)}
          variant="filled"
        >
          Update Error: {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateNotification;