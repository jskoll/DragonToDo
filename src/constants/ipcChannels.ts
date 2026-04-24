// IPC channel names shared between main and preload processes
export const IPC_CHANNELS = {
  // File operations
  LOAD_TODO_FILE: 'load-todo-file',
  SAVE_TODO_FILE: 'save-todo-file',
  OPEN_FILE_DIALOG: 'open-file-dialog',
  SHOW_SAVE_DIALOG: 'show-save-dialog',

  // Notifications
  SHOW_NOTIFICATION: 'show-notification',

  // Menu events (main -> renderer)
  FILE_LOADED: 'file-loaded',
  SAVE_REQUEST: 'save-request',
  SAVE_AS_REQUEST: 'save-as-request',
  SHOW_ADD_TASK_DIALOG: 'show-add-task-dialog',

  // Update events
  CHECK_FOR_UPDATES: 'check-for-updates',
  DOWNLOAD_UPDATE: 'download-update',
  INSTALL_UPDATE: 'install-update',
  GET_UPDATE_INFO: 'get-update-info',
  IS_UPDATE_AVAILABLE: 'is-update-available',
  UPDATE_AVAILABLE: 'update-available',
  UPDATE_DOWNLOADED: 'update-downloaded',
  UPDATE_DOWNLOAD_PROGRESS: 'update-download-progress',
  UPDATE_ERROR: 'update-error',
} as const;
