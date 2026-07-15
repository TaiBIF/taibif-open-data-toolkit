import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import butterFlyLogo from '../../../assets/mascot-butterfly.png';
import fishLogo from '../../../assets/mascot-fish.png';
import flowerLogo from '../../../assets/mascot-flower.png';
import frogLogo from '../../../assets/mascot-frog.png';
import mreevesiLogo from '../../../assets/mascot-Mreevesi.png';
import { useI18n } from './i18n';

interface StepItem {
  label: string;
  icon: string;
  path: string;
  hints: {
    step: number;
    text: string;
  };
}

interface StepContextType {
  stepItems: StepItem[];
  currentStep: number;
  currentPath: string;
}

const StepContext = createContext<StepContextType | undefined>(undefined);

function StepProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { messages } = useI18n();

  const stepItems: StepItem[] = useMemo(
    () => [
      {
        label: messages.customStepper.labels.project, // 資料專案
        icon: flowerLogo,
        path: '/',
        hints: {
          step: 0,
          text: messages.customStepper.hints.project, // 選擇建立新專案，或開啟過去的專案來繼續編輯
        },
      },
      {
        label: messages.customStepper.labels.template, // 資料模板
        icon: frogLogo,
        path: '/data-template',
        hints: {
          step: 1,
          text: messages.customStepper.hints.template, // 從內建模板、主題挑選欄位，或自訂欄位建立屬於自己的模板
        },
      },
      {
        label: messages.customStepper.labels.edit, // 資料編輯
        icon: mreevesiLogo,
        path: '/data-edit',
        hints: {
          step: 2,
          text: messages.customStepper.hints.edit, // 在這一步填寫與整理資料，左側可切換不同資料表。所有修改都會自動保存，完成後即可檢查資料品質
        },
      },
      {
        label: messages.customStepper.labels.mapping, // 資料匯入
        icon: mreevesiLogo,
        path: '/data-mapping',
        hints: {
          step: 2,
          text: messages.customStepper.hints.mapping, // 將既有資料表匯入至專案中，並對應欄位
        },
      },
      {
        label: messages.customStepper.labels.validate, // 資料驗證
        icon: fishLogo,
        path: '/data-validate',
        hints: {
          step: 3,
          text: messages.customStepper.hints.validate, // 檢查欄位格式與內容是否符合規則，快速定位資料錯誤並查看影響列數
        },
      },
      {
        label: messages.customStepper.labels.clean, // 資料清理
        icon: butterFlyLogo,
        path: '/data-clean',
        hints: {
          step: 4,
          text: messages.customStepper.hints.clean, // 依左側錯誤訊息定位資料問題，並使用表格上方提供的工具批次修正資料內容
        },
      },
    ],
    [messages],
  );

  const currentStep = useMemo(() => {
    return stepItems.findIndex((item) => item.path === location.pathname);
  }, [location.pathname, stepItems]);

  const contextValue = useMemo(
    () => ({
      stepItems,
      currentStep,
      currentPath: location.pathname,
    }),
    [currentStep, location.pathname, stepItems],
  );

  return (
    <StepContext.Provider value={contextValue}>{children}</StepContext.Provider>
  );
}

export default StepProvider;

export const useStepContext = () => {
  const context = useContext(StepContext);
  if (!context) throw new Error('useStepContext 必須在 <StepProvider> 中使用');
  return context;
};
