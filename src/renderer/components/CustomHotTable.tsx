import {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { HotTable, type HotTableRef } from '@handsontable/react-wrapper';
import type Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import '../styles/handsontable-overrides.css';

registerAllModules();

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type FieldMeta = {
  vocabKey?: string;
  strict?: boolean;
  isCustom?: boolean;
  customLabelZh?: string;
};

type SchemaColumn = {
  key: string;
  title?: string;
  type?: string;
  required?: boolean;
  width?: number;
  meta?: FieldMeta;
};

type TableSchema = {
  columns: SchemaColumn[];
  meta?: any;
};

const toSupportedHotType = (value: unknown): string => {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();

  if (
    v === 'numeric' ||
    v === 'date' ||
    v === 'time' ||
    v === 'checkbox' ||
    v === 'text' ||
    v === 'handsontable'
  ) {
    return v;
  }

  if (
    v === 'number' ||
    v === 'int' ||
    v === 'integer' ||
    v === 'float' ||
    v === 'double' ||
    v === 'decimal'
  ) {
    return 'numeric';
  }

  if (v === 'bool' || v === 'boolean') return 'checkbox';
  if (v === 'datetime' || v === 'timestamp') return 'date';

  return 'text';
};

type Props = {
  projectId: number;
  tableName: string;
  page: number;
  pageSize: number;
  height?: number | string;
  markCustomHeaders?: boolean;
  autoAppendEmptyPage?: boolean;
  onTotalRowsChange?: (total: number) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  textFilter?: {
    kind?: 'text' | 'duplicate';
    fieldKey: string;
    mode: 'exact' | 'fuzzy' | 'regex';
    query: string;
  } | null;
};

// 前端系統欄位：用來對應 DB table_data.id（穩定主鍵），不屬於 schema，不寫回 data JSON
type RowWithPk = Record<string, any> & { __pk: number };

export type HotTableApi = {
  /** 清空目前選取的列（會寫回 DB） */
  clearSelectedRows: () => Promise<void>;
  /** 取得目前選取列的 DB PK（table_data.id） */
  getSelectedPks: () => number[];
  /** 取得「空白列」的 JSON（依照 schema 欄位） */
  getEmptyRowJson: () => string;

  /** 新增一整頁空白列（會寫回 DB） */
  appendEmptyPage: () => Promise<
    | {
        ok: true;
        startPk?: number;
        endPk?: number;
        newTotal: number;
        goToPage: number;
      }
    | { ok: false; error: string }
  >;

  facetSelectedHeader: (opts?: { limit?: number }) => Promise<
    | {
        ok: true;
        tableName: string;
        fieldKey: string;
        items: Array<{ value: string; count: number }>;
      }
    | { ok: false; error: string }
  >;

  deleteSelectedRows: () => Promise<
    | { ok: true; deleted: number; newTotal: number }
    | { ok: false; error: string }
  >;
  /** 重新載入當前頁面資料 */
  reloadPage: () => void;
};

const CustomHotTable = forwardRef<HotTableApi, Props>(
  (
    {
      projectId,
      tableName,
      page,
      pageSize,
      height = '100%',
      markCustomHeaders = false,
      autoAppendEmptyPage = false,
      onTotalRowsChange,
      onSaveStatusChange,
      textFilter = null,
    },
    ref,
  ) => {
    const hotRef = useRef<HotTableRef | null>(null);
    const saveTimerRef = useRef<number | null>(null);

    // ✅ pending 改存「主鍵 + 欄位 patch」
    const pendingPatchRef = useRef<Map<number, Record<string, any>>>(new Map());

    const identityRef = useRef({ projectId, tableName });
    const selectedHeaderKeyRef = useRef<string | null>(null);
    const autoAppendDoneRef = useRef<Set<string>>(new Set());

    // ✅ selection 也改存 __pk
    const selectedPksRef = useRef<Set<number>>(new Set());

    const [schema, setSchema] = useState<TableSchema | null>(null);
    const [dataRows, setDataRows] = useState<RowWithPk[]>([]);
    const [vocabMap, setVocabMap] = useState<Record<string, string[]>>({});
    const [reloadToken, setReloadToken] = useState(0);

    // ---------- helpers ----------
    const getFieldKeyByVisualCol = (hot: Handsontable, visualCol: number) => {
      const cols = hot.getSettings().columns as any[] | undefined;
      const key = cols?.[visualCol]?.data;
      return typeof key === 'string' ? key : null;
    };

    const isStale = (snap: { projectId: number; tableName: string }) => {
      return (
        snap.projectId !== identityRef.current.projectId ||
        snap.tableName !== identityRef.current.tableName
      );
    };

    const makeEmptyRowObj = (cols: SchemaColumn[]) => {
      const obj: Record<string, any> = {};
      for (const c of cols) obj[c.key] = null;
      return obj;
    };

    const getHot = () =>
      hotRef.current?.hotInstance as Handsontable | undefined;

    const getPkFromVisualRow = (hot: Handsontable, visualRow: number) => {
      const rowObj = hot.getSourceDataAtRow(visualRow) as any;
      const pk = rowObj?.__pk;
      return typeof pk === 'number' ? pk : null;
    };

    // ---------- auto-save ----------
    const flushSave = async () => {
      const hot = getHot();
      if (!hot) return null;

      // ✅ 快照：確保整個 flushSave 都針對同一張表
      const snap = { ...identityRef.current };

      const pendingEntries = Array.from(pendingPatchRef.current.entries());
      pendingPatchRef.current.clear();
      if (pendingEntries.length === 0) return null;

      try {
        const payloadRows = pendingEntries.map(([id, patch]) => ({
          id,
          patch,
        }));

        const res = await window.electron.ipcRenderer.invoke(
          'patch-table-data-rows',
          snap.projectId,
          snap.tableName,
          payloadRows,
        );

        // ✅ async 回來後若已切表：丟棄結果，不更新任何 UI
        if (isStale(snap)) return res;

        onSaveStatusChange?.('saved');

        // ✅ 更新當頁 UI（保留 __pk）
        setDataRows((prev) => {
          const byPk = new Map<number, Record<string, any>>();
          for (const [id, patch] of pendingEntries) {
            byPk.set(id, patch);
          }

          return prev.map((row) => {
            const pk = row.__pk;
            if (typeof pk !== 'number' || pk <= 0) return row;
            const patch = byPk.get(pk);
            if (!patch) return row;
            return { ...row, ...patch, __pk: pk };
          });
        });

        return res;
      } catch (err) {
        if (!isStale(snap)) {
          console.error('auto-save failed:', err);
          onSaveStatusChange?.('error');
        }
        return null;
      }
    };

    const scheduleSave = () => {
      onSaveStatusChange?.('saving');

      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        flushSave().catch((err) => console.error('auto-save failed:', err));
      }, 400);
    };

    const handleAfterChange = (changes: any[] | null, source: string) => {
      if (!changes || source === 'loadData') return;

      const hot = getHot();
      if (!hot) return;

      let hasPatch = false;

      for (const [visualRow, visualCol, _oldValue, newValue] of changes) {
        const pk = getPkFromVisualRow(hot, visualRow);
        const key =
          typeof visualCol === 'string'
            ? visualCol
            : getFieldKeyByVisualCol(hot, visualCol);
        if (typeof pk !== 'number' || pk <= 0) continue;
        if (!key) continue;

        const existing = pendingPatchRef.current.get(pk) ?? {};
        existing[key] = newValue ?? null;
        pendingPatchRef.current.set(pk, existing);
        hasPatch = true;
      }

      if (hasPatch) scheduleSave();
    };

    // ---------- load schema + paged data ----------
    useEffect(() => {
      let cancelled = false;

      const load = async () => {
        // 切頁/切表前，先把上一輪 pending 存掉（避免存錯表）
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        await flushSave();
        if (cancelled) return;

        try {
          // 1) schema
          const schemaRow = await window.electron.ipcRenderer.invoke(
            'get-table-schema',
            projectId,
            tableName,
          );

          const parsedSchema: TableSchema = schemaRow?.schema_json
            ? JSON.parse(schemaRow.schema_json)
            : { columns: [] };

          if (cancelled) return;
          setSchema(parsedSchema);

          const cols = parsedSchema.columns ?? [];

          const vocabKeys = Array.from(
            new Set(
              cols
                .map((c) => c.meta?.vocabKey)
                .filter((v): v is string => typeof v === 'string'),
            ),
          );

          if (vocabKeys.length > 0) {
            const results = await Promise.all(
              vocabKeys.map(async (vk) => {
                const res = await window.electron.ipcRenderer.invoke(
                  'get-controlled-vocab',
                  vk,
                );

                return [vk, res?.ok ? (res.items ?? []) : []] as const;
              }),
            );

            if (!cancelled) {
              setVocabMap((prev) => ({
                ...prev,
                ...Object.fromEntries(results),
              }));
            }
          }

          // 2) paged data
          const resp: {
            total: number;
            rows: Array<{ id?: number; row_id?: number; data: string }>;
          } = await window.electron.ipcRenderer.invoke(
            'get-table-data',
            projectId,
            tableName,
            page,
            pageSize,
            textFilter,
          );

          if (cancelled) return;

          const total = resp?.total ?? 0;
          onTotalRowsChange?.(total);

          const dbRows = resp?.rows ?? [];

          // 新專案第一次進入：自動補一頁空白列
          const autoKey = `${projectId}-${tableName}`;
          if (
            autoAppendEmptyPage &&
            !textFilter &&
            total === 0 &&
            page === 1 &&
            !autoAppendDoneRef.current.has(autoKey)
          ) {
            const emptyObj = makeEmptyRowObj(cols);
            const emptyJson = JSON.stringify(emptyObj);

            const res = await window.electron.ipcRenderer.invoke(
              'append-empty-page',
              projectId,
              tableName,
              pageSize,
              emptyJson,
            );

            if (!cancelled && res?.ok) {
              autoAppendDoneRef.current.add(autoKey);
              onTotalRowsChange?.(res.newTotal ?? 0);
              setReloadToken((t) => t + 1);
              return;
            }
          }
          const result: RowWithPk[] = dbRows.map((r) => {
            const parsed = r.data ? JSON.parse(r.data) : {};
            const obj: Record<string, any> = {};
            for (const c of cols) obj[c.key] = parsed?.[c.key] ?? null;

            // ✅ 優先使用 r.id（table_data.id）；若 IPC 尚未改，fallback 用 row_id（暫時相容）
            const pk =
              typeof r.id === 'number'
                ? r.id
                : typeof r.row_id === 'number'
                  ? r.row_id
                  : 0;

            return { ...obj, __pk: Number(pk) || 0 };
          });

          setDataRows(result);
        } catch (err) {
          console.error('Load schema/data failed:', err);
          if (!cancelled) {
            setSchema({ columns: [] });
            setDataRows([]);
            onTotalRowsChange?.(0);
          }
        }
      };

      load();

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, tableName, page, pageSize, reloadToken, textFilter]);

    // ---------- columns ----------
    const visibleColumns = useMemo(() => schema?.columns ?? [], [schema]);

    const colHeaders = useMemo(
      () => visibleColumns.map((c) => c.title ?? c.key),
      [visibleColumns],
    );

    const hotColumns = useMemo(
      () =>
        visibleColumns.map((c) => {
          const vocabKey = c.meta?.vocabKey;
          const items = vocabKey ? vocabMap[vocabKey] : null;

          if (items && items.length > 0) {
            return {
              data: c.key,
              type: 'dropdown',
              source: items,
              strict: c.meta?.strict ?? false,
              allowInvalid: !(c.meta?.strict ?? false),
            };
          }

          return {
            data: c.key,
            type: toSupportedHotType(c.type),
          };
        }),
      [visibleColumns, vocabMap],
    );

    const colWidths = useMemo(
      () => visibleColumns.map((c) => c.width ?? 200),
      [visibleColumns],
    );

    // hotData：只顯示真實資料列（刪除後不自動補齊）
    const hotData = useMemo(() => {
      if (!visibleColumns.length) return [];
      return dataRows ?? [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataRows, visibleColumns]);

    // ---------- imperative API ----------
    const getSelectedPks = () => {
      return Array.from(selectedPksRef.current).sort((a, b) => a - b);
    };

    const getEmptyRowJson = () => {
      const obj = makeEmptyRowObj(visibleColumns);
      return JSON.stringify(obj);
    };

    const clearSelectedRows = async () => {
      const hot = getHot();
      if (!hot) return;

      // 先把 pending 存掉，避免覆蓋
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      await flushSave();

      const pks = getSelectedPks();
      if (pks.length === 0) return;

      const emptyObj = makeEmptyRowObj(visibleColumns);
      const emptyJson = JSON.stringify(emptyObj);

      try {
        onSaveStatusChange?.('saving');

        const res = await window.electron.ipcRenderer.invoke(
          // ⚠️ 後端要改成用 id 清空
          'clear-table-data-rows',
          projectId,
          tableName,
          pks,
          emptyJson,
        );

        if (!res?.ok) {
          onSaveStatusChange?.('error');
          return;
        }

        // ✅ 更新當頁 UI：用 __pk 對應（不再用 rowId/offset 算 idx）
        setDataRows((prev) =>
          prev.map((row) => {
            const pk = row.__pk;
            if (typeof pk !== 'number' || pk <= 0) return row;
            if (!pks.includes(pk)) return row;
            return { ...emptyObj, __pk: pk };
          }),
        );

        onSaveStatusChange?.('saved');
      } catch (err) {
        console.error('clearSelectedRows failed:', err);
        onSaveStatusChange?.('error');
      }
    };

    const appendEmptyPage = async () => {
      const hot = getHot();
      if (!hot) return { ok: false as const, error: 'HOT not ready' };

      const snap = { ...identityRef.current };

      // 先把 pending 存掉
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      await flushSave();

      if (isStale(snap)) {
        return { ok: false as const, error: 'stale request (table changed)' };
      }

      const emptyObj = makeEmptyRowObj(visibleColumns);
      const emptyJson = JSON.stringify(emptyObj);

      try {
        onSaveStatusChange?.('saving');

        const res = await window.electron.ipcRenderer.invoke(
          'append-empty-page',
          snap.projectId,
          snap.tableName,
          pageSize,
          emptyJson,
        );

        if (isStale(snap)) {
          return { ok: false as const, error: 'stale request (table changed)' };
        }

        if (!res?.ok) {
          onSaveStatusChange?.('error');
          return {
            ok: false as const,
            error: res?.error ?? 'append-empty-page failed',
          };
        }

        onTotalRowsChange?.(res.newTotal);

        const goToPage = Math.max(1, Math.ceil(res.newTotal / pageSize));

        // 若新增後仍在同一頁，強制 reload 讓新資料出現
        if (goToPage === page) {
          setReloadToken((t) => t + 1);
        }

        onSaveStatusChange?.('saved');

        // startPk/endPk 先用你後端現有回傳欄位（你之後再對齊）
        return {
          ok: true as const,
          startPk: res.startPk ?? res.startRowId,
          endPk: res.endPk ?? res.endRowId,
          newTotal: res.newTotal,
          goToPage,
        };
      } catch (err) {
        if (!isStale(snap)) {
          console.error('appendEmptyPage failed:', err);
          onSaveStatusChange?.('error');
        }
        return { ok: false as const, error: String(err) };
      }
    };

    const facetSelectedHeader = async (opts?: { limit?: number }) => {
      const fieldKey = selectedHeaderKeyRef.current;
      if (!fieldKey) {
        return { ok: false as const, error: '請先點選一個欄位 header' };
      }

      const lim = Math.max(1, Math.min(500, Number(opts?.limit) || 100));

      try {
        const res = await window.electron.ipcRenderer.invoke(
          'facet-table-field',
          projectId,
          tableName,
          fieldKey,
          lim,
        );

        if (!res?.ok) {
          return { ok: false as const, error: res?.error ?? 'facet failed' };
        }

        return {
          ok: true as const,
          tableName,
          fieldKey,
          items: res.items ?? [],
        };
      } catch (e) {
        return { ok: false as const, error: String(e) };
      }
    };

    const reloadPage = () => {
      setReloadToken((t) => t + 1);
    };

    const deleteSelectedRows = async () => {
      const hot = getHot();
      if (!hot) return { ok: false as const, error: 'HOT not ready' };

      const snap = { ...identityRef.current };

      // 先把 pending 存掉
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      await flushSave();

      if (isStale(snap)) {
        return { ok: false as const, error: 'stale request (table changed)' };
      }

      const pks = getSelectedPks();
      if (pks.length === 0) {
        return { ok: false as const, error: 'no selection' };
      }

      try {
        onSaveStatusChange?.('saving');

        const res = await window.electron.ipcRenderer.invoke(
          // ⚠️ 後端要改成用 id 刪除
          'delete-table-rows',
          snap.projectId,
          snap.tableName,
          pks,
        );

        if (isStale(snap)) {
          return { ok: false as const, error: 'stale request (table changed)' };
        }

        if (!res?.ok) {
          onSaveStatusChange?.('error');
          return { ok: false as const, error: res?.error ?? 'delete failed' };
        }

        onTotalRowsChange?.(res.newTotal ?? 0);

        // ✅ 刪除後用 reload 重新載入本頁（避免自己算位置）
        setReloadToken((t) => t + 1);

        onSaveStatusChange?.('saved');

        return {
          ok: true as const,
          deleted: res.deleted ?? pks.length,
          newTotal: res.newTotal ?? 0,
        };
      } catch (e) {
        if (!isStale(snap)) onSaveStatusChange?.('error');
        return { ok: false as const, error: String(e) };
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        clearSelectedRows,
        getSelectedPks,
        getEmptyRowJson,
        appendEmptyPage,
        facetSelectedHeader,
        deleteSelectedRows,
        reloadPage,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [projectId, tableName, page, pageSize, visibleColumns, textFilter],
    );

    // 元件卸載/切換時把 pending 存掉
    useEffect(() => {
      return () => {
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        flushSave().catch(() => {});
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, tableName, page, pageSize]);

    useEffect(() => {
      identityRef.current = { projectId, tableName };
    }, [projectId, tableName]);

    return (
      <HotTable
        ref={hotRef}
        className="ht-theme-main"
        data={hotData}
        columns={hotColumns}
        colHeaders={colHeaders}
        colWidths={colWidths}
        height={height}
        autoColumnSize={true}
        filters={true}
        // ✅ row header 純視覺編號：不代表 DB row_id
        rowHeaders={(visualRow) => (page - 1) * pageSize + visualRow + 1}
        headerClassName="htLeft"
        afterGetColHeader={(col, TH) => {
          if (col < 0) return;
          const column = visibleColumns[col];
          const isRequired = Boolean(column?.required);
          const isCustom = Boolean(markCustomHeaders && column?.meta?.isCustom);

          TH.style.color = isRequired ? '#c62828' : isCustom ? '#1565c0' : '';
          TH.style.fontWeight = isRequired || isCustom ? '700' : '';
        }}
        manualRowMove={true}
        autoWrapRow={true}
        autoWrapCol={false}
        manualRowResize={true}
        manualColumnResize={true}
        navigableHeaders={true}
        licenseKey="non-commercial-and-evaluation"
        afterChange={handleAfterChange}
        afterOnCellMouseDown={(_e, coords) => {
          const hot = getHot();
          if (!hot) return;

          // header row === -1
          if (
            coords?.row === -1 &&
            typeof coords.col === 'number' &&
            coords.col >= 0
          ) {
            const key = getFieldKeyByVisualCol(hot, coords.col);
            selectedHeaderKeyRef.current = key;
          }
        }}
        afterSelectionEnd={() => {
          const hot = getHot();
          if (!hot) return;

          const sel = hot.getSelected?.() ?? [];
          const pks = new Set<number>();

          for (const s of sel) {
            const [r1, _c1, r2, _c2] = s;
            const from = Math.min(r1, r2);
            const to = Math.max(r1, r2);

            for (let vr = from; vr <= to; vr++) {
              if (vr < 0) continue;

              const rowObj = hot.getSourceDataAtRow(vr) as any;
              const pk = rowObj?.__pk;
              // 只接受真實 DB row（>0）
              if (typeof pk === 'number' && pk > 0) pks.add(pk);
            }
          }

          selectedPksRef.current = pks;
        }}
        afterDeselect={() => {
          // 保留最後一次選擇，避免點工具列/選單時 selection 被清掉
        }}
      />
    );
  },
);

export default CustomHotTable;
