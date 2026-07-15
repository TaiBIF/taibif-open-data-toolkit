import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CustomAccordion from '../CustomAccordion';
import FacetValueList from './FacetValueList';
import BatchEditDialog from './BatchEditDialog';
import { useI18n } from '../../contexts/i18n';

type FacetValue = { value: string; count: number };
type FacetField = { field: string; values: FacetValue[] };

type ContentFilterPanelProps = {
  onClose: () => void;
  facet: FacetField;
  onBatchEdit: (payload: {
    field: string;
    fromValue: string;
    toValue: string;
  }) => void;
};

const ContentFilterPanel = ({
  onClose,
  facet,
  onBatchEdit,
}: ContentFilterPanelProps) => {
  const { messages } = useI18n();
  const contentFilterText = messages.cleanPage.panels.contentFilter;
  const [picked, setPicked] = useState<FacetValue | null>(null);

  return (
    <>
      <CustomAccordion
        title={contentFilterText.title} // 內容篩選
        subtitle={`${facet.field}`}
        icon={<PlaylistAddCheckIcon sx={{ color: 'primary.main' }} />}
        closable
        onClose={onClose}
        sx={{ mt: 1 }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {contentFilterText.description}{' '}
          {/* 點選需要修改的值，接著在彈出視窗輸入新值，系統將批次套用至所有符合該值的資料。 */}
        </Typography>

        <FacetValueList values={facet.values} onPick={setPicked} />
      </CustomAccordion>

      <BatchEditDialog
        open={!!picked}
        field={facet.field}
        pickedValue={picked?.value ?? ''}
        pickedCount={picked?.count ?? 0}
        onClose={() => setPicked(null)}
        onConfirm={(newValue) => {
          if (!picked) return;
          onBatchEdit({
            field: facet.field,
            fromValue: picked.value,
            toValue: newValue,
          });
          setPicked(null);
        }}
      />
    </>
  );
};

export default ContentFilterPanel;
