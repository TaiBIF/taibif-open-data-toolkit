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
    label: '生態檢核 物種名錄',
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
    label: '生態檢核 物種出現紀錄',
    value: 'template_extension_ecological_assessment_occurrence',
    group: '生物多樣性領域資料標準',
  },
];

export const themeTemplates = [
  {
    label: '自然史典藏',
    value: 'natural_history_collection',
    group: '生物多樣性領域資料標準',
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
    core: {
      label: '生態檢核 物種名錄',
      value: 'template_core_ecological_assessment',
    },
    extensions: [
      {
        label: '生態檢核 物種出現紀錄',
        value: 'template_extension_ecological_assessment_occurrence',
      },
    ],
  },
];
