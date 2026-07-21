import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { pdb } from '../../db';
import { getVocabItems } from '../../vocab';
import { FIELD_VOCAB_KEY } from '../../../shared/controlledVocab';

/**
 * ✅ 改成以 table_data.id 當作穩定主鍵（__pk）
 * - 前端傳進來的 rows 以 { id, dataJson } 為主
 * - 分頁改用 ORDER BY id（row header 只是視覺編號，不再依賴 row_id 連號）
 * - ensure / append 以「補足筆數」或「新增空白筆」的概念運作，不再操作 row_id
 *
 * 注意：
 * 1) 這份改法假設 table_data.id 是 INTEGER PRIMARY KEY（或至少 UNIQUE）
 * 2) row_id 欄位可留著不用；若你的表有 NOT NULL constraint 會擋 insert，請把 row_id 改成可為 NULL 或給預設值（例如 NULL）
 */

type UpsertRowPayload = {
  id: number; // ✅ table_data.id（__pk）
  dataJson: string;
};

type ValidationErrorRow = {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
};

type ValidationFieldStat = {
  field: string;
  accuracy: number;
};

type ValidationFieldDef = {
  key: string;
  required: boolean;
};

type ValidationRuleContext = {
  parsed: Record<string, unknown>;
  rowNumber: number;
  fieldDefs: ValidationFieldDef[];
};

type ValidationRule = (ctx: ValidationRuleContext) => ValidationErrorRow[];
type ParsedValidationRow = {
  rowNumber: number;
  parsed: Record<string, unknown>;
};

const isIso8601Date = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;

  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() + 1 === month &&
    dt.getUTCDate() === day
  );
};

const isMissingValue = (value: unknown): boolean =>
  value == null || (typeof value === 'string' && value.trim().length === 0);

const VALIDATION_VOCAB_FIELD_MAP: Record<string, string> = FIELD_VOCAB_KEY;

const UNIQUE_ID_FIELDS_BY_TABLE: Record<string, string[]> = {
  template_core_checklist: ['taxonID'],
  template_core_occurrence: ['occurrenceID'],
  template_core_samplingevent: ['eventID'],
  template_extension_occurrence: ['occurrenceID'],
};

const DATE_FORMAT_FIELDS = new Set([
  'eventDate',
  'created',
  'dateIdentified',
  'modified',
  'georeferencedDate',
]);

const parseValidationFieldDefs = (parsedSchema: any): ValidationFieldDef[] => {
  const columns = Array.isArray(parsedSchema?.columns)
    ? parsedSchema.columns
    : [];

  return columns
    .map((c: any) => ({
      key: typeof c?.key === 'string' ? c.key : '',
      required: Boolean(c?.required),
    }))
    .filter((c: { key: string }) => c.key.length > 0);
};

const requiredFieldRule: ValidationRule = ({
  parsed,
  rowNumber,
  fieldDefs,
}) => {
  const controlledVocabFields = new Set(
    Object.keys(VALIDATION_VOCAB_FIELD_MAP),
  );
  const requiredFields = fieldDefs
    .filter(
      (f) =>
        f.required &&
        f.key !== 'eventDate' &&
        !controlledVocabFields.has(f.key),
    )
    .map((f) => f.key);

  return requiredFields
    .filter((fieldKey) => isMissingValue(parsed?.[fieldKey]))
    .map((fieldKey) => ({
      row: rowNumber,
      field: fieldKey,
      message: `${fieldKey} 為必填欄位`,
      severity: 'error' as const,
    }));
};

const dateFieldFormatRule: ValidationRule = ({
  parsed,
  rowNumber,
  fieldDefs,
}) => {
  const dateFields = fieldDefs
    .map((f) => f.key)
    .filter((key) => DATE_FORMAT_FIELDS.has(key));

  return dateFields.flatMap((fieldKey) => {
    const rawValue = String(parsed?.[fieldKey]).trim();
    if (isIso8601Date(rawValue)) return [];

    return [
      {
        row: rowNumber,
        field: fieldKey,
        message: `${fieldKey} 格式錯誤（${rawValue}）`,
        severity: 'error' as const,
      },
    ];
  });
};

const optionalFieldEmptyRule: ValidationRule = ({
  parsed,
  rowNumber,
  fieldDefs,
}) => {
  const controlledVocabFields = new Set(
    Object.keys(VALIDATION_VOCAB_FIELD_MAP),
  );
  const optionalFields = fieldDefs
    .filter((f) => !f.required && !controlledVocabFields.has(f.key))
    .map((f) => f.key);

  return optionalFields
    .filter((fieldKey) => isMissingValue(parsed?.[fieldKey]))
    .map((fieldKey) => ({
      row: rowNumber,
      field: fieldKey,
      message: `${fieldKey} 為空值`,
      severity: 'warning' as const,
    }));
};

const decimalCoordinateRule: ValidationRule = ({
  parsed,
  rowNumber,
  fieldDefs,
}) => {
  const rules = [
    { key: 'decimalLongitude', min: -180, max: 180 },
    { key: 'decimalLatitude', min: -90, max: 90 },
  ];

  return rules.flatMap(({ key, min, max }) => {
    const hasField = fieldDefs.some((f) => f.key === key);
    if (!hasField) return [];

    const raw = parsed?.[key];
    if (isMissingValue(raw)) return [];

    const numeric =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw.trim())
          : Number.NaN;

    if (!Number.isFinite(numeric)) {
      return [
        {
          row: rowNumber,
          field: key,
          message: `${key} 不是有效數值（${String(raw)}）`,
          severity: 'error' as const,
        },
      ];
    }

    if (numeric < min || numeric > max) {
      return [
        {
          row: rowNumber,
          field: key,
          message: `${key} 不在有效範圍（${numeric}），需介於 ${min} 到 ${max}`,
          severity: 'error' as const,
        },
      ];
    }

    return [];
  });
};

const controlledVocabRule: ValidationRule = ({
  parsed,
  rowNumber,
  fieldDefs,
}) => {
  return Object.entries(VALIDATION_VOCAB_FIELD_MAP).flatMap(
    ([fieldKey, vocabKey]) => {
      const hasField = fieldDefs.some((f) => f.key === fieldKey);
      if (!hasField) return [];

      const raw = parsed?.[fieldKey];

      const value = String(raw).trim();
      const vocabItems = getVocabItems(vocabKey);
      if (vocabItems.includes(value)) return [];

      return [
        {
          row: rowNumber,
          field: fieldKey,
          message: `${fieldKey} 非控制詞彙（${value}）`,
          severity: 'error' as const,
        },
      ];
    },
  );
};

const validationRules: ValidationRule[] = [
  requiredFieldRule,
  dateFieldFormatRule,
  decimalCoordinateRule,
  controlledVocabRule,
  optionalFieldEmptyRule,
];

const validateDuplicateIdFields = (
  tableName: string,
  fieldDefs: ValidationFieldDef[],
  rows: ParsedValidationRow[],
): ValidationErrorRow[] => {
  const configuredFields = UNIQUE_ID_FIELDS_BY_TABLE[tableName] ?? [];
  if (configuredFields.length === 0) return [];

  const availableFields = new Set(fieldDefs.map((f) => f.key));
  const targetFields = configuredFields.filter((f) => availableFields.has(f));
  if (targetFields.length === 0) return [];

  return targetFields.flatMap((fieldKey) => {
    const valueToRows = new Map<string, number[]>();

    rows.forEach(({ rowNumber, parsed }) => {
      const raw = parsed?.[fieldKey];
      if (isMissingValue(raw)) return;

      const normalized = String(raw).trim();
      const hits = valueToRows.get(normalized) ?? [];
      hits.push(rowNumber);
      valueToRows.set(normalized, hits);
    });

    return Array.from(valueToRows.entries()).flatMap(([value, rowNumbers]) => {
      if (rowNumbers.length <= 1) return [];

      return rowNumbers.map((rowNumber) => ({
        row: rowNumber,
        field: fieldKey,
        message: `${fieldKey} 重複（${value}）`,
        severity: 'error' as const,
      }));
    });
  });
};

const buildFieldStats = (
  fieldDefs: ValidationFieldDef[],
  rows: ParsedValidationRow[],
): ValidationFieldStat[] => {
  const statCounter = new Map<string, { total: number; valid: number }>();
  fieldDefs.forEach((f) => {
    statCounter.set(f.key, { total: 0, valid: 0 });
  });

  rows.forEach(({ parsed }) => {
    fieldDefs.forEach((f) => {
      const stat = statCounter.get(f.key);
      if (!stat) return;

      stat.total += 1;
      if (!isMissingValue(parsed?.[f.key])) stat.valid += 1;
    });
  });

  return Array.from(statCounter.entries()).map(([field, stat]) => ({
    field,
    accuracy: stat.total === 0 ? 100 : (stat.valid / stat.total) * 100,
  }));
};

const validateTableRows = (
  tableName: string,
  fieldDefs: ValidationFieldDef[],
  rows: any[],
): { errors: ValidationErrorRow[]; fieldStats: ValidationFieldStat[] } => {
  const errors: ValidationErrorRow[] = [];
  const parsedRows: ParsedValidationRow[] = [];

  (rows ?? []).forEach((r: any, idx: number) => {
    const rowNumber = idx + 1;
    let parsed: Record<string, unknown> = {};

    try {
      parsed =
        typeof r?.data === 'string' && r.data.length > 0
          ? JSON.parse(r.data)
          : {};
    } catch {
      errors.push({
        row: rowNumber,
        message: '資料格式錯誤：JSON 解析失敗',
        severity: 'error',
      });
      return;
    }

    parsedRows.push({ rowNumber, parsed });

    validationRules.forEach((rule) => {
      const ruleErrors = rule({ parsed, rowNumber, fieldDefs });
      if (ruleErrors.length > 0) errors.push(...ruleErrors);
    });
  });

  const duplicateErrors = validateDuplicateIdFields(
    tableName,
    fieldDefs,
    parsedRows,
  );
  if (duplicateErrors.length > 0) errors.push(...duplicateErrors);

  return {
    errors,
    fieldStats: buildFieldStats(fieldDefs, parsedRows),
  };
};

export const registerEditHandlers = () => {
  // 儲存資料表中的內容（以 id 為主鍵 upsert/update）
  ipcMain.handle(
    'upsert-table-data-rows',
    async (
      _event,
      projectId: number,
      tableName: string,
      rows: UpsertRowPayload[],
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName || !Array.isArray(rows)) {
        return { ok: false, error: 'Invalid params' };
      }

      try {
        await pdb.exec('BEGIN');

        await pdb.run(
          `DELETE FROM table_data
           WHERE project_id = ? AND table_name = ?`,
          [projectId, tableName],
        );

        let updated = 0;

        for (const r of rows) {
          const id = Number(r?.id);
          const dataJson = r?.dataJson;

          if (!Number.isFinite(id) || id <= 0) continue;
          if (typeof dataJson !== 'string') continue;

          // ✅ 用 id 當 conflict target
          // 如果你希望「只能更新同 project/table 的資料」，可以用 WHERE 限制 project_id/table_name
          await pdb.run(
            `
            INSERT INTO table_data (id, project_id, table_name, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(id)
            DO UPDATE SET
              data = excluded.data,
              updated_at = CURRENT_TIMESTAMP
            `,
            [id, projectId, tableName, dataJson],
          );

          updated++;
        }

        await pdb.exec('COMMIT');
        return { ok: true, count: updated };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('upsert-table-data-rows 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 補齊空白的 rows（以「筆數」為概念，不再補 row_id 連號）
  ipcMain.handle(
    'ensure-table-rows',
    async (
      _event,
      projectId: number,
      tableName: string,
      targetRows: number,
      colKeys: string[],
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };

      const n = Math.max(0, Number(targetRows) || 0);
      if (n === 0) return { ok: true };

      const emptyObj: Record<string, any> = {};
      for (const k of colKeys ?? []) emptyObj[k] = null;
      const emptyJson = JSON.stringify(emptyObj);

      try {
        // ✅ 以 COUNT(*) 判斷目前筆數
        const countRow = await pdb.get(
          `SELECT COUNT(*) AS total
           FROM table_data
           WHERE project_id = ? AND table_name = ?`,
          [projectId, tableName],
        );

        const total = Number(countRow?.total ?? 0);
        if (total >= n) return { ok: true };

        const need = n - total;

        await pdb.exec('BEGIN');

        for (let i = 0; i < need; i++) {
          // ✅ 只插入 data；id 由 DB 自動產生
          await pdb.run(
            `
            INSERT INTO table_data (project_id, table_name, data, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            [projectId, tableName, emptyJson],
          );
        }

        await pdb.exec('COMMIT');
        return { ok: true };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('ensure-table-rows failed:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 從資料庫取得當前要渲染 rows（分頁改用 id 排序）
  ipcMain.handle(
    'get-table-data',
    async (
      _event,
      projectId: number,
      tableName: string,
      page: number,
      pageSize: number,
      textFilter?: {
        kind?: 'text' | 'duplicate';
        fieldKey: string;
        mode: 'exact' | 'fuzzy' | 'regex';
        query: string;
      } | null,
    ) => {
      if (!pdb) return { total: 0, rows: [] };

      const safePage = Math.max(1, Number(page) || 1);
      const safePageSize = Math.max(1, Math.min(200, Number(pageSize) || 20));
      const offset = (safePage - 1) * safePageSize;

      try {
        const resolvedTableRow = await pdb.get(
          `SELECT table_name FROM project_tables
           WHERE project_id = ?
             AND (table_name = ? OR display_name = ?)
           LIMIT 1`,
          [projectId, tableName, tableName],
        );
        const resolvedTableName =
          typeof resolvedTableRow?.table_name === 'string' &&
          resolvedTableRow.table_name.length > 0
            ? resolvedTableRow.table_name
            : tableName;

        const tf =
          textFilter && typeof textFilter === 'object'
            ? {
                kind: textFilter.kind === 'duplicate' ? 'duplicate' : 'text',
                fieldKey: textFilter.fieldKey,
                mode: textFilter.mode,
                query: textFilter.query?.toString() ?? '',
              }
            : null;

        const hasFilter =
          tf &&
          typeof tf.fieldKey === 'string' &&
          /^[A-Za-z0-9_]+$/.test(tf.fieldKey) &&
          typeof tf.query === 'string' &&
          (tf.kind === 'duplicate' ||
            (tf.mode === 'regex'
              ? tf.query.length > 0
              : tf.query.trim().length > 0));

        if (hasFilter && tf) {
          const jsonPath = `$.${tf.fieldKey}`;
          const query = tf.mode === 'regex' ? tf.query : tf.query.trim();
          const regexMatchesBlankValue = (re: RegExp) => {
            re.lastIndex = 0;
            const matched = re.test(' ');
            re.lastIndex = 0;
            return matched;
          };
          const valueMatchesRegex = (re: RegExp, raw: unknown) => {
            const value = raw == null ? '' : String(raw);
            re.lastIndex = 0;
            if (re.test(value)) {
              re.lastIndex = 0;
              return true;
            }
            re.lastIndex = 0;
            return value.trim() === '' && regexMatchesBlankValue(re);
          };

          if (tf.kind === 'duplicate') {
            let queryMatcher: ((value: string) => boolean) | null = null;

            if (query.length > 0) {
              if (tf.mode === 'exact') {
                queryMatcher = (value) => value === query;
              } else if (tf.mode === 'fuzzy') {
                const lowerQuery = query.toLowerCase();
                queryMatcher = (value) =>
                  value.toLowerCase().includes(lowerQuery);
              } else {
                try {
                  const re = new RegExp(query);
                  queryMatcher = (value) => valueMatchesRegex(re, value);
                } catch {
                  return { total: 0, rows: [] };
                }
              }
            }

            const allRows = await pdb.all(
              `SELECT id, data
               FROM table_data
               WHERE project_id = ? AND table_name = ?
               ORDER BY id ASC`,
              [projectId, resolvedTableName],
            );

            const valueCounts = new Map<string, number>();
            (allRows ?? []).forEach((r: any) => {
              const parsed = r?.data ? JSON.parse(r.data) : {};
              const raw = parsed?.[tf.fieldKey];
              const value = raw == null ? '' : String(raw).trim();
              valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1);
            });

            const duplicateValues = new Set(
              Array.from(valueCounts.entries())
                .filter(
                  ([value, count]) =>
                    count > 1 && (!queryMatcher || queryMatcher(value)),
                )
                .map(([value]) => value),
            );

            const matched = (allRows ?? []).filter((r: any) => {
              const parsed = r?.data ? JSON.parse(r.data) : {};
              const raw = parsed?.[tf.fieldKey];
              const value = raw == null ? '' : String(raw).trim();
              return duplicateValues.has(value);
            });

            const total = matched.length;
            const pageRows = matched.slice(offset, offset + safePageSize);
            return { total, rows: pageRows };
          }

          if (tf.mode === 'regex') {
            let re: RegExp | null = null;
            try {
              re = new RegExp(tf.query);
            } catch {
              return { total: 0, rows: [] };
            }

            const allRows = await pdb.all(
              `SELECT id, data
               FROM table_data
               WHERE project_id = ? AND table_name = ?
               ORDER BY id ASC`,
              [projectId, resolvedTableName],
            );

            const matched = (allRows ?? []).filter((r: any) => {
              const parsed = r?.data ? JSON.parse(r.data) : {};
              const v = parsed?.[tf.fieldKey];
              return re ? valueMatchesRegex(re, v) : false;
            });

            const total = matched.length;
            const pageRows = matched.slice(offset, offset + safePageSize);
            return { total, rows: pageRows };
          }

          const valueExpr = `TRIM(CAST(json_extract(data, ?) AS TEXT))`;
          const [whereSql, whereArgs] =
            tf.mode === 'fuzzy'
              ? [`LOWER(${valueExpr}) LIKE ?`, [`%${query.toLowerCase()}%`]]
              : [`${valueExpr} = ?`, [query]];

          const totalRow = await pdb.get(
            `SELECT COUNT(*) AS total
             FROM table_data
             WHERE project_id = ? AND table_name = ?
               AND ${whereSql}`,
            [projectId, resolvedTableName, jsonPath, ...whereArgs],
          );
          const total = Number(totalRow?.total ?? 0);

          const rows = await pdb.all(
            `SELECT id, data
             FROM table_data
             WHERE project_id = ? AND table_name = ?
               AND ${whereSql}
             ORDER BY id ASC
             LIMIT ? OFFSET ?`,
            [
              projectId,
              resolvedTableName,
              jsonPath,
              ...whereArgs,
              safePageSize,
              offset,
            ],
          );

          return { total, rows: rows ?? [] };
        }

        const totalRow = await pdb.get(
          `SELECT COUNT(*) AS total
           FROM table_data
           WHERE project_id = ? AND table_name = ?`,
          [projectId, resolvedTableName],
        );
        const total = Number(totalRow?.total ?? 0);

        const rows = await pdb.all(
          `SELECT id, data
           FROM table_data
           WHERE project_id = ? AND table_name = ?
           ORDER BY id ASC
           LIMIT ? OFFSET ?`,
          [projectId, resolvedTableName, safePageSize, offset],
        );

        return { total, rows: rows ?? [] };
      } catch (err) {
        console.error('get-table-data 失敗:', err);
        return { total: 0, rows: [] };
      }
    },
  );

  ipcMain.handle(
    'validate-project-table-data',
    async (_event, projectId: number) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId) return { ok: false, error: 'Invalid params' };

      try {
        const projectRow = await pdb.get(
          `SELECT id FROM projects WHERE id = ?`,
          [projectId],
        );
        if (!projectRow?.id) return { ok: false, error: 'Project not found' };

        const tables = await pdb.all(
          `SELECT table_name, display_name
           FROM project_tables
           WHERE project_id = ?
           ORDER BY id ASC`,
          [projectId],
        );

        const validationTables = await Promise.all(
          (tables ?? []).map(async (tableRow: any) => {
            const tableName = String(tableRow?.table_name ?? '');
            const displayName = String(tableRow?.display_name ?? tableName);

            const schemaRow = await pdb.get(
              `SELECT schema_json
               FROM table_schema
               WHERE project_id = ? AND table_name = ?`,
              [projectId, tableName],
            );

            const parsedSchema = schemaRow?.schema_json
              ? JSON.parse(schemaRow.schema_json)
              : { columns: [] };
            const fieldDefs = parseValidationFieldDefs(parsedSchema);

            const rows = await pdb.all(
              `SELECT id, data
               FROM table_data
               WHERE project_id = ? AND table_name = ?
               ORDER BY id ASC`,
              [projectId, tableName],
            );

            const { errors, fieldStats } = validateTableRows(
              tableName,
              fieldDefs,
              rows ?? [],
            );

            return {
              tableName,
              displayName,
              totalRows: Number(rows?.length ?? 0),
              errorCount: errors.length,
              errors,
              fieldStats,
            };
          }),
        );

        const totalErrors = validationTables.reduce(
          (sum, t) => sum + Number(t?.errorCount ?? 0),
          0,
        );

        return {
          ok: true,
          projectId,
          totalErrors,
          tables: validationTables,
          validatedAt: new Date().toISOString(),
        };
      } catch (err) {
        console.error('validate-project-table-data 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 功能：新增一整頁空白資料（改成 insert N 筆，回傳 pk 區間）
  ipcMain.handle(
    'append-empty-page',
    async (
      _event,
      projectId: number,
      tableName: string,
      pageSize: number,
      emptyJson: string,
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };

      const size = Math.max(1, Math.min(200, Number(pageSize) || 20));
      const safeEmptyJson =
        typeof emptyJson === 'string' ? emptyJson : JSON.stringify({});

      try {
        await pdb.exec('BEGIN');

        let startPk: number | null = null;
        let endPk: number | null = null;

        for (let i = 0; i < size; i++) {
          const res: any = await pdb.run(
            `
            INSERT INTO table_data (project_id, table_name, data, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            [projectId, tableName, safeEmptyJson],
          );

          // sqlite wrapper 通常會回傳 { lastID, changes }
          const pk = Number(res?.lastID);
          if (Number.isFinite(pk) && pk > 0) {
            if (startPk == null) startPk = pk;
            endPk = pk;
          }
        }

        const totalRow = await pdb.get(
          `SELECT COUNT(*) AS total
           FROM table_data
           WHERE project_id = ? AND table_name = ?`,
          [projectId, tableName],
        );

        await pdb.exec('COMMIT');

        return {
          ok: true,
          startPk,
          endPk,
          newTotal: Number(totalRow?.total ?? 0),
        };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('append-empty-page 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 功能：獲取欄位 facet（不依賴 row_id，不用改）
  ipcMain.handle(
    'facet-table-field',
    async (
      _event,
      projectId: number,
      tableName: string,
      fieldKey: string,
      limit: number,
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };

      const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));

      if (!/^[A-Za-z0-9_]+$/.test(fieldKey)) {
        return { ok: false, error: 'Invalid fieldKey' };
      }

      const jsonPath = `$.${fieldKey}`;

      try {
        const rows = await pdb.all(
          `
          SELECT
            CASE
              WHEN json_extract(data, ?) IS NULL THEN ''
              ELSE TRIM(CAST(json_extract(data, ?) AS TEXT))
            END AS value,
            COUNT(1) AS count
          FROM table_data
          WHERE project_id = ? AND table_name = ?
          GROUP BY value
          ORDER BY count DESC, value ASC
          LIMIT ?
          `,
          [jsonPath, jsonPath, projectId, tableName, safeLimit],
        );

        return {
          ok: true,
          items: (rows ?? []).map((r: any) => ({
            value: r.value,
            count: r.count,
          })),
        };
      } catch (err) {
        console.error('facet-table-field failed:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 功能：刪除選擇列（改成用 pk 刪）
  ipcMain.handle(
    'delete-table-rows',
    async (_event, projectId: number, tableName: string, ids: number[]) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };

      const pks = Array.from(new Set((ids ?? []).map(Number)))
        .filter((n) => Number.isFinite(n) && n >= 1)
        .sort((a, b) => a - b);

      if (pks.length === 0) return { ok: true, deleted: 0, newTotal: 0 };

      try {
        await pdb.exec('BEGIN');

        for (const pk of pks) {
          await pdb.run(
            `DELETE FROM table_data
             WHERE project_id = ? AND table_name = ? AND id = ?`,
            [projectId, tableName, pk],
          );
        }

        const totalRow = await pdb.get(
          `SELECT COUNT(*) AS total
           FROM table_data
           WHERE project_id = ? AND table_name = ?`,
          [projectId, tableName],
        );

        await pdb.exec('COMMIT');

        return {
          ok: true,
          deleted: pks.length,
          newTotal: Number(totalRow?.total ?? 0),
        };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('delete-table-rows 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  /**
   * （你前端有呼叫）clear-table-data-rows
   * 你原始貼的檔案沒包含這個 handler，我這裡補一個「用 pk 清空 data」版本。
   * 如果你本來就有，照這個邏輯把 row_id 改成 id 即可。
   */
  ipcMain.handle(
    'clear-table-data-rows',
    async (
      _event,
      projectId: number,
      tableName: string,
      ids: number[],
      emptyJson: string,
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };

      const pks = Array.from(new Set((ids ?? []).map(Number)))
        .filter((n) => Number.isFinite(n) && n >= 1)
        .sort((a, b) => a - b);

      if (pks.length === 0) return { ok: true, cleared: 0 };

      const safeEmptyJson =
        typeof emptyJson === 'string' ? emptyJson : JSON.stringify({});

      try {
        await pdb.exec('BEGIN');

        for (const pk of pks) {
          await pdb.run(
            `
            UPDATE table_data
            SET data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE project_id = ? AND table_name = ? AND id = ?
            `,
            [safeEmptyJson, projectId, tableName, pk],
          );
        }

        await pdb.exec('COMMIT');
        return { ok: true, cleared: pks.length };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        console.error('clear-table-data-rows 失敗:', err);
        return { ok: false, error: String(err) };
      }
    },
  );

  // 依主鍵合併 patch，避免篩選/部分資料寫回時覆蓋整列
  ipcMain.handle(
    'patch-table-data-rows',
    async (
      _event,
      projectId: number,
      tableName: string,
      rows: Array<{ id: number; patch: Record<string, any> }>,
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName || !Array.isArray(rows)) {
        return { ok: false, error: 'Invalid params' };
      }

      const resolvedTableRow = await pdb.get(
        `SELECT table_name FROM project_tables
         WHERE project_id = ?
           AND (table_name = ? OR display_name = ?)
         LIMIT 1`,
        [projectId, tableName, tableName],
      );
      const resolvedTableName =
        typeof resolvedTableRow?.table_name === 'string' &&
        resolvedTableRow.table_name.length > 0
          ? resolvedTableRow.table_name
          : tableName;

      try {
        await pdb.exec('BEGIN');

        let updated = 0;

        for (const r of rows) {
          const id = Number(r?.id);
          const patch = r?.patch;
          if (!Number.isFinite(id) || id <= 0) continue;
          if (!patch || typeof patch !== 'object') continue;

          const row = await pdb.get(
            `SELECT data FROM table_data
             WHERE project_id = ? AND table_name = ? AND id = ?`,
            [projectId, resolvedTableName, id],
          );
          const current = row?.data ? JSON.parse(row.data) : {};
          const next = { ...current, ...patch };

          await pdb.run(
            `
            UPDATE table_data
            SET data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE project_id = ? AND table_name = ? AND id = ?
            `,
            [JSON.stringify(next), projectId, resolvedTableName, id],
          );
          updated++;
        }

        await pdb.exec('COMMIT');
        return { ok: true, count: updated };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('pick-mapping-file', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'CSV / TSV', extensions: ['csv', 'tsv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (res.canceled || !res.filePaths?.length) {
      return { ok: false, error: 'cancelled' };
    }

    const filePath = res.filePaths[0];
    const ext = path.extname(filePath).toLowerCase();

    if (ext !== '.csv' && ext !== '.tsv') {
      return { ok: false, error: 'unsupported file type' };
    }

    const parseFile = (input: string, delimiter: string) => {
      const lines = input.split(/\r?\n/).filter((l) => l.length > 0);
      if (lines.length === 0) return null;

      const parseLine = (line: string) => {
        const out: string[] = [];
        let cur = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const ch = line[i];

          if (ch === '"') {
            const next = line[i + 1];
            if (inQuotes && next === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
            continue;
          }

          if (ch === delimiter && !inQuotes) {
            out.push(cur);
            cur = '';
            continue;
          }

          cur += ch;
        }

        out.push(cur);
        return out.map((s) => s.trim());
      };

      const headers = parseLine(lines[0]);
      const maxRows = Math.min(20, lines.length - 1);
      const rows = Array.from({ length: maxRows }, (_, i) =>
        parseLine(lines[i + 1]),
      );

      return { headers, rows };
    };

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const delimiter = ext === '.tsv' ? '\t' : ',';
      const parsed = parseFile(content, delimiter);
      if (!parsed) return { ok: false, error: 'empty file' };

      return {
        ok: true,
        filePath,
        fileName: path.basename(filePath),
        headers: parsed.headers,
        rows: parsed.rows,
      };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  ipcMain.handle(
    'import-mapping-file',
    async (
      _event,
      projectId: number,
      tableName: string,
      filePath: string,
      projectHeaders: string[],
      mapping: Record<string, string>,
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName || !filePath) {
        return { ok: false, error: 'Invalid params' };
      }

      const resolvedTableRow = await pdb.get(
        `SELECT table_name FROM project_tables
         WHERE project_id = ?
           AND (table_name = ? OR display_name = ?)
         LIMIT 1`,
        [projectId, tableName, tableName],
      );
      const resolvedTableName =
        typeof resolvedTableRow?.table_name === 'string' &&
        resolvedTableRow.table_name.length > 0
          ? resolvedTableRow.table_name
          : tableName;

      const mappedFields = Object.entries(mapping ?? {}).filter(
        ([, v]) => typeof v === 'string' && v.length > 0,
      );
      if (mappedFields.length === 0) {
        return { ok: false, error: 'no mapping' };
      }

      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.csv' && ext !== '.tsv') {
        return { ok: false, error: 'unsupported file type' };
      }

      const parseFile = (input: string, delimiter: string) => {
        const lines = input.split(/\r?\n/).filter((l) => l.length > 0);
        if (lines.length === 0) return null;

        const parseLine = (line: string) => {
          const out: string[] = [];
          let cur = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const ch = line[i];

            if (ch === '"') {
              const next = line[i + 1];
              if (inQuotes && next === '"') {
                cur += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
              continue;
            }

            if (ch === delimiter && !inQuotes) {
              out.push(cur);
              cur = '';
              continue;
            }

            cur += ch;
          }

          out.push(cur);
          return out.map((s) => s.trim());
        };

        const headers = parseLine(lines[0]);
        const rows = lines.slice(1).map((line) => parseLine(line));
        return { headers, rows };
      };

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const delimiter = ext === '.tsv' ? '\t' : ',';
        const parsed = parseFile(content, delimiter);
        if (!parsed) return { ok: false, error: 'empty file' };

        const { headers, rows } = parsed;
        const headerIndex = new Map<string, number>();
        headers.forEach((h, i) => headerIndex.set(h, i));

        const normalizedProjectHeaders = Array.isArray(projectHeaders)
          ? projectHeaders
          : [];

        let inserted = 0;
        let skipped = 0;

        await pdb.exec('BEGIN');

        await pdb.run(
          `DELETE FROM table_data
           WHERE project_id = ? AND table_name = ?`,
          [projectId, resolvedTableName],
        );

        for (const row of rows) {
          const obj: Record<string, any> = {};
          for (const key of normalizedProjectHeaders) obj[key] = null;

          for (const [projectField, fileHeader] of mappedFields) {
            const idx = headerIndex.get(fileHeader);
            if (idx == null) continue;
            obj[projectField] = row[idx] ?? null;
          }

          const values = Object.values(obj);
          const hasAnyValue = values.some(
            (v) => v != null && String(v).trim() !== '',
          );

          if (!hasAnyValue) {
            skipped++;
            continue;
          }

          await pdb.run(
            `
            INSERT INTO table_data (project_id, table_name, data, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            [projectId, resolvedTableName, JSON.stringify(obj)],
          );
          inserted++;
        }

        const totalRow = await pdb.get(
          `SELECT COUNT(*) AS total
           FROM table_data
           WHERE project_id = ? AND table_name = ?`,
          [projectId, resolvedTableName],
        );

        await pdb.exec('COMMIT');

        return {
          ok: true,
          inserted,
          skipped,
          newTotal: Number(totalRow?.total ?? 0),
        };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle(
    'export-table-data',
    async (_event, projectId: number, tableName: string) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName) {
        return { ok: false, error: 'Invalid params' };
      }

      const resolvedTableRow = await pdb.get(
        `SELECT table_name, display_name FROM project_tables
         WHERE project_id = ?
           AND (table_name = ? OR display_name = ?)
         LIMIT 1`,
        [projectId, tableName, tableName],
      );
      const resolvedTableName =
        typeof resolvedTableRow?.table_name === 'string' &&
        resolvedTableRow.table_name.length > 0
          ? resolvedTableRow.table_name
          : tableName;

      try {
        const schemaRow = await pdb.get(
          `SELECT schema_json
           FROM table_schema
           WHERE project_id = ? AND table_name = ?`,
          [projectId, resolvedTableName],
        );
        const parsedSchema = schemaRow?.schema_json
          ? JSON.parse(schemaRow.schema_json)
          : { columns: [] };
        const cols = Array.isArray(parsedSchema?.columns)
          ? parsedSchema.columns
          : [];
        const colKeys = cols
          .map((c: any) => c?.key)
          .filter((k: any) => typeof k === 'string');

        const rows = await pdb.all(
          `SELECT data
           FROM table_data
           WHERE project_id = ? AND table_name = ?
           ORDER BY id ASC`,
          [projectId, resolvedTableName],
        );

        const escapeCsv = (value: any) => {
          if (value == null) return '';
          const str = String(value);
          if (/[",\n\r]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const headerLine = colKeys.map(escapeCsv).join(',');
        const bodyLines = (rows ?? []).map((r: any) => {
          const parsed = r?.data ? JSON.parse(r.data) : {};
          const line = colKeys.map((k) => escapeCsv(parsed?.[k])).join(',');
          return line;
        });

        const csvContent = [headerLine, ...bodyLines].join('\n');

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${yyyy}-${mm}-${dd}`;
        const safeName = resolvedTableName ?? 'table-data';
        const defaultPath = `${datePrefix}-${safeName}.csv`;

        const res = await dialog.showSaveDialog({
          defaultPath,
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        });

        if (res.canceled || !res.filePath) {
          return { ok: false, error: 'cancelled' };
        }

        fs.writeFileSync(res.filePath, csvContent, 'utf-8');

        return { ok: true, filePath: res.filePath };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    },
  );
};
