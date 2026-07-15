import {
  Typography,
  IconButton,
  Box,
  Autocomplete,
  TextField,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import GTranslateIcon from '@mui/icons-material/GTranslate';

import taibifLogo from '../../../assets/taibif-logo-rbg.png';
import { locales, type Locale } from '../i18n/locales';
import { useI18n } from '../contexts/i18n';

interface LanguageOption {
  code: Locale;
  label: string;
}

const LogoHeader = () => {
  const { locale, setLocale, messages } = useI18n();
  const languageOptions: LanguageOption[] = locales.map((code) => ({
    code,
    label: messages.logoHeader.languageNames[code],
  }));
  const selectedLanguage =
    languageOptions.find((option) => option.code === locale) ??
    languageOptions[0];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box
        component={RouterLink}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Box
          component="img"
          src={taibifLogo}
          alt={messages.logoHeader.logoAlt}
          sx={{ width: 55, height: 'auto' }}
        />
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', color: 'primary.main' }}
        >
          {/* 開放資料工具包 (Open Data Toolkit, ODT) */}
          {messages.logoHeader.title}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex' }}>
        <IconButton
          sx={{ color: 'primary.main' }}
          aria-label={messages.logoHeader.languageLabel}
        >
          <GTranslateIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Autocomplete<LanguageOption, false, true, false>
          disablePortal
          options={languageOptions}
          value={selectedLanguage}
          onChange={(_, value) => {
            if (value) setLocale(value.code);
          }}
          disableClearable
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          sx={{
            width: 200,
            '& .MuiInputBase-root': {
              fontSize: '0.8rem',
              minHeight: '36px',
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.8rem',
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              aria-label={messages.logoHeader.languageLabel}
            />
          )}
        />
      </Box>
    </Box>
  );
};

export default LogoHeader;
