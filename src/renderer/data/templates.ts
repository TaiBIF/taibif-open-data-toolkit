export const coreTemplates = [
  {
    label: '物種名錄 Checklist',
    value: 'template_core_checklist',
    group: '達爾文核心資料表',
  },
  {
    label: '出現紀錄 Occurrence',
    value: 'template_core_occurrence',
    group: '達爾文核心資料表',
  },
  {
    label: '調查活動 Sampling Event',
    value: 'template_core_samplingevent',
    group: '達爾文核心資料表',
  },
  {
    label: '自然史典藏 物種出現紀錄',
    value: 'template_core_natural_history_collection',
    group: '生物多樣性領域資料標準',
  },
  {
    label: '生態檢核 工程基本資料',
    value: 'template_core_ecological_assessment',
    group: '生物多樣性領域資料標準',
  },
];

export const extensionTemplates = [
  {
    label: 'Darwin Core Occurrence',
    value: 'template_extension_occurrence',
    group: '達爾文延伸資料表',
  },
  {
    label: 'Simple Multimedia',
    value: 'template_extension_simple_multimedia',
    group: '達爾文延伸資料表',
  },
  {
    label: 'Extended Measurement Or Facts',
    value: 'template_extension_extended_measurement_or_facts',
    group: '達爾文延伸資料表',
  },
  {
    label: 'Resource Relationship',
    value: 'template_extension_resource_relationship',
    group: '達爾文延伸資料表',
  },
  {
    label: 'DNA Derived Data',
    value: 'template_extension_dna_derived_data',
    group: '達爾文延伸資料表',
  },
  {
    label: '自然史典藏 物種鑑定歷史',
    value:
      'template_extension_natural_history_collection_identification_history',
    group: '生物多樣性領域資料標準',
  },
  {
    label: '自然史典藏 典藏量測紀錄',
    value: 'template_extension_natural_history_collection_measurment_or_facts',
    group: '生物多樣性領域資料標準',
  },
  {
    label: '生態檢核 生物出現紀錄',
    value: 'template_extension_ecological_assessment_occurrence',
    group: '生物多樣性領域資料標準',
  },
  {
    label: '生態檢核 生物名錄',
    value: 'template_extension_ecological_assessment_checklist',
    group: '生物多樣性領域資料標準',
  },
];

export const themeTemplates = [
  {
    label: '自然史典藏',
    value: 'natural_history_collection',
    group: '生物多樣性領域資料標準',
    reference: {
      href: 'https://docs.tbiadata.tw/collection/#extension-identification-history',
      label: 'TBIA 自然史典藏資料交換參考模板',
    },
    core: {
      label: '自然史典藏 物種出現紀錄',
      value: 'template_core_natural_history_collection',
    },
    extensions: [
      {
        label: '自然史典藏 物種鑑定歷史',
        value:
          'template_extension_natural_history_collection_identification_history',
      },
      {
        label: '自然史典藏 典藏量測紀錄',
        value:
          'template_extension_natural_history_collection_measurment_or_facts',
      },
    ],
  },
  {
    label: '生態檢核',
    value: 'ecological_assessment',
    group: '生物多樣性領域資料標準',
    reference: {
      href: 'https://docs.tbiadata.tw/PECEP_standard/',
      label: 'TBIA 生態檢核資料交換參考模板',
    },
    core: {
      label: '生態檢核 工程基本資料',
      value: 'template_core_ecological_assessment',
    },
    extensions: [
      {
        label: '生態檢核 生物出現紀錄',
        value: 'template_extension_ecological_assessment_occurrence',
      },
      {
        label: '生態檢核 生物名錄',
        value: 'template_extension_ecological_assessment_checklist',
      },
    ],
  },
  // {
  //   label: '自動相機',
  //   value: 'ecological_assessment',
  //   group: '生物多樣性領域資料標準',
  //   reference: {
  //     href: 'https://docs.tbiadata.tw/cameratrap/',
  //     label: 'TBIA 自動相機資料交換參考模板',
  //   },
  //   core: {
  //     label: '自動相機 佈設資料',
  //     value: '',
  //   },
  //   extensions: [
  //     {
  //       label: '自動相機 多媒體資料',
  //       value: '',
  //     },
  //     {
  //       label: '自動相機 觀察資料',
  //       value: '',
  //     },
  //   ],
  // },
];

const defaultTemplateReference = {
  href: 'https://dwc.tdwg.org/terms/',
  label: 'Darwin Core Quick Reference Guide',
};

// 在主題的 reference 設定來源，核心與延伸資料表共用
export function getTemplateReference(templateValue: string) {
  const theme = themeTemplates.find(
    ({ core, extensions }) =>
      core.value === templateValue ||
      extensions.some(({ value }) => value === templateValue),
  );

  return theme?.reference ?? defaultTemplateReference;
}
