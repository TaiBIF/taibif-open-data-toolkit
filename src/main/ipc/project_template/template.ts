import { ipcMain } from 'electron';
import { pdb } from '../../db';
import type { Table } from '../../../renderer/contexts/project';
import { getVocabItems } from '../../vocab';

type SaveTableSchemaPayload = {
  projectId: number;
  tableName: string;
  schemaJson: string;
};

type SaveCustomTemplatePayload = {
  name: string;
  configJson: string;
};

type GlobalCustomFieldDefRow = {
  field_name: string;
  field_name_zh: string;
  field_type: string;
};

type ProjectCustomFieldLinkRow = {
  template_name: string | null;
  field_name: string;
  field_name_zh: string;
  field_type: string;
};

const ensureCustomFieldTables = async () => {
  if (!pdb) return;

  await pdb.exec(`
    CREATE TABLE IF NOT EXISTS global_custom_field_defs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_name TEXT NOT NULL,
      field_name_zh TEXT NOT NULL DEFAULT '',
      field_type TEXT NOT NULL DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(field_name)
    )
  `);

  await pdb.exec(`
    CREATE TABLE IF NOT EXISTS project_custom_field_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      template_name TEXT NOT NULL,
      field_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, template_name, field_name)
    )
  `);

  const globalColumns = await pdb.all<{ name: string }>(
    `PRAGMA table_info(global_custom_field_defs)`,
  );
  const hasZh = (globalColumns ?? []).some((c) => c?.name === 'field_name_zh');
  if (!hasZh) {
    await pdb.exec(
      `ALTER TABLE global_custom_field_defs ADD COLUMN field_name_zh TEXT NOT NULL DEFAULT ''`,
    );
  }

  const legacyProjectTable = await pdb.get<{ name: string }>(
    `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'project_custom_fields'
    LIMIT 1
    `,
  );
  if (legacyProjectTable?.name) {
    await pdb.run(
      `
      INSERT INTO global_custom_field_defs (
        field_name, field_name_zh, field_type, created_at, updated_at
      )
      SELECT
        field_name,
        COALESCE(NULLIF(field_name_zh, ''), field_name) AS field_name_zh,
        field_type,
        MIN(created_at) AS created_at,
        MAX(updated_at) AS updated_at
      FROM project_custom_fields
      GROUP BY field_name
      ON CONFLICT(field_name)
      DO UPDATE SET
        field_name_zh = excluded.field_name_zh,
        field_type = excluded.field_type,
        updated_at = excluded.updated_at
      `,
    );

    await pdb.run(
      `
      INSERT INTO project_custom_field_links (
        project_id, template_name, field_name, created_at, updated_at
      )
      SELECT
        project_id,
        template_name,
        field_name,
        MIN(created_at) AS created_at,
        MAX(updated_at) AS updated_at
      FROM project_custom_fields
      GROUP BY project_id, template_name, field_name
      ON CONFLICT(project_id, template_name, field_name)
      DO UPDATE SET
        updated_at = excluded.updated_at
      `,
    );

    await pdb.exec(`DROP TABLE IF EXISTS project_custom_fields`);
  }

  const legacyGlobalTable = await pdb.get<{ name: string }>(
    `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'global_custom_fields'
    LIMIT 1
    `,
  );
  if (legacyGlobalTable?.name) {
    await pdb.run(
      `
      INSERT INTO global_custom_field_defs (
        field_name, field_name_zh, field_type, created_at, updated_at
      )
      SELECT
        field_name,
        COALESCE(NULLIF(field_name_zh, ''), field_name) AS field_name_zh,
        field_type,
        MIN(created_at) AS created_at,
        MAX(updated_at) AS updated_at
      FROM global_custom_fields
      GROUP BY field_name
      ON CONFLICT(field_name)
      DO UPDATE SET
        field_name_zh = excluded.field_name_zh,
        field_type = excluded.field_type,
        updated_at = excluded.updated_at
      `,
    );

    await pdb.exec(`DROP TABLE IF EXISTS global_custom_fields`);
  }
};

const normalizeFieldType = (value: unknown): string => {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  if (v === 'number' || v === 'date' || v === 'boolean') return v;
  return 'text';
};

const normalizeTemplateNames = (value: unknown): string[] =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((v) => String(v ?? '').trim())
        .filter((v) => v.length > 0),
    ),
  );

const FIELD_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const ensureCustomTemplateTables = async () => {
  if (!pdb) return;

  await pdb.exec(`
    CREATE TABLE IF NOT EXISTS global_custom_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      config_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const registerTemplateHandlers = () => {
  // 取得特定 template 的列表
  ipcMain.handle(
    'get-template',
    async (_event, templateValue: string, projectId?: number) => {
      if (!pdb) return [];
      await ensureCustomFieldTables();

      const sql = `SELECT * FROM ${templateValue} ORDER BY id ASC`;

      try {
        const rows = await pdb.all<any>(sql);
        if (!projectId) return rows;

        const customRows = await pdb.all<ProjectCustomFieldLinkRow>(
          `
          SELECT
            l.template_name,
            d.field_name,
            d.field_name_zh,
            d.field_type
          FROM project_custom_field_links l
          JOIN global_custom_field_defs d
            ON d.field_name = l.field_name
          WHERE l.project_id = ? AND l.template_name = ?
          ORDER BY d.field_name ASC
          `,
          [projectId, templateValue],
        );

        const existing = new Set(
          (rows ?? []).map((r: any) => String(r?.column_name ?? '').trim()),
        );

        const customAsTemplateRows = (customRows ?? [])
          .filter((r) => !existing.has(String(r.field_name).trim()))
          .map((r) => ({
            id: null,
            column_name: r.field_name,
            column_type: r.field_type || 'text',
            definition_zh: `自訂欄位（${r.field_name_zh || '未填中文名稱'}）`,
            definition_en: 'Custom field',
            common_name: r.field_name_zh || null,
            example: null,
            example_en: null,
            is_required: 0,
            is_recommended: 1,
            is_custom: 1,
            last_updated: '',
          }));

        return [...rows, ...customAsTemplateRows];
      } catch (err) {
        console.error('查詢失敗:', err);
        return [];
      }
    },
  );

  ipcMain.handle(
    'list-project-custom-fields',
    async (_event, projectId: number) => {
      if (!pdb || !projectId) return [];
      await ensureCustomFieldTables();

      const rows = await pdb.all<ProjectCustomFieldLinkRow>(
        `
        SELECT
          l.template_name,
          d.field_name,
          d.field_name_zh,
          d.field_type
        FROM global_custom_field_defs d
        LEFT JOIN project_custom_field_links l
          ON l.field_name = d.field_name
         AND l.project_id = ?
        ORDER BY d.field_name ASC, l.template_name ASC
        `,
        [projectId],
      );

      const grouped = new Map<
        string,
        {
          fieldName: string;
          fieldNameZh: string;
          fieldType: string;
          templates: string[];
        }
      >();

      (rows ?? []).forEach((r) => {
        const fieldName = String(r.field_name ?? '').trim();
        if (!fieldName) return;
        const hit = grouped.get(fieldName) ?? {
          fieldName,
          fieldNameZh: String(r.field_name_zh ?? '').trim(),
          fieldType: normalizeFieldType(r.field_type),
          templates: [],
        };
        if (r.template_name && !hit.templates.includes(r.template_name)) {
          hit.templates.push(r.template_name);
        }
        grouped.set(fieldName, hit);
      });

      return Array.from(grouped.values());
    },
  );

  ipcMain.handle(
    'save-project-custom-field',
    async (
      _event,
      payload: {
        projectId: number;
        fieldName: string;
        fieldNameZh: string;
        fieldType?: string;
        templateNames: string[];
      },
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      await ensureCustomFieldTables();

      const projectId = Number(payload?.projectId);
      const fieldName = String(payload?.fieldName ?? '').trim();
      const fieldNameZh = String(payload?.fieldNameZh ?? '').trim();
      const fieldType = normalizeFieldType(payload?.fieldType);
      const templateNames = normalizeTemplateNames(payload?.templateNames);

      if (!projectId || !fieldName || !fieldNameZh || templateNames.length === 0) {
        return { ok: false, error: 'Invalid params' };
      }
      if (!FIELD_KEY_PATTERN.test(fieldName)) {
        return {
          ok: false,
          error: 'fieldName must match [A-Za-z_][A-Za-z0-9_]*',
        };
      }

      try {
        await pdb.exec('BEGIN');
        await pdb.run(
          `
          INSERT INTO global_custom_field_defs (
            field_name, field_name_zh, field_type, created_at, updated_at
          ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(field_name)
          DO UPDATE SET
            field_name_zh = excluded.field_name_zh,
            field_type = excluded.field_type,
            updated_at = CURRENT_TIMESTAMP
          `,
          [fieldName, fieldNameZh, fieldType],
        );

        for (const templateName of templateNames) {
          await pdb.run(
            `
            INSERT INTO project_custom_field_links (
              project_id, template_name, field_name, created_at, updated_at
            ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(project_id, template_name, field_name)
            DO UPDATE SET
              updated_at = CURRENT_TIMESTAMP
            `,
            [projectId, templateName, fieldName],
          );
        }
        await pdb.exec('COMMIT');
        return { ok: true, count: templateNames.length };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('save-project-custom-field 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle(
    'attach-existing-custom-field',
    async (
      _event,
      payload: {
        projectId: number;
        fieldName: string;
        templateNames: string[];
      },
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      await ensureCustomFieldTables();

      const projectId = Number(payload?.projectId);
      const fieldName = String(payload?.fieldName ?? '').trim();
      const templateNames = normalizeTemplateNames(payload?.templateNames);
      if (!projectId || !fieldName || templateNames.length === 0) {
        return { ok: false, error: 'Invalid params' };
      }
      if (!FIELD_KEY_PATTERN.test(fieldName)) {
        return {
          ok: false,
          error: 'fieldName must match [A-Za-z_][A-Za-z0-9_]*',
        };
      }

      const source = await pdb.get<{ field_type: string; field_name_zh: string }>(
        `
        SELECT field_type, field_name_zh
        FROM global_custom_field_defs
        WHERE field_name = ?
        ORDER BY datetime(updated_at) DESC, id DESC
        LIMIT 1
        `,
        [fieldName],
      );
      if (!source?.field_type) {
        return { ok: false, error: 'Custom field not found' };
      }

      const fieldType = normalizeFieldType(source.field_type);
      const fieldNameZh = String(source.field_name_zh ?? '').trim();
      try {
        await pdb.exec('BEGIN');
        await pdb.run(
          `
          INSERT INTO global_custom_field_defs (
            field_name, field_name_zh, field_type, created_at, updated_at
          ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(field_name)
          DO UPDATE SET
            field_name_zh = excluded.field_name_zh,
            field_type = excluded.field_type,
            updated_at = CURRENT_TIMESTAMP
          `,
          [fieldName, fieldNameZh, fieldType],
        );

        for (const templateName of templateNames) {
          await pdb.run(
            `
            INSERT INTO project_custom_field_links (
              project_id, template_name, field_name, created_at, updated_at
            ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(project_id, template_name, field_name)
            DO UPDATE SET
              updated_at = CURRENT_TIMESTAMP
            `,
            [projectId, templateName, fieldName],
          );
        }
        await pdb.exec('COMMIT');
        return { ok: true, count: templateNames.length };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('attach-existing-custom-field 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('list-custom-templates', async () => {
    if (!pdb) return [];
    await ensureCustomTemplateTables();

    try {
      const rows = await pdb.all<{
        name: string;
        updated_at: string;
      }>(
        `
        SELECT name, updated_at
        FROM global_custom_templates
        ORDER BY datetime(updated_at) DESC, name ASC
        `,
      );
      return rows ?? [];
    } catch (err) {
      console.error('list-custom-templates 失敗:', err);
      return [];
    }
  });

  ipcMain.handle('get-custom-template', async (_event, name: string) => {
    if (!pdb || !name) return null;
    await ensureCustomTemplateTables();

    try {
      const row = await pdb.get<{
        name: string;
        config_json: string;
        updated_at: string;
      }>(
        `
        SELECT name, config_json, updated_at
        FROM global_custom_templates
        WHERE name = ?
        LIMIT 1
        `,
        [String(name).trim()],
      );
      return row ?? null;
    } catch (err) {
      console.error('get-custom-template 失敗:', err);
      return null;
    }
  });

  ipcMain.handle(
    'save-custom-template',
    async (_event, payload: SaveCustomTemplatePayload) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      await ensureCustomTemplateTables();

      const name = String(payload?.name ?? '').trim();
      const configJson = String(payload?.configJson ?? '').trim();
      if (!name || !configJson) {
        return { ok: false, error: 'Invalid params' };
      }

      try {
        await pdb.run(
          `
          INSERT INTO global_custom_templates (
            name, config_json, created_at, updated_at
          ) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(name)
          DO UPDATE SET
            config_json = excluded.config_json,
            updated_at = CURRENT_TIMESTAMP
          `,
          [name, configJson],
        );

        return { ok: true };
      } catch (err) {
        console.error('save-custom-template 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 儲存/更新專案的資料表的 schema
  ipcMain.handle(
    'save-table-schema',
    async (_event, payload: SaveTableSchemaPayload) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };

      const { projectId, tableName, schemaJson } =
        payload || ({} as SaveTableSchemaPayload);

      if (!projectId || !tableName || !schemaJson) {
        return { ok: false, error: 'Missing projectId/tableName/schemaJson' };
      }

      try {
        // 先查是否存在
        const existing = await pdb.get(
          `SELECT id, version FROM table_schema WHERE project_id = ? AND table_name = ?`,
          [projectId, tableName],
        );

        if (existing?.id) {
          // 存在 -> update + version+1
          const nextVersion = (existing.version ?? 1) + 1;

          await pdb.run(
            `UPDATE table_schema
           SET schema_json = ?, version = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
            [schemaJson, nextVersion, existing.id],
          );

          return {
            ok: true,
            action: 'updated',
            id: existing.id,
            version: nextVersion,
          };
        } else {
          // 不存在 -> insert
          const result = await pdb.run(
            `INSERT INTO table_schema (project_id, table_name, schema_json, version, created_at, updated_at)
           VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [projectId, tableName, schemaJson],
          );

          // 不同 sqlite wrapper 回傳欄位可能不同，這裡做保守處理
          const insertedId =
            (result as any)?.lastID ?? (result as any)?.lastInsertRowid ?? null;

          return { ok: true, action: 'inserted', id: insertedId, version: 1 };
        }
      } catch (err) {
        console.error('save-table-schema 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 取得資料表的 schema
  ipcMain.handle(
    'get-table-schema',
    async (_event, projectId: number, tableName: string) => {
      if (!pdb) return null;

      try {
        const row = await pdb.get(
          `SELECT schema_json FROM table_schema WHERE project_id = ? AND table_name = ?`,
          [projectId, tableName],
        );
        return row ?? null;
      } catch (err) {
        console.error('取得 table schema 失敗:', err);
        return null;
      }
    },
  );

  // 取得專案的模板資訊
  ipcMain.handle('get-project-tables', async (_event, projectId: number) => {
    if (!pdb) return [];
    if (!projectId) return [];

    try {
      const rows = await pdb.all(
        `SELECT table_name, kind, display_name
         FROM project_tables
         WHERE project_id = ?
         ORDER BY id ASC`,
        [projectId],
      );

      return (rows ?? []).map((r: any) => ({
        name: r.table_name,
        kind: r.kind,
        displayName: r.display_name,
      }));
    } catch (err) {
      console.error('get-project-tables 查詢失敗:', err);
      return [];
    }
  });

  // 儲存專案的模板資訊
  ipcMain.handle(
    'save-project-tables',
    async (_event, projectId: number, tables: Table[]) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !Array.isArray(tables)) {
        return { ok: false, error: 'Invalid params' };
      }

      // 基本驗證：避免寫入壞資料
      const cleaned = tables
        .filter((t) => t && t.name && t.kind && t.displayName)
        .map((t) => ({
          name: String(t.name),
          kind: t.kind === 'core' ? 'core' : 'extension',
          displayName: String(t.displayName),
        }));

      try {
        await pdb.exec('BEGIN');

        // 以本次選擇為準：先清掉舊的
        await pdb.run(`DELETE FROM project_tables WHERE project_id = ?`, [
          projectId,
        ]);

        // 逐筆插入（UNIQUE(project_id, table_name) 保護）
        for (const t of cleaned) {
          await pdb.run(
            `
            INSERT INTO project_tables (project_id, table_name, kind, display_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(project_id, table_name)
            DO UPDATE SET
              kind = excluded.kind,
              display_name = excluded.display_name,
              updated_at = CURRENT_TIMESTAMP
            `,
            [projectId, t.name, t.kind, t.displayName],
          );
        }

        await pdb.exec('COMMIT');
        return { ok: true, count: cleaned.length };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('save-project-tables 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 取得控制詞彙的映射表
  ipcMain.handle('get-controlled-vocab', async (_e, vocabKey: string) => {
    return { ok: true, items: getVocabItems(vocabKey) };
  });
};
