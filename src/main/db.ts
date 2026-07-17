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

const SYSTEM_TABLES = [
  'intro',
  'template_core_checklist',
  'template_core_occurrence',
  'template_core_samplingevent',
  'template_extension_dna_derived_data',
  'template_extension_extended_measurement_or_facts',
  'template_extension_occurrence',
  'template_extension_resource_relationship',
  'template_extension_simple_multimedia',
];

const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`;

const closeDatabase = (database: sqlite3.Database) => {
  return new Promise<void>((resolve, reject) => {
    database.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

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

const syncSystemTablesFromBundledDb = async (
  dbPath: string,
  bundledDbPath: string,
) => {
  const maintenanceDb = new sqlite3.Database(dbPath);
  const maintenance = promisifyDb(maintenanceDb);
  const placeholders = SYSTEM_TABLES.map(() => '?').join(', ');

  try {
    await maintenance.run('ATTACH DATABASE ? AS bundled', [bundledDbPath]);

    const schemaRows = await maintenance.all<{ name: string; sql: string }>(
      `SELECT name, sql
       FROM bundled.sqlite_master
       WHERE type = 'table'
         AND name IN (${placeholders})`,
      SYSTEM_TABLES,
    );
    const createSqlByTable = new Map(
      schemaRows.map((row) => [row.name, row.sql]),
    );

    await maintenance.exec('PRAGMA foreign_keys = OFF');
    await maintenance.exec('BEGIN');

    await SYSTEM_TABLES.reduce<Promise<void>>(async (previous, tableName) => {
      await previous;

      const createSql = createSqlByTable.get(tableName);
      if (!createSql) {
        throw new Error(`Missing bundled system table: ${tableName}`);
      }

      const quotedTable = quoteIdentifier(tableName);
      await maintenance.exec(`DROP TABLE IF EXISTS ${quotedTable}`);
      await maintenance.exec(createSql);
      await maintenance.exec(
        `INSERT INTO ${quotedTable} SELECT * FROM bundled.${quotedTable}`,
      );
    }, Promise.resolve());

    await maintenance.exec('COMMIT');
    await maintenance.run('DETACH DATABASE bundled');
  } catch (err) {
    try {
      await maintenance.exec('ROLLBACK');
    } catch (rollbackErr) {
      console.error(
        'Rollback failed while syncing system tables:',
        rollbackErr,
      );
    }
    try {
      await maintenance.run('DETACH DATABASE bundled');
    } catch (detachErr) {
      console.error('Detach failed while syncing system tables:', detachErr);
    }
    throw err;
  } finally {
    await closeDatabase(maintenanceDb);
  }
};

export const initDatabase = async () => {
  const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'odt.sqlite3') // 正式
    : path.resolve(__dirname, '../../assets/odt.sqlite3'); // 開發

  if (app.isPackaged) {
    const userDataPath = app.getPath('userData');
    const dbVersionTagPath = path.join(userDataPath, 'odt-db-version.txt');
    const packagedVersion = app.getVersion();
    const initialDbPath = path.join(
      process.resourcesPath,
      'assets',
      'odt.sqlite3',
    );
    const existingVersionTag = fs.existsSync(dbVersionTagPath)
      ? fs.readFileSync(dbVersionTagPath, 'utf-8').trim()
      : '';
    const dbExists = fs.existsSync(dbPath);
    const userDbIsHealthy = dbExists
      ? await checkDatabaseIntegrity(dbPath)
      : false;
    const shouldRebuildDb = !dbExists || !userDbIsHealthy;
    const shouldSyncSystemTables =
      dbExists && userDbIsHealthy && existingVersionTag !== packagedVersion;

    // 本機 DB 不存在或損壞時，才用新打包資源中的 DB 重建整份 DB。
    if (shouldRebuildDb) {
      if (dbExists) {
        const backupPath = path.join(
          userDataPath,
          `odt.sqlite3.corrupt-${Date.now()}`,
        );
        fs.copyFileSync(dbPath, backupPath);
      }

      fs.copyFileSync(initialDbPath, dbPath);
      fs.writeFileSync(dbVersionTagPath, packagedVersion, 'utf-8');
    } else if (shouldSyncSystemTables) {
      await syncSystemTablesFromBundledDb(dbPath, initialDbPath);
      fs.writeFileSync(dbVersionTagPath, packagedVersion, 'utf-8');
    }
  }

  db = new sqlite3.Database(dbPath);

  pdb = promisifyDb(db);
};
