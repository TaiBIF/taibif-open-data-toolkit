import { useState } from 'react';
import {
  Button,
  Stack,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Link,
} from '@mui/material';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CustomAccordion from '../CustomAccordion';
import { useI18n } from '../../contexts/i18n';

type SocketStatus = 'idle' | 'connecting' | 'running' | 'done' | 'error';

type SpeciesApiPanelProps = {
  onClose: () => void;
  onConnect: () => Promise<{
    ok: boolean;
    updated?: number;
    skipped?: number;
    totalNames?: number;
  }>;
};

type SocketStatusBarProps = {
  status: SocketStatus;
  message?: string;
  statusLabels: {
    connecting: string;
    running: string;
    done: string;
    error: string;
  };
};

const SocketStatusBar = ({
  status,
  message,
  statusLabels,
}: SocketStatusBarProps) => {
  if (status === 'idle') return null;

  return (
    <Box
      sx={{
        mt: 1,
        mb: 2, // ⭐ 與下方按鈕的距離
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // ⭐ 置中
      }}
    >
      {status === 'running' && (
        <Box sx={{ width: '100%', mb: 1 }}>
          <LinearProgress />
        </Box>
      )}

      <Chip
        size="small"
        label={
          message ??
          {
            connecting: statusLabels.connecting,
            running: statusLabels.running,
            done: statusLabels.done,
            error: statusLabels.error,
          }[status]
        }
        color={
          status === 'done'
            ? 'success'
            : status === 'error'
              ? 'error'
              : 'primary'
        }
        variant="filled" // ⭐ 實色
        sx={{
          color: '#fff', // ⭐ 白字
          fontWeight: 500,
          cursor: 'default',
          pointerEvents: 'none', // ⭐ 不可互動
        }}
      />
    </Box>
  );
};

const SpeciesApiPanel = ({ onClose, onConnect }: SpeciesApiPanelProps) => {
  const { messages } = useI18n();
  const speciesText = messages.cleanPage.panels.speciesApi;
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('idle');
  const [socketMessage, setSocketMessage] = useState<string>();

  return (
    <CustomAccordion
      title={speciesText.title} // 串接物種 API
      subtitle={speciesText.subtitle} // 自動補齊物種高階層相關欄位
      icon={<CloudSyncIcon sx={{ color: 'primary.main' }} />}
      closable
      onClose={onClose}
      sx={{ mt: 1 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {speciesText.descriptionPrefix}
        {/* 系統將根據 scientificName 欄位的內容，使用 */}
        <Link
          href="https://match.taibif.tw/v2/index.html"
          target="_blank"
          rel="noopener noreferrer"
          underline="always"
          color="primary.main"
        >
          Nomenmatch API
        </Link>{' '}
        {speciesText.descriptionMiddle}
        {/* 進行比對。會先以 Taicol 主要資訊來源進行查詢，若未匹配再以 GBIF 作為資料來源進行補查，並將結果寫入資料表。 */}
        {speciesText.descriptionSuffix}
        <br />
        <br />
        {speciesText.overwriteFieldsPrefix}
        {/* 串接完成後將會新增、覆寫以下欄位： */}
        apiSource, acceptedNameUsageID, vernacularName, kingdom, phylum, class,
        order, family, genus, taxonRank
      </Typography>

      <SocketStatusBar
        status={socketStatus}
        message={socketMessage}
        statusLabels={speciesText.status}
      />

      <Stack>
        <Button
          variant="outlined"
          fullWidth
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': { bgcolor: '#e8eaf6' },
          }}
          onClick={async () => {
            setSocketStatus('running');
            setSocketMessage(undefined);
            try {
              const res = await onConnect();
              if (!res?.ok) {
                setSocketStatus('error');
                setSocketMessage(speciesText.connectFailed); // 串接過程發生錯誤
                return;
              }
              setSocketStatus('done');
              setSocketMessage(
                speciesText.doneSummary
                  .replace('{updated}', String(res.updated ?? 0))
                  .replace('{skipped}', String(res.skipped ?? 0)), // 完成：{updated} 筆更新 / {skipped} 筆略過
              );
            } catch (err) {
              setSocketStatus('error');
              setSocketMessage(String(err));
            }
          }}
        >
          {speciesText.actionConnect} {/* 串接 */}
        </Button>
      </Stack>
    </CustomAccordion>
  );
};

export default SpeciesApiPanel;
