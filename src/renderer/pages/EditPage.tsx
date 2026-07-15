import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import CustomHotTable, { type HotTableApi } from '../components/CustomHotTable';
import type { SaveStatus } from '../components/CustomHotTable';
import CustomTab from '../components/CustomTab';
import CustomAccordion from '../components/CustomAccordion';
import FacetFrequencyList, {
  type FacetFrequencyItem,
} from '../components/FacetFrequencyList';
import PaginationControls from '../components/PaginationControls';
import useAutoPageSize from '../hooks/useAutoPageSize';

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
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';

import StorageIcon from '@mui/icons-material/Storage';
import EditIcon from '@mui/icons-material/Edit';
import GetAppIcon from '@mui/icons-material/GetApp';
import PublishIcon from '@mui/icons-material/Publish';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddBoxIcon from '@mui/icons-material/AddBox';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

const EditPage = () => {
  const navigate = useNavigate();
  const tableRef = useRef<HotTableApi | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const { messages } = useI18n();
  const editText = messages.editPage;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageSizeMode, setPageSizeMode] = useState<'auto' | 'manual'>('auto');
  const [totalRows, setTotalRows] = useState(0);

  const { selectedProject, tables, setTables } = useProject();
  const [activeTableName, setActiveTableName] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [facetPanelOpen, setFacetPanelOpen] = useState(true);
  const [facetResult, setFacetResult] = useState<null | {
    tableName: string;
    fieldKey: string;
    items: FacetFrequencyItem[];
  }>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetCount, setDeleteTargetCount] = useState(0);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [validateBusy, setValidateBusy] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);

  const { containerHeight: tableContainerHeight } = useAutoPageSize({
    containerRef: tableContainerRef,
    enabled: pageSizeMode === 'auto',
    page,
    pageSize,
    bottomMargin: TABLE_BOTTOM_MARGIN,
    setPage,
    setPageSize,
  });

  const SaveStatusChip = ({ saveStatus }: { saveStatus: SaveStatus }) => {
    if (saveStatus === 'idle') return null;

    const label =
      saveStatus === 'saving'
        ? editText.saveStatus.saving
        : saveStatus === 'saved'
          ? editText.saveStatus.saved
          : editText.saveStatus.failed;

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

          // label padding 更小
          '& .MuiChip-label': {
            px: 0.75, // 原本 1
            py: 0, // 避免撐高
            lineHeight: 1, // 更緊
          },

          // icon margin 更小
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

  const handleConfirmDelete = async () => {
    const api = tableRef.current;
    if (!api) return;

    setDeleteBusy(true);
    const res = await api.deleteSelectedRows();
    setDeleteBusy(false);
    setDeleteDialogOpen(false);

    if (!res.ok) {
      setDeleteError(res.error ?? editText.errors.deleteFailed);
      return;
    }

    // 刪完後可能頁數變少，修正 page
    const newTotalPages = Math.max(1, Math.ceil(res.newTotal / pageSize));
    setPage((p) => Math.min(p, newTotalPages));
  };

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

  // 開啟新專案時，直接從 context 取得模板資訊
  useEffect(() => {
    if (!tables?.length) return;

    const exists =
      activeTableName && tables.some((t) => t.name === activeTableName);

    if (!exists) {
      setActiveTableName(tables[0].name);
    }
  }, [tables, activeTableName]);

  const validateData = async () => {
    if (selectedProject == null) {
      setValidateError(editText.errors.selectProjectFirst);
      return;
    }

    setValidateBusy(true);
    setValidateError(null);

    try {
      const result = await window.electron.ipcRenderer.invoke(
        'validate-project-table-data',
        selectedProject,
      );

      if (!result?.ok) {
        setValidateError(result?.error ?? editText.errors.validateFailed);
        return;
      }

      navigate('/data-validate', {
        state: {
          validation: result,
        },
      });
    } catch (err) {
      setValidateError(
        `${editText.errors.validateFailedWithReasonPrefix}${String(err)}`,
      );
    } finally {
      setValidateBusy(false);
    }
  };

  const mappingData = () => {
    if (selectedProject == null || !activeTableName) return;

    window.electron.ipcRenderer
      .invoke('pick-mapping-file')
      .then((res) => {
        if (!res?.ok) return;

        navigate('/data-mapping', {
          state: {
            projectId: selectedProject,
            tableName: activeTableName,
            filePath: res.filePath,
            fileName: res.fileName,
            headers: res.headers ?? [],
            rows: res.rows ?? [],
          },
        });
      })
      .catch((err) => console.warn('pick-mapping-file failed:', err));
  };

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
              setPage(1); // 先改 page
              setActiveTableName(newKey); // 再切表
              setFacetResult(null); // 清掉獲取行資料結果
            }}
            items={tables.map((t) => ({
              key: t.name,
              type: t.kind, // 'core' | 'extension'
              title: t.displayName, // 你目前的欄位名
              subtitle:
                t.kind === 'core'
                  ? editText.tableTabs.coreSubtitle
                  : editText.tableTabs.extensionSubtitle,
            }))}
          />

          <Box sx={{ mt: 1, flex: 1, overflow: 'auto' }}>
            {facetResult && facetResult.tableName === activeTableName && (
              <CustomAccordion
                title={editText.tableTabs.facetTitle}
                subtitle={`${facetResult.fieldKey}`}
                icon={<FormatListBulletedIcon sx={{ color: 'primary.main' }} />}
                expanded={facetPanelOpen}
                onExpandedChange={setFacetPanelOpen}
                closable
                onClose={() => setFacetResult(null)}
              >
                <FacetFrequencyList items={facetResult.items} />
              </CustomAccordion>
            )}
          </Box>
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
                label={editText.menus.data}
                startIcon={<StorageIcon fontSize="small" />}
                items={[
                  {
                    label: editText.menus.getFacetRows,
                    startIcon: <PlaylistAddCheckIcon fontSize="small" />,
                    onClick: async () => {
                      const api = tableRef.current;
                      if (!api) return;

                      const res = await api.facetSelectedHeader({ limit: 200 });

                      if (!res.ok) {
                        console.warn(res.error);
                        return;
                      }

                      setFacetResult({
                        tableName: res.tableName,
                        fieldKey: res.fieldKey,
                        items: res.items ?? [],
                      });

                      setFacetPanelOpen(true);
                    },
                  },
                  {
                    label: editText.menus.importToCurrentTable,
                    startIcon: <PublishIcon fontSize="small" />,
                    onClick: () => {
                      mappingData();
                    },
                  },
                  {
                    label: editText.menus.exportCurrentTable,
                    startIcon: <GetAppIcon fontSize="small" />,
                    onClick: async () => {
                      if (selectedProject == null || !activeTableName) return;

                      const res = await window.electron.ipcRenderer.invoke(
                        'export-table-data',
                        selectedProject,
                        activeTableName,
                      );

                      if (!res?.ok) {
                        console.warn(res?.error ?? 'export failed');
                      }
                    },
                  },
                ]}
              />

              <HoverMenuButton
                label={editText.menus.edit}
                startIcon={<EditIcon fontSize="small" />}
                items={[
                  {
                    label: editText.menus.deleteSelectedRows,
                    startIcon: <DeleteOutlineIcon fontSize="small" />,
                    onClick: () => {
                      const api = tableRef.current;
                      if (!api) return;

                      const pks = api.getSelectedPks();
                      if (pks.length === 0) {
                        setDeleteError(editText.errors.selectRowsFirst);
                        return;
                      }

                      setDeleteTargetCount(pks.length);
                      setDeleteDialogOpen(true);
                    },
                  },
                  {
                    label: editText.menus.appendEmptyPage,
                    startIcon: <AddBoxIcon fontSize="small" />,
                    onClick: async () => {
                      const api = tableRef.current;
                      if (!api) return;

                      const res = await api.appendEmptyPage();
                      if (!res.ok) {
                        console.error(res.error);
                        return;
                      }

                      // 跳到新增後最後一頁（appendEmptyPage 已經幫你算好）
                      setPage(res.goToPage);
                    },
                  },
                ]}
              />

              <SaveStatusChip saveStatus={saveStatus} />

              <Tooltip
                arrow
                title={
                  <Box sx={{ py: 0.25 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: '#c62828', lineHeight: 1.2 }}
                        >
                          {editText.tooltip.requiredFieldTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {editText.tooltip.requiredFieldDesc}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: '#1565c0', lineHeight: 1.2 }}
                        >
                          {editText.tooltip.customFieldTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {editText.tooltip.customFieldDesc}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                }
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: '#ffffff',
                      color: 'text.primary',
                      border: '1px solid',
                      borderColor: 'divider',
                    },
                  },
                  arrow: {
                    sx: {
                      color: '#ffffff',
                      '&::before': {
                        border: '1px solid',
                        borderColor: 'divider',
                      },
                    },
                  },
                }}
              >
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
            {selectedProject == null ? (
              <div>{editText.emptyState.selectProjectFirst}</div>
            ) : !activeTableName ? (
              <div>{editText.emptyState.selectTableFirst}</div>
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
                markCustomHeaders
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
              onClick={() => navigate('/data-template')}
            >
              {editText.actions.previous}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              disabled={validateBusy}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: '#e8eaf6',
                },
              }}
              onClick={validateData}
            >
              {validateBusy
                ? editText.actions.validating
                : editText.actions.next}
            </Button>
          </Stack>

          <Dialog
            open={deleteDialogOpen}
            onClose={() => {
              if (!deleteBusy) setDeleteDialogOpen(false);
            }}
            aria-labelledby="delete-rows-title"
            aria-describedby="delete-rows-description"
          >
            <DialogTitle id="delete-rows-title">
              {editText.deleteDialog.title}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-rows-description" variant="body2">
                {editText.deleteDialog.descriptionPrefix} {deleteTargetCount}{' '}
                {editText.deleteDialog.descriptionSuffix}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteBusy}
              >
                {editText.deleteDialog.cancel}
              </Button>
              <Button onClick={handleConfirmDelete} disabled={deleteBusy}>
                {editText.deleteDialog.confirm}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={Boolean(deleteError)}
            autoHideDuration={3000}
            onClose={() => setDeleteError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setDeleteError(null)}
              severity="warning"
              variant="filled"
            >
              {deleteError}
            </Alert>
          </Snackbar>

          <Snackbar
            open={Boolean(validateError)}
            autoHideDuration={3500}
            onClose={() => setValidateError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setValidateError(null)}
              severity="error"
              variant="filled"
            >
              {validateError}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Layout>
  );
};

export default EditPage;
