import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import CustomTab from '../components/CustomTab';
import CustomAccordion from '../components/CustomAccordion';
import ErrorRowList from '../components/ErrorRowList';
import FieldFrequencyList from '../components/FieldFrequencyList';
import {
  groupValidationErrors,
  translateValidationGroupTitle,
  type ValidationErrorRow,
  type ValidationErrorGroup,
} from '../utils/validationErrorGroups';

import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';

import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import { useI18n } from '../contexts/i18n';
import { useProject } from '../contexts/project';

type ValidationFieldStat = {
  field: string;
  accuracy: number;
};

type TableValidationResult = {
  tableName: string;
  displayName: string;
  totalRows: number;
  errorCount: number;
  errors: ValidationErrorRow[];
  fieldStats: ValidationFieldStat[];
};

type ProjectValidationResult = {
  ok: boolean;
  projectId: number;
  totalErrors: number;
  tables: TableValidationResult[];
  validatedAt: string;
  error?: string;
};

const ValidatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject, tables, setTables } = useProject();
  const { messages, locale } = useI18n();
  const validateText = messages.validatePage;

  const [activeTableName, setActiveTableName] = useState<string | null>(null);
  const [validationResult, setValidationResult] =
    useState<ProjectValidationResult | null>(null);
  const [validateBusy, setValidateBusy] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);

  const routeValidation =
    (location.state as { validation?: ProjectValidationResult } | undefined)
      ?.validation ?? null;

  const activeValidation = validationResult?.tables?.find(
    (t) => t.tableName === activeTableName,
  );
  const activeErrors = activeValidation?.errors ?? [];
  const activeFieldStats = activeValidation?.fieldStats ?? [];
  const groupedErrors: ValidationErrorGroup[] =
    groupValidationErrors(activeErrors);

  const localizedGroupedErrors = groupedErrors.map((group) => ({
    ...group,
    title: translateValidationGroupTitle(group.title, locale),
  }));

  const cleanData = () => {
    navigate('/data-clean', {
      state: { validation: validationResult },
    });
  };
  const goPrevPage = () => {
    navigate('/data-edit');
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

  useEffect(() => {
    if (selectedProject == null) {
      setValidationResult(null);
      return;
    }

    const hasRouteValidation =
      routeValidation?.ok && routeValidation.projectId === selectedProject;

    if (hasRouteValidation) {
      setValidationResult(routeValidation);
      setValidateError(null);
      return;
    }

    let cancelled = false;

    const loadValidation = async () => {
      setValidateBusy(true);
      setValidateError(null);

      try {
        const res = (await window.electron.ipcRenderer.invoke(
          'validate-project-table-data',
          selectedProject,
        )) as ProjectValidationResult;

        if (cancelled) return;

        if (!res?.ok) {
          setValidationResult(null);
          setValidateError(res?.error ?? validateText.errors.validateFailed);
          return;
        }

        setValidationResult(res);
      } catch (err) {
        if (cancelled) return;
        setValidationResult(null);
        setValidateError(
          `${validateText.errors.validateFailedWithReasonPrefix}${String(err)}`,
        );
      } finally {
        if (!cancelled) setValidateBusy(false);
      }
    };

    loadValidation();

    return () => {
      cancelled = true;
    };
  }, [
    selectedProject,
    routeValidation,
    validateText.errors.validateFailed,
    validateText.errors.validateFailedWithReasonPrefix,
  ]);

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
            }}
            items={tables.map((t) => ({
              key: t.name,
              type: t.kind, // 'core' | 'extension'
              title: t.displayName, // 你目前的欄位名
              subtitle:
                t.kind === 'core'
                  ? validateText.tableTabs.coreSubtitle
                  : validateText.tableTabs.extensionSubtitle,
            }))}
          />
          <Box sx={{ mt: 1, flex: 1, overflow: 'auto' }}>
            <CustomAccordion
              title={validateText.tableTabs.fieldFrequencyTitle}
              icon={<FormatListBulletedIcon sx={{ color: 'primary.main' }} />}
            >
              <FieldFrequencyList rows={activeFieldStats} />
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
          >
            {validateText.actions.downloadErrors}
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
            overflow: 'hidden', // 外層不要捲
          }}
        >
          <Stack
            direction="column"
            sx={{
              height: '100%',
            }}
          >
            {/* 上方內容（可捲動） */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                mb: 1,
              }}
            >
              <Typography variant="h6">
                {validateText.sections.errorListTitle} {/* 錯誤訊息清單 */}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {validateText.sections.errorListDescription}
              </Typography>
              {validateBusy ? (
                <CustomAccordion
                  title={validateText.states.validatingTitle}
                  count={0}
                >
                  <Typography variant="body2" color="text.secondary">
                    {validateText.states.validatingDescription}
                  </Typography>
                </CustomAccordion>
              ) : localizedGroupedErrors.length === 0 ? (
                <Chip
                  size="small"
                  variant="filled"
                  icon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                  label={validateText.states.noErrorData}
                  sx={{
                    bgcolor: 'rgba(76,175,80,0.14)',
                    color: 'success.main',
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
                    '&:hover': { bgcolor: 'rgba(76,175,80,0.14)' },
                  }}
                />
              ) : (
                <Stack spacing={1}>
                  {localizedGroupedErrors.map((group) => (
                    <CustomAccordion
                      key={group.key}
                      title={group.title}
                      icon={
                        group.severity === 'error' ? (
                          <ErrorOutlineIcon sx={{ color: 'error.main' }} />
                        ) : (
                          <WarningAmberIcon sx={{ color: 'warning.main' }} />
                        )
                      }
                      count={group.count}
                    >
                      <ErrorRowList rows={group.rows} />
                    </CustomAccordion>
                  ))}
                </Stack>
              )}
            </Box>

            {/* 底部按鈕（固定在底） */}
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
                {validateText.actions.previous}
              </Button>

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
                onClick={cleanData}
              >
                {validateText.actions.next}
              </Button>
            </Stack>
          </Stack>

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

export default ValidatePage;
