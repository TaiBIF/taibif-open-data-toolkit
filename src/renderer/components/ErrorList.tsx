import { Box, Stack, Typography } from '@mui/material';

type ErrorRow = {
  row: number;
  message: string;
  field?: string;
};

type ErrorListProps = {
  rows: ErrorRow[];
};

const ErrorList = ({ rows }: ErrorListProps) => {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        沒有錯誤資料
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {rows.map((r) => (
        <Box
          key={`${r.row}-${r.message}`}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: '#f0f2ff',
            display: 'flex',
            alignItems: 'center',
            gap: 2, // 左右間距
          }}
        >
          {/* 左：列數 */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap' }}
          >
            第 {r.row} 列
          </Typography>

          {/* 右：錯誤訊息 */}
          <Typography variant="body2" sx={{ flex: 1 }}>
            {r.message}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default ErrorList;
