import { Box, Stack, Typography } from '@mui/material';
import { useI18n } from '../../contexts/i18n';

export type FacetValue = {
  value: string;
  count: number;
};

export type FacetField = {
  field: string; // 例如 eventDate / kingdom
  values: FacetValue[]; // 例如 [{value:'2026-01-01',count:99}, ...]
};

type FacetValueListProps = {
  values: FacetValue[];
  onPick: (picked: FacetValue) => void;
};

const FacetValueList = ({ values, onPick }: FacetValueListProps) => {
  const { messages } = useI18n();
  const facetValueText = messages.cleanPage.panels.facetValueList;

  return (
    <Stack spacing={1}>
      {values.map((v) => (
        <Box
          key={v.value}
          onClick={() => onPick(v)}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: '#f0f2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': { bgcolor: '#e8eaf6' },
          }}
        >
          <Typography variant="body2" sx={{ pr: 1, wordBreak: 'break-word' }}>
            {v.value === '' ? facetValueText.emptyValue : v.value}{' '}
            {/* （空值） */}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap' }}
          >
            {v.count.toLocaleString()} {facetValueText.recordUnit} {/* 筆 */}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default FacetValueList;
