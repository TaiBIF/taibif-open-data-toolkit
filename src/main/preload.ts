// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    // 額外：invoke 支援
    invoke(channel: string, ...args: any[]) {
      return ipcRenderer.invoke(channel, ...args);
    },

    // 可註冊 handler
    on(channel: string, listener: (...args: any[]) => void) {
      ipcRenderer.on(channel, (_event, ...args) => listener(...args));
    },

    // once 只觸發一次
    once(channel: string, listener: (...args: any[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => listener(...args));
    },

    // sendMessage：僅限 type-safe channel（如 'ipc-example'）
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
