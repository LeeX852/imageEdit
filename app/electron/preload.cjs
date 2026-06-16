const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialog
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // Backend info
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),

  // Platform info
  platform: process.platform,
  isElectron: true,
});
