import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useI18n } from '../contexts/i18n';

export type FieldFrequencyRow = {
  field: string;
  accuracy: number; // 0~100
};

type FieldFrequencyListProps = {
  rows: FieldFrequencyRow[];
};

const FieldFrequencyList = ({ rows }: FieldFrequencyListProps) => {
  const { messages } = useI18n();
  const fieldFrequencyText = messages.components.fieldFrequencyList;

  return (
    <Stack spacing={1}>
      {/* Header（對齊 ErrorList 的摘要感） */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 1,
          bgcolor: '#f0f2ff',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {fieldFrequencyText.fieldName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {fieldFrequencyText.accuracy}
        </Typography>
      </Box>

      {/* Rows */}
      {rows.map((r) => (
        <Box
          key={r.field}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: '#f0f2ff',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* 左：欄位名稱 */}
          <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-word' }}>
            {r.field}
          </Typography>

          {/* 右：正確率 */}
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            {r.accuracy.toFixed(1)}%
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default FieldFrequencyList;
