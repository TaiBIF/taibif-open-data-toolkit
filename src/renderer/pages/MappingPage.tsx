import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';

import {
  Box,
  Button,
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';

import CustomAccordion from '../components/CustomAccordion';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FieldMappingStatusList from '../components/FieldMappingStatusList';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import '../styles/handsontable-overrides.css';
import { useI18n } from '../contexts/i18n';

registerAllModules();

const MappingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { messages } = useI18n();
  const mappingText = messages.mappingPage;
  const state = (location.state ?? {}) as {
    projectId?: number;
    tableName?: string;
    filePath?: string;
    fileName?: string;
    headers?: string[];
    rows?: string[][];
  };

  const [projectHeaders, setProjectHeaders] = useState<string[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>(state.headers ?? []);
  const [fileRows, setFileRows] = useState<string[][]>(state.rows ?? []);
  const [fileName, setFileName] = useState<string | undefined>(state.fileName);
  const [filePath, setFilePath] = useState<string | undefined>(state.filePath);

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const goPrevPage = () => {
    navigate('/data-edit');
  };

  useEffect(() => {
    setFileHeaders(state.headers ?? []);
    setFileRows(state.rows ?? []);
    setFileName(state.fileName);
    setFilePath(state.filePath);
  }, [state.headers, state.rows, state.fileName, state.filePath]);

  useEffect(() => {
    if (!state.projectId || !state.tableName) return;

    window.electron.ipcRenderer
      .invoke('get-table-schema', state.projectId, state.tableName)
      .then((schemaRow) => {
        const parsed = schemaRow?.schema_json
          ? JSON.parse(schemaRow.schema_json)
          : { columns: [] };
        const cols = parsed?.columns ?? [];
        setProjectHeaders(cols.map((c: { key: string }) => c.key));
      })
      .catch((err) => console.warn('get-table-schema failed:', err));
  }, [state.projectId, state.tableName]);

  useEffect(() => {
    if (!projectHeaders.length || !fileHeaders.length) return;

    setMapping((prev) => {
      const next = { ...prev };
      for (const field of projectHeaders) {
        if (next[field]) continue;
        if (fileHeaders.includes(field)) {
          next[field] = field;
        }
      }
      return next;
    });
  }, [projectHeaders, fileHeaders]);

  const mappingStatus = useMemo(() => {
    const used = new Map<string, string[]>();

    for (const [field, selected] of Object.entries(mapping)) {
      if (!selected) continue;
      const list = used.get(selected) ?? [];
      list.push(field);
      used.set(selected, list);
    }

    return projectHeaders.map((field) => {
      const selected = mapping[field];
      if (!selected) return { field, status: 'unmapped' as const };
      const dup = (used.get(selected)?.length ?? 0) > 1;
      return {
        field,
        status: dup ? ('duplicate' as const) : ('mapped' as const),
      };
    });
  }, [mapping, projectHeaders]);

  const handleImport = async () => {
    if (!state.projectId || !state.tableName || !filePath) {
      setImportError(mappingText.errors.missingImportTarget); // 缺少匯入檔案或目標資料表
      return;
    }

    setImportBusy(true);
    const res = await window.electron.ipcRenderer.invoke(
      'import-mapping-file',
      state.projectId,
      state.tableName,
      filePath,
      projectHeaders,
      mapping,
    );
    setImportBusy(false);

    if (!res?.ok) {
      setImportError(res?.error ?? mappingText.errors.importFailed); // 匯入失敗
      return;
    }

    setImportSuccess(
      mappingText.success.importedRows.replace('{count}', String(res.inserted)), // 已匯入 {count} 筆資料
    );
    navigate('/data-edit');
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
            overflow: 'auto',
          }}
        >
          <CustomAccordion
            title={mappingText.sections.mappingStatusTitle} // 欄位對應狀態
            sx={{ mt: 1 }}
            icon={<FormatListBulletedIcon sx={{ color: 'primary.main' }} />}
          >
            <FieldMappingStatusList rows={mappingStatus} />
          </CustomAccordion>
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
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" color="text.primary">
                    {mappingText.sections.filePreviewTitle} {/* 檔案預覽 */}
                  </Typography>
                  {fileName && (
                    <Typography variant="caption" color="text.secondary">
                      {fileName}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', marginBottom: 2 }}
                >
                  {mappingText.sections.filePreviewDescription}{' '}
                  {/* 以下為所選檔案的前五筆資料預覽，方便快速查看檔案內容，並進行欄位對應設定 */}
                </Typography>

                {fileHeaders.length > 0 ? (
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                    }}
                  >
                    <HotTable
                      className="ht-theme-main"
                      data={fileRows.slice(0, 5)}
                      colHeaders={fileHeaders}
                      rowHeaders={true}
                      height={175}
                      licenseKey="non-commercial-and-evaluation"
                      readOnly={true}
                      stretchH="all"
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {mappingText.sections.noImportFileSelected}{' '}
                    {/* 尚未選擇匯入檔案 */}
                  </Typography>
                )}
              </Stack>

              <Stack spacing={1.5}>
                <Typography variant="h6" color="text.primary">
                  {mappingText.sections.fieldMappingTitle} {/* 欄位對應 */}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', marginBottom: 2 }}
                >
                  {mappingText.sections.fieldMappingDescription}{' '}
                  {/* 左側為本專案資料表中的欄位，右側為匯入檔案中的欄位。請將檔案中的欄位依照資料內容，對應到正確的專案欄位。 */}
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,

                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography>
                    {mappingText.headers.projectField} {/* 專案欄位 */}
                  </Typography>
                  <Typography>
                    {mappingText.headers.importField} {/* 匯入欄位 */}
                  </Typography>
                </Box>

                {projectHeaders.map((header) => (
                  <Box
                    key={header}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      bgcolor: '#e8eaf6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ flex: 1, wordBreak: 'break-word' }}
                    >
                      {header}
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <Select
                        value={mapping[header] ?? ''}
                        displayEmpty
                        onChange={(event) => {
                          const next = String(event.target.value);
                          setMapping((prev) => ({ ...prev, [header]: next }));
                        }}
                      >
                        <MenuItem value="">
                          <Typography variant="body2" color="text.secondary">
                            {mappingText.placeholders.unselected} {/* 未選擇 */}
                          </Typography>
                        </MenuItem>
                        {fileHeaders.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ))}
              </Stack>
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
                {mappingText.actions.cancelImport} {/* 取消匯入 */}
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
                onClick={handleImport}
                disabled={importBusy}
              >
                {mappingText.actions.importData} {/* 匯入資料 */}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(importError)}
        autoHideDuration={3000}
        onClose={() => setImportError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setImportError(null)}
          severity="error"
          variant="filled"
        >
          {importError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(importSuccess)}
        autoHideDuration={3000}
        onClose={() => setImportSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setImportSuccess(null)}
          severity="success"
          variant="filled"
        >
          {importSuccess}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default MappingPage;
