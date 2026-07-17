import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import sqlite3 from 'sqlite3';

let db: sqlite3.Database;
export let pdb: ReturnType<typeof promisifyDb>;

// function promisifyDb(database: sqlite3.Database) {
//   return {
//     run: promisify(database.run.bind(database)),
//     exec: promisify(database.exec.bind(database)),
//     all: promisify(database.all.bind(database)),
//     get: promisify(database.get.bind(database)),
//   };
// }

function promisifyDb(database: sqlite3.Database) {
  return {
    run(sql: string, params?: any[]) {
      return new Promise<sqlite3.RunResult>((resolve, reject) => {
        database.run(sql, params ?? [], function (err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    },

    exec(sql: string) {
      return new Promise<void>((resolve, reject) => {
        database.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },

    all<T = any>(sql: string, params?: any[]) {
      return new Promise<T[]>((resolve, reject) => {
        database.all(sql, params ?? [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },

    get<T = any>(sql: string, params?: any[]) {
      return new Promise<T | undefined>((resolve, reject) => {
        database.get(sql, params ?? [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
  };
}

const checkDatabaseIntegrity = (dbPath: string) => {
  return new Promise<boolean>((resolve) => {
    const database = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READONLY,
      (openErr) => {
        if (openErr) {
          resolve(false);
          return;
        }

        database.all<{ integrity_check: string }>(
          'PRAGMA integrity_check;',
          [],
          (checkErr, rows) => {
            database.close();

            if (checkErr || !Array.isArray(rows) || rows.length === 0) {
              resolve(false);
              return;
            }

            resolve(
              rows.length === 1 &&
                String(rows[0]?.integrity_check ?? '').toLowerCase() === 'ok',
            );
          },
        );
      },
    );
  });
};

export const initDatabase = async () => {
  const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'odt.sqlite3') // 正式
    : path.resolve(__dirname, '../../assets/odt.sqlite3'); // 開發

  if (app.isPackaged) {
    const userDataPath = app.getPath('userData');
    const dbVersionTagPath = path.join(userDataPath, 'odt-db-version.txt');
    const packagedVersion = app.getVersion();
    const existingVersionTag = fs.existsSync(dbVersionTagPath)
      ? fs.readFileSync(dbVersionTagPath, 'utf-8').trim()
      : '';
    const dbExists = fs.existsSync(dbPath);
    const userDbIsHealthy = dbExists
      ? await checkDatabaseIntegrity(dbPath)
      : false;
    const shouldRefreshDb =
      !dbExists || !userDbIsHealthy || existingVersionTag !== packagedVersion;

    // 每次 app 版本更新或本機 DB 損壞時，用新打包資源中的 DB 覆蓋本機 DB
    if (shouldRefreshDb) {
      if (dbExists) {
        const backupPath = path.join(
          userDataPath,
          userDbIsHealthy
            ? `odt.sqlite3.backup-${Date.now()}`
            : `odt.sqlite3.corrupt-${Date.now()}`,
        );
        fs.copyFileSync(dbPath, backupPath);
      }

      const initialDbPath = path.join(
        process.resourcesPath,
        'assets',
        'odt.sqlite3',
      );
      fs.copyFileSync(initialDbPath, dbPath);
      fs.writeFileSync(dbVersionTagPath, packagedVersion, 'utf-8');
    }
  }

  db = new sqlite3.Database(dbPath);

  pdb = promisifyDb(db);
};
