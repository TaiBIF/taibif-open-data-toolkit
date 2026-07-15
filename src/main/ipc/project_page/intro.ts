import { ipcMain } from 'electron';
import { pdb } from '../../db';

export const registerIntroHandlers = () => {
  ipcMain.handle('get-intro', async () => {
    return pdb ? await pdb.all('SELECT * FROM intro') : [];
  });
};
