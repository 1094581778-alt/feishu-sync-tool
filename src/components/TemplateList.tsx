"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FilePathSelector } from '@/components/FilePathSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  Settings,
  FileSpreadsheet,
  Loader2,
  X,
  Check,
  Trash2,
} from 'lucide-react';
import type { HistoryTemplate, FeishuTable, FieldMatchResult } from '@/types';

interface TemplateListProps {
  historyTemplates: HistoryTemplate[];
  templateFiles: Record<string, File>;
  templateSheetNames: Record<string, string[]>;
  templateSyncStatus: Record<string, { success: boolean; message: string }>;
  tables: FeishuTable[];
  tableFields: Record<string, any[]>;
  feishuAppId: string;
  feishuAppSecret: string;
  setTemplateFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  setTemplateSheetNames: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setHistoryTemplates: React.Dispatch<React.SetStateAction<HistoryTemplate[]>>;
  setTemplateSyncStatus: React.Dispatch<React.SetStateAction<Record<string, { success: boolean; message: string }>>>;
  setTableFields: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  handleImportTemplates: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportTemplates: () => void;
  handleBatchUpload: () => void;
  handleDeleteTemplate: (id: string) => void;
  setTemplateToEdit: React.Dispatch<React.SetStateAction<HistoryTemplate | null>>;
  setShowSaveTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  showSheetMappingDropdown: string | null;
  setShowSheetMappingDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  showTableSelectorDropdown: string | null;
  setShowTableSelectorDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  showSheetSelectorDropdown: string | null;
  setShowSheetSelectorDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  expandedFieldDetails: string | null;
  setExpandedFieldDetails: React.Dispatch<React.SetStateAction<string | null>>;
  showSaveSuccess: string | null;
  setShowSaveSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  batchUploadProgress?: string;
}

export function TemplateList({
  historyTemplates,
  templateFiles,
  templateSheetNames,
  templateSyncStatus,
  tables,
  tableFields,
  feishuAppId,
  feishuAppSecret,
  setTemplateFiles,
  setTemplateSheetNames,
  setHistoryTemplates,
  setTemplateSyncStatus,
  setTableFields,
  handleImportTemplates,
  handleExportTemplates,
  handleBatchUpload,
  handleDeleteTemplate,
  setTemplateToEdit,
  setShowSaveTemplateModal,
  showSheetMappingDropdown,
  setShowSheetMappingDropdown,
  showTableSelectorDropdown,
  setShowTableSelectorDropdown,
  showSheetSelectorDropdown,
  setShowSheetSelectorDropdown,
  expandedFieldDetails,
  setExpandedFieldDetails,
  showSaveSuccess,
  setShowSaveSuccess,
  batchUploadProgress,
}: TemplateListProps) {
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [autoAddFields, setAutoAddFields] = useState<Record<string, boolean>>({});
  const [addingFields, setAddingFields] = useState<Record<string, boolean>>({});

  // 自动检测字段类型
  const detectFieldType = (excelField: string, jsonData: Record<string, any>[]) => {
    // 检查是否为数字类型
    const values = jsonData.map(row => row[excelField]);
    const allNumbers = values.every(value => {
      if (value === null || value === undefined) return true;
      return !isNaN(Number(value));
    });
    
    if (allNumbers) {
      return 'number';
    }
    
    // 检查是否为日期类型
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{4}\/\d{2}\/\d{2}$/
    ];
    const allDates = values.every(value => {
      if (value === null || value === undefined) return true;
      return dateFormats.some(format => format.test(value.toString()));
    });
    
    if (allDates) return 'date';
    
    return 'text';
  };

  // 添加未匹配字段到飞书表格
  const addUnmatchedFieldsToFeishu = async (template: HistoryTemplate, tableId: string, skipRefresh = false) => {
    const matches = template.fieldMatchResults?.[tableId] || [];
    const unmatchedFields = matches.filter((m: any) => !m.matched);

    if (unmatchedFields.length === 0) {
      if (!skipRefresh) {
        setShowSaveSuccess('✅ 没有未匹配字段需要添加');
        setTimeout(() => setShowSaveSuccess(null), 3000);
      }
      return;
    }

    setAddingFields(prev => ({ ...prev, [`${template.id}-${tableId}`]: true }));

    try {
      let successCount = 0;
      let failedFields: string[] = [];
      let skippedFields: string[] = [];

      // 读取Excel文件获取数据以检测字段类型
      const file = templateFiles[template.id];
      let jsonData: Record<string, any>[] = [];
      if (file) {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = template.tableToSheetMapping[tableId];
        
        if (sheetName) {
          // 大小写不敏感查找工作表
          const actualSheetName = workbook.SheetNames.find(
            (name) => name.toLowerCase() === sheetName.toLowerCase()
          ) || sheetName;
          
          if (workbook.Sheets[actualSheetName]) {
            jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(
              workbook.Sheets[actualSheetName], 
              { raw: false }
            );
          }
        }
      }

      for (const field of unmatchedFields) {
        try {
          // 自动检测字段类型
          const fieldType = detectFieldType(field.excelField, jsonData);
          
          const requestBody: any = {
            token: template.spreadsheetToken,
            tableId,
            fieldName: field.excelField,
            fieldType: fieldType
          };

          if (feishuAppId && feishuAppSecret) {
            requestBody.appId = feishuAppId;
            requestBody.appSecret = feishuAppSecret;
          }

          const response = await fetch(`${window.location.origin}/api/feishu/add-field`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
            console.log(`✅ [历史模版] 已添加字段 "${field.excelField}" (类型: ${fieldType}) 到飞书表格`);
          } else {
            // 检查是否是字段已存在的错误
            if (data.error?.includes('已存在') || response.status === 409) {
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

      // 如果不是从 refreshFieldMatches 调用的，则刷新字段信息
      if (!skipRefresh) {
        await refreshFieldMatches(template);
      }

      if (!skipRefresh) {
        // 构建结果消息
        let message = '';
        if (successCount > 0) {
          message += `✅ 成功添加 ${successCount} 个字段`;
        }
        if (skippedFields.length > 0) {
          message += (message ? '，' : '') + `⚠️ 跳过 ${skippedFields.length} 个已存在字段`;
        }
        if (failedFields.length > 0) {
          message += (message ? '，' : '') + `❌ 失败 ${failedFields.length} 个字段`;
        }
        if (!message) {
          message = '✅ 没有需要添加的字段';
        }

        setShowSaveSuccess(message);
        setTimeout(() => setShowSaveSuccess(null), 3000);
      }
    } catch (error) {
      console.error(`❌ [历史模版] 添加字段失败:`, error);
      if (!skipRefresh) {
        setShowSaveSuccess('❌ 添加字段失败，请检查网络连接');
        setTimeout(() => setShowSaveSuccess(null), 3000);
      }
    } finally {
      setAddingFields(prev => ({ ...prev, [`${template.id}-${tableId}`]: false }));
    }
  };

  // 刷新字段匹配的函数
  const refreshFieldMatches = async (template: HistoryTemplate) => {
    const file = templateFiles[template.id];
    const sheetNames = templateSheetNames[template.id] || [];

    console.log(`🔄 [历史模版] 开始刷新模版 "${template.name}"`);
    console.log(`📁 文件状态:`, file ? `${file.name} (已加载)` : '未上传');
    console.log(`📊 Sheet映射:`, template.tableToSheetMapping);

    if (!file) {
      console.error(`❌ [历史模版] 模版 "${template.name}" 没有上传文件`);
      setShowSaveSuccess('❌ 请先上传Excel文件');
      setTimeout(() => setShowSaveSuccess(null), 3000);
      return;
    }

    if (!template.tableToSheetMapping || Object.keys(template.tableToSheetMapping).length === 0) {
      console.error(`❌ [历史模版] 模版 "${template.name}" 没有配置Sheet映射`);
      setShowSaveSuccess('❌ 请先配置Sheet映射');
      setTimeout(() => setShowSaveSuccess(null), 3000);
      return;
    }

    try {
      // 重新获取飞书字段信息（不使用缓存）
      const newTableFields: Record<string, any[]> = {};
      for (const tableId of template.selectedTableIds) {
        try {
          const requestBody: any = { 
            token: template.spreadsheetToken, 
            tableId 
          };
          if (feishuAppId && feishuAppSecret) {
            requestBody.appId = feishuAppId;
            requestBody.appSecret = feishuAppSecret;
          }

          const response = await fetch(`${window.location.origin}/api/feishu/fields`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          const data = await response.json();
          if (data.success) {
            newTableFields[tableId] = data.fields;
            console.log(`✅ [历史模版] 已获取表 ${tableId} 字段:`, data.fields.length);
          } else {
            console.error(`❌ [历史模版] 获取表 ${tableId} 字段失败:`, data.error);
          }
        } catch (error) {
          console.error(`❌ [历史模版] 获取表 ${tableId} 字段请求失败:`, error);
        }
      }

      // 更新 tableFields
      if (Object.keys(newTableFields).length > 0) {
        setTableFields(prev => ({ ...prev, ...newTableFields }));
      }

      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      console.log(`📋 [历史模版] 读取到 ${workbook.SheetNames.length} 个Sheet:`, workbook.SheetNames);

      // 更新 Sheet 名称
      setTemplateSheetNames((prev) => ({
        ...prev,
        [template.id]: workbook.SheetNames,
      }));

      // 重新分析每个工作表的字段匹配
      const newFieldMatches: Record<string, FieldMatchResult[]> = {};

      for (const tableId of template.selectedTableIds) {
        const sheetName = template.tableToSheetMapping[tableId];
        console.log(`🔍 [历史模版] 检查表 ${tableId} -> Sheet: ${sheetName}`);

        // 大小写不敏感查找工作表
        let actualSheetName = sheetName;
        if (sheetName) {
          actualSheetName = workbook.SheetNames.find(
            (name) => name.toLowerCase() === sheetName.toLowerCase()
          ) || sheetName;
        }

        if (sheetName && workbook.Sheets[actualSheetName]) {
          const worksheet = workbook.Sheets[actualSheetName];
          const jsonData = XLSX.utils.sheet_to_json<
            Record<string, any>
          >(worksheet, { raw: false });

          console.log(`📊 [历史模版] Sheet "${actualSheetName}" 有 ${jsonData.length} 行数据`);

          if (jsonData.length > 0) {
            const excelColumns = Object.keys(jsonData[0]);
            const feishuFields = newTableFields[tableId] || [];
            const feishuFieldNames = feishuFields.map(
              (f: any) => f.field_name || f.name
            );

            console.log(`📝 [历史模版] Excel列:`, excelColumns);
            console.log(`📝 [历史模版] 飞书字段:`, feishuFieldNames);

            // 模糊匹配
            const normalizeFieldName = (name: string) =>
              name.trim().toLowerCase().replace(/\s+/g, '');

            const results: FieldMatchResult[] =
              excelColumns.map((excelField) => {
                let feishuField = feishuFieldNames.find(
                  (fn: string) => fn === excelField
                );
                if (!feishuField) {
                  const normalizedExcelField =
                    normalizeFieldName(excelField);
                  feishuField = feishuFieldNames.find(
                    (fn: string) =>
                      normalizeFieldName(fn) ===
                      normalizedExcelField
                  );
                }
                return {
                  excelField,
                  feishuField: feishuField || null,
                  matched: !!feishuField,
                };
              });

            newFieldMatches[tableId] = results;
            console.log(`✅ [历史模版] 表 ${tableId} 匹配结果: ${results.filter(r => r.matched).length}/${results.length}`);
          }
        } else {
          console.warn(`⚠️ [历史模版] Sheet "${sheetName}" 不存在`);
        }
      }

      // 更新模版的字段匹配结果
      const updatedTemplates = historyTemplates.map((temp) =>
        temp.id === template.id
          ? { ...temp, fieldMatchResults: newFieldMatches, tableFields: newTableFields }
          : temp
      );
      setHistoryTemplates(updatedTemplates);
      localStorage.setItem(
        'feishuHistoryTemplates',
        JSON.stringify(updatedTemplates)
      );

      console.log(
        `✅ [历史模版] 已刷新模版 "${template.name}" 的字段匹配`
      );

      // 检查是否需要自动添加未匹配字段
      for (const tableId of template.selectedTableIds) {
        const matches = newFieldMatches[tableId] || [];
        const unmatchedFields = matches.filter((m: any) => !m.matched);
        const autoAddEnabled = autoAddFields[`${template.id}-${tableId}`];

        if (autoAddEnabled && unmatchedFields.length > 0) {
          console.log(`🔄 [历史模版] 自动添加 ${unmatchedFields.length} 个未匹配字段到表 ${tableId}`);
          
          setAddingFields(prev => ({ ...prev, [`${template.id}-${tableId}`]: true }));
          
          try {
            let successCount = 0;
            let failedFields: string[] = [];
            let skippedFields: string[] = [];

            for (const field of unmatchedFields) {
              try {
                // 自动检测字段类型
                const fieldType = detectFieldType(field.excelField, jsonData);
                
                const requestBody: any = {
                  token: template.spreadsheetToken,
                  tableId,
                  fieldName: field.excelField,
                  fieldType: fieldType
                };

                if (feishuAppId && feishuAppSecret) {
                  requestBody.appId = feishuAppId;
                  requestBody.appSecret = feishuAppSecret;
                }

                const response = await fetch(`${window.location.origin}/api/feishu/add-field`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(requestBody),
                });

                const data = await response.json();
                if (data.success) {
                  successCount++;
                  console.log(`✅ [历史模版] 已添加字段 "${field.excelField}" 到飞书表格`);
                } else {
                  // 检查是否是字段已存在的错误
                  if (data.error?.includes('已存在') || response.status === 409) {
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

            // 手动刷新字段信息
            const refreshedTableFields: Record<string, any[]> = {};
            for (const tid of template.selectedTableIds) {
              try {
                const requestBody: any = { 
                  token: template.spreadsheetToken, 
                  tableId: tid 
                };
                if (feishuAppId && feishuAppSecret) {
                  requestBody.appId = feishuAppId;
                  requestBody.appSecret = feishuAppSecret;
                }

                const response = await fetch(`${window.location.origin}/api/feishu/fields`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(requestBody),
                });
                const data = await response.json();
                if (data.success) {
                  refreshedTableFields[tid] = data.fields;
                }
              } catch (error) {
                console.error(`❌ [历史模版] 获取表 ${tid} 字段失败:`, error);
              }
            }

            // 更新 tableFields
            if (Object.keys(refreshedTableFields).length > 0) {
              setTableFields(prev => ({ ...prev, ...refreshedTableFields }));
            }

            // 重新计算字段匹配
            const refreshedFieldMatches: Record<string, FieldMatchResult[]> = {};
            for (const tid of template.selectedTableIds) {
              const sheetName = template.tableToSheetMapping[tid];
              let actualSheetName = sheetName;
              if (sheetName) {
                actualSheetName = workbook.SheetNames.find(
                  (name) => name.toLowerCase() === sheetName.toLowerCase()
                ) || sheetName;
              }

              if (sheetName && workbook.Sheets[actualSheetName]) {
                const worksheet = workbook.Sheets[actualSheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false });

                if (jsonData.length > 0) {
                  const excelColumns = Object.keys(jsonData[0]);
                  const feishuFields = refreshedTableFields[tid] || newTableFields[tid] || [];
                  const feishuFieldNames = feishuFields.map((f: any) => f.field_name || f.name);

                  const normalizeFieldName = (name: string) =>
                    name.trim().toLowerCase().replace(/\s+/g, '');

                  const results: FieldMatchResult[] = excelColumns.map((excelField) => {
                    let feishuField = feishuFieldNames.find((fn: string) => fn === excelField);
                    if (!feishuField) {
                      const normalizedExcelField = normalizeFieldName(excelField);
                      feishuField = feishuFieldNames.find((fn: string) =>
                        normalizeFieldName(fn) === normalizedExcelField
                      );
                    }
                    return {
                      excelField,
                      feishuField: feishuField || null,
                      matched: !!feishuField,
                    };
                  });

                  refreshedFieldMatches[tid] = results;
                }
              }
            }

            // 更新模版的字段匹配结果
            const finalTemplates = historyTemplates.map((temp) =>
              temp.id === template.id
                ? { ...temp, fieldMatchResults: refreshedFieldMatches, tableFields: refreshedTableFields }
                : temp
            );
            setHistoryTemplates(finalTemplates);
            localStorage.setItem('feishuHistoryTemplates', JSON.stringify(finalTemplates));

            // 构建结果消息
            let message = '';
            if (successCount > 0) {
              message += `✅ 成功添加 ${successCount} 个字段`;
            }
            if (skippedFields.length > 0) {
              message += (message ? '，' : '') + `⚠️ 跳过 ${skippedFields.length} 个已存在字段`;
            }
            if (failedFields.length > 0) {
              message += (message ? '，' : '') + `❌ 失败 ${failedFields.length} 个字段`;
            }
            if (!message) {
              message = '✅ 没有需要添加的字段';
            }

            setShowSaveSuccess(message);
          } catch (error) {
            console.error(`❌ [历史模版] 自动添加字段失败:`, error);
            setShowSaveSuccess('❌ 自动添加字段失败，请检查网络连接');
          } finally {
            setAddingFields(prev => ({ ...prev, [`${template.id}-${tableId}`]: false }));
          }
        }
      }

      setShowSaveSuccess('✅ 字段匹配已刷新');
      setTimeout(() => setShowSaveSuccess(null), 3000);
    } catch (error) {
      console.error(`❌ [历史模版] 刷新失败:`, error);
      setShowSaveSuccess('❌ 刷新失败，请检查文件');
      setTimeout(() => setShowSaveSuccess(null), 3000);
    }
  };

  if (historyTemplates.length === 0) {
    return (
      <>
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">历史模版</h3>
          <div className="flex items-center gap-2">
            {/* 导入按钮 */}
            <input
              type="file"
              accept=".json"
              onChange={handleImportTemplates}
              className="hidden"
              id="import-templates-input-empty"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.getElementById('import-templates-input-empty') as HTMLInputElement;
                if (input) input.click();
              }}
              className="h-8 px-2 text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              导入
            </Button>
          </div>
        </div>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无历史模版</p>
          <p className="text-xs mt-1">配置完成后可以保存为模版</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">历史模版</h3>
        <div className="flex items-center gap-2">
          {/* 导入按钮 */}
          <input
            type="file"
            accept=".json"
            onChange={handleImportTemplates}
            className="hidden"
            id="import-templates-input"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.getElementById('import-templates-input') as HTMLInputElement;
              if (input) input.click();
            }}
            className="h-8 px-2 text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            导入
          </Button>
          {/* 导出按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportTemplates}
            className="h-8 px-2 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            导出
          </Button>
          {/* 全部同步上传按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBatchUpload}
            className="h-8 px-2 text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            全部同步上传
          </Button>
          {/* 清除全部模板按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔍 [历史模版] 点击了清除全部按钮');
              setShowClearAllDialog(true);
            }}
            className="h-8 px-2 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            清除全部
          </Button>
        </div>
      </div>

      {/* 批量上传进度提示 */}
      {batchUploadProgress && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            {batchUploadProgress}
          </p>
        </div>
      )}

      {/* 模版列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {historyTemplates.map((template) => {
          const sheetNames = templateSheetNames[template.id] || [];
          const hasSheetMappingErrors = template.selectedTableIds.some((tableId: string) => {
            const savedSheet = template.tableToSheetMapping?.[tableId];
            if (!savedSheet) return true;
            const sheetExists = sheetNames.some((sheet) => sheet.toLowerCase() === savedSheet.toLowerCase());
            if (!sheetExists) return true;
            const matches = template.fieldMatchResults?.[tableId] || [];
            const matchedCount = matches.filter((m: any) => m.matched).length;
            return matchedCount === 0;
          });

          return (
            <div
              key={template.id}
              className={`p-4 rounded-lg hover:shadow-md transition-shadow ${
                hasSheetMappingErrors
                  ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* 保存成功提示 */}
              {showSaveSuccess === template.id && (
                <div className="mb-3 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs text-green-700 dark:text-green-300">
                    {showSaveSuccess === template.id ? '配置已自动保存' : ''}
                  </span>
                </div>
              )}
              
              {/* 头部信息 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium truncate ${
                      hasSheetMappingErrors
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {hasSheetMappingErrors && '⚠️ '}
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(template.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTemplateToEdit(template);
                      setShowSaveTemplateModal(true);
                    }}
                    className="h-7 w-7"
                    title="编辑模版"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="h-7 w-7 text-red-600 hover:text-red-800 dark:text-red-400"
                    title="删除模版"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* 备注信息 */}
              {template.remark && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {template.remark}
                </p>
              )}

              {/* 标签信息 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded">
                  {template.inputMode === 'file' ? '文件上传' : '粘贴内容'}
                </span>
                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded">
                  {template.selectedTableIds.length} 个工作表
                </span>
                {template.tableToSheetMapping &&
                  Object.keys(template.tableToSheetMapping).length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded">
                      {Object.keys(template.tableToSheetMapping).length} 个子表配置
                    </span>
                  )}
              </div>

              {/* 操作区域 */}
              <div className="space-y-2">
                {/* 配置子表按钮（如果还没有子表配置） */}
                {(!template.tableToSheetMapping ||
                  Object.keys(template.tableToSheetMapping).length === 0) && (
                  <DropdownMenu
                    open={showSheetMappingDropdown === template.id}
                    onOpenChange={(open) =>
                      setShowSheetMappingDropdown(open ? template.id : null)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 py-2"
                      >
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        配置子表
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
                      <DropdownMenuLabel className="text-xs font-medium">
                        选择历史子表配置
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {historyTemplates.map((t) => {
                        const sheetMappingCount = t.tableToSheetMapping
                          ? Object.keys(t.tableToSheetMapping).length
                          : 0;
                        const hasMapping = sheetMappingCount > 0;
                        return (
                          <DropdownMenuItem
                            key={t.id}
                            disabled={!hasMapping}
                            onClick={() => {
                              if (t.tableToSheetMapping) {
                                const updatedTemplates = historyTemplates.map((temp) =>
                                  temp.id === template.id
                                    ? {
                                        ...temp,
                                        tableToSheetMapping: { ...t.tableToSheetMapping },
                                      }
                                    : temp
                                );
                                setHistoryTemplates(updatedTemplates);
                                localStorage.setItem(
                                  'feishuHistoryTemplates',
                                  JSON.stringify(updatedTemplates)
                                );
                                console.log(
                                  `✅ [历史模版] 已应用模版 "${t.name}" 的子表配置到 "${template.name}"`
                                );
                              }
                              setShowSheetMappingDropdown(null);
                            }}
                            className={`cursor-pointer py-2 ${
                              !hasMapping ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FileSpreadsheet className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {t.name}
                                </span>
                                {t.id === template.id && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">
                                    当前
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <span>{sheetMappingCount} 个子表配置</span>
                                <span>•</span>
                                <span className="truncate max-w-[100px]">
                                  {t.remark || '无备注'}
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                      {historyTemplates.length === 0 && (
                        <div className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                          暂无历史模版
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* 文件上传区域 */}
                <div>
                  <input
                    type="file"
                    id={`file-upload-${template.id}`}
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // 分析文件中的Sheet
                        const buffer = await file.arrayBuffer();
                        const XLSX = await import('xlsx');
                        const workbook = XLSX.read(buffer, { type: 'array' });

                        // 保存到临时状态
                        setTemplateFiles((prev) => ({ ...prev, [template.id]: file }));
                        setTemplateSheetNames((prev) => ({
                          ...prev,
                          [template.id]: workbook.SheetNames,
                        }));

                        console.log(
                          `✅ [历史模版] 模版 "${template.name}" 已上传文件: ${file.name}, 包含 ${workbook.SheetNames.length} 个Sheet`
                        );

                        // 自动触发字段匹配刷新
                        await refreshFieldMatches(template);
                        setShowSaveSuccess('文件已上传，字段匹配已刷新');
                        setTimeout(() => setShowSaveSuccess(null), 3000);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fileInput = document.getElementById(
                        `file-upload-${template.id}`
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.click();
                    }}
                    className="w-full text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950 py-2 overflow-hidden"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate min-w-0">
                      {templateFiles[template.id]
                        ? `已上传: ${templateFiles[template.id].name}`
                        : '上传Excel文件'}
                    </span>
                  </Button>
                </div>

                {/* 文件路径选择区域 */}
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📁 文件路径选择
                  </h5>
                  <FilePathSelector
                    templateId={template.id}
                    filePath={template.filePath}
                    onFileSelect={async (file) => {
                      // 分析文件中的Sheet
                      const buffer = await file.arrayBuffer();
                      const XLSX = await import('xlsx');
                      const workbook = XLSX.read(buffer, { type: 'array' });

                      // 保存到临时状态
                      setTemplateFiles((prev) => ({ ...prev, [template.id]: file }));
                      setTemplateSheetNames((prev) => ({
                        ...prev,
                        [template.id]: workbook.SheetNames,
                      }));

                      console.log(
                        `✅ [历史模版] 模版 "${template.name}" 已通过路径选择文件: ${file.name}, 包含 ${workbook.SheetNames.length} 个Sheet`
                      );

                      // 自动触发字段匹配刷新
                      await refreshFieldMatches(template);
                      setShowSaveSuccess('文件已选择，字段匹配已刷新');
                      setTimeout(() => setShowSaveSuccess(null), 3000);
                    }}
                    onFilePathChange={(path) => {
                      const updatedTemplates = historyTemplates.map((temp) =>
                        temp.id === template.id
                          ? { ...temp, filePath: path, updatedAt: new Date().toISOString() }
                          : temp
                      );
                      setHistoryTemplates(updatedTemplates);
                      localStorage.setItem(
                        'feishuHistoryTemplates',
                        JSON.stringify(updatedTemplates)
                      );
                      console.log(
                        `✅ [历史模版] 已更新模版 "${template.name}" 的文件路径: ${path}`
                      );
                    }}
                  />
                </div>

                {/* 文件上传状态提示 */}
                {templateFiles[template.id] ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md mb-2">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      ✅ 文件已上传：
                      <span className="font-medium">
                        {templateFiles[template.id]?.name}
                      </span>
                    </p>
                    {templateSheetNames[template.id] && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        📄 识别到 {templateSheetNames[template.id].length} 个 Sheet：
                        {templateSheetNames[template.id].join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md mb-2">
                    <p className="text-xs text-red-800 dark:text-red-200">
                      ⚠️ 未上传Excel文件
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      请点击下方"上传Excel文件"按钮上传文件
                    </p>
                  </div>
                )}

                {/* Sheet选择区域（文件上传后显示） */}
                {template.tableToSheetMapping &&
                  Object.keys(template.tableToSheetMapping).length > 0 &&
                  templateFiles[template.id] &&
                  templateSheetNames[template.id] && (
                    <div
                      className={`p-3 rounded-md mb-2 ${
                        hasSheetMappingErrors
                          ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                          : 'bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p
                          className={`text-xs font-medium ${
                            hasSheetMappingErrors
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-purple-800 dark:text-purple-200'
                          }`}
                        >
                          {hasSheetMappingErrors
                            ? '⚠️ 工作表配置存在问题'
                            : '📊 工作表配置'}
                        </p>
                        <div className="flex items-center gap-2">
                          {/* 修改配置下拉菜单 */}
                          <DropdownMenu
                            open={showSheetMappingDropdown === template.id}
                            onOpenChange={(open) =>
                              setShowSheetMappingDropdown(open ? template.id : null)
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100"
                              >
                                ✏️ 修改配置
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
                              <DropdownMenuLabel className="text-xs font-medium">
                                选择历史子表配置
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {historyTemplates.map((t) => {
                                const sheetMappingCount = t.tableToSheetMapping
                                  ? Object.keys(t.tableToSheetMapping).length
                                  : 0;
                                return (
                                  <DropdownMenuItem
                                    key={t.id}
                                    onClick={() => {
                                      // 应用该模版的子表配置到当前模版
                                      if (t.tableToSheetMapping) {
                                        const updatedTemplates = historyTemplates.map((temp) =>
                                          temp.id === template.id
                                            ? {
                                                ...temp,
                                                tableToSheetMapping: {
                                                  ...t.tableToSheetMapping,
                                                },
                                              }
                                            : temp
                                        );
                                        setHistoryTemplates(updatedTemplates);
                                        localStorage.setItem(
                                          'feishuHistoryTemplates',
                                          JSON.stringify(updatedTemplates)
                                        );
                                        console.log(
                                          `✅ [历史模版] 已应用模版 "${t.name}" 的子表配置到 "${template.name}"`
                                        );
                                      }
                                      setShowSheetMappingDropdown(null);
                                    }}
                                    className="cursor-pointer py-2"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <FileSpreadsheet className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {t.name}
                                        </span>
                                        {t.id === template.id && (
                                          <span className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">
                                            当前
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <span>{sheetMappingCount} 个子表配置</span>
                                        <span>•</span>
                                        <span className="truncate max-w-[100px]">
                                          {t.remark || '无备注'}
                                        </span>
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })}
                              {historyTemplates.length === 0 && (
                                <div className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                                  暂无历史模版
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await refreshFieldMatches(template);
                              setShowSaveSuccess('字段匹配已刷新');
                              setTimeout(() => setShowSaveSuccess(null), 3000);
                            }}
                            className="h-6 px-2 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                          >
                            🔄 刷新
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // 手动保存当前配置
                              const updatedTemplates = historyTemplates.map((temp) =>
                                temp.id === template.id ? template : temp
                              );
                              setHistoryTemplates(updatedTemplates);
                              localStorage.setItem(
                                'feishuHistoryTemplates',
                                JSON.stringify(updatedTemplates)
                              );
                              setShowSaveSuccess('配置已保存');
                              setTimeout(() => setShowSaveSuccess(null), 3000);
                            }}
                            className="h-6 px-2 text-xs text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
                          >
                            💾 保存
                          </Button>
                        </div>
                      </div>
                      {hasSheetMappingErrors && (
                        <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                          ⚠️ 部分工作表的Sheet映射存在问题，请检查配置
                        </p>
                      )}
                      <div className="space-y-2">
                        {template.selectedTableIds.map((tableId: string) => {
                          const table = tables.find((t) => t.id === tableId);
                          const savedSheet = template.tableToSheetMapping?.[tableId];
                          const sheetNames = templateSheetNames[template.id] || [];
                          const sheetExists = savedSheet
                            ? sheetNames.some((sheet) => sheet.toLowerCase() === savedSheet.toLowerCase())
                            : false;
                          const matches = template.fieldMatchResults?.[tableId] || [];
                          const matchedCount = matches.filter((m: any) => m.matched).length;
                          const unmatchedCount = matches.filter((m: any) => !m.matched)
                            .length;

                          if (!savedSheet) return null;

                          const hasError = !sheetExists || matchedCount === 0;

                          return (
                            <div
                              key={tableId}
                              className={`p-2 rounded-md ${
                                hasError
                                  ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700'
                                  : 'bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-xs flex-1">
                                  <DropdownMenu
                                    open={showTableSelectorDropdown === `${template.id}-${tableId}`}
                                    onOpenChange={(open) =>
                                      setShowTableSelectorDropdown(open ? `${template.id}-${tableId}` : null)
                                    }
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto px-2 py-1 text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 rounded transition-all cursor-pointer"
                                      >
                                        <span
                                          className={`font-medium min-w-0 flex-1 truncate ${
                                            hasError
                                              ? 'text-red-900 dark:text-red-100'
                                              : 'text-gray-900 dark:text-white'
                                          }`}
                                        >
                                          {table?.name || tableId}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 flex-shrink-0 text-purple-600">
                                          <path d="m6 9 6 6 6-6"/>
                                        </svg>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-64 max-h-60 overflow-y-auto">
                                      <DropdownMenuLabel className="text-xs font-medium">
                                        选择工作表
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {tables.map((t) => (
                                        <DropdownMenuItem
                                          key={t.id}
                                          onClick={() => {
                                            const updatedTemplates = historyTemplates.map((temp) =>
                                              temp.id === template.id
                                                ? {
                                                    ...temp,
                                                    selectedTableIds: [t.id],
                                                  }
                                                : temp
                                            );
                                            setHistoryTemplates(updatedTemplates);
                                            localStorage.setItem(
                                              'feishuHistoryTemplates',
                                              JSON.stringify(updatedTemplates)
                                            );
                                            console.log(
                                              `✅ [历史模版] 已将模版 "${template.name}" 的工作表从 "${table?.name}" 修改为 "${t.name}"`
                                            );
                                            setShowTableSelectorDropdown(null);
                                            setShowSaveSuccess(`工作表已更新为 "${t.name}"`);
                                            setTimeout(() => setShowSaveSuccess(null), 3000);
                                          }}
                                          className="cursor-pointer py-2"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <FileSpreadsheet className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {t.name}
                                              </span>
                                              {t.id === tableId && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">
                                                  当前
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                              ID: {t.id}
                                            </div>
                                          </div>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <span className="text-purple-600">→</span>
                                  <DropdownMenu
                                    open={showSheetSelectorDropdown === `${template.id}-${tableId}`}
                                    onOpenChange={(open) =>
                                      setShowSheetSelectorDropdown(open ? `${template.id}-${tableId}` : null)
                                    }
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto px-2 py-0.5 text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 rounded transition-all cursor-pointer"
                                      >
                                        <span
                                          className={`${
                                            sheetExists
                                              ? 'text-purple-900 dark:text-purple-100'
                                              : 'text-red-900 dark:text-red-100'
                                          }`}
                                        >
                                          {savedSheet} {!sheetExists && '(不存在)'}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 flex-shrink-0 text-purple-600">
                                          <path d="m6 9 6 6 6-6"/>
                                        </svg>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 max-h-60 overflow-y-auto">
                                      <DropdownMenuLabel className="text-xs font-medium">
                                        选择 Sheet
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {sheetNames.map((sheetName) => (
                                        <DropdownMenuItem
                                          key={sheetName}
                                          onClick={() => {
                                            const updatedTemplates = historyTemplates.map((temp) =>
                                              temp.id === template.id
                                                ? {
                                                    ...temp,
                                                    tableToSheetMapping: {
                                                      ...temp.tableToSheetMapping,
                                                      [tableId]: sheetName,
                                                    },
                                                  }
                                                : temp
                                            );
                                            setHistoryTemplates(updatedTemplates);
                                            localStorage.setItem(
                                              'feishuHistoryTemplates',
                                              JSON.stringify(updatedTemplates)
                                            );
                                            console.log(
                                              `✅ [历史模版] 已将模版 "${template.name}" 的工作表 "${table?.name}" 的 Sheet 从 "${savedSheet}" 修改为 "${sheetName}"`
                                            );
                                            setShowSheetSelectorDropdown(null);
                                            setShowSaveSuccess(`Sheet 已更新为 "${sheetName}"`);
                                            setTimeout(() => setShowSaveSuccess(null), 3000);
                                          }}
                                          className="cursor-pointer py-2"
                                        >
                                          <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                              {sheetName}
                                            </span>
                                            {sheetName === savedSheet && (
                                              <span className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">
                                                当前
                                              </span>
                                            )}
                                          </div>
                                        </DropdownMenuItem>
                                      ))}
                                      {sheetNames.length === 0 && (
                                        <div className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                                          暂无 Sheet，请先上传文件
                                        </div>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      matchedCount > 0 ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                  ></span>
                                  <span className={matchedCount > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {matchedCount} 匹配
                                  </span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  <span className="text-red-600">{unmatchedCount} 未匹配</span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedFieldDetails(
                                    expandedFieldDetails === `${template.id}-${tableId}` 
                                      ? null 
                                      : `${template.id}-${tableId}`
                                  )}
                                  className="h-6 px-2 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100"
                                >
                                  {expandedFieldDetails === `${template.id}-${tableId}` ? '收起' : '展开'}
                                </Button>
                                {!sheetExists && (
                                  <span className="flex items-center gap-1 text-red-600 font-medium">
                                    ⚠️ Sheet不存在
                                  </span>
                                )}
                              </div>
                              {expandedFieldDetails === `${template.id}-${tableId}` && (
                                <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">✅ 已匹配字段：</p>
                                      <div className="flex flex-wrap gap-1">
                                        {matches.filter((m: any) => m.matched).map((m: any, idx: number) => (
                                          <span key={idx} className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                            {m.excelField} → {m.feishuField}
                                          </span>
                                        ))}
                                        {matchedCount === 0 && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">暂无匹配字段</span>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-red-700 dark:text-red-300">❌ Excel 未匹配字段：</p>
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1">
                                            <Switch
                                              checked={autoAddFields[`${template.id}-${tableId}`] || false}
                                              onCheckedChange={(checked) => 
                                                setAutoAddFields(prev => ({ ...prev, [`${template.id}-${tableId}`]: checked }))
                                              }
                                              className="h-4 w-7"
                                            />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">自动添加</span>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addUnmatchedFieldsToFeishu(template, tableId)}
                                            disabled={addingFields[`${template.id}-${tableId}`] || unmatchedCount === 0}
                                            className="h-6 px-2 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                                          >
                                            {addingFields[`${template.id}-${tableId}`] ? (
                                              <>
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                添加中...
                                              </>
                                            ) : (
                                              '➕ 添加到飞书'
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {matches.filter((m: any) => !m.matched).map((m: any, idx: number) => (
                                          <span key={idx} className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                                            {m.excelField}
                                          </span>
                                        ))}
                                        {unmatchedCount === 0 && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">全部字段已匹配</span>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">⚠️ 飞书未使用字段：</p>
                                      <div className="flex flex-wrap gap-1">
                                        {(() => {
                                          const feishuFields = template.tableFields?.[tableId] || [];
                                          const matchedFeishuFields = matches.filter((m: any) => m.matched).map((m: any) => m.feishuField);
                                          const unusedFeishuFields = feishuFields.filter((f: any) => 
                                            !matchedFeishuFields.includes(f.field_name || f.name)
                                          );
                                          return unusedFeishuFields.length > 0 ? (
                                            unusedFeishuFields.map((f: any, idx: number) => (
                                              <span key={idx} className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded">
                                                {f.field_name || f.name}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">全部字段已使用</span>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 同步上传按钮 */}
                {templateFiles[template.id] && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // 检查飞书配置
                        if (!feishuAppId || !feishuAppSecret) {
                          console.error('请先配置飞书 App ID 和 App Secret');
                          return;
                        }

                        const file = templateFiles[template.id];
                        if (!file) return;

                        // 设置正在同步的状态
                        setTemplateSyncStatus((prev) => ({
                          ...prev,
                          [template.id]: { success: false, message: '正在同步...' },
                        }));

                        try {
                          // 判断是否是多Sheet Excel
                          const sheetNames = templateSheetNames[template.id] || [];
                          const isMultiSheetExcel =
                            sheetNames.length > 1 &&
                            template.tableToSheetMapping &&
                            Object.keys(template.tableToSheetMapping).length > 0;

                          if (isMultiSheetExcel) {
                            // 多Sheet模式：使用 tableToSheetMapping
                            let successCount = 0;
                            const totalCount = Object.keys(
                              template.tableToSheetMapping || {}
                            ).length;

                            for (const [tableId, sheetName] of Object.entries(
                              template.tableToSheetMapping || {}
                            )) {
                              if (!sheetName) continue;

                              try {
                                const syncFormData = new FormData();
                                syncFormData.append('file', file);
                                syncFormData.append('sheetName', sheetName as string);
                                syncFormData.append(
                                  'spreadsheetToken',
                                  template.spreadsheetToken
                                );
                                syncFormData.append('sheetId', tableId);
                                syncFormData.append('appId', feishuAppId);
                                syncFormData.append('appSecret', feishuAppSecret);

                                const syncResponse = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: syncFormData,
                                });

                                if (syncResponse.ok) {
                                  successCount++;
                                }
                              } catch (err) {
                                console.error(`同步 Sheet "${sheetName}" 失败:`, err);
                              }
                            }

                            // 设置最终状态
                            const success = successCount === totalCount;
                            setTemplateSyncStatus((prev) => ({
                              ...prev,
                              [template.id]: {
                                success,
                                message: success
                                  ? `✅ 成功同步 ${successCount} 个 Sheet`
                                  : `⚠️ 同步完成，成功 ${successCount}/${totalCount} 个 Sheet`,
                              },
                            }));
                          } else {
                            // 单Sheet模式
                            const syncFormData = new FormData();
                            syncFormData.append('file', file);
                            syncFormData.append(
                              'spreadsheetToken',
                              template.spreadsheetToken
                            );
                            syncFormData.append('sheetId', template.selectedTableIds[0]);
                            syncFormData.append('appId', feishuAppId);
                            syncFormData.append('appSecret', feishuAppSecret);

                            const syncResponse = await fetch('/api/upload', {
                              method: 'POST',
                              body: syncFormData,
                            });

                            const syncData = await syncResponse.json();

                            if (syncData.success) {
                              setTemplateSyncStatus((prev) => ({
                                ...prev,
                                [template.id]: {
                                  success: true,
                                  message: `✅ 同步成功: ${syncData.message}`,
                                },
                              }));
                            } else {
                              setTemplateSyncStatus((prev) => ({
                                ...prev,
                                [template.id]: {
                                  success: false,
                                  message: `⚠️ 同步失败: ${syncData.message}`,
                                },
                              }));
                            }
                          }
                        } catch (err) {
                          console.error('同步失败:', err);
                          setTemplateSyncStatus((prev) => ({
                            ...prev,
                            [template.id]: {
                              success: false,
                              message: `⚠️ 同步失败: ${err instanceof Error ? err.message : '未知错误'}`,
                            },
                          }));
                        }
                      }}
                      className="w-full text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 py-2"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      同步上传
                    </Button>

                    {/* 同步状态提示 */}
                    {templateSyncStatus[template.id] && (
                      <div
                        className={`p-3 rounded-md ${
                          templateSyncStatus[template.id].success
                            ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <p
                          className={`text-xs ${
                            templateSyncStatus[template.id].success
                              ? 'text-green-800 dark:text-green-200'
                              : 'text-red-800 dark:text-red-200'
                          }`}
                        >
                          {templateSyncStatus[template.id].message}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 清除全部模板确认对话框 */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清除全部历史模板</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将清除所有历史模板，且不可恢复。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              console.log('❌ [历史模版] 用户取消了清除操作');
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log('🔍 [历史模版] 用户确认清除，准备执行操作');
                setHistoryTemplates([]);
                localStorage.removeItem('feishuHistoryTemplates');
                console.log('✅ [历史模版] 已清除全部历史模板');
                setShowClearAllDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              确认清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
