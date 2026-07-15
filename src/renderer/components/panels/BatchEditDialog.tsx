import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useI18n } from '../../contexts/i18n';

type BatchEditDialogProps = {
  open: boolean;
  field: string;
  pickedValue: string;
  pickedCount: number;
  onClose: () => void;
  onConfirm: (newValue: string) => void;
};

const BatchEditDialog = ({
  open,
  field,
  pickedValue,
  pickedCount,
  onClose,
  onConfirm,
}: BatchEditDialogProps) => {
  const { messages } = useI18n();
  const batchEditText = messages.cleanPage.panels.batchEditDialog;
  const [newValue, setNewValue] = React.useState('');

  React.useEffect(() => {
    if (open) setNewValue('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{batchEditText.title}</DialogTitle> {/* 批次修改 */}
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {batchEditText.fieldPrefix}
            {field} {/* 欄位： */}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {batchEditText.currentValuePrefix}
            {pickedValue === ''
              ? messages.cleanPage.panels.facetValueList.emptyValue
              : pickedValue}{' '}
            {/* 目前值： */}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {batchEditText.affectedCountPrefix}
            {pickedCount.toLocaleString()} {/* 影響筆數： */}
          </Typography>
        </Box>

        <TextField
          label={batchEditText.newValueLabel} // 填入新值
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          fullWidth
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{batchEditText.cancel}</Button> {/* 取消 */}
        <Button
          variant="contained"
          onClick={() => onConfirm(newValue)}
          disabled={newValue.trim().length === 0}
        >
          {batchEditText.confirm} {/* 確認修改 */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchEditDialog;
