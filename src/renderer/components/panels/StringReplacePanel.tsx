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

import FindReplaceIcon from '@mui/icons-material/FindReplace';
import CustomAccordion from '../CustomAccordion';
import { useI18n } from '../../contexts/i18n';

type ReplaceMode = 'exact' | 'fuzzy' | 'regex';
type ApplyScopeMode = 'all' | 'rows';

type FacetValue = { value: string; count: number };
type FacetField = { field: string; values: FacetValue[] };

type StringReplacePanelProps = {
  onClose: () => void;
  facet: FacetField;

  onReplace: (payload: {
    field: string;
    mode: ReplaceMode;
    from: string; // 要被取代的字串
    to: string; // 取代為
    rowNumbers?: number[];
  }) => void;
};

const parseRowNumbers = (value: string): number[] | null => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(',').map((p) => p.trim());
  const result = new Set<number>();

  for (const part of parts) {
    if (!part) return null;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = Number(startStr);
      const end = Number(endStr);
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start <= 0 ||
        end <= 0 ||
        start > end
      ) {
        return null;
      }
      for (let i = start; i <= end; i += 1) result.add(i);
      continue;
    }

    const num = Number(part);
    if (!Number.isInteger(num) || num <= 0) return null;
    result.add(num);
  }

  return Array.from(result).sort((a, b) => a - b);
};

const StringReplacePanel = ({
  onClose,
  facet,
  onReplace,
}: StringReplacePanelProps) => {
  const { messages } = useI18n();
  const replaceText = messages.cleanPage.panels.stringReplace;
  const scopeText = messages.cleanPage.panels.applyScope;
  const [mode, setMode] = useState<ReplaceMode>('exact');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [scopeMode, setScopeMode] = useState<ApplyScopeMode>('all');
  const [rowNumbersInput, setRowNumbersInput] = useState('');
  const normalizedFrom = mode === 'regex' ? from : from.trim();

  const { matchedCount, sample } = useMemo(() => {
    const q = mode === 'regex' ? from : from.trim();
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
  }, [facet.values, mode, from]);

  const regexInvalid = useMemo(() => {
    if (mode !== 'regex') return false;
    const q = from;
    if (!q) return false;
    try {
      new RegExp(q);
      return false;
    } catch {
      return true;
    }
  }, [mode, from]);

  const canReplace =
    normalizedFrom.length > 0 && !regexInvalid && matchedCount > 0;
  const parsedRowNumbers = parseRowNumbers(rowNumbersInput);
  const rowNumbersInvalid = scopeMode === 'rows' && parsedRowNumbers == null;
  const rowNumbersEmpty =
    scopeMode === 'rows' &&
    Array.isArray(parsedRowNumbers) &&
    !parsedRowNumbers.length;
  const modeLabel: Record<ReplaceMode, string> = {
    exact: replaceText.modeLabels.exact,
    fuzzy: replaceText.modeLabels.fuzzy,
    regex: replaceText.modeLabels.regex,
  };

  return (
    <CustomAccordion
      title={replaceText.title} // 字串取代
      subtitle={facet.field}
      icon={<FindReplaceIcon sx={{ color: 'primary.main' }} />}
      closable
      onClose={onClose}
      sx={{ mt: 1 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {replaceText.description}{' '}
        {/* 設定要被取代的字串與取代後的內容，按下「取代」後將直接批次修改所有符合條件的資料。 */}
      </Typography>

      <Stack spacing={1.25}>
        <FormControl size="small" fullWidth>
          <InputLabel id="string-replace-mode-label">
            {replaceText.modeLabel}
          </InputLabel>
          <Select
            labelId="string-replace-mode-label"
            value={mode}
            label={replaceText.modeLabel}
            onChange={(e) => setMode(e.target.value as ReplaceMode)}
          >
            <MenuItem value="exact">{modeLabel.exact}</MenuItem>
            <MenuItem value="fuzzy">{modeLabel.fuzzy}</MenuItem>
            <MenuItem value="regex">{modeLabel.regex}</MenuItem>
          </Select>
        </FormControl>

        {/* 要被取代的字串 */}
        <TextField
          size="small"
          fullWidth
          label={replaceText.fromLabel} // 要被取代的字串
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          error={regexInvalid}
          helperText={
            regexInvalid
              ? replaceText.helpers.regexInvalid // 正則表達式格式不正確
              : mode === 'exact'
                ? replaceText.helpers.exact // 完全相等才會被取代
                : mode === 'fuzzy'
                  ? replaceText.helpers.fuzzy // 包含關鍵字即會被取代（不分大小寫）
                  : replaceText.helpers.regex // 可使用正則表達式，例如 \\s+ 代表空白字元
          }
        />

        {/* 取代為 */}
        <TextField
          size="small"
          fullWidth
          label={replaceText.toLabel} // 取代為
          value={to}
          onChange={(e) => setTo(e.target.value)}
          helperText={replaceText.toHelper} // 可留空，代表取代成空字串
        />

        <FormControl size="small" fullWidth>
          <InputLabel id="replace-scope-label">{scopeText.label}</InputLabel>
          <Select
            labelId="replace-scope-label"
            label={scopeText.label}
            value={scopeMode}
            onChange={(e) => setScopeMode(e.target.value as ApplyScopeMode)}
          >
            <MenuItem value="all">{scopeText.allRows}</MenuItem>
            <MenuItem value="rows">{scopeText.specificRows}</MenuItem>
          </Select>
        </FormControl>

        {scopeMode === 'rows' && (
          <TextField
            size="small"
            fullWidth
            label={scopeText.rowNumbersLabel}
            value={rowNumbersInput}
            placeholder={scopeText.rowNumbersPlaceholder}
            onChange={(e) => setRowNumbersInput(e.target.value)}
            error={rowNumbersInvalid || rowNumbersEmpty}
            helperText={
              rowNumbersInvalid
                ? scopeText.rowNumbersInvalid
                : scopeText.rowNumbersHelper
            }
          />
        )}

        {/* 匹配摘要 */}
        <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: '#f0f2ff' }}>
          <Typography variant="body2">
            {replaceText.affectedCountPrefix}
            {matchedCount.toLocaleString()} {/* 影響筆數： */}
          </Typography>

          {sample.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {replaceText.samplePrefix} {/* 範例匹配值： */}
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

        {/* 取代 */}
        <Button
          variant="outlined"
          fullWidth
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': { bgcolor: '#e8eaf6' },
          }}
          //   disabled={!canReplace}
          onClick={() => {
            onReplace({
              field: facet.field,
              mode,
              from: normalizedFrom,
              to,
              rowNumbers:
                scopeMode === 'rows' && Array.isArray(parsedRowNumbers)
                  ? parsedRowNumbers
                  : undefined,
            });
          }}
          disabled={rowNumbersInvalid || rowNumbersEmpty}
        >
          {replaceText.actionReplace} {/* 取代 */}
        </Button>
      </Stack>
    </CustomAccordion>
  );
};

export default StringReplacePanel;
