import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import CustomTab from '../components/CustomTab';
import CustomAccordion from '../components/CustomAccordion';
import CustomHotTable, { type HotTableApi } from '../components/CustomHotTable';
import type { SaveStatus } from '../components/CustomHotTable';
import FieldErrorAccordionList from '../components/FieldErrorAccordionList';
import ContentFilterPanel from '../components/panels/ContentFilterPanel';
import TextFilterPanel from '../components/panels/TextFilterPanel';
import DuplicateFilterPanel from '../components/panels/DuplicateFilterPanel';
import StringReplacePanel from '../components/panels/StringReplacePanel';
import FieldSwapPanel from '../components/panels/FieldSwapPanel';
import SpeciesApiPanel from '../components/panels/SpeciesApiPanel';
import PaginationControls from '../components/PaginationControls';
import useAutoPageSize from '../hooks/useAutoPageSize';
import {
  groupValidationErrors,
  type ValidationErrorRow,
} from '../utils/validationErrorGroups';

import {
  Box,
  Button,
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuList,
  MenuItem,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';

import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TuneIcon from '@mui/icons-material/Tune';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FindReplaceIcon from '@mui/icons-material/FindReplace';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useI18n } from '../contexts/i18n';
import { useProject } from '../contexts/project';

const TABLE_BOTTOM_MARGIN = 16;

type HoverMenuItem = {
  label: string;
  startIcon?: ReactNode;
  onClick?: () => void | Promise<void>;
};

function HoverMenuButton({
  label,
  startIcon,
  items,
}: {
  label: string;
  startIcon?: ReactNode;
  items: HoverMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = () => setOpen(true);
  const closeMenu = () => setOpen(false);
  const handleClickAway = (event: MouseEvent | TouchEvent) => {
    if (
      event.target instanceof Node &&
      anchorRef.current?.contains(event.target)
    ) {
      return;
    }
    closeMenu();
  };

  return (
    <Box
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      sx={{ display: 'inline-flex' }}
    >
      <Button
        ref={anchorRef}
        variant="outlined"
        startIcon={startIcon}
        onClick={openMenu}
        sx={{
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': { bgcolor: '#e8eaf6' },
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Button>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        disablePortal
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'left top' }}>
            <Paper
              onMouseEnter={openMenu}
              onMouseLeave={closeMenu}
              elevation={3}
            >
              <ClickAwayListener onClickAway={handleClickAway}>
                <MenuList dense>
                  {items.map((it) => (
                    <MenuItem
                      key={it.label}
                      onClick={() => {
                        it.onClick?.();
                      }}
                    >
                      {it.startIcon && (
                        <Box sx={{ mr: 1, display: 'flex' }}>
                          {it.startIcon}
                        </Box>
                      )}
                      {it.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}

type LeftToolPanel =
  | 'none'
  | 'contentFilter'
  | 'textFilter'
  | 'duplicateFilter'
  | 'stringReplace'
  | 'fieldSwap'
  | 'speciesApi';

type TableValidationResult = {
  tableName: string;
  errors: ValidationErrorRow[];
};

type ProjectValidationResult = {
  ok: boolean;
  projectId?: number;
  error?: string;
  tables?: TableValidationResult[];
};

const CleanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef<HotTableApi | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const { messages } = useI18n();
  const cleanText = messages.cleanPage;
  const { selectedProject, tables, setTables } = useProject();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageSizeMode, setPageSizeMode] = useState<'auto' | 'manual'>('auto');
  const [totalRows, setTotalRows] = useState(0);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [leftToolPanel, setLeftToolPanel] = useState<LeftToolPanel>('none');
  const [activeTableName, setActiveTableName] = useState<string | null>(null);
  const [textFilter, setTextFilter] = useState<{
    kind?: 'text' | 'duplicate';
    fieldKey: string;
    mode: 'exact' | 'fuzzy' | 'regex';
    query: string;
  } | null>(null);
  const [facetResult, setFacetResult] = useState<null | {
    tableName: string;
    fieldKey: string;
    items: Array<{ value: string; count: number }>;
  }>(null);
  const [fieldKeys, setFieldKeys] = useState<string[]>([]);
  const [validationResult, setValidationResult] =
    useState<ProjectValidationResult | null>(null);
  const [validationBusy, setValidationBusy] = useState(false);
  const [actionWarning, setActionWarning] = useState<string | null>(null);

  const { containerHeight: tableContainerHeight } = useAutoPageSize({
    containerRef: tableContainerRef,
    enabled: pageSizeMode === 'auto',
    page,
    pageSize,
    bottomMargin: TABLE_BOTTOM_MARGIN,
    setPage,
    setPageSize,
  });
  const HEADER_NOT_SELECTED_ERROR = '請先點選一個欄位 header';
  const routeValidation =
    (location.state as { validation?: ProjectValidationResult } | undefined)
      ?.validation ?? null;
  const validationItems = useMemo(() => {
    const tableErrors =
      validationResult?.tables?.find((t) => t.tableName === activeTableName)
        ?.errors ?? [];

    return groupValidationErrors(tableErrors).map((g) => ({
      field: g.title,
      errorMessage: '',
      count: g.count,
      rows: g.rows,
    }));
  }, [validationResult, activeTableName]);

  const SaveStatusChip = ({ saveStatus }: { saveStatus: SaveStatus }) => {
    if (saveStatus === 'idle') return null;

    const label =
      saveStatus === 'saving'
        ? cleanText.saveStatus.saving // 存檔中
        : saveStatus === 'saved'
          ? cleanText.saveStatus.saved // 已儲存
          : cleanText.saveStatus.failed; // 存檔失敗

    const icon =
      saveStatus === 'saving' ? (
        <CircularProgress size={12} color="inherit" />
      ) : saveStatus === 'saved' ? (
        <CheckCircleIcon sx={{ fontSize: 16 }} />
      ) : (
        <ErrorOutlineIcon sx={{ fontSize: 16 }} />
      );

    const style =
      saveStatus === 'saving'
        ? { bgcolor: 'rgba(63,81,181,0.10)', color: 'primary.main' }
        : saveStatus === 'saved'
          ? { bgcolor: 'rgba(76,175,80,0.14)', color: 'success.main' }
          : { bgcolor: 'rgba(244,67,54,0.14)', color: 'error.main' };

    return (
      <Chip
        size="small"
        variant="filled"
        icon={icon}
        label={label}
        sx={{
          ...style,
          height: 24,
          borderRadius: 1,
          fontSize: 12,
          fontWeight: 500,
          '& .MuiChip-label': {
            px: 0.75,
            py: 0,
            lineHeight: 1,
          },
          '& .MuiChip-icon': {
            color: 'inherit',
            ml: 0.5,
            mr: 0.25,
          },
          '&:hover': { bgcolor: style.bgcolor },
        }}
      />
    );
  };

  const refreshFacet = async (fieldKey: string) => {
    const api = tableRef.current;
    if (!api) return;

    const res = await api.facetSelectedHeader({ limit: 200 });
    if (!res.ok) {
      console.warn(res.error);
      return;
    }

    if (res.tableName !== activeTableName) return;
    if (res.fieldKey !== fieldKey) return;

    setFacetResult({
      tableName: res.tableName,
      fieldKey: res.fieldKey,
      items: res.items ?? [],
    });
  };

  const getFacetSelectionWithWarning = async () => {
    const api = tableRef.current;
    if (!api) return null;

    const res = await api.facetSelectedHeader({ limit: 200 });
    if (!res.ok) {
      setActionWarning(
        res.error === HEADER_NOT_SELECTED_ERROR
          ? cleanText.states.selectAnyHeader
          : String(res.error),
      );
      return null;
    }

    return res;
  };

  const goPrevPage = () => {
    navigate('/data-validate');
  };

  const resolveTargetPks = async (rowNumbers?: number[]) => {
    if (!rowNumbers?.length) return undefined;
    if (selectedProject == null || !activeTableName) return null;

    const res = await window.electron.ipcRenderer.invoke(
      'get-table-row-pks-by-row-numbers',
      selectedProject,
      activeTableName,
      rowNumbers,
    );

    if (!res?.ok) {
      setActionWarning(String(res?.error ?? 'Resolve target rows failed'));
      return null;
    }

    const pks = Array.isArray(res.pks) ? (res.pks as number[]) : [];
    if (!pks.length) {
      setActionWarning(messages.cleanPage.panels.applyScope.noMatchedRows);
      return null;
    }
    return pks;
  };

  const runValidation = useCallback(async () => {
    if (selectedProject == null) {
      setValidationResult(null);
      return;
    }

    setValidationBusy(true);
    try {
      const res = (await window.electron.ipcRenderer.invoke(
        'validate-project-table-data',
        selectedProject,
      )) as ProjectValidationResult;
      setValidationResult(res);
    } catch (err) {
      setValidationResult({
        ok: false,
        error: String(err),
      });
    } finally {
      setValidationBusy(false);
    }
  }, [selectedProject]);

  // 開啟舊專案時，從資料庫資料庫取得模板資訊
  useEffect(() => {
    if (selectedProject == null) {
      setTables([]);
      setActiveTableName(null);
      return;
    }

    let cancelled = false;

    const loadTables = async () => {
      const list = await window.electron.ipcRenderer.invoke(
        'get-project-tables',
        selectedProject,
      );

      if (cancelled) return;

      const safeList = Array.isArray(list) ? list : [];
      setTables(safeList);

      // 初始化 active table
      setActiveTableName((prev) => prev ?? safeList?.[0]?.name ?? null);
    };

    loadTables().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [selectedProject, setTables]);

  useEffect(() => {
    if (selectedProject == null || !activeTableName) {
      setFieldKeys([]);
      return;
    }

    let cancelled = false;

    window.electron.ipcRenderer
      .invoke('get-table-schema', selectedProject, activeTableName)
      .then((schemaRow) => {
        if (cancelled) return;
        const parsed = schemaRow?.schema_json
          ? JSON.parse(schemaRow.schema_json)
          : { columns: [] };
        const cols = parsed?.columns ?? [];
        setFieldKeys(
          cols
            .map((c: { key?: string }) => c?.key)
            .filter((k: any) => typeof k === 'string'),
        );
      })
      .catch((err) => {
        if (!cancelled) console.warn('get-table-schema failed:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProject, activeTableName]);

  useEffect(() => {
    if (selectedProject == null) {
      setValidationResult(null);
      return;
    }

    if (
      routeValidation?.ok &&
      Number(routeValidation?.projectId) === Number(selectedProject)
    ) {
      setValidationResult(routeValidation);
      setValidationBusy(false);
      return;
    }

    runValidation();
  }, [runValidation, selectedProject, routeValidation]);

  // 開啟新專案時，直接從 context 取得模板資訊
  useEffect(() => {
    if (!tables?.length) return;

    const exists =
      activeTableName && tables.some((t) => t.name === activeTableName);

    if (!exists) {
      setActiveTableName(tables[0].name);
    }
  }, [tables, activeTableName]);

  return (
    <Layout>
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'stretch',
          height: 0,
        }}
      >
        {/* 左側欄 */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'primary.main',
            px: 1,
            py: 2,
            overflow: 'hidden',
          }}
        >
          <CustomTab
            value={activeTableName}
            onChange={(newKey) => {
              setActiveTableName(newKey); // 再切表
              setFacetResult(null);
              setTextFilter(null);
            }}
            items={tables.map((t) => ({
              key: t.name,
              type: t.kind, // 'core' | 'extension'
              title: t.displayName, // 你目前的欄位名
              subtitle:
                t.kind === 'core'
                  ? cleanText.tableTabs.coreSubtitle // 核心資料表
                  : cleanText.tableTabs.extensionSubtitle, // 延伸資料表
            }))}
          />

          <Box sx={{ mt: 1, flex: 1, overflow: 'auto' }}>
            {leftToolPanel === 'textFilter' && facetResult && (
              <TextFilterPanel
                onClose={() => {
                  setLeftToolPanel('none');
                  setTextFilter(null);
                  setPage(1);
                  tableRef.current?.reloadPage();
                }}
                facet={{
                  field: facetResult.fieldKey,
                  values: facetResult.items.map((i) => ({
                    value: i.value,
                    count: i.count,
                  })),
                }}
                onBatchEdit={(payload) => {
                  setTextFilter({
                    kind: 'text',
                    fieldKey: payload.field,
                    mode: payload.mode,
                    query: payload.query,
                  });
                  setPage(1);
                  tableRef.current?.reloadPage();
                }}
              />
            )}

            {leftToolPanel === 'duplicateFilter' && facetResult && (
              <DuplicateFilterPanel
                onClose={() => {
                  setLeftToolPanel('none');
                  setTextFilter(null);
                  setPage(1);
                  tableRef.current?.reloadPage();
                }}
                facet={{
                  field: facetResult.fieldKey,
                  values: facetResult.items.map((i) => ({
                    value: i.value,
                    count: i.count,
                  })),
                }}
                onBatchEdit={(payload) => {
                  setTextFilter({
                    kind: 'duplicate',
                    fieldKey: payload.field,
                    mode: payload.mode,
                    query: payload.query,
                  });
                  setPage(1);
                  tableRef.current?.reloadPage();
                }}
              />
            )}

            {leftToolPanel === 'contentFilter' && facetResult && (
              <ContentFilterPanel
                onClose={() => setLeftToolPanel('none')}
                facet={{
                  field: facetResult.fieldKey,
                  values: facetResult.items.map((i) => ({
                    value: i.value,
                    count: i.count,
                  })),
                }}
                onBatchEdit={async (payload) => {
                  if (selectedProject == null || !activeTableName) return;
                  const res = await window.electron.ipcRenderer.invoke(
                    'batch-update-field-value',
                    selectedProject,
                    activeTableName,
                    payload.field,
                    payload.fromValue,
                    payload.toValue,
                  );
                  if (!res?.ok) {
                    console.warn(res?.error ?? 'batch update failed');
                    return;
                  }
                  tableRef.current?.reloadPage();
                  await refreshFacet(payload.field);
                }}
              />
            )}

            {leftToolPanel === 'stringReplace' && facetResult && (
              <StringReplacePanel
                onClose={() => setLeftToolPanel('none')}
                facet={{
                  field: facetResult.fieldKey,
                  values: facetResult.items.map((i) => ({
                    value: i.value,
                    count: i.count,
                  })),
                }}
                onReplace={async (payload) => {
                  if (selectedProject == null || !activeTableName) return;
                  const selectedPks = await resolveTargetPks(
                    payload.rowNumbers,
                  );
                  if (selectedPks === null) return;
                  const res = await window.electron.ipcRenderer.invoke(
                    'batch-replace-field-value',
                    selectedProject,
                    activeTableName,
                    payload.field,
                    payload.mode,
                    payload.from,
                    payload.to,
                    selectedPks,
                  );
                  if (!res?.ok) {
                    console.warn(res?.error ?? 'replace failed');
                    return;
                  }
                  tableRef.current?.reloadPage();
                  await refreshFacet(payload.field);
                }}
              />
            )}

            {leftToolPanel === 'fieldSwap' && (
              <FieldSwapPanel
                onClose={() => setLeftToolPanel('none')}
                sourceField={facetResult?.fieldKey ?? fieldKeys[0] ?? ''}
                allFields={fieldKeys}
                onSwap={async (payload) => {
                  if (selectedProject == null || !activeTableName) return;
                  const selectedPks = await resolveTargetPks(
                    payload.rowNumbers,
                  );
                  if (selectedPks === null) return;
                  const res = await window.electron.ipcRenderer.invoke(
                    'swap-table-fields',
                    selectedProject,
                    activeTableName,
                    payload.fromField,
                    payload.toField,
                    selectedPks,
                  );
                  if (!res?.ok) {
                    console.warn(res?.error ?? 'swap failed');
                    return;
                  }
                  tableRef.current?.reloadPage();
                }}
              />
            )}

            {leftToolPanel === 'speciesApi' && (
              <SpeciesApiPanel
                onClose={() => setLeftToolPanel('none')}
                onConnect={async () => {
                  if (selectedProject == null || !activeTableName) return;
                  console.log('[species-api] start', {
                    projectId: selectedProject,
                    tableName: activeTableName,
                  });
                  const res = await window.electron.ipcRenderer.invoke(
                    'sync-scientific-name-taxon',
                    selectedProject,
                    activeTableName,
                  );
                  if (!res?.ok) {
                    console.warn(res?.error ?? 'sync species api failed');
                    return res;
                  }
                  if (res?.schemaUpdated) {
                    setActiveTableName((prev) => (prev ? `${prev}` : prev));
                  }
                  console.log('[species-api] done', res);
                  tableRef.current?.reloadPage();
                  return res;
                }}
              />
            )}

            <CustomAccordion
              title={cleanText.accordion.errorMessages} // 錯誤訊息
              icon={<FormatListBulletedIcon sx={{ color: 'primary.main' }} />}
            >
              {validationBusy ? (
                <Typography variant="body2" color="text.secondary">
                  {cleanText.accordion.validating} {/* 驗證中... */}
                </Typography>
              ) : (
                <FieldErrorAccordionList items={validationItems} />
              )}
            </CustomAccordion>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                bgcolor: '#e8eaf6',
              },
            }}
            onClick={() => navigate('/data-validate')}
          >
            {cleanText.accordion.retryValidate} {/* 再次驗證 */}
          </Button>
        </Box>

        {/* 右側欄 */}
        <Box
          sx={{
            flex: 4,
            display: 'flex',
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'primary.main',
            px: 2,
            py: 2,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              mb: 1,
            }}
          >
            {/* 左側 */}
            <Stack direction="row" spacing={1} alignItems="center">
              <HoverMenuButton
                label={cleanText.menus.filterData} // 資料篩選
                startIcon={<FilterAltIcon fontSize="small" />}
                items={[
                  {
                    label: cleanText.menus.filterByContent, // 內容篩選
                    startIcon: <PlaylistAddCheckIcon fontSize="small" />,
                    onClick: async () => {
                      const res = await getFacetSelectionWithWarning();
                      if (!res) return;

                      setFacetResult({
                        tableName: res.tableName,
                        fieldKey: res.fieldKey,
                        items: res.items ?? [],
                      });
                      setLeftToolPanel('contentFilter');
                    },
                  },
                  {
                    label: cleanText.menus.filterByText, // 文字篩選
                    startIcon: <TextFieldsIcon fontSize="small" />,
                    onClick: async () => {
                      const res = await getFacetSelectionWithWarning();
                      if (!res) return;

                      setFacetResult({
                        tableName: res.tableName,
                        fieldKey: res.fieldKey,
                        items: res.items ?? [],
                      });
                      setLeftToolPanel('textFilter');
                    },
                  },
                  {
                    label: cleanText.menus.filterDuplicates,
                    startIcon: <ContentCopyIcon fontSize="small" />,
                    onClick: async () => {
                      const res = await getFacetSelectionWithWarning();
                      if (!res) return;

                      setFacetResult({
                        tableName: res.tableName,
                        fieldKey: res.fieldKey,
                        items: res.items ?? [],
                      });
                      setLeftToolPanel('duplicateFilter');
                    },
                  },
                ]}
              />

              <HoverMenuButton
                label={cleanText.menus.editContent} // 內容修改
                startIcon={<TuneIcon fontSize="small" />}
                items={[
                  {
                    label: cleanText.menus.stringReplace, // 字串取代
                    startIcon: <FindReplaceIcon fontSize="small" />,
                    onClick: async () => {
                      const res = await getFacetSelectionWithWarning();
                      if (!res) return;

                      setFacetResult({
                        tableName: res.tableName,
                        fieldKey: res.fieldKey,
                        items: res.items ?? [],
                      });
                      setLeftToolPanel('stringReplace');
                    },
                  },
                  {
                    label: cleanText.menus.swapFieldContent, // 欄位內容調換
                    startIcon: <SwapHorizIcon fontSize="small" />,
                    onClick: async () => {
                      const res = await getFacetSelectionWithWarning();
                      if (!res) return;

                      setFacetResult({
                        tableName: res.tableName,
                        fieldKey: res.fieldKey,
                        items: res.items ?? [],
                      });
                      setLeftToolPanel('fieldSwap');
                    },
                  },
                ]}
              />

              <HoverMenuButton
                label="API"
                startIcon={<CloudSyncIcon fontSize="small" />}
                items={[
                  {
                    label: cleanText.menus.speciesApi, // 串接物種 API
                    startIcon: <CloudSyncIcon fontSize="small" />,
                    onClick: () => setLeftToolPanel('speciesApi'),
                  },
                ]}
              />

              {textFilter && (
                <Button
                  // size="small"
                  variant="outlined"
                  startIcon={<CloseIcon fontSize="small" />}
                  sx={{
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': { bgcolor: 'rgba(244,67,54,0.08)' },
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => {
                    setTextFilter(null);
                    setPage(1);
                    tableRef.current?.reloadPage();
                  }}
                >
                  {cleanText.menus.closeFilter} {/* 關閉篩選 */}
                </Button>
              )}

              <SaveStatusChip saveStatus={saveStatus} />
            </Stack>

            {/* 右側：頁碼控制 */}
            <PaginationControls
              page={page}
              totalRows={totalRows}
              pageSize={pageSize}
              pageSizeMode={pageSizeMode}
              onPageChange={setPage}
              onPageSizeModeChange={setPageSizeMode}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </Stack>

          <Box
            ref={tableContainerRef}
            sx={{
              flex: 1,
              minHeight: 0,
              mb: `${TABLE_BOTTOM_MARGIN}px`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {textFilter && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {cleanText.states.showingFilteredResult}{' '}
                {/* 目前顯示為篩選結果 */}
              </Typography>
            )}
            {selectedProject == null ? (
              <div>
                {cleanText.states.selectProjectFirst} {/* 請先選擇專案 */}
              </div>
            ) : !activeTableName ? (
              <div>
                {cleanText.states.selectTableFirst} {/* 請先選擇資料表 */}
              </div>
            ) : (
              <CustomHotTable
                key={`${selectedProject}-${activeTableName}`}
                ref={tableRef}
                projectId={selectedProject}
                tableName={activeTableName}
                page={page}
                pageSize={pageSize}
                height={
                  tableContainerHeight > 0
                    ? Math.max(320, Math.floor(tableContainerHeight))
                    : 610
                }
                textFilter={textFilter}
                onTotalRowsChange={setTotalRows}
                onSaveStatusChange={setSaveStatus}
              />
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: '#e8eaf6',
                },
              }}
              onClick={goPrevPage}
            >
              {cleanText.actions.previous} {/* 上一步 */}
            </Button>

            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderColor: 'error.dark',
                color: 'error.dark',
                '&:hover': { bgcolor: 'error.light' },
              }}
              onClick={async () => {
                if (selectedProject == null) return;
                const res = await window.electron.ipcRenderer.invoke(
                  'export-project-data-zip',
                  selectedProject,
                );
                if (!res?.ok) {
                  console.warn(res?.error ?? 'export zip failed');
                }
              }}
            >
              {cleanText.actions.exportData} {/* 匯出資料 */}
            </Button>
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(actionWarning)}
        autoHideDuration={3000}
        onClose={() => setActionWarning(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setActionWarning(null)}
          severity="warning"
          variant="filled"
        >
          {actionWarning}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default CleanPage;
