import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useI18n } from '../contexts/i18n';

type ErrorRowListProps = {
  rows: { row: number; value: string }[];
  initialVisibleCount?: number;
  loadMoreStep?: number;
};

const ErrorRowList = ({
  rows,
  initialVisibleCount = 20,
  loadMoreStep = 20,
}: ErrorRowListProps) => {
  const { messages } = useI18n();
  const errorRowText = messages.components.errorRowList;
  const safeInitial = Math.max(1, initialVisibleCount);
  const safeStep = Math.max(1, loadMoreStep);
  const [visibleCount, setVisibleCount] = useState(safeInitial);

  useEffect(() => {
    setVisibleCount(safeInitial);
  }, [rows, safeInitial]);

  const visibleRows = useMemo(
    () => rows.slice(0, visibleCount),
    [rows, visibleCount],
  );

  const hasMore = visibleCount < rows.length;

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        {errorRowText.shownPrefix}
        {Math.min(visibleCount, rows.length)} / {rows.length}
        {errorRowText.shownSuffix}
      </Typography>

      {visibleRows.map((r) => (
        <Box
          key={`${r.row}-${r.value}`}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: '#f0f2ff',
            display: 'flex',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ width: 80, whiteSpace: 'nowrap' }}
          >
            {errorRowText.rowPrefix}
            {r.row}
            {errorRowText.rowSuffix}
          </Typography>

          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {r.value}
          </Typography>
        </Box>
      ))}

      {hasMore && (
        <Button
          variant="outlined"
          size="small"
          onClick={() => setVisibleCount((n) => n + safeStep)}
          sx={{
            alignSelf: 'flex-start',
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': { bgcolor: '#e8eaf6' },
          }}
        >
          {errorRowText.loadMore}
        </Button>
      )}
    </Stack>
  );
};

export default ErrorRowList;
