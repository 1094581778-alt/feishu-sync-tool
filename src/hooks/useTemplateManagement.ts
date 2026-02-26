import { useState, useCallback } from 'react';
import type { HistoryTemplate, FieldMatchResult } from '@/types';
import { fetchFeishuFields, addFieldToFeishu } from '@/services/feishuApi';
import { readExcelData, readExcelSheetNames, readExcelWorkbook } from '@/utils/excelUtils';
import {
  detectFieldType,
  calculateFieldMatches,
  buildResultMessage,
  isFieldAlreadyExists,
  MESSAGE_TIMEOUT,
  MESSAGES,
} from '@/utils/templateUtils';

interface UseTemplateManagementProps {
  historyTemplates: HistoryTemplate[];
  templateFiles: Record<string, File>;
  tableFields: Record<string, any[]>;
  feishuAppId: string;
  feishuAppSecret: string;
  setTemplateFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  setTemplateSheetNames: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setHistoryTemplates: React.Dispatch<React.SetStateAction<HistoryTemplate[]>>;
  setTableFields: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setShowSaveSuccess: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useTemplateManagement({
  historyTemplates,
  templateFiles,
  tableFields,
  feishuAppId,
  feishuAppSecret,
  setTemplateFiles,
  setTemplateSheetNames,
  setHistoryTemplates,
  setTableFields,
  setShowSaveSuccess,
}: UseTemplateManagementProps) {
  const [autoAddFields, setAutoAddFields] = useState<Record<string, boolean>>({});
  const [addingFields, setAddingFields] = useState<Record<string, boolean>>({});

  const showMessage = useCallback((message: string, timeout: number = MESSAGE_TIMEOUT.SHORT) => {
    setShowSaveSuccess(message);
    setTimeout(() => setShowSaveSuccess(null), timeout);
  }, [setShowSaveSuccess]);

  const updateTemplate = useCallback((templateId: string, updates: Partial<HistoryTemplate>) => {
    setHistoryTemplates((prev) => {
      const updatedTemplates = prev.map((temp) =>
        temp.id === templateId ? { ...temp, ...updates } : temp
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('feishuHistoryTemplates', JSON.stringify(updatedTemplates));
      }
      return updatedTemplates;
    });
  }, [setHistoryTemplates]);

  const addUnmatchedFieldsToFeishu = useCallback(async (
    template: HistoryTemplate,
    tableId: string,
    skipRefresh = false
  ) => {
    const matches = template.fieldMatchResults?.[tableId] || [];
    const unmatchedFields = matches.filter((m: any) => !m.matched);

    if (unmatchedFields.length === 0) {
      if (!skipRefresh) {
        showMessage(MESSAGES.NO_UNMATCHED_FIELDS);
      }
      return;
    }

    setAddingFields(prev => ({ ...prev, [`${template.id}-${tableId}`]: true }));

    try {
      let successCount = 0;
      let failedFields: string[] = [];
      let skippedFields: string[] = [];

      const file = templateFiles[template.id];
      if (!file) {
        if (!skipRefresh) {
          showMessage(MESSAGES.NO_FILE, MESSAGE_TIMEOUT.LONG);
        }
        return;
      }

      const jsonData = await readExcelData(template, tableId, file);

      for (const field of unmatchedFields) {
        try {
          const fieldType = detectFieldType(field.excelField, jsonData);
          const { response, data } = await addFieldToFeishu(
            template,
            tableId,
            field.excelField,
            fieldType,
            feishuAppId,
            feishuAppSecret
          );

          if (data.success) {
            successCount++;
            console.log(`✅ [历史模版] 已添加字段 "${field.excelField}" (类型: ${fieldType}) 到飞书表格`);
          } else {
            if (isFieldAlreadyExists(data.error, response.status)) {
              console.log(`⚠️ [历史模版] 字段 "${field.excelField}" 已存在，跳过`);
              skippedFields.push(field.excelField);
            } else {
              failedFields.push(field.excelField);
              console.error(`❌ [历史模版] 添加字段 "${field.excelField}" 失败:`, data.error);
            }
          }
        } catch (error) {
          failedFields.push(field.excelField);
          console.error(`❌ [历史模版] 添加字段 "${field.excelField}" 请求失败:`, error);
        }
      }

      if (!skipRefresh) {
        showMessage(buildResultMessage(successCount, skippedFields, failedFields));
      }
    } catch (error) {
      console.error(`❌ [历史模版] 添加字段失败:`, error);
      if (!skipRefresh) {
        showMessage(MESSAGES.ADD_FIELDS_FAILED);
      }
    } finally {
      setAddingFields(prev => ({ ...prev, [`${template.id}-${tableId}`]: false }));
    }
  }, [
    templateFiles,
    feishuAppId,
    feishuAppSecret,
    showMessage,
  ]);

  const refreshFieldMatches = useCallback(async (template: HistoryTemplate) => {
    const file = templateFiles[template.id];

    if (!file) {
      showMessage(MESSAGES.NO_FILE, MESSAGE_TIMEOUT.LONG);
      return;
    }

    if (!template.tableToSheetMapping || Object.keys(template.tableToSheetMapping).length === 0) {
      showMessage(MESSAGES.NO_SHEET_MAPPING, MESSAGE_TIMEOUT.LONG);
      return;
    }

    try {
      const newTableFields: Record<string, any[]> = {};
      const newFieldMatches: Record<string, FieldMatchResult[]> = {};
      const tablesToAutoAdd: Array<{ tableId: string; unmatchedFields: any[] }> = [];
      
      const workbook = await readExcelWorkbook(file);
      if (!workbook) return;

      setTemplateSheetNames((prev) => ({
        ...prev,
        [template.id]: workbook.SheetNames,
      }));

      for (const tableId of (template.selectedTableIds || [])) {
        try {
          // 获取飞书字段
          const data = await fetchFeishuFields(template, tableId, feishuAppId, feishuAppSecret);
          if (data.success) {
            newTableFields[tableId] = data.fields;
          }
        } catch (error) {
          console.error(`❌ [历史模版] 获取表 ${tableId} 字段请求失败:`, error);
        }

        // 计算字段匹配
        const sheetName = template.tableToSheetMapping?.[tableId];
        if (sheetName) {
          const jsonData = await readExcelData(template, tableId, file);
          if (jsonData.length > 0) {
            const excelColumns = Object.keys(jsonData[0]);
            const feishuFields = newTableFields[tableId] || [];
            const feishuFieldNames = feishuFields.map(
              (f: any) => f.field_name || f.name
            );

            const results: FieldMatchResult[] = calculateFieldMatches(excelColumns, feishuFieldNames);
            newFieldMatches[tableId] = results;

            // 检查匹配字段数量
            const matchedFields = results.filter((m: any) => m.matched);
            const unmatchedFields = results.filter((m: any) => !m.matched);
            
            console.log(`📊 [刷新字段] 工作表 ${tableId}:`);
            console.log(`  - Excel字段: ${excelColumns.length} 个`);
            console.log(`  - 飞书字段: ${feishuFields.length} 个`);
            console.log(`  - 匹配字段: ${matchedFields.length} 个`);
            console.log(`  - 未匹配字段: ${unmatchedFields.length} 个`);

            // 如果匹配字段为0，自动开启自动添加开关
            if (matchedFields.length === 0 && unmatchedFields.length > 0) {
              console.log(`⚠️ [刷新字段] 匹配字段为0，自动开启自动添加开关`);
              setAutoAddFields(prev => ({
                ...prev,
                [`${template.id}-${tableId}`]: true
              }));
              tablesToAutoAdd.push({ tableId, unmatchedFields });
            } else {
              // 检查是否需要自动添加未匹配字段
              const autoAddEnabled = autoAddFields[`${template.id}-${tableId}`];
              
              if (autoAddEnabled && unmatchedFields.length > 0) {
                tablesToAutoAdd.push({ tableId, unmatchedFields });
              }
            }
          }
        }
      }

      if (Object.keys(newTableFields).length > 0) {
        setTableFields(prev => ({ ...prev, ...newTableFields }));
      }

      updateTemplate(template.id, {
        fieldMatchResults: newFieldMatches,
        tableFields: newTableFields,
      });

      // 处理自动添加字段
      for (const { tableId } of tablesToAutoAdd) {
        await addUnmatchedFieldsToFeishu(template, tableId, true);
      }

      showMessage(MESSAGES.REFRESH_SUCCESS);
    } catch (error) {
      console.error(`❌ [历史模版] 刷新失败:`, error);
      showMessage(MESSAGES.REFRESH_FAILED);
    }
  }, [
    templateFiles,
    feishuAppId,
    feishuAppSecret,
    setTableFields,
    setTemplateSheetNames,
    updateTemplate,
    autoAddFields,
    addUnmatchedFieldsToFeishu,
    showMessage,
  ]);

  const handleFileUpload = useCallback(async (templateId: string, file: File) => {
    const sheetNames = await readExcelSheetNames(file);
    
    setTemplateFiles((prev) => ({ ...prev, [templateId]: file }));
    setTemplateSheetNames((prev) => ({
      ...prev,
      [templateId]: sheetNames,
    }));

    const template = historyTemplates.find(t => t.id === templateId);
    if (template) {
      await refreshFieldMatches(template);
    }
  }, [historyTemplates, setTemplateFiles, setTemplateSheetNames, refreshFieldMatches]);

  return {
    autoAddFields,
    setAutoAddFields,
    addingFields,
    addUnmatchedFieldsToFeishu,
    refreshFieldMatches,
    handleFileUpload,
  };
}
