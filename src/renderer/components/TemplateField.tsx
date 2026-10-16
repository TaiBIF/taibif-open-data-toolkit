import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useI18n } from '../contexts/i18n';
import { getTemplateReference } from '../data/templates';

type CheckedFieldsMap = Record<string, Record<string, boolean>>;

interface TemplateField {
  column_name: string;
  column_type: string | null;
  definition_zh: string | null;
  definition_en?: string | null;
  common_name: string | null;
  example: string | null;
  example_en?: string | null;
  is_required: boolean;
  is_recommended: boolean;
  is_custom?: boolean;
  last_updated: string;
}

interface TemplateFieldPanelProps {
  title: string;
  fields: TemplateField[];
  templateValue: string;
  checkedFields: CheckedFieldsMap;
  setCheckedFields: Dispatch<SetStateAction<CheckedFieldsMap>>;
  setHoveredField: Dispatch<SetStateAction<TemplateField | null>>;
}

export default function TemplateFieldPanel({
  title,
  fields,
  templateValue,
  checkedFields,
  setCheckedFields,
  setHoveredField,
}: TemplateFieldPanelProps) {
  const { messages } = useI18n();
  const panelText = messages.templatePage.panel;
  const [showDescription, setShowDescription] = useState(false);
  const [hideUnchecked, setHideUnchecked] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const reference = getTemplateReference(templateValue);

  const visibleFields = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return fields.filter((field) => {
      const matchesSearch =
        field.column_name.toLowerCase().includes(query) ||
        (field.common_name ?? '').toLowerCase().includes(query);
      return (
        matchesSearch &&
        (!hideUnchecked || checkedFields[templateValue]?.[field.column_name])
      );
    });
  }, [searchQuery, hideUnchecked, fields, checkedFields, templateValue]);

  return (
    <Accordion
      sx={{
        bgcolor: '#e8eaf6',
        '&::before': { display: 'none' },
        '&.Mui-expanded': {
          mt: 1,
        },
      }}
      elevation={0}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body1">{title}</Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            size="small"
            variant="outlined"
            fullWidth
            aria-expanded={showFilter}
            onClick={() => setShowFilter((prev) => !prev)}
            sx={{
              borderColor: 'info.main',
              color: 'info.main',
              '&:hover': { bgcolor: '#e8eaf6' },
            }}
          >
            {showFilter ? panelText.hideFilter : panelText.showFilter}
          </Button>
          <Button
            size="small"
            variant="outlined"
            fullWidth
            onClick={() => setShowDescription((prev) => !prev)}
            sx={{
              borderColor: 'info.main',
              color: 'info.main',
              '&:hover': { bgcolor: '#e8eaf6' },
            }}
          >
            {showDescription
              ? panelText.hideDescription
              : panelText.showDescription}
          </Button>

          <Button
            size="small"
            variant="outlined"
            fullWidth
            onClick={() => setHideUnchecked((prev) => !prev)}
            sx={{
              borderColor: 'info.main',
              color: 'info.main',
              '&:hover': { bgcolor: '#e8eaf6' },
            }}
          >
            {hideUnchecked
              ? panelText.showAllFields
              : panelText.hideUncheckedFields}
          </Button>
        </Stack>

        <Collapse in={showFilter} timeout={180}>
          <Box sx={{ pt: 2, px: 0.5, pb: 0.5 }}>
            <TextField
              fullWidth
              size="small"
              label={panelText.searchFields}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label={panelText.clearSearch}
                      onClick={() => setSearchQuery('')}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />
          </Box>
        </Collapse>
        {(showFilter || searchQuery.trim() || hideUnchecked) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, textAlign: 'right' }}
            role="status"
          >
            {panelText.fieldCount
              .replace('{visible}', String(visibleFields.length))
              .replace('{total}', String(fields.length))}
          </Typography>
        )}

        <Collapse in={showDescription} sx={{ mt: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              whiteSpace: 'pre-line',
              pl: 2,
              pr: 2,
              mt: 2,
              mb: 2,
              borderLeft: 3,
              borderColor: 'info.light',
            }}
          >
            {panelText.descriptionPrefix}{' '}
            <a
              href={reference.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              {reference.label}
            </a>{' '}
            {panelText.descriptionSuffix}
          </Typography>
        </Collapse>

        <FormGroup sx={{ mt: 1 }}>
          {visibleFields.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {panelText.noMatchingFields}
            </Typography>
          )}
          {visibleFields.map((field) => (
            <Box
              key={`${title}-${field.column_name}`}
              data-name={field.column_name}
              data-type={field.column_type}
              data-description={field.definition_zh}
              data-commonname={field.common_name}
              data-example={field.example}
              onMouseEnter={() => setHoveredField(field)}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name={field.column_name}
                    checked={
                      !!checkedFields[templateValue]?.[field.column_name]
                    }
                    disabled={field.is_required}
                    onChange={(e) =>
                      setCheckedFields((prev) => ({
                        ...prev,
                        [templateValue]: {
                          ...prev[templateValue],
                          [field.column_name]: e.target.checked,
                        },
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ flexWrap: 'wrap', rowGap: 0.5 }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {field.column_name}
                        {field.common_name ? `（${field.common_name}）` : ''}
                      </Typography>
                      {field.is_custom && (
                        <Chip
                          label={panelText.customFieldBadge}
                          size="small"
                          variant="filled"
                          icon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            bgcolor: 'rgba(122,75,0,0.12)',
                            color: '#7a4b00',
                            height: 24,
                            borderRadius: 1,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'default',
                            '& .MuiChip-label': {
                              px: 0.75,
                              py: 0,
                              lineHeight: 1,
                            },
                            '& .MuiChip-icon': {
                              color: 'inherit',
                              ml: 0.5,
                              mr: 0.25,
                            },
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                }
              />
              <Divider />
            </Box>
          ))}
        </FormGroup>
      </AccordionDetails>
    </Accordion>
  );
}
