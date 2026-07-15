import React, { useMemo } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepIconProps,
  Box,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useStepContext } from '../contexts/step';

const CustomStepper = () => {
  const { stepItems, currentPath } = useStepContext();

  const displaySteps = useMemo(
    () => stepItems.filter((item) => item.path !== '/data-mapping'),
    [stepItems],
  );
  const activePath = currentPath === '/data-mapping' ? '/data-edit' : currentPath;
  const activeIndex = displaySteps.findIndex((item) => item.path === activePath);

  const CustomStepIcon: React.FC<StepIconProps> = ({ className, icon }) => {
    const index = Number(icon) - 1;
    const iconSrc = displaySteps[index]?.icon;

    return (
      <Box
        component="img"
        src={iconSrc}
        alt={`step-${icon}`}
        className={className}
        sx={{
          width: 35,
          height: 35,
          opacity: index === activeIndex ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }}
      />
    );
  };

  return (
    <Box>
      <Stepper activeStep={Math.max(0, activeIndex)}>
        {displaySteps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              slots={{ stepIcon: CustomStepIcon }}
              slotProps={{
                stepIcon: { icon: index + 1 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" color="primary.main">
                  {step.label}
                </Typography>
                {index < displaySteps.length - 1 && (
                  <ArrowForwardIcon
                    fontSize="small"
                    sx={{ color: 'primary.main' }}
                  />
                )}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default CustomStepper;
