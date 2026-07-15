import * as React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';

import HubIcon from '@mui/icons-material/Hub';
import ExtensionIcon from '@mui/icons-material/Extension';

export type TabItemInput = {
  key: string;
  type: 'core' | 'extension';
  title: string;
  subtitle?: string;
  disabled?: boolean;
};

export type CustomTabProps = {
  items: TabItemInput[];
  spacing?: number;

  value: string | null;
  onChange: (key: string) => void;
};

const ICON_MAP = {
  core: <HubIcon />,
  extension: <ExtensionIcon />,
} as const;

const getButtonStyle = (isSelected: boolean) => {
  return isSelected
    ? {
        bgcolor: 'secondary.main',
        color: 'common.white',
        boxShadow: 'none',
        borderColor: 'secondary.main',
        '&:hover': {
          bgcolor: 'secondary.main',
        },
      }
    : {
        borderColor: 'primary.main',
        color: 'primary.main',
        '&:hover': {
          bgcolor: '#e8eaf6',
        },
      };
};

const CustomTab = ({ items, spacing = 1, value, onChange }: CustomTabProps) => {
  // 核心資料表永遠置頂
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.type === 'core' && b.type !== 'core') return -1;
      if (a.type !== 'core' && b.type === 'core') return 1;
      return 0;
    });
  }, [items]);

  return (
    <Stack direction="column" spacing={spacing}>
      {sortedItems.map((item) => {
        const selected = item.key === value;

        return (
          <Button
            key={item.key}
            variant="outlined"
            startIcon={ICON_MAP[item.type]}
            disabled={item.disabled}
            onClick={() => onChange(item.key)}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              ...getButtonStyle(selected),
            }}
          >
            <Stack direction="column" alignItems="flex-start">
              <Box component="span">{item.title}</Box>

              {item.subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    lineHeight: 1.2,
                    color: selected
                      ? 'rgba(255,255,255,0.8)'
                      : 'text.secondary',
                  }}
                >
                  {item.subtitle}
                </Typography>
              )}
            </Stack>
          </Button>
        );
      })}
    </Stack>
  );
};

export default CustomTab;
