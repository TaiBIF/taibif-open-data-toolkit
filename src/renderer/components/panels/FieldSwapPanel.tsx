import { useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CustomAccordion from '../CustomAccordion';
import { useI18n } from '../../contexts/i18n';

type ApplyScopeMode = 'all' | 'rows';

type SwapFieldPanelProps = {
  onClose: () => void;

  /** 目前正在操作的欄位（例如使用者在某欄位上開啟此 panel） */
  sourceField: string;

  /** 可被選擇的所有欄位清單（通常來自表頭） */
  allFields: string[];

  /** 點擊「對調」後直接執行 */
  onSwap: (payload: {
    fromField: string;
    toField: string;
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

const FieldSwapPanel = ({
  onClose,
  sourceField,
  allFields,
  onSwap,
}: SwapFieldPanelProps) => {
  const { messages } = useI18n();
  const swapText = messages.cleanPage.panels.fieldSwap;
  const scopeText = messages.cleanPage.panels.applyScope;
  const options = useMemo(
    () => allFields.filter((f) => f !== sourceField),
    [allFields, sourceField],
  );

  const [targetField, setTargetField] = useState<string>(options[0] ?? '');
  const [scopeMode, setScopeMode] = useState<ApplyScopeMode>('all');
  const [rowNumbersInput, setRowNumbersInput] = useState('');

  const canSwap = !!sourceField && !!targetField && sourceField !== targetField;
  const parsedRowNumbers = parseRowNumbers(rowNumbersInput);
  const rowNumbersInvalid = scopeMode === 'rows' && parsedRowNumbers == null;
  const rowNumbersEmpty =
    scopeMode === 'rows' &&
    Array.isArray(parsedRowNumbers) &&
    !parsedRowNumbers.length;

  return (
    <CustomAccordion
      title={swapText.title} // 欄位內容調換
      subtitle={sourceField}
      icon={<SwapHorizIcon sx={{ color: 'primary.main' }} />}
      closable
      onClose={onClose}
      sx={{ mt: 1 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {swapText.descriptionPrefix}
        {/* 選擇要與「 */}
        {sourceField}
        {swapText.descriptionSuffix}
        {/* 」對調的欄位，按下「對調」後將直接交換兩個欄位的內容。 */}
      </Typography>

      <Stack spacing={1.25}>
        <FormControl size="small" fullWidth>
          <InputLabel id="swap-field-label">
            {swapText.targetFieldLabel} {/* 對調欄位 */}
          </InputLabel>
          <Select
            labelId="swap-field-label"
            label={swapText.targetFieldLabel} // 對調欄位
            value={targetField}
            onChange={(e) => setTargetField(e.target.value)}
          >
            {options.map((f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel id="swap-scope-label">{scopeText.label}</InputLabel>
          <Select
            labelId="swap-scope-label"
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

        <Button
          variant="outlined"
          fullWidth
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': { bgcolor: '#e8eaf6' },
          }}
          // disabled={!canSwap}
          onClick={() =>
            onSwap({
              fromField: sourceField,
              toField: targetField,
              rowNumbers:
                scopeMode === 'rows' && Array.isArray(parsedRowNumbers)
                  ? parsedRowNumbers
                  : undefined,
            })
          }
          disabled={!canSwap || rowNumbersInvalid || rowNumbersEmpty}
        >
          {swapText.actionSwap} {/* 對調 */}
        </Button>
      </Stack>
    </CustomAccordion>
  );
};

export default FieldSwapPanel;
