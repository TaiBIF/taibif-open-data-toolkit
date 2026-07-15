import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export type FacetFrequencyItem = {
  value: string;
  count: number;
};

type Props = {
  items: FacetFrequencyItem[];
};

const FacetFrequencyList = ({ items }: Props) => {
  return (
    <Stack spacing={1}>
      {/* Header */}
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
          值
        </Typography>
        <Typography variant="caption" color="text.secondary">
          次數
        </Typography>
      </Box>

      {/* Rows */}
      {items.map((r, idx) => (
        <Box
          key={`${r.value}-${idx}`}
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
          <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-word' }}>
            {r.value}
          </Typography>

          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            {r.count}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default FacetFrequencyList;
