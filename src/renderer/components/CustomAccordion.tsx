import * as React from 'react';
import { Box, Collapse, IconButton, ListItem, Typography } from '@mui/material';
import { type SxProps, type Theme } from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import { useI18n } from '../contexts/i18n';

type CustomAccordionProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;

  defaultExpanded?: boolean;
  expanded?: boolean; // 受控
  onExpandedChange?: (expanded: boolean) => void;

  count?: number; // 方便你顯示「資料問題筆數」
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
  titleNoWrap?: boolean;

  closable?: boolean;
  onClose?: () => void;
};

const CustomAccordion = ({
  title,
  subtitle,
  children,
  count,
  defaultExpanded = false,
  expanded,
  onExpandedChange,
  icon = <WarningAmberIcon sx={{ color: 'warning.main' }} />,
  sx,
  titleNoWrap = true,
  closable = false,
  onClose,
}: CustomAccordionProps) => {
  const { messages } = useI18n();
  const [innerExpanded, setInnerExpanded] = React.useState(defaultExpanded);
  const isControlled = typeof expanded === 'boolean';

  const isOpen = closable
    ? true // ✅ closable 模式永遠展開
    : isControlled
      ? expanded
      : innerExpanded;

  const toggle = () => {
    if (closable) return;
    const next = !isOpen;
    if (!isControlled) setInnerExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <Box sx={sx}>
      {/* Header */}
      <ListItem
        onClick={toggle}
        sx={{
          bgcolor: '#e8eaf6',
          borderRadius: 2,
          px: 2,
          py: 1,
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: '#dfe3f5',
            cursor: 'pointer',
          },
        }}
      >
        {/* icon from props */}
        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>{icon}</Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap={titleNoWrap}>
            {title}
          </Typography>

          <Typography variant="caption" color="text.secondary" noWrap>
            {subtitle ??
              (typeof count === 'number'
                ? `${messages.components.customAccordion.issueCountPrefix}${count}`
                : '')}
          </Typography>
        </Box>

        {/* 右上角控制 */}
        {closable ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            sx={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        )}
      </ListItem>

      {/* Body */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box sx={{ pt: 1, pb: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};

export default CustomAccordion;
