import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import TextFieldsIcon from '@mui/icons-material/TextFields';
import CustomAccordion from '../CustomAccordion';
import { useI18n } from '../../contexts/i18n';

type TextFilterMode = 'exact' | 'fuzzy' | 'regex';

type FacetValue = { value: string; count: number };
type FacetField = { field: string; values: FacetValue[] };

type TextFilterPanelProps = {
  onClose: () => void;
  facet: FacetField;

  onBatchEdit: (payload: {
    field: string;
    mode: TextFilterMode;
    query: string;
  }) => void;
};

const TextFilterPanel = ({
  onClose,
  facet,
  onBatchEdit,
}: TextFilterPanelProps) => {
  const { messages } = useI18n();
  const textFilterText = messages.cleanPage.panels.textFilter;
  const [mode, setMode] = useState<TextFilterMode>('exact');
  const [query, setQuery] = useState('');
  const normalizedQuery = mode === 'regex' ? query : query.trim();

  const { matchedCount, sample } = useMemo(() => {
    const q = mode === 'regex' ? query : query.trim();
    if (!q) return { matchedCount: 0, sample: [] as FacetValue[] };

    let matcher: (v: string) => boolean;

    if (mode === 'exact') {
      matcher = (v) => v === q;
    } else if (mode === 'fuzzy') {
      const lower = q.toLowerCase();
      matcher = (v) => (v ?? '').toLowerCase().includes(lower);
    } else {
      try {
        const re = new RegExp(q);
        matcher = (v) => {
          const value = v ?? '';
          re.lastIndex = 0;
          if (re.test(value)) {
            re.lastIndex = 0;
            return true;
          }
          re.lastIndex = 0;
          return value.trim() === '' && re.test(' ');
        };
      } catch {
        return { matchedCount: 0, sample: [] as FacetValue[] };
      }
    }

    const matched = facet.values.filter((x) => matcher(x.value));
    const count = matched.reduce((sum, x) => sum + x.count, 0);
    return { matchedCount: count, sample: matched.slice(0, 5) };
  }, [facet.values, mode, query]);

  const regexInvalid = useMemo(() => {
    if (mode !== 'regex') return false;
    const q = query;
    if (!q) return false;
    try {
      new RegExp(q);
      return false;
    } catch {
      return true;
    }
  }, [mode, query]);

  const canSearch =
    normalizedQuery.length > 0 && !regexInvalid && matchedCount > 0;

  const modeLabel: Record<TextFilterMode, string> = {
    exact: textFilterText.modeLabels.exact,
    fuzzy: textFilterText.modeLabels.fuzzy,
    regex: textFilterText.modeLabels.regex,
  };

  return (
    <CustomAccordion
      title={textFilterText.title} // 文字篩選
      subtitle={facet.field}
      icon={<TextFieldsIcon sx={{ color: 'primary.main' }} />}
      closable
      onClose={onClose}
      sx={{ mt: 1 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {textFilterText.description}{' '}
        {/* 選擇搜尋模式並輸入關鍵字，按下「搜尋」後將直接套用至所有符合條件的資料。 */}
      </Typography>

      <Stack spacing={1.25}>
        <FormControl size="small" fullWidth>
          <InputLabel id="text-filter-mode-label">
            {textFilterText.modeLabel} {/* 搜尋模式 */}
          </InputLabel>
          <Select
            labelId="text-filter-mode-label"
            value={mode}
            label={textFilterText.modeLabel} // 搜尋模式
            onChange={(e) => setMode(e.target.value as TextFilterMode)}
          >
            <MenuItem value="exact">{modeLabel.exact}</MenuItem>
            <MenuItem value="fuzzy">{modeLabel.fuzzy}</MenuItem>
            <MenuItem value="regex">{modeLabel.regex}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          fullWidth
          label={textFilterText.queryLabel} // 搜尋內容
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          error={regexInvalid}
          helperText={
            regexInvalid
              ? textFilterText.helpers.regexInvalid // 正則表達式格式不正確
              : mode === 'exact'
                ? textFilterText.helpers.exact // 完全相等才會匹配
                : mode === 'fuzzy'
                  ? textFilterText.helpers.fuzzy // 包含關鍵字即匹配（不分大小寫）
                  : textFilterText.helpers.regex // 可使用正則表達式，例如 \\s+ 代表空白字元
          }
        />

        <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: '#f0f2ff' }}>
          <Typography variant="body2">
            {textFilterText.matchedCountPrefix}
            {matchedCount.toLocaleString()} {/* 目前匹配筆數： */}
          </Typography>

          {sample.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {textFilterText.samplePrefix} {/* 範例匹配值： */}
              {sample
                .map((s) =>
                  s.value === ''
                    ? messages.cleanPage.panels.facetValueList.emptyValue
                    : s.value,
                )
                .join('、')}
              {sample.length >= 5 ? '…' : ''}
            </Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          fullWidth
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': { bgcolor: '#e8eaf6' },
          }}
          //   disabled={!canSearch}
          onClick={() => {
            onBatchEdit({
              field: facet.field,
              mode,
              query: normalizedQuery,
            });
          }}
        >
          {textFilterText.actionSearch} {/* 搜尋 */}
        </Button>
      </Stack>
    </CustomAccordion>
  );
};

export default TextFilterPanel;
