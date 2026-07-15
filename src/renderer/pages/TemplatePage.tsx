import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Autocomplete,
  TextField,
  Button,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BallotIcon from '@mui/icons-material/Ballot';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import Layout from '../components/Layout';
import TemplateFieldPanel from '../components/TemplateField';
import {
  coreTemplates,
  extensionTemplates,
  themeTemplates,
} from '../data/templates';

import type { Table } from '../contexts/project';
import { FIELD_VOCAB_KEY } from '../../shared/controlledVocab';

import { useI18n } from '../contexts/i18n';
import { useProject } from '../contexts/project';

interface TemplateField {
  column_name: string;
  column_type: string | null;
  definition_zh: string | null;
  definition_en?: string | null;
  common_name: string | null;
  example: string | null;
  example_en?: string | null;
  is_required: boolean;
  is_recommended: boolean;
  is_custom?: boolean;
  last_updated: string;
}

type TemplateOption = { label: string; value: string; group?: string };
interface ThemeTemplate {
  label: string;
  value: string;
  group?: string;
  core: TemplateOption;
  extensions: TemplateOption[];
}

type CheckedFieldsMap = Record<string, Record<string, boolean>>;
type CustomFieldType = 'text' | 'number' | 'date' | 'boolean';
type CustomFieldRecord = {
  fieldName: string;
  fieldNameZh: string;
  fieldType: string;
  templates: string[];
};
type SavedCustomTemplateOption = {
  name: string;
  updated_at?: string;
};
const CUSTOM_FIELD_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const normalizeSchemaColumnType = (
  value: unknown,
): 'text' | 'numeric' | 'date' | 'checkbox' => {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  if (v === 'number' || v === 'numeric') return 'numeric';
  if (
    v === 'int' ||
    v === 'integer' ||
    v === 'float' ||
    v === 'double' ||
    v === 'decimal' ||
    v === 'numeric'
  ) {
    return 'numeric';
  }
  if (v === 'date' || v === 'datetime' || v === 'timestamp') return 'date';
  if (v === 'bool' || v === 'boolean' || v === 'checkbox') return 'checkbox';
  return 'text';
};

const TemplatePage = () => {
  const navigate = useNavigate();
  const { selectedProject, setTables } = useProject();
  const { messages } = useI18n();
  const templateText = messages.templatePage;
  const getOptionLabel = (option: { label: string; value: string }) =>
    templateText.optionLabels[option.value] ?? option.label;
  const getOptionGroup = (group?: string) =>
    group
      ? templateText.optionGroups[group] ?? group
      : templateText.sidebar.uncategorized;

  const getButtonStyle = (isSelected: boolean) => {
    return isSelected
      ? {
          bgcolor: 'secondary.main',
          color: 'common.white',
          boxShadow: 'none',
        }
      : {
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': {
            bgcolor: '#e8eaf6',
          },
        };
  };

  const [mode, setMode] = useState<'template' | 'topic' | 'custom' | null>(
    'custom',
  );

  const [coreTemplateData, setCoreTemplateData] = useState<
    { name: string; fields: TemplateField[] }[]
  >([]);

  const [extensionTemplatesData, setExtensionTemplatesData] = useState<
    { name: string; fields: TemplateField[] }[]
  >([]);

  const [selectedCore, setSelectedCore] = useState<TemplateOption | null>(null);

  const [selectedExtension, setSelectedExtension] = useState<
    TemplateOption[] | null
  >(null);

  const [selectedTheme, setSelectedTheme] = useState<ThemeTemplate | null>(
    null,
  );

  const [checkedFields, setCheckedFields] = useState<CheckedFieldsMap>({});
  const [hoveredField, setHoveredField] = useState<null | TemplateField>(null);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customTab, setCustomTab] = useState(0);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldNameZh, setCustomFieldNameZh] = useState('');
  const [customFieldType, setCustomFieldType] = useState<CustomFieldType>('text');
  const [customTargetTemplates, setCustomTargetTemplates] = useState<
    TemplateOption[]
  >([]);
  const [existingCustomFields, setExistingCustomFields] = useState<
    CustomFieldRecord[]
  >([]);
  const [pickedExistingField, setPickedExistingField] =
    useState<CustomFieldRecord | null>(null);
  const [existingTargetTemplates, setExistingTargetTemplates] = useState<
    TemplateOption[]
  >([]);
  const [customDialogError, setCustomDialogError] = useState('');
  const [savedCustomTemplates, setSavedCustomTemplates] = useState<
    SavedCustomTemplateOption[]
  >([]);
  const [selectedSavedTemplate, setSelectedSavedTemplate] =
    useState<SavedCustomTemplateOption | null>(null);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveTemplateError, setSaveTemplateError] = useState('');
  const [customFieldSuccessOpen, setCustomFieldSuccessOpen] = useState(false);

  const allTemplateOptions: TemplateOption[] = [
    ...coreTemplates,
    ...extensionTemplates,
  ];

  const loadSavedCustomTemplates = async () => {
    const rows = (await window.electron.ipcRenderer.invoke(
      'list-custom-templates',
    )) as SavedCustomTemplateOption[];
    setSavedCustomTemplates(Array.isArray(rows) ? rows : []);
  };

  const reloadTemplateFields = async () => {
    if (!selectedProject) return;

    if (selectedCore) {
      await loadCoreTemplate(
        selectedCore.value,
        setCoreTemplateData,
        setCheckedFields,
      );
    }

    if (selectedExtension?.length) {
      for (const ext of selectedExtension) {
        await loadExtensionTemplate(
          ext.value,
          setExtensionTemplatesData,
          setCheckedFields,
        );
      }
    }
  };

  const loadExistingCustomFields = async () => {
    if (!selectedProject) return;
    const rows = (await window.electron.ipcRenderer.invoke(
      'list-project-custom-fields',
      selectedProject,
    )) as CustomFieldRecord[];
    setExistingCustomFields(Array.isArray(rows) ? rows : []);
  };

  const openCustomDialog = async () => {
    if (!selectedProject) {
      alert(templateText.alerts.selectProjectFirst);
      return;
    }

    setCustomDialogError('');
    setCustomDialogOpen(true);
    await loadExistingCustomFields();
  };

  const applySavedCustomTemplate = async (
    option: SavedCustomTemplateOption | null,
  ) => {
    setSelectedSavedTemplate(option);
    if (!option?.name) {
      setSelectedTheme(null);
      setSelectedCore(null);
      setSelectedExtension(null);
      setCoreTemplateData([]);
      setExtensionTemplatesData([]);
      setCheckedFields({});
      return;
    }

    const row = (await window.electron.ipcRenderer.invoke(
      'get-custom-template',
      option.name,
    )) as { name: string; config_json?: string } | null;
    if (!row?.config_json) return;

    try {
      const parsed = JSON.parse(row.config_json) as {
        tables?: Table[];
        checkedFields?: CheckedFieldsMap;
      };

      const tables = Array.isArray(parsed?.tables) ? parsed.tables : [];
      const checked = parsed?.checkedFields ?? {};

      const coreRow = tables.find((t) => t.kind === 'core');
      const extensionRows = tables.filter((t) => t.kind === 'extension');

      const nextCore =
        coreTemplates.find((opt) => opt.value === coreRow?.name) ?? null;
      const nextExtensions = extensionTemplates.filter((opt) =>
        extensionRows.some((rowTable) => rowTable.name === opt.value),
      );

      setSelectedTheme(null);
      setSelectedCore(nextCore);
      setSelectedExtension(nextExtensions.length > 0 ? nextExtensions : null);
      setCheckedFields(checked);
    } catch (err) {
      console.warn('parse custom template failed:', err);
    }
  };

  const resetCustomDialogForm = () => {
    setCustomFieldName('');
    setCustomFieldNameZh('');
    setCustomFieldType('text');
    setCustomTargetTemplates([]);
    setPickedExistingField(null);
    setExistingTargetTemplates([]);
    setCustomDialogError('');
    setCustomTab(0);
  };

  const markCustomFieldChecked = (
    templateNames: string[],
    fieldName: string,
  ) => {
    setCheckedFields((prev) => {
      const next = { ...prev };
      templateNames.forEach((templateName) => {
        if (!next[templateName]) return;
        next[templateName] = {
          ...next[templateName],
          [fieldName]: true,
        };
      });
      return next;
    });
  };

  const showCustomFieldSuccessDialog = () => {
    setCustomFieldSuccessOpen(true);
  };

  const saveCustomField = async () => {
    if (!selectedProject) return;

    const fieldName = customFieldName.trim();
    const fieldNameZh = customFieldNameZh.trim();
    const templateNames = customTargetTemplates.map((t) => t.value);
    if (!fieldName || !fieldNameZh || templateNames.length === 0) {
      setCustomDialogError(templateText.errors.customFieldRequired);
      return;
    }
    if (!CUSTOM_FIELD_KEY_PATTERN.test(fieldName)) {
      setCustomDialogError(templateText.errors.customFieldNamePattern);
      return;
    }

    const res = await window.electron.ipcRenderer.invoke(
      'save-project-custom-field',
      {
        projectId: selectedProject,
        fieldName,
        fieldNameZh,
        fieldType: customFieldType,
        templateNames,
      },
    );
    if (!res?.ok) {
      setCustomDialogError(res?.error ?? templateText.errors.saveFailed);
      return;
    }

    await loadExistingCustomFields();
    await reloadTemplateFields();
    markCustomFieldChecked(templateNames, fieldName);
    resetCustomDialogForm();
    setCustomDialogOpen(false);
    showCustomFieldSuccessDialog();
  };

  const attachExistingCustomField = async () => {
    if (!selectedProject) return;

    const fieldName = pickedExistingField?.fieldName?.trim() ?? '';
    const templateNames = existingTargetTemplates.map((t) => t.value);
    if (!fieldName || templateNames.length === 0) {
      setCustomDialogError(templateText.errors.attachExistingRequired);
      return;
    }

    const res = await window.electron.ipcRenderer.invoke(
      'attach-existing-custom-field',
      {
        projectId: selectedProject,
        fieldName,
        templateNames,
      },
    );
    if (!res?.ok) {
      setCustomDialogError(res?.error ?? templateText.errors.applyFailed);
      return;
    }

    await loadExistingCustomFields();
    await reloadTemplateFields();
    markCustomFieldChecked(templateNames, fieldName);
    resetCustomDialogForm();
    setCustomDialogOpen(false);
    showCustomFieldSuccessDialog();
  };

  // 處理資料集類型下拉選單資料層的 state 邏輯
  const loadCoreTemplate = async (
    templateValue: string,
    setCoreTemplateData: Dispatch<
      SetStateAction<{ name: string; fields: TemplateField[] }[]>
    >,
    setCheckedFields: Dispatch<SetStateAction<CheckedFieldsMap>>,
  ) => {
    try {
      const initialChecked: Record<string, boolean> = {};
      const requiredChecked: Record<string, boolean> = {};

      // 從資料庫中取得對應模板內容
      const results = await window.electron.ipcRenderer.invoke(
        'get-template',
        templateValue,
        selectedProject,
      );

      // 將模板欄位全部存起來，用來渲染畫面
      setCoreTemplateData([
        {
          name: templateValue,
          fields: results as TemplateField[],
        },
      ]);

      // 判斷哪些是預先勾選好的欄位
      results.forEach((field: TemplateField) => {
        initialChecked[field.column_name] = Boolean(
          field.is_required || field.is_recommended,
        );
        if (Boolean(field.is_required)) {
          requiredChecked[field.column_name] = true;
        }
      });

      // 把勾選好的欄位存起來統一管理，用來傳遞到資料編輯頁面
      setCheckedFields((prev) => ({
        ...prev,
        [templateValue]: prev[templateValue]
          ? { ...prev[templateValue], ...requiredChecked }
          : initialChecked,
      }));
    } catch (err) {
      console.error('載入資料集類型模板失敗：', err);
    }
  };

  // 處理延伸資料集下拉選單資料層的 state 邏輯
  // 只處理單一選項的載入 / 更新
  const loadExtensionTemplate = async (
    templateValue: string,
    setExtensionTemplatesData: Dispatch<
      SetStateAction<{ name: string; fields: TemplateField[] }[]>
    >,
    setCheckedFields: Dispatch<SetStateAction<CheckedFieldsMap>>,
  ) => {
    try {
      const initialChecked: Record<string, boolean> = {};
      const requiredChecked: Record<string, boolean> = {};

      // 從資料庫中取得對應模板內容
      const results = await window.electron.ipcRenderer.invoke(
        'get-template',
        templateValue,
        selectedProject,
      );

      // 將模板欄位全部存起來，用來渲染畫面
      // 清掉被取消勾選的內容，新增勾選的內容
      setExtensionTemplatesData((prev) => [
        ...prev.filter((t) => t.name !== templateValue),
        { name: templateValue, fields: results as TemplateField[] },
      ]);

      // 判斷哪些是預先勾選好的欄位
      results.forEach((field: TemplateField) => {
        initialChecked[field.column_name] = Boolean(
          field.is_required || field.is_recommended,
        );
        if (Boolean(field.is_required)) {
          requiredChecked[field.column_name] = true;
        }
      });

      // 把勾選好的欄位存起來統一管理，用來傳遞到資料編輯頁面
      setCheckedFields((prev) => ({
        ...prev,
        [templateValue]: prev[templateValue]
          ? { ...prev[templateValue], ...requiredChecked }
          : initialChecked,
      }));
    } catch (err) {
      console.error('載入延伸資料集模板失敗：', err);
    }
  };

  // 處理資料集類型下拉選單 UI 層的 state 邏輯
  const handleSingleTemplateSelect = (
    option: TemplateOption | null,
    setSelected: Dispatch<SetStateAction<TemplateOption | null>>,
    setCheckedFields: Dispatch<SetStateAction<CheckedFieldsMap>>,
    prevValue?: string,
  ) => {
    setSelected(option);

    // 選擇為空時，清掉舊的勾選狀態
    if (!option?.value) {
      setCheckedFields((prev) => {
        const updated = { ...prev };
        if (prevValue) {
          delete updated[prevValue];
        }
        return updated;
      });
      return;
    }
  };

  // 處理延伸資料集下拉選單 UI 層的 state 邏輯
  const handleMultiTemplateSelect = (
    options: TemplateOption[] | null,
    setSelected: Dispatch<SetStateAction<TemplateOption[] | null>>,
    prevValues: string[],
  ) => {
    setSelected(options);

    if (!options) return;

    // 取得當前所有選項
    const currentValues = options.map((opt) => opt.value);
    // 取得取消勾選的選項
    const removedValues = prevValues.filter(
      (prev) => !currentValues.includes(prev),
    );

    // 清掉取消勾選選項的勾選狀態
    if (removedValues.length > 0) {
      setCheckedFields((prev) => {
        const updated = { ...prev };
        removedValues.forEach((val) => {
          delete updated[val];
        });
        return updated;
      });
    }
  };

  const showClickedFields = async () => {
    // 從 context 拿 projectId
    const projectId = selectedProject;

    // 把選擇的模板資訊存在 context
    const coreTable: Table[] = selectedCore
      ? [
          {
            name: selectedCore.value,
            kind: 'core',
            displayName: getOptionLabel(selectedCore),
          },
        ]
      : [];

    const extensionTables: Table[] = (selectedExtension ?? []).map((ext) => ({
      name: ext.value,
      kind: 'extension',
      displayName: getOptionLabel(ext),
    }));

    const merged = [...coreTable, ...extensionTables];

    setTables(merged);

    // 把選擇的模板資訊存在資料庫
    const res = await window.electron.ipcRenderer.invoke(
      'save-project-tables',
      projectId,
      merged,
    );

    const requiredKeysByTable = new Map<string, Set<string>>();
    const fieldTypeByTable = new Map<string, Map<string, string>>();
    const customKeysByTable = new Map<string, Set<string>>();
    const customLabelByTable = new Map<string, Map<string, string>>();
    [...coreTemplateData, ...extensionTemplatesData].forEach((table) => {
      const requiredKeys = new Set(
        table.fields
          .filter((f) => Boolean(f.is_required))
          .map((f) => f.column_name),
      );
      requiredKeysByTable.set(table.name, requiredKeys);

      const types = new Map<string, string>();
      table.fields.forEach((f) => {
        types.set(f.column_name, normalizeSchemaColumnType(f.column_type));
      });
      fieldTypeByTable.set(table.name, types);

      const customKeys = new Set(
        table.fields
          .filter((f) => Boolean(f.is_custom))
          .map((f) => f.column_name),
      );
      customKeysByTable.set(table.name, customKeys);

      const labels = new Map<string, string>();
      table.fields.forEach((f) => {
        const label = String(f.common_name ?? '').trim();
        if (label) labels.set(f.column_name, label);
      });
      customLabelByTable.set(table.name, labels);
    });

    // 把選擇的模板欄位存進資料庫
    try {
      for (const [tableName, fields] of Object.entries(checkedFields)) {
        const requiredKeys = requiredKeysByTable.get(tableName) ?? new Set();

        const columns = Object.entries(fields)
          .filter(([, enabled]) => Boolean(enabled))
          .map(([key]) => ({
            key,
            title: key,
            type: fieldTypeByTable.get(tableName)?.get(key) ?? 'text',
            required: requiredKeys.has(key),
            meta: {
              ...(FIELD_VOCAB_KEY[key]
                ? { vocabKey: FIELD_VOCAB_KEY[key], strict: true }
                : {}),
              ...(customKeysByTable.get(tableName)?.has(key)
                ? {
                    isCustom: true,
                    customLabelZh:
                      customLabelByTable.get(tableName)?.get(key) ?? '',
                  }
                : {}),
            },
          }));

        if (columns.length === 0) continue;

        const schema = {
          columns,
          meta: {
            source: 'ui',
            table: tableName,
            updatedAt: new Date().toISOString(),
          },
        };

        await window.electron.ipcRenderer.invoke('save-table-schema', {
          projectId,
          tableName,
          schemaJson: JSON.stringify(schema),
        });
      }

      console.log('資料表 schema 儲存成功');
      navigate('/data-edit');
    } catch (err) {
      console.error('資料表 schema 儲存失敗：', err);
    }
  };

  const saveCheckedFieldsAsCustomTemplate = async () => {
    const name = saveTemplateName.trim();
    if (!name) {
      setSaveTemplateError(templateText.errors.customTemplateNameRequired);
      return;
    }

    const coreTable: Table[] = selectedCore
      ? [
          {
            name: selectedCore.value,
            kind: 'core',
            displayName: getOptionLabel(selectedCore),
          },
        ]
      : [];
    const extensionTables: Table[] = (selectedExtension ?? []).map((ext) => ({
      name: ext.value,
      kind: 'extension',
      displayName: getOptionLabel(ext),
    }));
    const merged = [...coreTable, ...extensionTables];

    if (merged.length === 0) {
      setSaveTemplateError(templateText.errors.customTemplateSelectRequired);
      return;
    }

    const filteredChecked: CheckedFieldsMap = {};
    merged.forEach((t) => {
      filteredChecked[t.name] = checkedFields[t.name] ?? {};
    });

    const config = {
      tables: merged,
      checkedFields: filteredChecked,
      updatedAt: new Date().toISOString(),
    };

    const res = await window.electron.ipcRenderer.invoke('save-custom-template', {
      name,
      configJson: JSON.stringify(config),
    });
    if (!res?.ok) {
      setSaveTemplateError(res?.error ?? templateText.errors.saveFailed);
      return;
    }

    setSaveTemplateDialogOpen(false);
    setSaveTemplateError('');
    setSaveTemplateName('');
    await loadSavedCustomTemplates();
    setSelectedSavedTemplate({ name });
  };

  // 內建模板中，資料集類型下拉選單改變後，渲染模板內容
  useEffect(() => {
    loadSavedCustomTemplates().catch((err) => {
      console.warn('load custom templates failed:', err);
    });
  }, []);

  useEffect(() => {
    if (selectedCore) {
      loadCoreTemplate(
        selectedCore.value,
        setCoreTemplateData,
        setCheckedFields,
      );
    }
  }, [selectedCore]);

  // 內建模板中，延伸資料集下拉選單改變後，渲染模板內容
  useEffect(() => {
    if (!selectedExtension) {
      setExtensionTemplatesData([]);
      return;
    }

    // 清掉被取消的選項的勾選狀態
    const selectedNames = selectedExtension.map((ext) => ext.value);
    setExtensionTemplatesData((prev) =>
      prev.filter((t) => selectedNames.includes(t.name)),
    );

    // 處理最後被操作的選項
    const lastExtension = selectedExtension[selectedExtension.length - 1];
    if (lastExtension) {
      loadExtensionTemplate(
        lastExtension.value,
        setExtensionTemplatesData,
        setCheckedFields,
      );
    }
  }, [selectedExtension]);

  useEffect(() => {
    if (!selectedProject) return;

    let cancelled = false;

    const hydrateSelections = async () => {
      const projectTables = (await window.electron.ipcRenderer.invoke(
        'get-project-tables',
        selectedProject,
      )) as Table[];
      if (cancelled) return;

      const safeTables = Array.isArray(projectTables) ? projectTables : [];
      if (safeTables.length === 0) {
        setSelectedTheme(null);
        setSelectedCore(null);
        setSelectedExtension(null);
        setCoreTemplateData([]);
        setExtensionTemplatesData([]);
        setCheckedFields({});
        return;
      }

      const coreRow = safeTables.find((t) => t.kind === 'core');
      const extensionRows = safeTables.filter((t) => t.kind === 'extension');

      const nextCore =
        coreTemplates.find((opt) => opt.value === coreRow?.name) ?? null;
      const nextExtensions = extensionTemplates.filter((opt) =>
        extensionRows.some((row) => row.name === opt.value),
      );

      setSelectedTheme(null);
      setSelectedCore(nextCore);
      setSelectedExtension(nextExtensions.length > 0 ? nextExtensions : null);

      const restoredChecked: CheckedFieldsMap = {};
      for (const t of safeTables) {
        const schemaRow = await window.electron.ipcRenderer.invoke(
          'get-table-schema',
          selectedProject,
          t.name,
        );
        if (cancelled) return;

        const parsed = schemaRow?.schema_json
          ? JSON.parse(schemaRow.schema_json)
          : null;
        const cols = Array.isArray(parsed?.columns) ? parsed.columns : [];

        restoredChecked[t.name] = cols.reduce(
          (acc: Record<string, boolean>, c: any) => {
            const key = typeof c?.key === 'string' ? c.key : '';
            if (key) acc[key] = true;
            return acc;
          },
          {},
        );
      }

      setCheckedFields((prev) => ({
        ...prev,
        ...restoredChecked,
      }));
    };

    hydrateSelections().catch((err) => {
      console.warn('hydrate template selections failed:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedProject]);

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
          <Stack spacing={1} sx={{ flex: 1 }}>
            {/* 自訂模板 */}
            <Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BookmarkIcon />}
                onClick={() => {
                  setMode('template');
                }}
                sx={getButtonStyle(mode === 'template')}
              >
                {templateText.sidebar.useCustomTemplate}
              </Button>
              <Collapse in={mode === 'template'}>
                <Box mt={1}>
                  <Autocomplete
                    options={savedCustomTemplates}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.name === value.name
                    }
                    value={selectedSavedTemplate}
                    onChange={(_, newValue) => {
                      applySavedCustomTemplate(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={templateText.sidebar.savedCustomTemplatePlaceholder}
                      />
                    )}
                  />
                </Box>
              </Collapse>
            </Box>

            {/* 主題模板 */}
            <Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WorkspacesIcon />}
                onClick={() => setMode('topic')}
                sx={getButtonStyle(mode === 'topic')}
              >
                {templateText.sidebar.useBuiltInTheme}
              </Button>
              <Collapse in={mode === 'topic'}>
                <Box mt={1}>
                  <Autocomplete
                    options={themeTemplates}
                    getOptionLabel={(option) => getOptionLabel(option)}
                    groupBy={(option) => getOptionGroup(option.group)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" />
                    )}
                    onChange={(_, selectedTheme) => {
                      if (!selectedTheme) {
                        setSelectedTheme(null);

                        setSelectedCore(null);
                        setCoreTemplateData([]);

                        setSelectedExtension(null);
                        setExtensionTemplatesData([]);

                        setCheckedFields({});
                        return;
                      }

                      setSelectedTheme(selectedTheme);

                      const prevCoreValue = selectedCore?.value;
                      handleSingleTemplateSelect(
                        selectedTheme.core,
                        setSelectedCore,
                        setCheckedFields,
                        prevCoreValue,
                      );

                      const preExtensionValues = (selectedExtension || []).map(
                        (item) => item.value,
                      );
                      handleMultiTemplateSelect(
                        selectedTheme.extensions,
                        setSelectedExtension,
                        preExtensionValues,
                      );

                      selectedTheme.extensions?.forEach((ext) => {
                        loadExtensionTemplate(
                          ext.value,
                          setExtensionTemplatesData,
                          setCheckedFields,
                        );
                      });
                    }}
                  />
                </Box>
              </Collapse>
            </Box>

            {/* 內建模板：資料集類型、延伸資料集 */}
            <Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BallotIcon />}
                onClick={() => setMode('custom')}
                sx={getButtonStyle(mode === 'custom')}
              >
                {templateText.sidebar.useBuiltInTemplate}
              </Button>
              <Collapse in={mode === 'custom'}>
                <Stack spacing={1} mt={1}>
                  <Autocomplete
                    options={coreTemplates}
                    getOptionLabel={(option) => getOptionLabel(option)}
                    groupBy={(option) => getOptionGroup(option.group)}
                    value={selectedCore}
                    onChange={(_, newValue) => {
                      const prevValue = selectedCore?.value;
                      handleSingleTemplateSelect(
                        newValue,
                        setSelectedCore,
                        setCheckedFields,
                        prevValue,
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={templateText.sidebar.coreTemplatePlaceholder}
                        size="small"
                      />
                    )}
                    disabled={!!selectedTheme}
                  />
                  <Autocomplete
                    multiple
                    options={extensionTemplates}
                    getOptionLabel={(option) => getOptionLabel(option)}
                    groupBy={(option) => getOptionGroup(option.group)}
                    value={selectedExtension || []}
                    onChange={(_, newValue) => {
                      const preValues = (selectedExtension || []).map(
                        (item) => item.value,
                      );
                      handleMultiTemplateSelect(
                        newValue,
                        setSelectedExtension,
                        preValues,
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={templateText.sidebar.extensionTemplatePlaceholder}
                        size="small"
                      />
                    )}
                  />
                </Stack>
              </Collapse>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<AutoFixHighIcon />}
            onClick={openCustomDialog}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                bgcolor: '#e8eaf6',
              },
            }}
          >
            {templateText.sidebar.editCustomFieldButton}
          </Button>
        </Box>
        <Box
          sx={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'primary.main',
            px: 2,
            py: 2,
            overflow: 'auto',
          }}
        >
          <Typography variant="h6">{templateText.content.fieldListTitle}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {templateText.content.fieldListDescription}
          </Typography>
          <Box
            sx={{
              color: 'text.secondary',
              whiteSpace: 'pre-line',
              pl: 2,
              pr: 2,
              mb: 2,
              borderLeft: 3,
              borderColor: 'info.light',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>{templateText.content.requiredFieldTitle}</strong>
              {templateText.content.requiredFieldDesc}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <strong>{templateText.content.recommendedFieldTitle}</strong>
              {templateText.content.recommendedFieldDesc}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <strong>{templateText.content.optionalFieldTitle}</strong>
              {templateText.content.optionalFieldDesc}
            </Typography>
          </Box>

          <Stack spacing={1}>
            {coreTemplateData.length > 0 &&
              checkedFields &&
              selectedCore?.value && (
                <TemplateFieldPanel
                  title={`${templateText.content.coreFieldPrefix}${getOptionLabel(selectedCore)}`}
                  fields={coreTemplateData[0].fields}
                  templateValue={selectedCore?.value}
                  checkedFields={checkedFields}
                  setCheckedFields={setCheckedFields}
                  setHoveredField={setHoveredField}
                />
              )}

            {selectedExtension?.map((ext) => {
              const template = extensionTemplatesData.find(
                (t) => t.name === ext.value,
              );
              if (!template) return null;

              return (
                <TemplateFieldPanel
                  key={template.name}
                  title={`${templateText.content.extensionFieldPrefix}${getOptionLabel(ext)}`}
                  fields={template.fields}
                  templateValue={template.name}
                  checkedFields={checkedFields}
                  setCheckedFields={setCheckedFields}
                  setHoveredField={setHoveredField}
                />
              );
            })}
          </Stack>
        </Box>
        <Box
          sx={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'primary.main',
            px: 2,
            py: 2,
            overflow: 'auto',
          }}
        >
          <Box sx={{ flex: 1 }}>
            {hoveredField ? (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {hoveredField.column_name}
                </Typography>

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  {templateText.preview.typeTitle}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {hoveredField.column_type || templateText.preview.noType}
                </Typography>

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  {templateText.preview.definitionTitle}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {hoveredField.definition_zh || templateText.preview.noDefinition}
                </Typography>

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  {templateText.preview.commonNameTitle}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {hoveredField.common_name || templateText.preview.noCommonName}
                </Typography>

                {hoveredField.example && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      {templateText.preview.exampleTitle}
                    </Typography>
                    <ul style={{ paddingLeft: '1.25rem', marginTop: 0 }}>
                      {hoveredField.example
                        .split(/<br\s*\/?>---<br\s*\/?>/i)
                        .map((line, index) => (
                          <li key={index}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              component="span"
                            >
                              {line.trim()}
                            </Typography>
                          </li>
                        ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {templateText.preview.hoverHint}
              </Typography>
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
              onClick={() => {
                setSaveTemplateName('');
                setSaveTemplateError('');
                setSaveTemplateDialogOpen(true);
              }}
            >
              {templateText.actions.saveCurrentSelectionAsTemplate}
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
              onClick={showClickedFields}
            >
              {templateText.actions.nextStep}
            </Button>
          </Stack>
        </Box>

        <Dialog
          open={customDialogOpen}
          onClose={() => {
            setCustomDialogOpen(false);
            resetCustomDialogForm();
          }}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>{templateText.dialogs.customFieldDialogTitle}</DialogTitle>
          <DialogContent>
            <Tabs
              value={customTab}
              onChange={(_, v) => {
                setCustomTab(v);
                setCustomDialogError('');
              }}
              sx={{ mb: 2 }}
            >
              <Tab label={templateText.dialogs.addCustomFieldTab} />
              <Tab label={templateText.dialogs.applyExistingFieldTab} />
            </Tabs>

            {customDialogError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {customDialogError}
              </Alert>
            )}

            {customTab === 0 && (
              <Stack spacing={2}>
                <TextField
                  label={templateText.dialogs.fieldNameLabel}
                  size="small"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  placeholder={templateText.dialogs.fieldNamePlaceholder}
                />
                <TextField
                  label={templateText.dialogs.fieldNameZhLabel}
                  size="small"
                  value={customFieldNameZh}
                  onChange={(e) => setCustomFieldNameZh(e.target.value)}
                  placeholder={templateText.dialogs.fieldNameZhPlaceholder}
                />

                <FormControl size="small">
                  <InputLabel id="custom-field-type-label">
                    {templateText.dialogs.fieldTypeLabel}
                  </InputLabel>
                  <Select
                    labelId="custom-field-type-label"
                    label={templateText.dialogs.fieldTypeLabel}
                    value={customFieldType}
                    onChange={(e) =>
                      setCustomFieldType(e.target.value as CustomFieldType)
                    }
                  >
                    <MenuItem value="text">text</MenuItem>
                    <MenuItem value="number">number</MenuItem>
                    <MenuItem value="date">date</MenuItem>
                    <MenuItem value="boolean">boolean</MenuItem>
                  </Select>
                </FormControl>

                <Autocomplete
                  multiple
                  options={allTemplateOptions}
                  getOptionLabel={(option) => getOptionLabel(option)}
                  groupBy={(option) => getOptionGroup(option.group)}
                  value={customTargetTemplates}
                  onChange={(_, newValue) => setCustomTargetTemplates(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={templateText.dialogs.targetTemplateLabel}
                      placeholder={templateText.dialogs.targetTemplatePlaceholder}
                    />
                  )}
                />
              </Stack>
            )}

            {customTab === 1 && (
              <Stack spacing={2}>
                <Autocomplete
                  options={existingCustomFields}
                  getOptionLabel={(option) =>
                    `${option.fieldName} / ${option.fieldNameZh} (${option.fieldType})`
                  }
                  value={pickedExistingField}
                  onChange={(_, value) => setPickedExistingField(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={templateText.dialogs.existingCustomFieldLabel}
                    />
                  )}
                />

                <Autocomplete
                  multiple
                  options={allTemplateOptions}
                  getOptionLabel={(option) => getOptionLabel(option)}
                  groupBy={(option) => getOptionGroup(option.group)}
                  value={existingTargetTemplates}
                  onChange={(_, newValue) =>
                    setExistingTargetTemplates(newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={templateText.dialogs.targetTemplateLabel}
                      placeholder={templateText.dialogs.targetTemplatePlaceholder}
                    />
                  )}
                />
              </Stack>
            )}
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => {
                setCustomDialogOpen(false);
                resetCustomDialogForm();
              }}
            >
              {templateText.dialogs.cancel}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (customTab === 0) {
                  saveCustomField();
                } else {
                  attachExistingCustomField();
                }
              }}
            >
              {templateText.dialogs.save}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={saveTemplateDialogOpen}
          onClose={() => setSaveTemplateDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{templateText.dialogs.saveCustomTemplateDialogTitle}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label={templateText.dialogs.templateNameLabel}
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              sx={{ mt: 1 }}
            />
            {saveTemplateError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {saveTemplateError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveTemplateDialogOpen(false)}>
              {templateText.dialogs.cancel}
            </Button>
            <Button variant="contained" onClick={saveCheckedFieldsAsCustomTemplate}>
              {templateText.dialogs.save}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={customFieldSuccessOpen}
          onClose={() => setCustomFieldSuccessOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            {templateText.dialogs.customFieldSuccessTitle}
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="body2">
              {templateText.dialogs.customFieldSuccessDescription}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              onClick={() => setCustomFieldSuccessOpen(false)}
            >
              {templateText.dialogs.confirm}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default TemplatePage;
