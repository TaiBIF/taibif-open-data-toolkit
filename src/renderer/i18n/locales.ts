export const locales = ['zh-TW', 'en', 'es'] as const;

export type Locale = (typeof locales)[number];

export interface AppMessages {
  logoHeader: {
    title: string;
    logoAlt: string;
    languageLabel: string;
    languageNames: Record<Locale, string>;
  };
  pagination: {
    labelPrefix: string;
    labelSuffix: string;
    rowsPerPageLabel: string;
    autoRowsLabel: string;
    goToPageLabel: string;
    goButton: string;
  };
  components: {
    customAccordion: {
      issueCountPrefix: string;
      emptyMessage: string;
    };
    fieldErrorAccordionList: {
      errorCountPrefix: string;
    };
    errorRowList: {
      shownPrefix: string;
      shownSuffix: string;
      rowPrefix: string;
      rowSuffix: string;
      loadMore: string;
    };
    fieldMappingStatusList: {
      fieldName: string;
      mappingStatus: string;
      mapped: string;
      unmapped: string;
      duplicate: string;
    };
    fieldFrequencyList: {
      fieldName: string;
      accuracy: string;
    };
    stepHint: {
      stepPrefix: string;
      unknownStep: string;
      currentProjectPrefix: string;
    };
  };
  customStepper: {
    labels: {
      project: string;
      template: string;
      edit: string;
      mapping: string;
      validate: string;
      clean: string;
    };
    hints: {
      project: string;
      template: string;
      edit: string;
      mapping: string;
      validate: string;
      clean: string;
    };
  };
  projectPage: {
    alerts: {
      enterProjectName: string;
      createProjectMissingLatestId: string;
      createProjectFailed: string;
      selectProjectFirst: string;
      deleteProjectFailed: string;
      fetchProjectsFailed: string;
    };
    actions: {
      createNewProject: string;
      openExistingProject: string;
    };
    form: {
      createTitle: string;
      createDescription: string;
      requiredMark: string;
      projectNameLabel: string;
      createButton: string;
    };
    projectList: {
      title: string;
      description: string;
      lastUpdatedPrefix: string;
      openButton: string;
      deleteButton: string;
    };
    about: {
      introPrefix: string;
      introSuffix: string;
    };
    introSections: {
      project: { title: string; desc: string };
      template: { title: string; desc: string };
      edit: { title: string; desc: string };
      validate: { title: string; desc: string };
      clearance: { title: string; desc: string };
    };
    deleteDialog: {
      title: string;
      description: string;
      cancel: string;
      confirm: string;
    };
  };
  templatePage: {
    alerts: {
      selectProjectFirst: string;
    };
    errors: {
      customFieldRequired: string;
      customFieldNamePattern: string;
      saveFailed: string;
      attachExistingRequired: string;
      applyFailed: string;
      customTemplateNameRequired: string;
      customTemplateSelectRequired: string;
    };
    sidebar: {
      useCustomTemplate: string;
      savedCustomTemplatePlaceholder: string;
      useBuiltInTheme: string;
      useBuiltInTemplate: string;
      uncategorized: string;
      coreTemplatePlaceholder: string;
      extensionTemplatePlaceholder: string;
      editCustomFieldButton: string;
    };
    content: {
      fieldListTitle: string;
      fieldListDescription: string;
      requiredFieldTitle: string;
      requiredFieldDesc: string;
      recommendedFieldTitle: string;
      recommendedFieldDesc: string;
      optionalFieldTitle: string;
      optionalFieldDesc: string;
      coreFieldPrefix: string;
      extensionFieldPrefix: string;
    };
    preview: {
      typeTitle: string;
      noType: string;
      definitionTitle: string;
      noDefinition: string;
      commonNameTitle: string;
      noCommonName: string;
      exampleTitle: string;
      hoverHint: string;
    };
    actions: {
      saveCurrentSelectionAsTemplate: string;
      nextStep: string;
    };
    dialogs: {
      customFieldDialogTitle: string;
      addCustomFieldTab: string;
      applyExistingFieldTab: string;
      fieldNameLabel: string;
      fieldNamePlaceholder: string;
      fieldNameZhLabel: string;
      fieldNameZhPlaceholder: string;
      fieldTypeLabel: string;
      targetTemplateLabel: string;
      targetTemplatePlaceholder: string;
      existingCustomFieldLabel: string;
      cancel: string;
      confirm: string;
      save: string;
      customFieldSuccessTitle: string;
      customFieldSuccessDescription: string;
      saveCustomTemplateDialogTitle: string;
      templateNameLabel: string;
    };
    panel: {
      hideDescription: string;
      showDescription: string;
      showAllFields: string;
      hideUncheckedFields: string;
      descriptionPrefix: string;
      descriptionSuffix: string;
      customFieldBadge: string;
    };
    optionLabels: Record<string, string>;
    optionGroups: Record<string, string>;
  };
  editPage: {
    saveStatus: {
      saving: string;
      saved: string;
      failed: string;
    };
    errors: {
      deleteFailed: string;
      selectProjectFirst: string;
      validateFailed: string;
      validateFailedWithReasonPrefix: string;
      selectRowsFirst: string;
    };
    tableTabs: {
      coreSubtitle: string;
      extensionSubtitle: string;
      facetTitle: string;
    };
    menus: {
      data: string;
      edit: string;
      getFacetRows: string;
      importToCurrentTable: string;
      exportCurrentTable: string;
      deleteSelectedRows: string;
      appendEmptyPage: string;
    };
    tooltip: {
      requiredFieldTitle: string;
      requiredFieldDesc: string;
      customFieldTitle: string;
      customFieldDesc: string;
    };
    emptyState: {
      selectProjectFirst: string;
      selectTableFirst: string;
    };
    actions: {
      previous: string;
      validating: string;
      next: string;
    };
    deleteDialog: {
      title: string;
      descriptionPrefix: string;
      descriptionSuffix: string;
      cancel: string;
      confirm: string;
    };
  };
  mappingPage: {
    status: {
      mapped: string;
      unmapped: string;
      duplicate: string;
    };
    errors: {
      missingImportTarget: string;
      importFailed: string;
    };
    success: {
      importedRows: string;
    };
    sections: {
      mappingStatusTitle: string;
      filePreviewTitle: string;
      filePreviewDescription: string;
      noImportFileSelected: string;
      fieldMappingTitle: string;
      fieldMappingDescription: string;
    };
    headers: {
      projectField: string;
      importField: string;
    };
    placeholders: {
      unselected: string;
    };
    actions: {
      cancelImport: string;
      importData: string;
    };
  };
  cleanPage: {
    saveStatus: {
      saving: string;
      saved: string;
      failed: string;
    };
    tableTabs: {
      coreSubtitle: string;
      extensionSubtitle: string;
    };
    accordion: {
      errorMessages: string;
      validating: string;
      retryValidate: string;
    };
    menus: {
      filterData: string;
      filterByContent: string;
      filterByText: string;
      filterDuplicates: string;
      editContent: string;
      stringReplace: string;
      swapFieldContent: string;
      speciesApi: string;
      closeFilter: string;
    };
    states: {
      showingFilteredResult: string;
      selectProjectFirst: string;
      selectTableFirst: string;
      selectAnyHeader: string;
    };
    actions: {
      previous: string;
      exportData: string;
    };
    panels: {
      applyScope: {
        label: string;
        allRows: string;
        specificRows: string;
        rowNumbersLabel: string;
        rowNumbersPlaceholder: string;
        rowNumbersHelper: string;
        rowNumbersInvalid: string;
        noMatchedRows: string;
      };
      facetValueList: {
        emptyValue: string;
        recordUnit: string;
      };
      batchEditDialog: {
        title: string;
        fieldPrefix: string;
        currentValuePrefix: string;
        affectedCountPrefix: string;
        newValueLabel: string;
        cancel: string;
        confirm: string;
      };
      contentFilter: {
        title: string;
        description: string;
      };
      textFilter: {
        title: string;
        description: string;
        modeLabel: string;
        queryLabel: string;
        modeLabels: {
          exact: string;
          fuzzy: string;
          regex: string;
        };
        helpers: {
          regexInvalid: string;
          exact: string;
          fuzzy: string;
          regex: string;
        };
        matchedCountPrefix: string;
        samplePrefix: string;
        actionSearch: string;
      };
      duplicateFilter: {
        title: string;
        description: string;
        queryLabel: string;
        helper: string;
        matchedCountPrefix: string;
        samplePrefix: string;
        actionSearch: string;
      };
      stringReplace: {
        title: string;
        description: string;
        modeLabel: string;
        modeLabels: {
          exact: string;
          fuzzy: string;
          regex: string;
        };
        fromLabel: string;
        toLabel: string;
        toHelper: string;
        helpers: {
          regexInvalid: string;
          exact: string;
          fuzzy: string;
          regex: string;
        };
        affectedCountPrefix: string;
        samplePrefix: string;
        actionReplace: string;
      };
      fieldSwap: {
        title: string;
        descriptionPrefix: string;
        descriptionSuffix: string;
        targetFieldLabel: string;
        actionSwap: string;
      };
      speciesApi: {
        title: string;
        subtitle: string;
        descriptionPrefix: string;
        descriptionMiddle: string;
        descriptionSuffix: string;
        overwriteFieldsPrefix: string;
        status: {
          connecting: string;
          running: string;
          done: string;
          error: string;
        };
        connectFailed: string;
        doneSummary: string;
        actionConnect: string;
      };
    };
  };
  validatePage: {
    sections: {
      errorListTitle: string;
      errorListDescription: string;
    };
    errors: {
      validateFailed: string;
      validateFailedWithReasonPrefix: string;
    };
    tableTabs: {
      coreSubtitle: string;
      extensionSubtitle: string;
      fieldFrequencyTitle: string;
    };
    actions: {
      downloadErrors: string;
      previous: string;
      next: string;
    };
    states: {
      validatingTitle: string;
      validatingDescription: string;
      resultTitleSuffix: string;
      noErrorData: string;
    };
  };
}

export const defaultLocale: Locale = 'zh-TW';

export const messages: Record<Locale, AppMessages> = {
  'zh-TW': {
    logoHeader: {
      title: '開放資料工具包 (Open Data Toolkit, ODT)',
      logoAlt: 'TaiBIF Logo',
      languageLabel: '語言',
      languageNames: {
        'zh-TW': '繁體中文',
        en: 'English',
        es: 'Español (generado por IA)',
      },
    },
    pagination: {
      labelPrefix: '第 ',
      labelSuffix: ' 頁',
      rowsPerPageLabel: '每頁筆數',
      autoRowsLabel: '自動',
      goToPageLabel: '跳至頁碼',
      goButton: '前往',
    },
    components: {
      customAccordion: {
        issueCountPrefix: '資料問題筆數：',
        emptyMessage: '沒有錯誤',
      },
      fieldErrorAccordionList: {
        errorCountPrefix: '錯誤筆數：',
      },
      errorRowList: {
        shownPrefix: '已顯示 ',
        shownSuffix: ' 筆',
        rowPrefix: '第 ',
        rowSuffix: ' 列',
        loadMore: '載入更多',
      },
      fieldMappingStatusList: {
        fieldName: '欄位名稱',
        mappingStatus: '對應狀態',
        mapped: '已對應',
        unmapped: '未對應',
        duplicate: '重複對應',
      },
      fieldFrequencyList: {
        fieldName: '欄位名稱',
        accuracy: '正確率',
      },
      stepHint: {
        stepPrefix: 'STEP',
        unknownStep: '未知步驟',
        currentProjectPrefix: '當前專案：',
      },
    },
    customStepper: {
      labels: {
        project: '資料專案',
        template: '資料模板',
        edit: '資料編輯',
        mapping: '資料匯入',
        validate: '資料驗證',
        clean: '資料清理',
      },
      hints: {
        project: '選擇建立新專案，或開啟過去的專案來繼續編輯',
        template: '從內建模板、主題挑選欄位，或自訂欄位建立屬於自己的模板',
        edit: '在這一步填寫與整理資料，左側可切換不同資料表。所有修改都會自動保存，完成後即可檢查資料品質',
        mapping: '將既有資料表匯入至專案中，並對應欄位',
        validate:
          '檢查欄位格式與內容是否符合規則，快速定位資料錯誤並查看影響列數',
        clean:
          '依左側錯誤訊息定位資料問題，並使用表格上方提供的工具批次修正資料內容',
      },
    },
    projectPage: {
      alerts: {
        enterProjectName: '請輸入專案名稱',
        createProjectMissingLatestId: '建立專案時發生錯誤。找不到最新專案 ID',
        createProjectFailed: '建立專案時發生錯誤',
        selectProjectFirst: '請先選擇專案',
        deleteProjectFailed: '刪除專案時發生錯誤',
        fetchProjectsFailed: '獲取專案列表時發生錯誤',
      },
      actions: {
        createNewProject: '建立新專案',
        openExistingProject: '開啟舊專案',
      },
      form: {
        createTitle: '建立新專案',
        createDescription: '請填寫以下欄位以建立新專案，標註',
        requiredMark: '為必填。',
        projectNameLabel: '專案名稱 *',
        createButton: '建立專案',
      },
      projectList: {
        title: '我的資料專案',
        description: '以下是您過往建立或匯入的專案，您可以繼續編輯或檢視進度。',
        lastUpdatedPrefix: '最後更新日期：',
        openButton: '開啟專案',
        deleteButton: '刪除專案',
      },
      about: {
        introPrefix:
          'TaiBIF Open Data Toolkit 是一個專門針對生物多樣性資料整合的強大工具，採用了國際生物多樣性領域常用的',
        introSuffix:
          '資料標準，旨在幫助使用者建立並有效管理、編輯、驗證和清理生物多樣性資料集。若想要建立資料模板、資料編輯管理和發布，此工具將能引導您進入理想的資料管理流程，並協助管控資料品質。',
      },
      introSections: {
        project: {
          title: '專案管理',
          desc: '提供新資料集專案建立和過往資料集匯入的功能，可輕鬆建立、開啟所擁有的資料集，並追蹤最新的資料集版本。從專案的建立到完成，您都能掌握每一步的進度和細節。',
        },
        template: {
          title: '資料模板',
          desc: '建立並選擇依據 Darwin Core 標準定義的欄位模板，確保資料格式和結構的一致性，再透過建議的必填、選填欄位提高資料集的完整性。不僅提高了資料處理的效率，大大節省探索 Darwin Core 資料欄位的時間成本，還能減少因欄位格式導致的錯誤。',
        },
        edit: {
          title: '資料編輯',
          desc: '提供類似 Excel 的編輯功能，讓您能夠直接在介面上進行資料編輯、修改和新增。自動儲存功能將保護您的資料變更不會因電腦問題或工具關閉而丟失。',
        },
        validate: {
          title: '資料驗證',
          desc: '協助檢查資料的準確性和完整性。通過自動化驗證工具，您可快速發現並修正資料中的常見錯誤，確保資料的高品質。',
        },
        clearance: {
          title: '資料清理',
          desc: '提供便利的資料清理功能，協助清除或修正重複、錯誤、不完整的資料，使資料更加精確可靠。清理完成後可匯出壓縮檔，可直接將整個檔案上傳到 TaiBIF 資料發布工具 (IPT)，不僅加速資料發布的流程，亦為後續的分析應用打下堅實的基礎。',
        },
      },
      deleteDialog: {
        title: '確定要刪除此專案嗎？',
        description:
          '專案內容刪除後將無法恢復，所有資料將永久移除。請確認是否繼續進行刪除操作。',
        cancel: '取消',
        confirm: '確認刪除',
      },
    },
    templatePage: {
      alerts: {
        selectProjectFirst: '請先建立或選擇專案',
      },
      errors: {
        customFieldRequired: '請填寫欄位名稱、中文名稱，並至少選擇一個模板。',
        customFieldNamePattern: '欄位名稱僅可使用英數與底線，且不可數字開頭。',
        saveFailed: '儲存失敗',
        attachExistingRequired: '請選擇既有欄位並至少選擇一個模板。',
        applyFailed: '套用失敗',
        customTemplateNameRequired: '請輸入模板名稱。',
        customTemplateSelectRequired: '請至少選擇一個核心或延伸模板。',
      },
      sidebar: {
        useCustomTemplate: '使用自訂模板',
        savedCustomTemplatePlaceholder: '選擇已儲存的自訂模板',
        useBuiltInTheme: '使用內建主題',
        useBuiltInTemplate: '使用內建模板',
        uncategorized: '未分類',
        coreTemplatePlaceholder: '資料集類型（必選）',
        extensionTemplatePlaceholder: '延伸資料集（可多選）',
        editCustomFieldButton: '新增 \\ 修改自訂欄位',
      },
      content: {
        fieldListTitle: '模板欄位清單',
        fieldListDescription:
          '以下欄位是根據左側下拉選單所選的「資料模板」顯示，欄位內容與順序可能因模板而異。',
        requiredFieldTitle: '必填欄位：',
        requiredFieldDesc: '這些欄位為系統要求的必要欄位，使用者無法取消勾選。',
        recommendedFieldTitle: '建議欄位：',
        recommendedFieldDesc:
          '這些欄位為預設勾選，建議填寫以提升資料完整性，使用者可選擇取消。',
        optionalFieldTitle: '選填欄位：',
        optionalFieldDesc: '可依實際資料需求自由選擇是否勾選。',
        coreFieldPrefix: '資料集類型欄位：',
        extensionFieldPrefix: '延伸資料集欄位：',
      },
      preview: {
        typeTitle: '類型',
        noType: '無',
        definitionTitle: '定義',
        noDefinition: '無說明',
        commonNameTitle: '常見對應名稱',
        noCommonName: '無',
        exampleTitle: '範例',
        hoverHint: '滑鼠移到欄位上以查看說明',
      },
      actions: {
        saveCurrentSelectionAsTemplate: '儲存當前勾選欄位為模板',
        nextStep: '下一步',
      },
      dialogs: {
        customFieldDialogTitle: '新增 / 套用自訂欄位',
        addCustomFieldTab: '新增自訂欄位',
        applyExistingFieldTab: '套用既有欄位',
        fieldNameLabel: '欄位名稱',
        fieldNamePlaceholder: '例如：catalogNumber',
        fieldNameZhLabel: '欄位中文名稱',
        fieldNameZhPlaceholder: '例如：館藏號',
        fieldTypeLabel: '欄位型別',
        targetTemplateLabel: '要加入的模板',
        targetTemplatePlaceholder: '可多選',
        existingCustomFieldLabel: '既有自訂欄位',
        cancel: '取消',
        confirm: '確定',
        save: '儲存',
        customFieldSuccessTitle: '自訂欄位已加入',
        customFieldSuccessDescription:
          '自訂欄位已成功加入所選模板的欄位清單尾端，系統已自動將其設為勾選，並於欄位名稱後方標示「自訂」標籤。',
        saveCustomTemplateDialogTitle: '儲存自訂模板',
        templateNameLabel: '模板名稱',
      },
      panel: {
        hideDescription: '隱藏說明',
        showDescription: '顯示說明',
        showAllFields: '顯示所有欄位',
        hideUncheckedFields: '隱藏未勾選欄位',
        descriptionPrefix: '以下欄位清單根據',
        descriptionSuffix: '彙整而來',
        customFieldBadge: '自訂',
      },
      optionLabels: {
        template_core_checklist: '物種名錄 Checklist',
        template_core_occurrence: '出現紀錄 Occurrence',
        template_core_samplingevent: '調查活動 Sampling Event',
        template_core_natural_history_collection: '自然史典藏 物種出現紀錄',
        template_core_ecological_assessment: '生態檢核 物種名錄',
        template_extension_occurrence: 'Darwin Core Occurrence',
        template_extension_simple_multimedia: 'Simple Multimedia',
        template_extension_extended_measurement_or_facts:
          'Extended Measurement Or Facts',
        template_extension_resource_relationship: 'Resource Relationship',
        template_extension_dna_derived_data: 'DNA Derived Data',
        template_extension_natural_history_collection_identification_history:
          '自然史典藏 物種鑑定歷史',
        template_extension_natural_history_collection_measurment_or_facts:
          '自然史典藏 典藏量測紀錄',
        template_extension_ecological_assessment_occurrence:
          '生態檢核 物種出現紀錄',
        natural_history_collection: '自然史典藏',
        ecological_assessment: '生態檢核',
      },
      optionGroups: {
        達爾文核心資料表: '達爾文核心資料表',
        達爾文延伸資料表: '達爾文延伸資料表',
        生物多樣性領域資料標準: '生物多樣性領域資料標準',
      },
    },
    editPage: {
      saveStatus: {
        saving: '存檔中',
        saved: '已儲存',
        failed: '存檔失敗',
      },
      errors: {
        deleteFailed: '刪除失敗',
        selectProjectFirst: '請先選擇專案',
        validateFailed: '資料驗證失敗',
        validateFailedWithReasonPrefix: '資料驗證失敗：',
        selectRowsFirst: '請先選擇要刪除的列',
      },
      tableTabs: {
        coreSubtitle: '核心資料表',
        extensionSubtitle: '延伸資料表',
        facetTitle: '獲取行資料',
      },
      menus: {
        data: '資料',
        edit: '編輯',
        getFacetRows: '獲取行資料',
        importToCurrentTable: '匯入資料至當前資料表',
        exportCurrentTable: '匯出當前資料表',
        deleteSelectedRows: '刪除選擇列',
        appendEmptyPage: '新增空白資料頁',
      },
      tooltip: {
        requiredFieldTitle: '必填欄位',
        requiredFieldDesc: '在表頭以紅色粗體顯示。',
        customFieldTitle: '自訂欄位',
        customFieldDesc: '在表頭以藍色粗體顯示。',
      },
      emptyState: {
        selectProjectFirst: '請先選擇專案',
        selectTableFirst: '請先選擇資料表',
      },
      actions: {
        previous: '上一步',
        validating: '驗證中',
        next: '下一步',
      },
      deleteDialog: {
        title: '刪除選擇列',
        descriptionPrefix: '即將刪除',
        descriptionSuffix: '列資料，此操作無法復原。',
        cancel: '取消',
        confirm: '確認刪除',
      },
    },
    mappingPage: {
      status: {
        mapped: '已對應',
        unmapped: '未對應',
        duplicate: '重複對應',
      },
      errors: {
        missingImportTarget: '缺少匯入檔案或目標資料表',
        importFailed: '匯入失敗',
      },
      success: {
        importedRows: '已匯入 {count} 筆資料',
      },
      sections: {
        mappingStatusTitle: '欄位對應狀態',
        filePreviewTitle: '檔案預覽',
        filePreviewDescription:
          '以下為所選檔案的前五筆資料預覽，方便快速查看檔案內容，並進行欄位對應設定',
        noImportFileSelected: '尚未選擇匯入檔案',
        fieldMappingTitle: '欄位對應',
        fieldMappingDescription:
          '左側為本專案資料表中的欄位，右側為匯入檔案中的欄位。請將檔案中的欄位依照資料內容，對應到正確的專案欄位。',
      },
      headers: {
        projectField: '專案欄位',
        importField: '匯入欄位',
      },
      placeholders: {
        unselected: '未選擇',
      },
      actions: {
        cancelImport: '取消匯入',
        importData: '匯入資料',
      },
    },
    cleanPage: {
      saveStatus: {
        saving: '存檔中',
        saved: '已儲存',
        failed: '存檔失敗',
      },
      tableTabs: {
        coreSubtitle: '核心資料表',
        extensionSubtitle: '延伸資料表',
      },
      accordion: {
        errorMessages: '錯誤訊息',
        validating: '驗證中...',
        retryValidate: '再次驗證',
      },
      menus: {
        filterData: '資料篩選',
        filterByContent: '內容篩選',
        filterByText: '文字篩選',
        filterDuplicates: '重複值篩選',
        editContent: '內容修改',
        stringReplace: '字串取代',
        swapFieldContent: '欄位內容調換',
        speciesApi: '串接物種 API',
        closeFilter: '關閉篩選',
      },
      states: {
        showingFilteredResult: '目前顯示為篩選結果',
        selectProjectFirst: '請先選擇專案',
        selectTableFirst: '請先選擇資料表',
        selectAnyHeader: '請先選擇任一表頭',
      },
      actions: {
        previous: '上一步',
        exportData: '匯出資料',
      },
      panels: {
        applyScope: {
          label: '套用範圍',
          allRows: '全部列',
          specificRows: '指定列號',
          rowNumbersLabel: '列號',
          rowNumbersPlaceholder: '例如：1,3,8-12',
          rowNumbersHelper: '可輸入單一列號、逗號分隔或區間（例如 1,3,8-12）',
          rowNumbersInvalid: '列號格式不正確',
          noMatchedRows: '找不到對應的列號，請確認輸入是否正確。',
        },
        facetValueList: {
          emptyValue: '（空值）',
          recordUnit: '筆',
        },
        batchEditDialog: {
          title: '批次修改',
          fieldPrefix: '欄位：',
          currentValuePrefix: '目前值：',
          affectedCountPrefix: '影響筆數：',
          newValueLabel: '填入新值',
          cancel: '取消',
          confirm: '確認修改',
        },
        contentFilter: {
          title: '內容篩選',
          description:
            '點選需要修改的值，接著在彈出視窗輸入新值，系統將批次套用至所有符合該值的資料。',
        },
        textFilter: {
          title: '文字篩選',
          description:
            '選擇搜尋模式並輸入關鍵字，按下「搜尋」後將直接套用至所有符合條件的資料。',
          modeLabel: '搜尋模式',
          queryLabel: '搜尋內容',
          modeLabels: {
            exact: '精準搜尋',
            fuzzy: '模糊搜尋',
            regex: '正則表達式搜尋',
          },
          helpers: {
            regexInvalid: '正則表達式格式不正確',
            exact: '完全相等才會匹配',
            fuzzy: '包含關鍵字即匹配（不分大小寫）',
            regex: '可使用正則表達式，例如 \\s+ 代表空白字元',
          },
          matchedCountPrefix: '目前匹配筆數：',
          samplePrefix: '範例匹配值：',
          actionSearch: '搜尋',
        },
        duplicateFilter: {
          title: '重複值篩選',
          description:
            '找出所選欄位中重複出現的值。未輸入搜尋內容時，會顯示所有重複值。',
          queryLabel: '搜尋內容',
          helper: '留空會顯示所有重複值；輸入內容時，完全相等才會匹配',
          matchedCountPrefix: '目前重複值資料筆數：',
          samplePrefix: '範例重複值：',
          actionSearch: '篩選',
        },
        stringReplace: {
          title: '字串取代',
          description:
            '設定要被取代的字串與取代後的內容，按下「取代」後將直接批次修改所有符合條件的資料。',
          modeLabel: '搜尋模式',
          modeLabels: {
            exact: '精準搜尋',
            fuzzy: '模糊搜尋',
            regex: '正則表達式搜尋',
          },
          fromLabel: '要被取代的字串',
          toLabel: '取代為',
          toHelper: '可留空，代表取代成空字串',
          helpers: {
            regexInvalid: '正則表達式格式不正確',
            exact: '完全相等才會被取代',
            fuzzy: '包含關鍵字即會被取代（不分大小寫）',
            regex: '可使用正則表達式，例如 \\s+ 代表空白字元',
          },
          affectedCountPrefix: '影響筆數：',
          samplePrefix: '範例匹配值：',
          actionReplace: '取代',
        },
        fieldSwap: {
          title: '欄位內容調換',
          descriptionPrefix: '選擇要與「',
          descriptionSuffix:
            '」對調的欄位，按下「對調」後將直接交換兩個欄位的內容。',
          targetFieldLabel: '對調欄位',
          actionSwap: '對調',
        },
        speciesApi: {
          title: '串接物種 API',
          subtitle: '自動補齊物種高階層相關欄位',
          descriptionPrefix: '系統將根據 scientificName 欄位的內容，使用 ',
          descriptionMiddle:
            ' 進行比對。會先以 Taicol 主要資訊來源進行查詢，若未匹配再以 GBIF 作為資料來源進行補查，並將結果寫入資料表。',
          descriptionSuffix: '',
          overwriteFieldsPrefix: '串接完成後將會新增、覆寫以下欄位：',
          status: {
            connecting: '連線中',
            running: '正在串接物種資料',
            done: '物種資料補齊完成',
            error: '串接過程發生錯誤',
          },
          connectFailed: '串接過程發生錯誤',
          doneSummary: '完成：{updated} 筆更新 / {skipped} 筆略過',
          actionConnect: '串接',
        },
      },
    },
    validatePage: {
      sections: {
        errorListTitle: '錯誤訊息清單',
        errorListDescription:
          '下方錯誤會依類型分組顯示。展開各錯誤訊息可查看需調整的資料列與內容，協助快速定位問題並在下一步修正。紅色錯誤表示需立即修正，黃色錯誤表示需特別留意。',
      },
      errors: {
        validateFailed: '資料驗證失敗',
        validateFailedWithReasonPrefix: '資料驗證失敗：',
      },
      tableTabs: {
        coreSubtitle: '核心資料表',
        extensionSubtitle: '延伸資料表',
        fieldFrequencyTitle: '欄位頻率',
      },
      actions: {
        downloadErrors: '下載錯誤訊息',
        previous: '上一步',
        next: '下一步',
      },
      states: {
        validatingTitle: '驗證中...',
        validatingDescription: '正在執行資料驗證，請稍候...',
        resultTitleSuffix: '資料驗證結果',
        noErrorData: '沒有錯誤資料',
      },
    },
  },
  en: {
    logoHeader: {
      title: 'Open Data Toolkit (ODT)',
      logoAlt: 'TaiBIF Logo',
      languageLabel: 'Language',
      languageNames: {
        'zh-TW': '繁體中文',
        en: 'English',
        es: 'Español (generado por IA)',
      },
    },
    pagination: {
      labelPrefix: 'Page ',
      labelSuffix: '',
      rowsPerPageLabel: 'Rows per page',
      autoRowsLabel: 'Auto',
      goToPageLabel: 'Go to page',
      goButton: 'Go',
    },
    components: {
      customAccordion: {
        issueCountPrefix: 'Issue Count: ',
        emptyMessage: 'No Errors',
      },
      fieldErrorAccordionList: {
        errorCountPrefix: 'Error Count: ',
      },
      errorRowList: {
        shownPrefix: 'Showing ',
        shownSuffix: ' rows',
        rowPrefix: 'Row ',
        rowSuffix: '',
        loadMore: 'Load More',
      },
      fieldMappingStatusList: {
        fieldName: 'Field Name',
        mappingStatus: 'Mapping Status',
        mapped: 'Mapped',
        unmapped: 'Unmapped',
        duplicate: 'Duplicate Mapping',
      },
      fieldFrequencyList: {
        fieldName: 'Field Name',
        accuracy: 'Accuracy',
      },
      stepHint: {
        stepPrefix: 'STEP',
        unknownStep: 'Unknown Step',
        currentProjectPrefix: 'Current Project: ',
      },
    },
    customStepper: {
      labels: {
        project: 'Project',
        template: 'Template',
        edit: 'Edit',
        mapping: 'Import',
        validate: 'Validate',
        clean: 'Clean',
      },
      hints: {
        project: 'Create a new project or continue by opening an existing one.',
        template:
          'Choose fields from built-in templates or themes, or create your own template with custom fields.',
        edit: 'Fill in and organize data in this step. Changes are auto-saved, and you can then check data quality.',
        mapping:
          'Import an existing table into the project and map its columns.',
        validate:
          'Check whether field formats and values follow the rules, and quickly locate problematic rows.',
        clean:
          'Use error hints on the left and the tools above the table to batch-fix data issues.',
      },
    },
    projectPage: {
      alerts: {
        enterProjectName: 'Please enter a project name.',
        createProjectMissingLatestId:
          'Failed to create project: latest project ID not found.',
        createProjectFailed: 'An error occurred while creating the project.',
        selectProjectFirst: 'Please select a project first.',
        deleteProjectFailed: 'An error occurred while deleting the project.',
        fetchProjectsFailed: 'An error occurred while fetching projects.',
      },
      actions: {
        createNewProject: 'Create New Project',
        openExistingProject: 'Open Existing Project',
      },
      form: {
        createTitle: 'Create New Project',
        createDescription: 'Fill in the fields below to create a project. ',
        requiredMark: 'indicates a required field.',
        projectNameLabel: 'Project Name *',
        createButton: 'Create Project',
      },
      projectList: {
        title: 'My Data Projects',
        description:
          'Below are your previously created or imported projects. You can continue editing or review progress.',
        lastUpdatedPrefix: 'Last updated: ',
        openButton: 'Open Project',
        deleteButton: 'Delete Project',
      },
      about: {
        introPrefix:
          'TaiBIF Open Data Toolkit is a powerful tool for biodiversity data integration and adopts the widely used',
        introSuffix:
          'standard. It helps users create, manage, edit, validate, and clean biodiversity datasets efficiently.',
      },
      introSections: {
        project: {
          title: 'Project Management',
          desc: 'Create new data projects or import existing ones, then track each project from start to completion.',
        },
        template: {
          title: 'Data Templates',
          desc: 'Build field templates based on Darwin Core to keep data structure consistent and reduce formatting errors.',
        },
        edit: {
          title: 'Data Editing',
          desc: 'Edit, update, and add data directly in a spreadsheet-like interface with auto-save protection.',
        },
        validate: {
          title: 'Data Validation',
          desc: 'Use automated checks to detect common issues quickly and improve overall data quality.',
        },
        clearance: {
          title: 'Data Cleaning',
          desc: 'Clean duplicate, incorrect, or incomplete records and export a ZIP package ready for downstream publishing.',
        },
      },
      deleteDialog: {
        title: 'Are you sure you want to delete this project?',
        description:
          'This action cannot be undone. All project data will be permanently removed.',
        cancel: 'Cancel',
        confirm: 'Confirm Delete',
      },
    },
    templatePage: {
      alerts: {
        selectProjectFirst: 'Please create or select a project first.',
      },
      errors: {
        customFieldRequired:
          'Please fill in field name, Chinese label, and choose at least one template.',
        customFieldNamePattern:
          'Field name can only contain letters, numbers, underscore, and cannot start with a number.',
        saveFailed: 'Save failed',
        attachExistingRequired:
          'Please select an existing field and at least one template.',
        applyFailed: 'Apply failed',
        customTemplateNameRequired: 'Please enter a template name.',
        customTemplateSelectRequired:
          'Please choose at least one core or extension template.',
      },
      sidebar: {
        useCustomTemplate: 'Use Custom Template',
        savedCustomTemplatePlaceholder: 'Select a saved custom template',
        useBuiltInTheme: 'Use Built-in Theme',
        useBuiltInTemplate: 'Use Built-in Template',
        uncategorized: 'Uncategorized',
        coreTemplatePlaceholder: 'Core dataset type (required)',
        extensionTemplatePlaceholder: 'Extension datasets (multiple)',
        editCustomFieldButton: 'Add / Edit Custom Fields',
      },
      content: {
        fieldListTitle: 'Template Field List',
        fieldListDescription:
          'The fields below are shown based on the selected template on the left. Content and order may vary by template.',
        requiredFieldTitle: 'Required fields:',
        requiredFieldDesc:
          'These are mandatory fields required by the system and cannot be unchecked.',
        recommendedFieldTitle: 'Recommended fields:',
        recommendedFieldDesc:
          'These fields are checked by default and recommended for better data completeness.',
        optionalFieldTitle: 'Optional fields:',
        optionalFieldDesc:
          'These fields can be selected freely based on your data needs.',
        coreFieldPrefix: 'Core Dataset Fields: ',
        extensionFieldPrefix: 'Extension Dataset Fields: ',
      },
      preview: {
        typeTitle: 'Type',
        noType: 'None',
        definitionTitle: 'Definition',
        noDefinition: 'No description',
        commonNameTitle: 'Common Mapped Name',
        noCommonName: 'None',
        exampleTitle: 'Example',
        hoverHint: 'Hover over a field to view details',
      },
      actions: {
        saveCurrentSelectionAsTemplate: 'Save Current Selection as Template',
        nextStep: 'Next',
      },
      dialogs: {
        customFieldDialogTitle: 'Add / Apply Custom Field',
        addCustomFieldTab: 'Add Custom Field',
        applyExistingFieldTab: 'Apply Existing Field',
        fieldNameLabel: 'Field Name',
        fieldNamePlaceholder: 'e.g. catalogNumber',
        fieldNameZhLabel: 'Chinese Field Label',
        fieldNameZhPlaceholder: 'e.g. 館藏號',
        fieldTypeLabel: 'Field Type',
        targetTemplateLabel: 'Templates to Add',
        targetTemplatePlaceholder: 'Multiple selections',
        existingCustomFieldLabel: 'Existing Custom Field',
        cancel: 'Cancel',
        confirm: 'OK',
        save: 'Save',
        customFieldSuccessTitle: 'Custom Field Added',
        customFieldSuccessDescription:
          'The custom field has been added to the end of the selected template field list, checked by default, and marked with a "Custom" label after the field name.',
        saveCustomTemplateDialogTitle: 'Save Custom Template',
        templateNameLabel: 'Template Name',
      },
      panel: {
        hideDescription: 'Hide Description',
        showDescription: 'Show Description',
        showAllFields: 'Show All Fields',
        hideUncheckedFields: 'Hide Unchecked Fields',
        descriptionPrefix: 'The field list below is compiled from the',
        descriptionSuffix: '.',
        customFieldBadge: 'Custom',
      },
      optionLabels: {
        template_core_checklist: 'Checklist',
        template_core_occurrence: 'Occurrence',
        template_core_samplingevent: 'Sampling Event',
        template_core_natural_history_collection:
          'Natural History Collection Occurrence',
        template_core_ecological_assessment: 'Ecological Assessment Checklist',
        template_extension_occurrence: 'Darwin Core Occurrence',
        template_extension_simple_multimedia: 'Simple Multimedia',
        template_extension_extended_measurement_or_facts:
          'Extended Measurement Or Facts',
        template_extension_resource_relationship: 'Resource Relationship',
        template_extension_dna_derived_data: 'DNA Derived Data',
        template_extension_natural_history_collection_identification_history:
          'Natural History Collection Identification History',
        template_extension_natural_history_collection_measurment_or_facts:
          'Natural History Collection Measurement Or Facts',
        template_extension_ecological_assessment_occurrence:
          'Ecological Assessment Occurrence',
        natural_history_collection: 'Natural History Collection',
        ecological_assessment: 'Ecological Assessment',
      },
      optionGroups: {
        達爾文核心資料表: 'Darwin Core Tables',
        達爾文延伸資料表: 'Darwin Core Extensions',
        生物多樣性領域資料標準: 'Biodiversity Data Standards',
      },
    },
    editPage: {
      saveStatus: {
        saving: 'Saving',
        saved: 'Saved',
        failed: 'Save Failed',
      },
      errors: {
        deleteFailed: 'Delete failed',
        selectProjectFirst: 'Please select a project first',
        validateFailed: 'Data validation failed',
        validateFailedWithReasonPrefix: 'Data validation failed: ',
        selectRowsFirst: 'Please select rows to delete first',
      },
      tableTabs: {
        coreSubtitle: 'Core',
        extensionSubtitle: 'Extension',
        facetTitle: 'Get Row Data',
      },
      menus: {
        data: 'Data',
        edit: 'Edit',
        getFacetRows: 'Get Row Data',
        importToCurrentTable: 'Import to Current Table',
        exportCurrentTable: 'Export Current Table',
        deleteSelectedRows: 'Delete Selected Rows',
        appendEmptyPage: 'Add Empty Data Page',
      },
      tooltip: {
        requiredFieldTitle: 'Required Fields',
        requiredFieldDesc: 'Displayed as bold red headers.',
        customFieldTitle: 'Custom Fields',
        customFieldDesc: 'Displayed as bold blue headers.',
      },
      emptyState: {
        selectProjectFirst: 'Please select a project first',
        selectTableFirst: 'Please select a table first',
      },
      actions: {
        previous: 'Previous',
        validating: 'Validating',
        next: 'Next',
      },
      deleteDialog: {
        title: 'Delete Selected Rows',
        descriptionPrefix: 'You are about to delete',
        descriptionSuffix: 'rows. This action cannot be undone.',
        cancel: 'Cancel',
        confirm: 'Confirm Delete',
      },
    },
    mappingPage: {
      status: {
        mapped: 'Mapped',
        unmapped: 'Unmapped',
        duplicate: 'Duplicate Mapping',
      },
      errors: {
        missingImportTarget: 'Missing import file or target table.',
        importFailed: 'Import failed',
      },
      success: {
        importedRows: 'Imported {count} rows',
      },
      sections: {
        mappingStatusTitle: 'Field Mapping Status',
        filePreviewTitle: 'File Preview',
        filePreviewDescription:
          'Preview of the first five rows in the selected file for quick inspection and field mapping.',
        noImportFileSelected: 'No import file selected',
        fieldMappingTitle: 'Field Mapping',
        fieldMappingDescription:
          'The left side shows project table fields, and the right side shows fields from the imported file. Map each imported field to the correct project field.',
      },
      headers: {
        projectField: 'Project Field',
        importField: 'Import Field',
      },
      placeholders: {
        unselected: 'Not Selected',
      },
      actions: {
        cancelImport: 'Cancel Import',
        importData: 'Import Data',
      },
    },
    cleanPage: {
      saveStatus: {
        saving: 'Saving',
        saved: 'Saved',
        failed: 'Save Failed',
      },
      tableTabs: {
        coreSubtitle: 'Core',
        extensionSubtitle: 'Extension',
      },
      accordion: {
        errorMessages: 'Error Messages',
        validating: 'Validating...',
        retryValidate: 'Validate Again',
      },
      menus: {
        filterData: 'Data Filter',
        filterByContent: 'Filter by Content',
        filterByText: 'Filter by Text',
        filterDuplicates: 'Filter Duplicates',
        editContent: 'Edit Content',
        stringReplace: 'String Replace',
        swapFieldContent: 'Swap Field Content',
        speciesApi: 'Connect Species API',
        closeFilter: 'Close Filter',
      },
      states: {
        showingFilteredResult: 'Showing filtered results',
        selectProjectFirst: 'Please select a project first',
        selectTableFirst: 'Please select a table first',
        selectAnyHeader: 'Please select any column header first',
      },
      actions: {
        previous: 'Previous',
        exportData: 'Export Data',
      },
      panels: {
        applyScope: {
          label: 'Apply Scope',
          allRows: 'All Rows',
          specificRows: 'Specific Rows',
          rowNumbersLabel: 'Row Numbers',
          rowNumbersPlaceholder: 'e.g. 1,3,8-12',
          rowNumbersHelper:
            'Use single numbers, comma-separated numbers, or ranges (e.g. 1,3,8-12).',
          rowNumbersInvalid: 'Invalid row number format',
          noMatchedRows: 'No matching rows found for the entered row numbers.',
        },
        facetValueList: {
          emptyValue: '(Empty)',
          recordUnit: 'rows',
        },
        batchEditDialog: {
          title: 'Batch Edit',
          fieldPrefix: 'Field: ',
          currentValuePrefix: 'Current value: ',
          affectedCountPrefix: 'Affected rows: ',
          newValueLabel: 'Enter new value',
          cancel: 'Cancel',
          confirm: 'Confirm',
        },
        contentFilter: {
          title: 'Filter by Content',
          description:
            'Select a value to modify, then enter a new value in the dialog to batch-apply changes to all matching rows.',
        },
        textFilter: {
          title: 'Filter by Text',
          description:
            'Choose a search mode and enter keywords. Click "Search" to apply it to all matching data.',
          modeLabel: 'Search Mode',
          queryLabel: 'Search Query',
          modeLabels: {
            exact: 'Exact Match',
            fuzzy: 'Fuzzy Match',
            regex: 'Regex Match',
          },
          helpers: {
            regexInvalid: 'Invalid regular expression format',
            exact: 'Only exact matches will be found',
            fuzzy: 'Contains keyword will match (case-insensitive)',
            regex:
              'You can use regular expressions, for example \\s+ for whitespace',
          },
          matchedCountPrefix: 'Matched rows: ',
          samplePrefix: 'Sample matches: ',
          actionSearch: 'Search',
        },
        duplicateFilter: {
          title: 'Filter Duplicates',
          description:
            'Find duplicate values in the selected field. Leave the search empty to show all duplicate values.',
          queryLabel: 'Search Query',
          helper:
            'Leave empty to show all duplicate values; exact text must match when entered',
          matchedCountPrefix: 'Duplicate rows: ',
          samplePrefix: 'Sample duplicate values: ',
          actionSearch: 'Apply Filter',
        },
        stringReplace: {
          title: 'String Replace',
          description:
            'Set the target string and replacement value. Click "Replace" to batch-update all matching rows.',
          modeLabel: 'Search Mode',
          modeLabels: {
            exact: 'Exact Match',
            fuzzy: 'Fuzzy Match',
            regex: 'Regex Match',
          },
          fromLabel: 'String to replace',
          toLabel: 'Replace with',
          toHelper: 'Can be empty to replace with an empty string',
          helpers: {
            regexInvalid: 'Invalid regular expression format',
            exact: 'Only exact matches will be replaced',
            fuzzy: 'Contains keyword will be replaced (case-insensitive)',
            regex:
              'You can use regular expressions, for example \\s+ for whitespace',
          },
          affectedCountPrefix: 'Affected rows: ',
          samplePrefix: 'Sample matches: ',
          actionReplace: 'Replace',
        },
        fieldSwap: {
          title: 'Swap Field Content',
          descriptionPrefix: 'Choose a field to swap with "',
          descriptionSuffix:
            '". Click "Swap" to exchange values between the two fields.',
          targetFieldLabel: 'Target field',
          actionSwap: 'Swap',
        },
        speciesApi: {
          title: 'Connect Species API',
          subtitle: 'Auto-fill higher taxonomy related fields',
          descriptionPrefix:
            'Based on values in the scientificName field, the system uses ',
          descriptionMiddle:
            ' for matching. It first queries Taicol as the primary source, then falls back to GBIF if no match is found, and writes results back to the table.',
          descriptionSuffix: '',
          overwriteFieldsPrefix:
            'After completion, the following fields will be added or overwritten:',
          status: {
            connecting: 'Connecting',
            running: 'Syncing species data',
            done: 'Species enrichment completed',
            error: 'An error occurred during sync',
          },
          connectFailed: 'An error occurred during sync',
          doneSummary: 'Done: {updated} updated / {skipped} skipped',
          actionConnect: 'Connect',
        },
      },
    },
    validatePage: {
      sections: {
        errorListTitle: 'Error List',
        errorListDescription:
          'Errors below are grouped by type. Expand each error item to review affected rows and values, then quickly locate issues and fix them in the next step. Red errors require immediate correction, while yellow errors indicate warnings to pay attention to.',
      },
      errors: {
        validateFailed: 'Data validation failed',
        validateFailedWithReasonPrefix: 'Data validation failed: ',
      },
      tableTabs: {
        coreSubtitle: 'Core',
        extensionSubtitle: 'Extension',
        fieldFrequencyTitle: 'Field Frequency',
      },
      actions: {
        downloadErrors: 'Download Error Report',
        previous: 'Previous',
        next: 'Next',
      },
      states: {
        validatingTitle: 'Validating...',
        validatingDescription: 'Running data validation, please wait...',
        resultTitleSuffix: 'Validation Result',
        noErrorData: 'No error data',
      },
    },
  },
  es: {
    logoHeader: {
      title: 'Kit de Herramientas de Datos Abiertos (ODT)',
      logoAlt: 'Logotipo de TaiBIF',
      languageLabel: 'Idioma',
      languageNames: {
        'zh-TW': '繁體中文',
        en: 'English',
        es: 'Español (generado por IA)',
      },
    },
    pagination: {
      labelPrefix: 'Pagina ',
      labelSuffix: '',
      rowsPerPageLabel: 'Filas por pagina',
      autoRowsLabel: 'Auto',
      goToPageLabel: 'Ir a pagina',
      goButton: 'Ir',
    },
    components: {
      customAccordion: {
        issueCountPrefix: 'Cantidad de Problemas: ',
        emptyMessage: 'Sin Errores',
      },
      fieldErrorAccordionList: {
        errorCountPrefix: 'Cantidad de Errores: ',
      },
      errorRowList: {
        shownPrefix: 'Mostrando ',
        shownSuffix: ' filas',
        rowPrefix: 'Fila ',
        rowSuffix: '',
        loadMore: 'Cargar mas',
      },
      fieldMappingStatusList: {
        fieldName: 'Nombre del Campo',
        mappingStatus: 'Estado de Mapeo',
        mapped: 'Mapeado',
        unmapped: 'Sin Mapear',
        duplicate: 'Mapeo Duplicado',
      },
      fieldFrequencyList: {
        fieldName: 'Nombre del Campo',
        accuracy: 'Precision',
      },
      stepHint: {
        stepPrefix: 'PASO',
        unknownStep: 'Paso desconocido',
        currentProjectPrefix: 'Proyecto actual: ',
      },
    },
    customStepper: {
      labels: {
        project: 'Proyecto',
        template: 'Plantilla',
        edit: 'Edicion',
        mapping: 'Importar',
        validate: 'Validar',
        clean: 'Limpiar',
      },
      hints: {
        project: 'Crea un proyecto nuevo o continua editando uno existente.',
        template:
          'Elige campos desde plantillas o temas integrados, o crea tu propia plantilla con campos personalizados.',
        edit: 'En este paso puedes completar y ordenar los datos. Los cambios se guardan automaticamente.',
        mapping:
          'Importa una tabla existente al proyecto y realiza la correspondencia de columnas.',
        validate:
          'Verifica si los formatos y contenidos cumplen las reglas, y localiza rapidamente los errores.',
        clean:
          'Usa los mensajes de error de la izquierda y las herramientas sobre la tabla para corregir datos por lotes.',
      },
    },
    projectPage: {
      alerts: {
        enterProjectName: 'Por favor, ingresa un nombre de proyecto.',
        createProjectMissingLatestId:
          'No se pudo crear el proyecto: no se encontro el ID mas reciente.',
        createProjectFailed: 'Ocurrio un error al crear el proyecto.',
        selectProjectFirst: 'Selecciona primero un proyecto.',
        deleteProjectFailed: 'Ocurrio un error al eliminar el proyecto.',
        fetchProjectsFailed:
          'Ocurrio un error al obtener la lista de proyectos.',
      },
      actions: {
        createNewProject: 'Crear Proyecto Nuevo',
        openExistingProject: 'Abrir Proyecto Existente',
      },
      form: {
        createTitle: 'Crear Proyecto Nuevo',
        createDescription:
          'Completa los campos para crear un proyecto. La marca ',
        requiredMark: 'indica un campo obligatorio.',
        projectNameLabel: 'Nombre del Proyecto *',
        createButton: 'Crear Proyecto',
      },
      projectList: {
        title: 'Mis Proyectos de Datos',
        description:
          'Aqui estan tus proyectos creados o importados anteriormente. Puedes continuar editando o revisar el progreso.',
        lastUpdatedPrefix: 'Ultima actualizacion: ',
        openButton: 'Abrir Proyecto',
        deleteButton: 'Eliminar Proyecto',
      },
      about: {
        introPrefix:
          'TaiBIF Open Data Toolkit es una herramienta potente para integrar datos de biodiversidad y adopta el estandar',
        introSuffix:
          'para ayudar a crear, gestionar, editar, validar y limpiar conjuntos de datos de forma eficiente.',
      },
      introSections: {
        project: {
          title: 'Gestion de Proyectos',
          desc: 'Crea proyectos nuevos o importa proyectos previos y sigue su avance en cada etapa.',
        },
        template: {
          title: 'Plantillas de Datos',
          desc: 'Construye plantillas basadas en Darwin Core para mantener consistencia y reducir errores de formato.',
        },
        edit: {
          title: 'Edicion de Datos',
          desc: 'Edita, modifica y agrega datos en una interfaz tipo hoja de calculo con guardado automatico.',
        },
        validate: {
          title: 'Validacion de Datos',
          desc: 'Usa validaciones automaticas para detectar errores comunes y mejorar la calidad de los datos.',
        },
        clearance: {
          title: 'Limpieza de Datos',
          desc: 'Limpia registros duplicados o incompletos y exporta un archivo ZIP listo para publicar.',
        },
      },
      deleteDialog: {
        title: 'Estas seguro de que deseas eliminar este proyecto?',
        description:
          'Esta accion no se puede deshacer. Todos los datos del proyecto se eliminaran permanentemente.',
        cancel: 'Cancelar',
        confirm: 'Confirmar Eliminacion',
      },
    },
    templatePage: {
      alerts: {
        selectProjectFirst: 'Primero crea o selecciona un proyecto.',
      },
      errors: {
        customFieldRequired:
          'Completa el nombre del campo, el nombre en chino y selecciona al menos una plantilla.',
        customFieldNamePattern:
          'El nombre del campo solo puede usar letras, numeros y guion bajo, y no puede comenzar con numero.',
        saveFailed: 'Error al guardar',
        attachExistingRequired:
          'Selecciona un campo existente y al menos una plantilla.',
        applyFailed: 'Error al aplicar',
        customTemplateNameRequired: 'Ingresa un nombre de plantilla.',
        customTemplateSelectRequired:
          'Selecciona al menos una plantilla central o de extension.',
      },
      sidebar: {
        useCustomTemplate: 'Usar Plantilla Personalizada',
        savedCustomTemplatePlaceholder:
          'Selecciona una plantilla personalizada guardada',
        useBuiltInTheme: 'Usar Tema Integrado',
        useBuiltInTemplate: 'Usar Plantilla Integrada',
        uncategorized: 'Sin categoria',
        coreTemplatePlaceholder: 'Tipo de conjunto central (obligatorio)',
        extensionTemplatePlaceholder: 'Conjuntos de extension (multiple)',
        editCustomFieldButton: 'Agregar / Editar Campos Personalizados',
      },
      content: {
        fieldListTitle: 'Lista de Campos de Plantilla',
        fieldListDescription:
          'Los campos se muestran segun la plantilla seleccionada a la izquierda. El contenido y el orden pueden variar.',
        requiredFieldTitle: 'Campos obligatorios:',
        requiredFieldDesc:
          'Estos campos son obligatorios del sistema y no se pueden desmarcar.',
        recommendedFieldTitle: 'Campos recomendados:',
        recommendedFieldDesc:
          'Estos campos vienen seleccionados por defecto y mejoran la integridad de los datos.',
        optionalFieldTitle: 'Campos opcionales:',
        optionalFieldDesc:
          'Puedes seleccionarlos libremente segun la necesidad de tus datos.',
        coreFieldPrefix: 'Campos del Conjunto Central: ',
        extensionFieldPrefix: 'Campos del Conjunto de Extension: ',
      },
      preview: {
        typeTitle: 'Tipo',
        noType: 'Ninguno',
        definitionTitle: 'Definicion',
        noDefinition: 'Sin descripcion',
        commonNameTitle: 'Nombre Comun Relacionado',
        noCommonName: 'Ninguno',
        exampleTitle: 'Ejemplo',
        hoverHint: 'Pasa el cursor sobre un campo para ver detalles',
      },
      actions: {
        saveCurrentSelectionAsTemplate:
          'Guardar la seleccion actual como plantilla',
        nextStep: 'Siguiente',
      },
      dialogs: {
        customFieldDialogTitle: 'Agregar / Aplicar Campo Personalizado',
        addCustomFieldTab: 'Agregar Campo Personalizado',
        applyExistingFieldTab: 'Aplicar Campo Existente',
        fieldNameLabel: 'Nombre del Campo',
        fieldNamePlaceholder: 'ej.: catalogNumber',
        fieldNameZhLabel: 'Nombre en Chino del Campo',
        fieldNameZhPlaceholder: 'ej.: 館藏號',
        fieldTypeLabel: 'Tipo de Campo',
        targetTemplateLabel: 'Plantillas a Agregar',
        targetTemplatePlaceholder: 'Seleccion multiple',
        existingCustomFieldLabel: 'Campo Personalizado Existente',
        cancel: 'Cancelar',
        confirm: 'Aceptar',
        save: 'Guardar',
        customFieldSuccessTitle: 'Campo Personalizado Agregado',
        customFieldSuccessDescription:
          'El campo personalizado se agrego al final de la lista de campos de la plantilla seleccionada, quedo seleccionado por defecto y se marca con la etiqueta "Personalizado" despues del nombre del campo.',
        saveCustomTemplateDialogTitle: 'Guardar Plantilla Personalizada',
        templateNameLabel: 'Nombre de Plantilla',
      },
      panel: {
        hideDescription: 'Ocultar Descripcion',
        showDescription: 'Mostrar Descripcion',
        showAllFields: 'Mostrar Todos los Campos',
        hideUncheckedFields: 'Ocultar Campos no Marcados',
        descriptionPrefix: 'La lista de campos se compila a partir de',
        descriptionSuffix: '.',
        customFieldBadge: 'Personalizado',
      },
      optionLabels: {
        template_core_checklist: 'Lista de Especies',
        template_core_occurrence: 'Registro de Ocurrencia',
        template_core_samplingevent: 'Evento de Muestreo',
        template_core_natural_history_collection:
          'Historia Natural - Ocurrencia',
        template_core_ecological_assessment: 'Evaluacion Ecologica - Lista',
        template_extension_occurrence: 'Darwin Core Occurrence',
        template_extension_simple_multimedia: 'Simple Multimedia',
        template_extension_extended_measurement_or_facts:
          'Extended Measurement Or Facts',
        template_extension_resource_relationship: 'Resource Relationship',
        template_extension_dna_derived_data: 'DNA Derived Data',
        template_extension_natural_history_collection_identification_history:
          'Historia Natural - Historial de Identificacion',
        template_extension_natural_history_collection_measurment_or_facts:
          'Historia Natural - Medicion o Hechos',
        template_extension_ecological_assessment_occurrence:
          'Evaluacion Ecologica - Ocurrencia',
        natural_history_collection: 'Historia Natural',
        ecological_assessment: 'Evaluacion Ecologica',
      },
      optionGroups: {
        達爾文核心資料表: 'Tablas Darwin Core',
        達爾文延伸資料表: 'Extensiones Darwin Core',
        生物多樣性領域資料標準: 'Estandares de Datos de Biodiversidad',
      },
    },
    editPage: {
      saveStatus: {
        saving: 'Guardando',
        saved: 'Guardado',
        failed: 'Error al Guardar',
      },
      errors: {
        deleteFailed: 'Error al eliminar',
        selectProjectFirst: 'Primero selecciona un proyecto',
        validateFailed: 'La validacion de datos fallo',
        validateFailedWithReasonPrefix: 'La validacion de datos fallo: ',
        selectRowsFirst: 'Selecciona primero las filas a eliminar',
      },
      tableTabs: {
        coreSubtitle: 'Tabla Principal',
        extensionSubtitle: 'Tabla de Extension',
        facetTitle: 'Obtener Datos de Filas',
      },
      menus: {
        data: 'Datos',
        edit: 'Editar',
        getFacetRows: 'Obtener Datos de Filas',
        importToCurrentTable: 'Importar a la Tabla Actual',
        exportCurrentTable: 'Exportar Tabla Actual',
        deleteSelectedRows: 'Eliminar Filas Seleccionadas',
        appendEmptyPage: 'Agregar Pagina de Datos Vacia',
      },
      tooltip: {
        requiredFieldTitle: 'Campos Obligatorios',
        requiredFieldDesc: 'Se muestran en el encabezado en rojo y negrita.',
        customFieldTitle: 'Campos Personalizados',
        customFieldDesc: 'Se muestran en el encabezado en azul y negrita.',
      },
      emptyState: {
        selectProjectFirst: 'Primero selecciona un proyecto',
        selectTableFirst: 'Primero selecciona una tabla',
      },
      actions: {
        previous: 'Anterior',
        validating: 'Validando',
        next: 'Siguiente',
      },
      deleteDialog: {
        title: 'Eliminar Filas Seleccionadas',
        descriptionPrefix: 'Estas a punto de eliminar',
        descriptionSuffix: 'filas. Esta accion no se puede deshacer.',
        cancel: 'Cancelar',
        confirm: 'Confirmar Eliminacion',
      },
    },
    mappingPage: {
      status: {
        mapped: 'Mapeado',
        unmapped: 'Sin Mapear',
        duplicate: 'Mapeo Duplicado',
      },
      errors: {
        missingImportTarget:
          'Falta el archivo de importacion o la tabla destino.',
        importFailed: 'Error de importacion',
      },
      success: {
        importedRows: 'Se importaron {count} filas',
      },
      sections: {
        mappingStatusTitle: 'Estado de Mapeo de Campos',
        filePreviewTitle: 'Vista Previa del Archivo',
        filePreviewDescription:
          'Vista previa de las primeras cinco filas del archivo seleccionado para revisar rapidamente y configurar el mapeo.',
        noImportFileSelected: 'Aun no se selecciono un archivo para importar',
        fieldMappingTitle: 'Mapeo de Campos',
        fieldMappingDescription:
          'A la izquierda estan los campos de la tabla del proyecto y a la derecha los del archivo importado. Asigna cada campo al destino correcto.',
      },
      headers: {
        projectField: 'Campo del Proyecto',
        importField: 'Campo Importado',
      },
      placeholders: {
        unselected: 'No Seleccionado',
      },
      actions: {
        cancelImport: 'Cancelar Importacion',
        importData: 'Importar Datos',
      },
    },
    cleanPage: {
      saveStatus: {
        saving: 'Guardando',
        saved: 'Guardado',
        failed: 'Error al Guardar',
      },
      tableTabs: {
        coreSubtitle: 'Tabla Principal',
        extensionSubtitle: 'Tabla de Extension',
      },
      accordion: {
        errorMessages: 'Mensajes de Error',
        validating: 'Validando...',
        retryValidate: 'Validar de Nuevo',
      },
      menus: {
        filterData: 'Filtrar Datos',
        filterByContent: 'Filtrar por Contenido',
        filterByText: 'Filtrar por Texto',
        filterDuplicates: 'Filtrar Duplicados',
        editContent: 'Editar Contenido',
        stringReplace: 'Reemplazo de Texto',
        swapFieldContent: 'Intercambiar Contenido de Campos',
        speciesApi: 'Conectar API de Especies',
        closeFilter: 'Cerrar Filtro',
      },
      states: {
        showingFilteredResult: 'Mostrando resultados filtrados',
        selectProjectFirst: 'Primero selecciona un proyecto',
        selectTableFirst: 'Primero selecciona una tabla',
        selectAnyHeader: 'Primero selecciona cualquier encabezado de columna',
      },
      actions: {
        previous: 'Anterior',
        exportData: 'Exportar Datos',
      },
      panels: {
        applyScope: {
          label: 'Alcance',
          allRows: 'Todas las Filas',
          specificRows: 'Filas Especificas',
          rowNumbersLabel: 'Numeros de Fila',
          rowNumbersPlaceholder: 'ej.: 1,3,8-12',
          rowNumbersHelper:
            'Puedes usar numeros individuales, separados por comas o rangos (ej.: 1,3,8-12).',
          rowNumbersInvalid: 'Formato de numero de fila invalido',
          noMatchedRows: 'No se encontraron filas para los numeros ingresados.',
        },
        facetValueList: {
          emptyValue: '(Vacio)',
          recordUnit: 'filas',
        },
        batchEditDialog: {
          title: 'Edicion por Lotes',
          fieldPrefix: 'Campo: ',
          currentValuePrefix: 'Valor actual: ',
          affectedCountPrefix: 'Filas afectadas: ',
          newValueLabel: 'Ingresar nuevo valor',
          cancel: 'Cancelar',
          confirm: 'Confirmar',
        },
        contentFilter: {
          title: 'Filtrar por Contenido',
          description:
            'Selecciona un valor para modificar y luego ingresa un nuevo valor en la ventana para aplicarlo por lotes a todas las filas coincidentes.',
        },
        textFilter: {
          title: 'Filtrar por Texto',
          description:
            'Elige un modo de busqueda e ingresa palabras clave. Pulsa "Buscar" para aplicarlo a todos los datos coincidentes.',
          modeLabel: 'Modo de busqueda',
          queryLabel: 'Texto de busqueda',
          modeLabels: {
            exact: 'Coincidencia exacta',
            fuzzy: 'Coincidencia difusa',
            regex: 'Coincidencia por regex',
          },
          helpers: {
            regexInvalid: 'Formato de expresion regular invalido',
            exact: 'Solo se encontraran coincidencias exactas',
            fuzzy:
              'Si contiene la palabra clave, coincidira (sin distinguir mayusculas)',
            regex:
              'Puedes usar expresiones regulares, por ejemplo \\s+ para espacios',
          },
          matchedCountPrefix: 'Filas coincidentes: ',
          samplePrefix: 'Ejemplos coincidentes: ',
          actionSearch: 'Buscar',
        },
        duplicateFilter: {
          title: 'Filtrar Duplicados',
          description:
            'Encuentra valores duplicados en el campo seleccionado. Si no ingresas texto, se muestran todos los duplicados.',
          queryLabel: 'Texto de busqueda',
          helper:
            'Deja vacio para mostrar todos los duplicados; si ingresas texto, debe coincidir exactamente',
          matchedCountPrefix: 'Filas duplicadas: ',
          samplePrefix: 'Ejemplos duplicados: ',
          actionSearch: 'Aplicar Filtro',
        },
        stringReplace: {
          title: 'Reemplazo de Texto',
          description:
            'Configura el texto objetivo y el contenido de reemplazo. Pulsa "Reemplazar" para modificar por lotes todas las filas coincidentes.',
          modeLabel: 'Modo de busqueda',
          modeLabels: {
            exact: 'Coincidencia exacta',
            fuzzy: 'Coincidencia difusa',
            regex: 'Coincidencia por regex',
          },
          fromLabel: 'Texto a reemplazar',
          toLabel: 'Reemplazar por',
          toHelper: 'Puede quedar vacio para reemplazar con una cadena vacia',
          helpers: {
            regexInvalid: 'Formato de expresion regular invalido',
            exact: 'Solo se reemplazaran coincidencias exactas',
            fuzzy:
              'Si contiene la palabra clave, se reemplazara (sin distinguir mayusculas)',
            regex:
              'Puedes usar expresiones regulares, por ejemplo \\s+ para espacios',
          },
          affectedCountPrefix: 'Filas afectadas: ',
          samplePrefix: 'Ejemplos coincidentes: ',
          actionReplace: 'Reemplazar',
        },
        fieldSwap: {
          title: 'Intercambiar Contenido de Campos',
          descriptionPrefix:
            'Selecciona el campo que deseas intercambiar con "',
          descriptionSuffix:
            '". Pulsa "Intercambiar" para cambiar el contenido entre ambos campos.',
          targetFieldLabel: 'Campo objetivo',
          actionSwap: 'Intercambiar',
        },
        speciesApi: {
          title: 'Conectar API de Especies',
          subtitle: 'Completar automaticamente campos taxonomicos superiores',
          descriptionPrefix:
            'Segun el contenido del campo scientificName, el sistema usa ',
          descriptionMiddle:
            ' para hacer la coincidencia. Primero consulta Taicol como fuente principal; si no hay coincidencia, usa GBIF como respaldo y escribe el resultado en la tabla.',
          descriptionSuffix: '',
          overwriteFieldsPrefix:
            'Al finalizar, se agregaran o sobrescribiran los siguientes campos:',
          status: {
            connecting: 'Conectando',
            running: 'Sincronizando datos de especies',
            done: 'Se completo el enriquecimiento de especies',
            error: 'Ocurrio un error durante la sincronizacion',
          },
          connectFailed: 'Ocurrio un error durante la sincronizacion',
          doneSummary:
            'Completado: {updated} actualizadas / {skipped} omitidas',
          actionConnect: 'Conectar',
        },
      },
    },
    validatePage: {
      sections: {
        errorListTitle: 'Lista de Errores',
        errorListDescription:
          'Los errores de abajo se agrupan por tipo. Expande cada error para revisar las filas y los valores que deben ajustarse, ubicar problemas rapidamente y corregirlos en el siguiente paso. Los errores en rojo requieren correccion inmediata; los amarillos son advertencias a tener en cuenta.',
      },
      errors: {
        validateFailed: 'La validacion de datos fallo',
        validateFailedWithReasonPrefix: 'La validacion de datos fallo: ',
      },
      tableTabs: {
        coreSubtitle: 'Tabla Principal',
        extensionSubtitle: 'Tabla de Extension',
        fieldFrequencyTitle: 'Frecuencia por Campo',
      },
      actions: {
        downloadErrors: 'Descargar Reporte de Errores',
        previous: 'Anterior',
        next: 'Siguiente',
      },
      states: {
        validatingTitle: 'Validando...',
        validatingDescription:
          'Se esta ejecutando la validacion de datos, por favor espera...',
        resultTitleSuffix: 'Resultado de Validacion',
        noErrorData: 'No hay datos con errores',
      },
    },
  },
};
