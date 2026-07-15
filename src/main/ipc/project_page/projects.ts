import { ipcMain } from 'electron';
import { pdb } from '../../db';

function getFormattedDateTime(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0'); // 月份從 0 開始
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

export const registerProjectHandlers = () => {
  // 取得所有 projects 的列表
  ipcMain.handle('get-projects', async () => {
    return pdb
      ? await pdb.all(
          'SELECT * FROM projects ORDER BY datetime(updated_at) DESC',
        )
      : [];
  });

  // 取得特定 project 的 name
  ipcMain.handle('get-project-name', async (_event, id: number) => {
    if (!pdb) return null;

    const result = await pdb.get('SELECT name FROM projects WHERE id = ?', id);

    return result?.name || null;
  });

  // 取得最後一筆新增的 project id
  ipcMain.handle('get-latest-project-id', async () => {
    if (!pdb) return null;

    try {
      const result = await pdb.get(
        'SELECT id FROM projects ORDER BY id DESC LIMIT 1',
      );
      return result?.id || null;
    } catch (err) {
      console.error('取得最後一筆 project id 失敗:', err);
      return null;
    }
  });

  // 開啟既有 project 時刷新 updated_at
  ipcMain.handle('touch-project-updated-at', async (_event, id: number) => {
    if (!pdb || !id) return { ok: false, touched: 0 };

    try {
      const now = getFormattedDateTime();
      const res = await pdb.run(
        `UPDATE projects
         SET updated_at = ?
         WHERE id = ?`,
        [now, id],
      );
      return { ok: true, touched: Number(res?.changes ?? 0) };
    } catch (err) {
      console.error('touch-project-updated-at 失敗:', err);
      return { ok: false, touched: 0, error: String(err) };
    }
  });

  // 建立新的 project
  ipcMain.handle('create-project', async (_event, data) => {
    const { name } = data;
    const now = getFormattedDateTime();
    return pdb
      ? await pdb.run(
          `INSERT INTO projects (name,  updated_at)
          VALUES (?, ?)`,
          [name, now],
        )
      : null;
  });

  //  刪除既有 project（同時清掉 project_tables / table_schema / table_data）
  ipcMain.handle('delete-project', async (_event, id: number) => {
    if (!pdb) return null;

    try {
      await pdb.exec('BEGIN');

      // 先刪子表
      await pdb.run('DELETE FROM project_tables WHERE project_id = ?', [id]);
      await pdb.run('DELETE FROM table_schema   WHERE project_id = ?', [id]);
      await pdb.run('DELETE FROM table_data     WHERE project_id = ?', [id]);

      // 再刪主表
      const res = await pdb.run('DELETE FROM projects WHERE id = ?', [id]);

      await pdb.exec('COMMIT');
      return res;
    } catch (err) {
      try {
        await pdb.exec('ROLLBACK');
      } catch {}
      console.error('delete-project 失敗:', err);
      return null;
    }
  });
};
