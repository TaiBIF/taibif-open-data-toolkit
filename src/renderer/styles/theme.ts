import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // 靛藍
    },
    secondary: {
      main: '#5c6bc0', // 淺靛藍（強調/hover）
    },
    background: {
      default: '#f8f9fb', // 淺灰白背景
      paper: '#f8f9fb', // 卡片底
    },
    text: {
      primary: '#1f1f1f',
      secondary: '#666666',
    },
    warning: {
      main: '#ff9800', // 橘色（主要）
      light: '#ffe0b2', // 淺橘（背景用）
      dark: '#ef6c00', // 深橘（hover 或 alert icon）
      contrastText: '#fff',
    },
    error: {
      main: '#f44336',
      light: '#fdecea',
      dark: '#d32f2f',
      contrastText: '#fff',
    },
    success: {
      main: '#4caf50',
      light: '#a5d6a7',
      dark: '#388e3c',
      contrastText: '#fff',
    },
    info: {
      main: '#2196f3',
      light: '#90caf9',
      dark: '#1565c0',
      contrastText: '#fff',
    },
  },
  typography: {
    fontFamily: `'Inter', 'Noto Sans TC', sans-serif`,
    allVariants: {
      color: '#1f1f1f',
    },
    button: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
