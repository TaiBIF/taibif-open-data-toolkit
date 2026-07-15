import { useMemo, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CustomAccordion from '../CustomAccordion';
import { useI18n } from '../../contexts/i18n';

type DuplicateFilterMode = 'exact' | 'fuzzy' | 'regex';

type FacetValue = { value: string; count: number };
type FacetField = { field: string; values: FacetValue[] };

type DuplicateFilterPanelProps = {
  onClose: () => void;
  facet: FacetField;

  onBatchEdit: (payload: {
    field: string;
    mode: DuplicateFilterMode;
    query: string;
  }) => void;
};

function DuplicateFilterPanel({
  onClose,
  facet,
  onBatchEdit,
}: DuplicateFilterPanelProps) {
  const { messages } = useI18n();
  const duplicateFilterText = messages.cleanPage.panels.duplicateFilter;
  const [query, setQuery] = useState('');

  const { matchedCount, sample } = useMemo(() => {
    const q = query.trim();
    const duplicateValues = facet.values.filter((x) => x.count > 1);

    if (!q) {
      const count = duplicateValues.reduce((sum, x) => sum + x.count, 0);
      return { matchedCount: count, sample: duplicateValues.slice(0, 5) };
    }

    const matched = duplicateValues.filter((x) => x.value === q);
    const count = matched.reduce((sum, x) => sum + x.count, 0);
    return { matchedCount: count, sample: matched.slice(0, 5) };
  }, [facet.values, query]);

  return (
    <CustomAccordion
      title={duplicateFilterText.title}
      subtitle={facet.field}
      icon={<ContentCopyIcon sx={{ color: 'primary.main' }} />}
      closable
      onClose={onClose}
      sx={{ mt: 1 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {duplicateFilterText.description}
      </Typography>

      <Stack spacing={1.25}>
        <TextField
          size="small"
          fullWidth
          label={duplicateFilterText.queryLabel}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          helperText={duplicateFilterText.helper}
        />

        <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: '#f0f2ff' }}>
          <Typography variant="body2">
            {duplicateFilterText.matchedCountPrefix}
            {matchedCount.toLocaleString()}
          </Typography>

          {sample.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {duplicateFilterText.samplePrefix}
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
          onClick={() => {
            onBatchEdit({
              field: facet.field,
              mode: 'exact',
              query: query.trim(),
            });
          }}
          disabled={matchedCount === 0}
        >
          {duplicateFilterText.actionSearch}
        </Button>
      </Stack>
    </CustomAccordion>
  );
}

export default DuplicateFilterPanel;
