import * as React from 'react';
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useI18n } from '../contexts/i18n';

type Props = {
  page: number; // 1-based
  totalRows: number;
  pageSize: number;
  pageSizeMode?: 'auto' | 'manual';

  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
  onPageSizeModeChange?: (nextMode: 'auto' | 'manual') => void;
  pageSizeOptions?: number[];

  // 可選：客製顯示文字
  label?: (page: number, totalPages: number) => React.ReactNode;

  // 可選：整體 disabled（例如讀取中）
  disabled?: boolean;

  // 可選：外層 sx
  sx?: any;
};

const toolbarIconBtnSx = {
  minWidth: 36,
  width: 36,
  height: 36,
  padding: 0,
  borderColor: 'primary.main',
  color: 'primary.main',
  fontSize: '0.875rem',
  fontWeight: 500,
  '&:hover': { bgcolor: '#e8eaf6' },
};

const pageBadgeSx = {
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  px: 1.25,
  color: 'primary.main',
  bgcolor: 'transparent',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

const compactFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 36,
    color: 'primary.main',
    fontSize: '0.875rem',
    fontWeight: 500,
    '& .MuiSelect-select, & .MuiInputBase-input': {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
  },
};

const PaginationControls: React.FC<Props> = ({
  page,
  totalRows,
  pageSize,
  pageSizeMode = 'manual',
  onPageChange,
  onPageSizeChange,
  onPageSizeModeChange,
  pageSizeOptions: propsPageSizeOptions,
  label,
  disabled = false,
  sx,
}) => {
  const { messages } = useI18n();
  const totalPages = Math.max(1, Math.ceil((totalRows || 0) / (pageSize || 1)));
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const [jumpPageInput, setJumpPageInput] = React.useState(String(safePage));
  const pageSizeOptions = propsPageSizeOptions?.length
    ? propsPageSizeOptions
    : [20, 50, 100];

  React.useEffect(() => {
    setJumpPageInput(String(safePage));
  }, [safePage]);

  const go = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));
  const jumpTarget = Number(jumpPageInput);
  const canJump =
    !disabled &&
    Number.isInteger(jumpTarget) &&
    jumpTarget >= 1 &&
    jumpTarget <= totalPages;

  const defaultLabel = (p: number, tp: number) => (
    <Typography variant="body2" sx={{ lineHeight: 1, color: 'primary.main' }}>
      {messages.pagination.labelPrefix}
      {p} / {tp}
      {messages.pagination.labelSuffix}
    </Typography>
  );

  const isFirstDisabled = disabled || safePage <= 1;
  const isLastDisabled = disabled || safePage >= totalPages;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={sx}>
      <Button
        variant="outlined"
        sx={toolbarIconBtnSx}
        disabled={isFirstDisabled}
        onClick={() => go(1)}
      >
        <FirstPageIcon fontSize="small" />
      </Button>

      <Button
        variant="outlined"
        sx={toolbarIconBtnSx}
        disabled={isFirstDisabled}
        onClick={() => go(safePage - 1)}
      >
        <ChevronLeftIcon fontSize="small" />
      </Button>

      <Box sx={pageBadgeSx}>
        {label
          ? label(safePage, totalPages)
          : defaultLabel(safePage, totalPages)}
      </Box>

      <Button
        variant="outlined"
        sx={toolbarIconBtnSx}
        disabled={isLastDisabled}
        onClick={() => go(safePage + 1)}
      >
        <ChevronRightIcon fontSize="small" />
      </Button>

      <Button
        variant="outlined"
        sx={toolbarIconBtnSx}
        disabled={isLastDisabled}
        onClick={() => go(totalPages)}
      >
        <LastPageIcon fontSize="small" />
      </Button>

      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: 1 }}>
        <Typography
          variant="caption"
          sx={{ lineHeight: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}
        >
          {messages.pagination.rowsPerPageLabel}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 84, ...compactFieldSx }}>
          <Select
            value={pageSizeMode === 'auto' ? 'auto' : String(pageSize)}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.value === 'auto') {
                onPageSizeModeChange?.('auto');
                return;
              }
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              onPageSizeModeChange?.('manual');
              onPageSizeChange?.(next);
              onPageChange(1);
            }}
          >
            <MenuItem
              value="auto"
              sx={{ fontSize: '0.875rem', fontWeight: 500 }}
            >
              {messages.pagination.autoRowsLabel}
            </MenuItem>
            {pageSizeOptions.map((opt) => (
              <MenuItem
                key={opt}
                value={String(opt)}
                sx={{ fontSize: '0.875rem', fontWeight: 500 }}
              >
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{ ml: 0.5 }}
      >
        <Typography
          variant="caption"
          sx={{ lineHeight: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}
        >
          {messages.pagination.goToPageLabel}
        </Typography>
        <TextField
          size="small"
          value={jumpPageInput}
          onChange={(e) => {
            setJumpPageInput(e.target.value.replace(/\D+/g, ''));
          }}
          disabled={disabled}
          sx={{ width: 64, ...compactFieldSx }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 1 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canJump) go(jumpTarget);
          }}
        />

        <Button
          variant="outlined"
          sx={{ ...toolbarIconBtnSx, width: 'auto', minWidth: 48, px: 1 }}
          disabled={!canJump}
          onClick={() => go(jumpTarget)}
        >
          {messages.pagination.goButton}
        </Button>
      </Stack>
    </Stack>
  );
};

export default PaginationControls;
