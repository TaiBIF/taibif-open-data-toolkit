import * as React from 'react';
import CustomAccordion from './CustomAccordion';
import ErrorRowList from './ErrorRowList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useI18n } from '../contexts/i18n';
import { translateValidationGroupTitle } from '../utils/validationErrorGroups';

import { Stack } from '@mui/material';

export type FieldError = {
  field: string;
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

const FieldErrorAccordionList = ({ items }: FieldErrorAccordionListProps) => {
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
          icon={<WarningAmberIcon sx={{ color: 'warning.main' }} />}
        >
          <ErrorRowList rows={item.rows} />
        </CustomAccordion>
      ))}
    </Stack>
  );
};

export default FieldErrorAccordionList;
