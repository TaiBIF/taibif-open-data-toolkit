import { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { useStepContext } from '../contexts/step';
import { useProject } from '../contexts/project';
import { useI18n } from '../contexts/i18n';

const StepHint = () => {
  const { stepItems, currentStep, currentPath } = useStepContext();
  const { selectedProject } = useProject();
  const { messages } = useI18n();
  const stepHintText = messages.components.stepHint;

  const [projectName, setProjectName] = useState<string>('');
  const stepByPath = stepItems.find((item) => item.path === currentPath);
  const step = stepByPath ?? stepItems[currentStep];
  const hints = step?.hints;

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('get-project-name', selectedProject)
      .then((result) => {
        setProjectName(result);
      });
  }, [selectedProject]);

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
      }}
    >
      {hints && (
        <Typography
          variant="subtitle2"
          sx={{ color: 'common.white', fontSize: 12 }}
        >
          {step
            ? `${stepHintText.stepPrefix}${hints.step}. ${hints.text}` // STEP
            : stepHintText.unknownStep}{' '}
          {/* 未知步驟 */}
        </Typography>
      )}
      {projectName && (
        <Typography
          variant="subtitle2"
          sx={{ color: 'common.white', fontSize: 12 }}
        >
          {stepHintText.currentProjectPrefix}
          {projectName} {/* 當前專案： */}
        </Typography>
      )}
    </Box>
  );
};

export default StepHint;
