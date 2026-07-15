import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useI18n } from '../contexts/i18n';

export type FieldMappingStatus = 'mapped' | 'unmapped' | 'duplicate';

export type FieldMappingStatusRow = {
  field: string;
  status: FieldMappingStatus;
};

type FieldMappingStatusListProps = {
  rows: ReadonlyArray<FieldMappingStatusRow>;
};

const FieldMappingStatusList = ({ rows }: FieldMappingStatusListProps) => {
  const { messages } = useI18n();
  const mappingStatusText = messages.components.fieldMappingStatusList;

  const getStatusLabel = (status: FieldMappingStatus) => {
    if (status === 'mapped') return mappingStatusText.mapped;
    if (status === 'unmapped') return mappingStatusText.unmapped;
    return mappingStatusText.duplicate;
  };

  const getStatusColor = (status: FieldMappingStatus) => {
    if (status === 'mapped') return 'success';
    if (status === 'unmapped') return 'warning';
    return 'error';
  };

  return (
    <Stack spacing={1}>
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
          {mappingStatusText.fieldName} {/* 欄位名稱 */}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {mappingStatusText.mappingStatus} {/* 對應狀態 */}
        </Typography>
      </Box>

      {rows.map((row) => {
        const color = getStatusColor(row.status);

        return (
          <Box
            key={row.field}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 8,
              bgcolor: '#f0f2ff',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{ flex: 1, wordBreak: 'break-word' }}
            >
              {row.field}
            </Typography>
            <Typography variant="body2" color={`${color}.main`}>
              {getStatusLabel(row.status)}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
};

export default FieldMappingStatusList;
