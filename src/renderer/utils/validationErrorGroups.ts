import { FIELD_VOCAB_KEY } from '../../shared/controlledVocab';

export type ValidationErrorRow = {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
};

export type ValidationErrorGroup = {
  key: string;
  title: string;
  count: number;
  severity: 'error' | 'warning';
  rows: { row: number; value: string }[];
};

const DATE_FORMAT_FIELDS = new Set([
  'eventDate',
  'created',
  'dateIdentified',
  'modified',
  'georeferencedDate',
]);
const CONTROLLED_VOCAB_FIELDS = new Set(Object.keys(FIELD_VOCAB_KEY));

const extractValueFromMessage = (message: string) => {
  const matched = message.match(/（(.+)）/);
  return matched?.[1] ?? message;
};

export const groupValidationErrors = (
  errors: ValidationErrorRow[],
): ValidationErrorGroup[] => {
  const grouped = new Map<
    string,
    {
      title: string;
      severity: 'error' | 'warning';
      rows: { row: number; value: string }[];
    }
  >();

  errors.forEach((err) => {
    let title = err.field ? `${err.field} 驗證錯誤` : '資料驗證錯誤';
    let rowValue = err.message;

    if (
      err.field &&
      DATE_FORMAT_FIELDS.has(err.field) &&
      err.message.includes('格式錯誤')
    ) {
      title = `${err.field} 格式不符合`;
      rowValue = extractValueFromMessage(err.message);
    } else if (err.field && err.message.includes('為空值')) {
      title = `${err.field} 為空值`;
      rowValue = 'null';
    } else if (err.field && err.message.includes('必填欄位')) {
      title = `${err.field} 必填欄位缺漏`;
      rowValue = 'null';
    } else if (
      (err.field === 'decimalLongitude' || err.field === 'decimalLatitude') &&
      err.message.includes('不在有效範圍')
    ) {
      title = `${err.field} 不在有效範圍`;
      rowValue = extractValueFromMessage(err.message);
    } else if (
      (err.field === 'decimalLongitude' || err.field === 'decimalLatitude') &&
      err.message.includes('不是有效數值')
    ) {
      title = `${err.field} 不是有效數值`;
      rowValue = extractValueFromMessage(err.message);
    } else if (
      err.field &&
      CONTROLLED_VOCAB_FIELDS.has(err.field) &&
      err.message.includes('非控制詞彙')
    ) {
      title = `${err.field} 非控制詞彙`;
      rowValue = extractValueFromMessage(err.message);
    } else if (err.field && err.message.includes('重複')) {
      title = `${err.field} 重複`;
      rowValue = extractValueFromMessage(err.message);
    } else if (err.message.includes('JSON 解析失敗')) {
      title = '資料格式錯誤';
      rowValue = 'JSON 解析失敗';
    }

    const key = `${err.field ?? 'unknown'}::${title}`;
    const current = grouped.get(key) ?? {
      title,
      severity: err.severity ?? 'error',
      rows: [],
    };
    current.rows.push({ row: err.row, value: rowValue });
    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .map(([key, value]) => ({
      key,
      title: value.title,
      count: value.rows.length,
      severity: value.severity,
      rows: value.rows.sort((a, b) => a.row - b.row),
    }))
    .sort((a, b) => b.count - a.count);
};

type ValidationTitleLocale = 'zh-TW' | 'en' | 'es';

export const translateValidationGroupTitle = (
  title: string,
  locale: ValidationTitleLocale,
) => {
  if (locale === 'zh-TW') return title;

  const formatWithField = (
    suffix: string,
    format: (field: string) => string,
  ) => {
    if (!title.endsWith(suffix)) return null;
    const field = title.slice(0, -suffix.length);
    return format(field);
  };

  if (locale === 'en') {
    return (
      formatWithField(' 驗證錯誤', (f) => `${f} Validation Error`) ??
      formatWithField(' 格式不符合', (f) => `${f} Invalid Format`) ??
      formatWithField(' 為空值', (f) => `${f} Null Value`) ??
      formatWithField(' 必填欄位缺漏', (f) => `${f} Required Field Missing`) ??
      formatWithField(' 不在有效範圍', (f) => `${f} Out of Valid Range`) ??
      formatWithField(' 不是有效數值', (f) => `${f} Invalid Number`) ??
      formatWithField(
        ' 非控制詞彙',
        (f) => `${f} Not in Controlled Vocabulary`,
      ) ??
      formatWithField(' 重複', (f) => `${f} Duplicated`) ??
      (title === '資料驗證錯誤'
        ? 'Data Validation Error'
        : title === '資料格式錯誤'
          ? 'Data Format Error'
          : title)
    );
  }

  return (
    formatWithField(' 驗證錯誤', (f) => `${f} Error de validacion`) ??
    formatWithField(' 格式不符合', (f) => `${f} Formato invalido`) ??
    formatWithField(' 為空值', (f) => `${f} Valor nulo`) ??
    formatWithField(' 必填欄位缺漏', (f) => `${f} Falta campo obligatorio`) ??
    formatWithField(' 不在有效範圍', (f) => `${f} Fuera de rango valido`) ??
    formatWithField(' 不是有效數值', (f) => `${f} Valor numerico invalido`) ??
    formatWithField(
      ' 非控制詞彙',
      (f) => `${f} Fuera del vocabulario controlado`,
    ) ??
    formatWithField(' 重複', (f) => `${f} Duplicado`) ??
    (title === '資料驗證錯誤'
      ? 'Error de validacion de datos'
      : title === '資料格式錯誤'
        ? 'Error de formato de datos'
        : title)
  );
};
