import { ipcMain, dialog } from 'electron';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { pdb } from '../../db';

const normalizeSelectedPks = (selectedPks?: number[]) => {
  if (!Array.isArray(selectedPks)) return [];
  return Array.from(
    new Set(
      selectedPks.filter(
        (id) => Number.isInteger(id) && Number(id) > 0,
      ) as number[],
    ),
  );
};

const buildIdFilter = (selectedPks?: number[]) => {
  const ids = normalizeSelectedPks(selectedPks);
  if (ids.length === 0) return { sql: '', params: [] as number[] };
  return {
    sql: ` AND id IN (${ids.map(() => '?').join(',')})`,
    params: ids,
  };
};

export const registerCleanHandlers = () => {
  ipcMain.handle(
    'get-table-row-pks-by-row-numbers',
    async (
      _event,
      projectId: number,
      tableName: string,
      rowNumbers: number[],
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName) {
        return { ok: false, error: 'Invalid params' };
      }

      const normalizedRowNumbers = normalizeSelectedPks(rowNumbers);
      if (!normalizedRowNumbers.length) {
        return { ok: true, pks: [] as number[] };
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
        const rows = await pdb.all(
          `
          SELECT id
          FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS row_no
            FROM table_data
            WHERE project_id = ? AND table_name = ?
          )
          WHERE row_no IN (${normalizedRowNumbers.map(() => '?').join(',')})
          ORDER BY id ASC
          `,
          [projectId, resolvedTableName, ...normalizedRowNumbers],
        );

        const pks = (rows ?? [])
          .map((r: any) => Number(r?.id))
          .filter((id: number) => Number.isInteger(id) && id > 0);

        return { ok: true, pks };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle(
    'batch-update-field-value',
    async (
      _event,
      projectId: number,
      tableName: string,
      fieldKey: string,
      fromValue: string,
      toValue: string,
      selectedPks?: number[],
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName || !fieldKey) {
        return { ok: false, error: 'Invalid params' };
      }
      if (!/^[A-Za-z0-9_]+$/.test(fieldKey)) {
        return { ok: false, error: 'Invalid fieldKey' };
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

      const jsonPath = `$.${fieldKey}`;
      const normalizedFromValue = String(fromValue ?? '').trim();
      const idFilter = buildIdFilter(selectedPks);

      try {
        await pdb.exec('BEGIN');

        const res = await pdb.run(
          `
          UPDATE table_data
          SET data = json_set(data, ?, ?),
              updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ? AND table_name = ?
            AND (
              (
                ? = ''
                AND (
                  json_extract(data, ?) IS NULL
                  OR TRIM(CAST(json_extract(data, ?) AS TEXT)) = ''
                )
              )
              OR (
                ? <> ''
                AND TRIM(CAST(json_extract(data, ?) AS TEXT)) = ?
              )
            )
            ${idFilter.sql}
          `,
          [
            jsonPath,
            toValue,
            projectId,
            resolvedTableName,
            normalizedFromValue,
            jsonPath,
            jsonPath,
            normalizedFromValue,
            jsonPath,
            normalizedFromValue,
            ...idFilter.params,
          ],
        );

        await pdb.exec('COMMIT');

        return { ok: true, updated: Number(res?.changes ?? 0) };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle(
    'batch-replace-field-value',
    async (
      _event,
      projectId: number,
      tableName: string,
      fieldKey: string,
      mode: 'exact' | 'fuzzy' | 'regex',
      fromValue: string,
      toValue: string,
      selectedPks?: number[],
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName || !fieldKey) {
        return { ok: false, error: 'Invalid params' };
      }
      if (!/^[A-Za-z0-9_]+$/.test(fieldKey)) {
        return { ok: false, error: 'Invalid fieldKey' };
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

      const from = (fromValue ?? '').toString();
      const to = (toValue ?? '').toString();
      if (!from && mode !== 'exact') {
        return { ok: false, error: 'Invalid from value' };
      }

      const escapeRegExp = (s: string) =>
        s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      let regex: RegExp | null = null;
      if (mode === 'regex') {
        try {
          regex = new RegExp(from, 'g');
        } catch {
          return { ok: false, error: 'Invalid regex' };
        }
      } else if (mode === 'fuzzy') {
        regex = new RegExp(escapeRegExp(from), 'gi');
      }

      try {
        await pdb.exec('BEGIN');
        const idFilter = buildIdFilter(selectedPks);

        const rows = await pdb.all(
          `SELECT id, data
           FROM table_data
           WHERE project_id = ? AND table_name = ?${idFilter.sql}`,
          [projectId, resolvedTableName, ...idFilter.params],
        );

        let updated = 0;
        let schemaUpdated = false;

        for (const r of rows ?? []) {
          const id = Number(r?.id);
          if (!Number.isFinite(id) || id <= 0) continue;
          const parsed = r?.data ? JSON.parse(r.data) : {};
          const raw = parsed?.[fieldKey];
          if (raw == null) continue;
          const str = String(raw);

          let next: string | null = null;

          if (mode === 'exact') {
            if (str === from) next = to;
          } else if (regex) {
            if (regex.test(str)) {
              regex.lastIndex = 0;
              next = str.replace(regex, to);
            }
          }

          if (next == null || next === str) continue;

          parsed[fieldKey] = next;
          await pdb.run(
            `
            UPDATE table_data
            SET data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE project_id = ? AND table_name = ? AND id = ?
            `,
            [JSON.stringify(parsed), projectId, resolvedTableName, id],
          );
          updated++;
        }

        await pdb.exec('COMMIT');
        return { ok: true, updated };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle(
    'swap-table-fields',
    async (
      _event,
      projectId: number,
      tableName: string,
      fromField: string,
      toField: string,
      selectedPks?: number[],
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName || !fromField || !toField) {
        return { ok: false, error: 'Invalid params' };
      }
      if (
        !/^[A-Za-z0-9_]+$/.test(fromField) ||
        !/^[A-Za-z0-9_]+$/.test(toField)
      ) {
        return { ok: false, error: 'Invalid fieldKey' };
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
        const idFilter = buildIdFilter(selectedPks);

        const rows = await pdb.all(
          `SELECT id, data
           FROM table_data
           WHERE project_id = ? AND table_name = ?${idFilter.sql}`,
          [projectId, resolvedTableName, ...idFilter.params],
        );

        let updated = 0;

        for (const r of rows ?? []) {
          const id = Number(r?.id);
          if (!Number.isFinite(id) || id <= 0) continue;
          const parsed = r?.data ? JSON.parse(r.data) : {};

          const fromVal = parsed?.[fromField] ?? null;
          const toVal = parsed?.[toField] ?? null;

          parsed[fromField] = toVal;
          parsed[toField] = fromVal;

          await pdb.run(
            `
            UPDATE table_data
            SET data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE project_id = ? AND table_name = ? AND id = ?
            `,
            [JSON.stringify(parsed), projectId, resolvedTableName, id],
          );
          updated++;
        }

        await pdb.exec('COMMIT');
        return { ok: true, updated };
      } catch (err) {
        try {
          await pdb.exec('ROLLBACK');
        } catch {}
        return { ok: false, error: String(err) };
      }
    },
  );

  ipcMain.handle(
    'sync-scientific-name-taxon',
    async (
      _event,
      projectId: number,
      tableName: string,
      selectedPks?: number[],
    ) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId || !tableName) {
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
        const idFilter = buildIdFilter(selectedPks);

        await pdb.run(
          `
          CREATE TABLE IF NOT EXISTS taxon_cache (
            scientific_name   TEXT PRIMARY KEY,
            taxon_id          TEXT,
            accepted_namecode TEXT,
            common_name       TEXT,
            source            TEXT,
            status            TEXT,
            kingdom           TEXT,
            phylum            TEXT,
            class             TEXT,
            "order"           TEXT,
            family            TEXT,
            genus             TEXT,
            taxon_rank        TEXT,
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
          )
          `,
        );
        await pdb.run(`DELETE FROM taxon_cache`);

        const rows = await pdb.all(
          `
          SELECT DISTINCT TRIM(CAST(json_extract(data, '$.scientificName') AS TEXT)) AS scientificName
          FROM table_data
          WHERE project_id = ? AND table_name = ?
            AND json_extract(data, '$.scientificName') IS NOT NULL
            AND TRIM(CAST(json_extract(data, '$.scientificName') AS TEXT)) <> ''
            ${idFilter.sql}
          `,
          [projectId, resolvedTableName, ...idFilter.params],
        );

        const names = (rows ?? [])
          .map((r: any) => r.scientificName)
          .filter((n: any) => typeof n === 'string' && n.length > 0);

        if (names.length === 0) {
          return {
            ok: true,
            updated: 0,
            skipped: 0,
            totalNames: 0,
            schemaUpdated: false,
          };
        }

        let updated = 0;
        let skipped = 0;
        let schemaUpdated = false;

        await pdb.exec('BEGIN');

        const fetchBatchAndCache = async (
          batch: string[],
          source: 'taicol' | 'gbif',
        ) => {
          const url = `https://match.taibif.tw/v2/api.php?names=${encodeURIComponent(
            batch.join('|'),
          )}&format=json&best=yes&source=${source}`;

          let json: any = null;
          try {
            const resp = await fetch(url);
            if (!resp.ok) return;
            json = await resp.json();
          } catch {
            return;
          }

          const entries = Array.isArray(json?.data) ? json.data : [];
          for (const group of entries) {
            const item = Array.isArray(group) ? group?.[0] : null;
            const searchTerm = item?.search_term ?? item?.name_cleaned;
            if (!searchTerm || typeof searchTerm !== 'string') continue;
            const result = item?.results?.[0] ?? null;

            let status: 'ok' | 'not_found' | 'error' = 'error';
            let payload: any = {
              scientific_name: searchTerm,
              taxon_id: null,
              accepted_namecode: null,
              common_name: null,
              source,
              kingdom: null,
              phylum: null,
              class: null,
              order: null,
              family: null,
              genus: null,
              taxon_rank: null,
            };

            if (result) {
              status = 'ok';
              payload = {
                scientific_name: searchTerm,
                taxon_id: result.accepted_namecode ?? result.namecode ?? null,
                accepted_namecode: result.accepted_namecode ?? null,
                common_name: result.common_name ?? null,
                source: result.source ?? source,
                kingdom: result.kingdom ?? null,
                phylum: result.phylum ?? null,
                class: result.class ?? null,
                order: result.order ?? null,
                family: result.family ?? null,
                genus: result.genus ?? null,
                taxon_rank: result.taxon_rank ?? null,
              };
            } else {
              status = 'not_found';
            }

            await pdb.run(
              `
              INSERT INTO taxon_cache (
                scientific_name, taxon_id, accepted_namecode, common_name, source, status,
                kingdom, phylum, class, "order", family, genus, taxon_rank, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(scientific_name) DO UPDATE SET
                taxon_id = excluded.taxon_id,
                accepted_namecode = excluded.accepted_namecode,
                common_name = excluded.common_name,
                source = excluded.source,
                status = excluded.status,
                kingdom = excluded.kingdom,
                phylum = excluded.phylum,
                class = excluded.class,
                "order" = excluded."order",
                family = excluded.family,
                genus = excluded.genus,
                taxon_rank = excluded.taxon_rank,
                updated_at = CURRENT_TIMESTAMP
              `,
              [
                payload.scientific_name,
                payload.taxon_id,
                payload.accepted_namecode,
                payload.common_name,
                payload.source,
                status,
                payload.kingdom,
                payload.phylum,
                payload.class,
                payload.order,
                payload.family,
                payload.genus,
                payload.taxon_rank,
              ],
            );
          }
        };

        // 先找出 cache 缺的名稱，批次打 taicol
        const missingNames: string[] = [];
        for (const name of names) {
          const cache = await pdb.get(
            `SELECT scientific_name FROM taxon_cache WHERE scientific_name = ?`,
            [name],
          );
          if (!cache) missingNames.push(name);
        }

        for (let i = 0; i < missingNames.length; i += 20) {
          const batch = missingNames.slice(i, i + 20);
          await fetchBatchAndCache(batch, 'taicol');
        }

        // 找出 taicol not_found，再批次打 gbif
        const notFoundRows = await pdb.all(
          `
          SELECT scientific_name
          FROM taxon_cache
          WHERE scientific_name IN (${names.map(() => '?').join(',')})
            AND status = 'not_found'
            AND source = 'taicol'
          `,
          names,
        );
        const notFoundNames = (notFoundRows ?? [])
          .map((r: any) => r.scientific_name)
          .filter((n: any) => typeof n === 'string' && n.length > 0);

        for (let i = 0; i < notFoundNames.length; i += 20) {
          const batch = notFoundNames.slice(i, i + 20);
          await fetchBatchAndCache(batch, 'gbif');
        }

        for (const name of names) {
          const cache = await pdb.get(
            `SELECT * FROM taxon_cache WHERE scientific_name = ?`,
            [name],
          );

          if (!cache || cache.status !== 'ok' || !cache.taxon_id) {
            skipped++;
            continue;
          }

          await pdb.run(
            `
            UPDATE table_data
            SET data = json_set(
              data,
              '$.acceptedNameUsageID', ?,
              '$.vernacularName', ?,
              '$.apiSource', ?,
              '$.kingdom', ?,
              '$.phylum', ?,
              '$.class', ?,
              '$.order', ?,
              '$.family', ?,
              '$.genus', ?,
              '$.taxonRank', ?
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE project_id = ? AND table_name = ?
              AND TRIM(CAST(json_extract(data, '$.scientificName') AS TEXT)) = ?
              ${idFilter.sql}
            `,
            [
              String(cache.taxon_id ?? ''),
              cache.common_name ?? null,
              cache.source ?? null,
              cache.kingdom ?? null,
              cache.phylum ?? null,
              cache.class ?? null,
              cache.order ?? null,
              cache.family ?? null,
              cache.genus ?? null,
              cache.taxon_rank ?? null,
              projectId,
              resolvedTableName,
              name,
              ...idFilter.params,
            ],
          );

          const ch = await pdb.get(`SELECT changes() AS changes`);
          updated += Number(ch?.changes ?? 0);
        }

        // 若 schema 沒有相關欄位，就補進去
        try {
          const schemaRow = await pdb.get(
            `SELECT schema_json
             FROM table_schema
             WHERE project_id = ? AND table_name = ?`,
            [projectId, resolvedTableName],
          );
          if (schemaRow?.schema_json) {
            const parsed = JSON.parse(schemaRow.schema_json);
            const cols = Array.isArray(parsed?.columns) ? parsed.columns : [];
            const required = [
              'acceptedNameUsageID',
              'vernacularName',
              'apiSource',
              'kingdom',
              'phylum',
              'class',
              'order',
              'family',
              'genus',
              'taxonRank',
            ];
            const existingKeys = new Set(
              cols
                .map((c: any) => c?.key)
                .filter((k: any) => typeof k === 'string'),
            );
            const missing = required.filter((k) => !existingKeys.has(k));
            if (missing.length > 0) {
              const nextCols = [
                ...cols,
                ...missing.map((k) => ({
                  key: k,
                  title: k,
                  type: 'text',
                })),
              ];
              const nextSchema = JSON.stringify({
                ...parsed,
                columns: nextCols,
              });
              const existing = await pdb.get(
                `SELECT id, version FROM table_schema WHERE project_id = ? AND table_name = ?`,
                [projectId, resolvedTableName],
              );
              if (existing?.id) {
                const nextVersion = (existing.version ?? 1) + 1;
                await pdb.run(
                  `UPDATE table_schema
                   SET schema_json = ?, version = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`,
                  [nextSchema, nextVersion, existing.id],
                );
                schemaUpdated = true;
              }
            }
          }
        } catch (e) {
          console.warn('update schema for acceptedNameUsageID failed:', e);
        }

        await pdb.exec('COMMIT');

        return {
          ok: true,
          updated,
          skipped,
          totalNames: names.length,
          schemaUpdated,
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
    'export-project-data-zip',
    async (_event, projectId: number) => {
      if (!pdb) return { ok: false, error: 'DB not initialized' };
      if (!projectId) return { ok: false, error: 'Invalid params' };

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const datePrefix = `${yyyy}-${mm}-${dd}`;

      const projectRow = await pdb.get(
        `SELECT name FROM projects WHERE id = ?`,
        [projectId],
      );
      const projectName =
        typeof projectRow?.name === 'string' && projectRow.name.length > 0
          ? projectRow.name
          : `project-${projectId}`;

      const saveRes = await dialog.showSaveDialog({
        defaultPath: `${datePrefix}-${projectName}.zip`,
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      });
      if (saveRes.canceled || !saveRes.filePath) {
        return { ok: false, error: 'cancelled' };
      }

      const tables = await pdb.all(
        `SELECT table_name, display_name
         FROM project_tables
         WHERE project_id = ?
         ORDER BY id ASC`,
        [projectId],
      );

      const escapeCsv = (value: any) => {
        if (value == null) return '';
        const str = String(value);
        if (/[",\n\r]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      try {
        const zip = new JSZip();

        for (const t of tables ?? []) {
          const tableName =
            typeof t?.table_name === 'string' ? t.table_name : '';
          if (!tableName) continue;

          const schemaRow = await pdb.get(
            `SELECT schema_json
             FROM table_schema
             WHERE project_id = ? AND table_name = ?`,
            [projectId, tableName],
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
            [projectId, tableName],
          );

          let keys = colKeys;
          if (keys.length === 0 && rows?.length) {
            const parsed = rows[0]?.data ? JSON.parse(rows[0].data) : {};
            keys = Object.keys(parsed ?? {});
          }

          const headerLine = keys.map(escapeCsv).join(',');
          const bodyLines = (rows ?? []).map((r: any) => {
            const parsed = r?.data ? JSON.parse(r.data) : {};
            return keys.map((k) => escapeCsv(parsed?.[k])).join(',');
          });

          const csv = [headerLine, ...bodyLines].join('\n');
          zip.file(`${projectName}-${tableName}.csv`, csv);
        }

        const content = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(saveRes.filePath, content);

        return { ok: true, filePath: saveRes.filePath };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    },
  );
};
