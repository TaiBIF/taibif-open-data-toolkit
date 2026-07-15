import { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';

import { theme } from '../styles/theme';
import CustomStepper from './CustomStepper';
import LogoHeader from './LogoHeader';
import StepHint from './StepHint';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        <AppBar
          position="static"
          sx={{
            bgcolor: 'background.default',
            color: 'primary.main',
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* Logo + 標題 + 語系 */}
            <LogoHeader />
            {/* 步驟 */}
            <CustomStepper />
          </Toolbar>
        </AppBar>

        {/* 步驟提示 */}
        <StepHint />

        {/* 子內容 */}
        {children}
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
