import * as React from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Stack } from '@mui/material';
import CustomAccordion from './CustomAccordion';
import ErrorRowList from './ErrorRowList';
import { useI18n } from '../contexts/i18n';
import { translateValidationGroupTitle } from '../utils/validationErrorGroups';

export type FieldError = {
  field: string;
  severity: 'error' | 'warning';
  errorMessage?: string;
  count: number;
  rows: {
    row: number;
    value: string;
  }[];
};

type FieldErrorAccordionListProps = {
  items: FieldError[];
};

function FieldErrorAccordionList({ items }: FieldErrorAccordionListProps) {
  const { messages, locale } = useI18n();
  const fieldErrorText = messages.components.fieldErrorAccordionList;

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <CustomAccordion
          key={item.field}
          title={translateValidationGroupTitle(item.field, locale)}
          titleNoWrap={false}
          subtitle={`${fieldErrorText.errorCountPrefix}${item.count}`} // 錯誤筆數：
          icon={
            item.severity === 'error' ? (
              <ErrorOutlineIcon sx={{ color: 'error.main' }} />
            ) : (
              <WarningAmberIcon sx={{ color: 'warning.main' }} />
            )
          }
        >
          <ErrorRowList rows={item.rows} />
        </CustomAccordion>
      ))}
    </Stack>
  );
}

export default FieldErrorAccordionList;
