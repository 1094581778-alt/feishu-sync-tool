"use client"

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FilePathSelector } from '@/components/FilePathSelector';
import { ResizableCard } from '@/components/ui/ResizableCard';
import { CreateNewTableDialog } from '@/components/CreateNewTableDialog';
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
  Plus,
  Search,
  Filter,
  Clock,
  PlayCircle,
  PauseCircle,
  Zap,
} from 'lucide-react';
import { ScheduledTaskConfigDialog } from '@/components/scheduled-tasks';
import type { ScheduledTaskConfig } from '@/types/scheduled-task';
import type { HistoryTemplate, FeishuTable, FieldMatchResult } from '@/types';
import { useTemplateManagement } from '@/hooks/useTemplateManagement';
import { createFeishuTable } from '@/services/feishuApi';
import { readExcelData } from '@/utils/excelUtils';
import { calculateFieldMatches, detectFieldType } from '@/utils/templateUtils';

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
  onRefreshTables?: (spreadsheetToken: string) => Promise<void>;
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
  onRefreshTables,
}: TemplateListProps) {
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  const [creatingTable, setCreatingTable] = useState(false);
  const [currentTemplateForCreate, setCurrentTemplateForCreate] = useState<HistoryTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [showScheduledTaskDialog, setShowScheduledTaskDialog] = useState(false);
  const [currentTemplateForScheduledTask, setCurrentTemplateForScheduledTask] = useState<HistoryTemplate | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<Record<string, ScheduledTaskConfig>>({});
  
  // 模板过滤和搜索逻辑
  const filteredTemplates = useMemo(() => {
    return (historyTemplates || []).filter(template => {
      const templateName = template.name || '';
      const searchLower = searchQuery.toLowerCase();
      
      // 搜索过滤
      const matchesSearch = searchQuery === '' || 
        templateName.toLowerCase().includes(searchLower) ||
        (template.remark && typeof template.remark === 'string' && template.remark.toLowerCase().includes(searchLower));
      
      // 状态过滤
      if (filterStatus === 'all') return matchesSearch;
      
      if (filterStatus === 'complete') {
        // 检查模板是否完整（有工作表映射）
        return matchesSearch && 
          template.tableToSheetMapping && 
          Object.keys(template.tableToSheetMapping).length > 0;
      }
      
      if (filterStatus === 'incomplete') {
        // 检查模板是否不完整（没有工作表映射）
        return matchesSearch && 
          (!template.tableToSheetMapping || 
           Object.keys(template.tableToSheetMapping).length === 0);
      }
      
      return matchesSearch;
    });
  }, [historyTemplates, searchQuery, filterStatus]);

  const {
    autoAddFields,
    setAutoAddFields,
    addingFields,
    addUnmatchedFieldsToFeishu,
    refreshFieldMatches,
    handleFileUpload,
  } = useTemplateManagement({
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
  });

  const handleCreateNewTable = async (tableName: string) => {
    if (!currentTemplateForCreate) return;

    setCreatingTable(true);
    try {
      const { response, data } = await createFeishuTable(
        currentTemplateForCreate.spreadsheetToken,
        tableName,
        feishuAppId,
        feishuAppSecret
      );

      if (data.success) {
        console.log(`✅ [历史模版] 已创建新工作表 "${tableName}"`);

        const newTable = {
          id: data.table.id,
          name: data.table.name,
        };

        const safeHistoryTemplates = Array.isArray(historyTemplates) ? historyTemplates : [];
        const updatedTemplates = safeHistoryTemplates.map((temp) =>
          temp.id === currentTemplateForCreate.id
            ? {
                ...temp,
                selectedTableIds: [newTable.id],
                selectedTableNames: [newTable.name],
                tableToSheetMapping: { [newTable.id]: Object.values(temp.tableToSheetMapping || {})[0] || '' },
              }
            : temp
        );

        setHistoryTemplates(updatedTemplates);
        if (typeof window !== 'undefined') {
          localStorage.setItem('feishuHistoryTemplates', JSON.stringify(updatedTemplates));
        }

        setShowCreateTableDialog(false);
        setShowSaveSuccess(`工作表 "${tableName}" 创建成功，正在添加字段...`);
        setTimeout(() => setShowSaveSuccess(null), 3000);

        if (onRefreshTables) {
          await onRefreshTables(currentTemplateForCreate.spreadsheetToken);
        }

        const file = templateFiles[currentTemplateForCreate.id];
        if (file) {
          const jsonData = await readExcelData(currentTemplateForCreate, newTable.id, file);
          if (jsonData.length > 0) {
            const excelColumns = Object.keys(jsonData[0]);
            
            const feishuFieldsResponse = await fetch(`${window.location.origin}/api/feishu/fields`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: currentTemplateForCreate.spreadsheetToken,
                tableId: newTable.id,
                appId: feishuAppId,
                appSecret: feishuAppSecret,
              }),
            });
            const feishuFieldsData = await feishuFieldsResponse.json();
            const feishuFields = feishuFieldsData.fields || [];
            const feishuFieldNames = feishuFields.map((f: any) => f.field_name || f.name);

            const results: FieldMatchResult[] = calculateFieldMatches(excelColumns, feishuFieldNames);
            const unmatchedFields = results.filter((m: any) => !m.matched);

            console.log(`📋 [新建工作表] Excel字段数量: ${excelColumns.length}`);
            console.log(`📋 [新建工作表] 飞书字段数量: ${feishuFields.length}`);
            console.log(`📋 [新建工作表] 未匹配字段数量: ${unmatchedFields.length}`);

            if (unmatchedFields.length > 0) {
              console.log(`➕ [新建工作表] 开始添加 ${unmatchedFields.length} 个未匹配字段`);
              await addUnmatchedFieldsToFeishu(currentTemplateForCreate, newTable.id, true);
              
              console.log(`⏳ [新建工作表] 等待字段添加完成...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              console.log(`🔄 [新建工作表] 刷新字段匹配结果`);
              await refreshFieldMatches(currentTemplateForCreate);
            } else {
              console.log(`✅ [新建工作表] 所有字段已匹配，无需添加`);
              await refreshFieldMatches(currentTemplateForCreate);
            }
          }
        }
      } else {
        setShowSaveSuccess(`创建工作表失败: ${data.error}`);
        setTimeout(() => setShowSaveSuccess(null), 3000);
      }
    } catch (error) {
      console.error('❌ [历史模版] 创建工作表失败:', error);
      setShowSaveSuccess('创建工作表失败，请重试');
      setTimeout(() => setShowSaveSuccess(null), 3000);
    } finally {
      setCreatingTable(false);
      setCurrentTemplateForCreate(null);
    }
  };

  if (filteredTemplates.length === 0) {
    return (
      <>
        {/* 顶部工具栏 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
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
              className="h-10 px-4 text-xs bg-gray-50 dark:bg-gray-800 border-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              导入
            </Button>
          </div>
        </div>
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl mt-4">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">暂无历史模版</p>
          <p className="text-xs mt-2">配置完成后可以保存为模版</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 顶部工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
        {/* 搜索和筛选 */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="搜索模版..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs w-full sm:w-64 h-10 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 px-4 text-xs bg-gray-50 dark:bg-gray-800 border-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                <Filter className="h-4 w-4 mr-1.5" />
                筛选
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel className="text-xs font-medium">状态筛选</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
              >
                全部
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus('complete')}
                className={filterStatus === 'complete' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
              >
                已配置
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterStatus('incomplete')}
                className={filterStatus === 'incomplete' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
              >
                未配置
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* 操作按钮 */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            className="h-10 px-4 text-xs bg-gray-50 dark:bg-gray-800 border-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            导入
          </Button>
          {/* 导出按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportTemplates}
            className="h-10 px-4 text-xs bg-gray-50 dark:bg-gray-800 border-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-1.5" />
            导出
          </Button>
          {/* 全部同步上传按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBatchUpload}
            className="h-10 px-4 text-xs bg-blue-600 text-white border-0 rounded-xl hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            全部同步
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
            className="h-10 px-4 text-xs bg-gray-50 dark:bg-gray-800 border-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            清除全部
          </Button>
        </div>
      </div>

      {/* 批量上传进度提示 */}
      {batchUploadProgress && (
        <div className="mt-4 px-5 py-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {batchUploadProgress}
          </p>
        </div>
      )}

      {/* 模版列表 */}
      <div className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => {
            const sheetNames = templateSheetNames[template.id] || [];
            const hasSheetMappingErrors = (template.selectedTableIds || []).some((tableId: string) => {
              const savedSheet = template.tableToSheetMapping?.[tableId];
              if (!savedSheet) return false;
              const sheetExists = sheetNames.some((sheet) => sheet.toLowerCase() === savedSheet.toLowerCase());
              if (!sheetExists) return true;
              const matches = template.fieldMatchResults?.[tableId] || [];
              const matchedCount = matches.filter((m: any) => m.matched).length;
              return matchedCount === 0;
            });

            return (
              <ResizableCard
                key={template.id}
                defaultWidth={400}
                defaultHeight={300}
                minWidth={300}
                minHeight={200}
                storageKey={`templatelist-card-${template.id}`}
                className={`overflow-hidden hover:shadow-md transition-all duration-300 bg-gray-50 dark:bg-gray-900/50 border-0 rounded-2xl ${
                  hasSheetMappingErrors 
                    ? 'relative' 
                    : ''
                }`}
              >
                {hasSheetMappingErrors && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-radial from-red-500/60 via-pink-400/40 to-transparent animate-[fog-dissolve_3s_ease-in-out_infinite]"></div>
                    <div className="absolute inset-4 rounded-2xl bg-gradient-radial from-red-400/40 via-pink-300/20 to-transparent animate-[fog-dissolve_3s_ease-in-out_infinite_1.5s]"></div>
                    <div className="absolute inset-2 rounded-2xl border border-red-400/40 animate-pulse"></div>
                    <div className="absolute inset-4 rounded-2xl border border-pink-300/30 animate-pulse" style={{animationDelay: '0.75s'}}></div>
                  </div>
                )}
                <div className="p-5">
              {/* 保存成功提示 */}
                {showSaveSuccess === template.id && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      {showSaveSuccess === template.id ? '配置已自动保存' : ''}
                    </span>
                  </div>
                )}
                
                {/* 头部信息 */}
                <div className="flex items-start justify-between mb-4">
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
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(template.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {/* 定时任务按钮 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCurrentTemplateForScheduledTask(template);
                        setShowScheduledTaskDialog(true);
                      }}
                      className="h-7 w-7"
                      title="定时任务配置"
                    >
                      <Zap className={`h-3.5 w-3.5 ${scheduledTasks[template.id]?.enabled ? 'text-[#007DFF]' : 'text-gray-500'}`} />
                    </Button>
                    {/* 编辑按钮 */}
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
                    {/* 删除按钮 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="h-7 w-7 text-red-600 hover:text-red-800 dark:text-red-400"
                      title="删除模版"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <span className="text-xs px-3 py-1 rounded-xl font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {template.inputMode === 'file' ? '文件上传' : '粘贴内容'}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-xl font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {(template.selectedTableIds || []).length} 个工作表
                  </span>
                  {template.tableToSheetMapping &&
                    Object.keys(template.tableToSheetMapping).length > 0 && (
                      <span className="text-xs px-3 py-1 rounded-xl font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        已配置 {Object.keys(template.tableToSheetMapping).length} 个子表
                      </span>
                    )}
                </div>

                {/* 操作区域 */}
                <div className="space-y-5">
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
                          className="w-full text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 py-2 transition-all duration-200 border-0 rounded-xl"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          配置子表
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                        <DropdownMenuLabel className="text-sm font-medium">
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
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem(
                                      'feishuHistoryTemplates',
                                      JSON.stringify(updatedTemplates)
                                    );
                                  }
                                  console.log(
                                    `✅ [历史模版] 已应用模版 "${t.name}" 的子表配置到 "${template.name}"`
                                  );
                                }
                                setShowSheetMappingDropdown(null);
                              }}
                              className={`cursor-pointer py-3 ${
                                !hasMapping ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileSpreadsheet className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {t.name}
                                  </span>
                                  {t.id === template.id && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-xl text-blue-700 dark:text-blue-300">
                                      当前
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <span>{sheetMappingCount} 个子表配置</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">
                                    {t.remark || '无备注'}
                                  </span>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                        {historyTemplates.length === 0 && (
                          <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
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
                          await handleFileUpload(template.id, file);
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
                      className="w-full text-sm border-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 py-2 overflow-hidden transition-all duration-200 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate min-w-0">
                        {templateFiles[template.id]
                          ? `已上传: ${templateFiles[template.id].name}`
                          : '上传Excel文件'}
                      </span>
                    </Button>
                  </div>

                  {/* 文件路径选择区域 */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      文件路径选择
                    </h5>
                    <FilePathSelector
                      templateId={template.id}
                      filePath={template.filePath}
                      onFileSelect={async (file) => {
                        await handleFileUpload(template.id, file);
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
                        if (typeof window !== 'undefined') {
                          localStorage.setItem(
                            'feishuHistoryTemplates',
                            JSON.stringify(updatedTemplates)
                          );
                        }
                        console.log(
                          `✅ [历史模版] 已更新模版 "${template.name}" 的文件路径: ${path}`
                        );
                      }}
                    />
                  </div>

                  {/* 文件上传状态提示 */}
                  {templateFiles[template.id] ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl transition-all duration-200">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                        ✅ 文件已上传：
                        <span className="font-medium ml-1">
                          {templateFiles[template.id]?.name}
                        </span>
                      </p>
                      {templateSheetNames[template.id] && (
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          📄 识别到 {templateSheetNames[template.id].length} 个 Sheet：
                          {templateSheetNames[template.id].join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl transition-all duration-200">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                        ⚠️ 未上传Excel文件
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        请点击上方"上传Excel文件"按钮上传文件
                      </p>
                    </div>
                  )}

                  {/* Sheet选择区域（文件上传后显示） */}
                  {template.tableToSheetMapping &&
                    Object.keys(template.tableToSheetMapping).length > 0 &&
                    templateFiles[template.id] &&
                    templateSheetNames[template.id] && (
                      <div
                        className={`p-5 rounded-xl ${
                          hasSheetMappingErrors
                            ? 'bg-gray-200 dark:bg-gray-800'
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        } transition-all duration-200`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <p
                            className={`text-sm font-medium ${
                              hasSheetMappingErrors
                                ? 'text-gray-800 dark:text-gray-200'
                                : 'text-gray-900 dark:text-white'
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
                                  className="h-8 px-3 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                                >
                                  <Settings className="h-3.5 w-3.5 mr-1" />
                                  修改配置
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                                <DropdownMenuLabel className="text-sm font-medium">
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
                                          if (typeof window !== 'undefined') {
                                            localStorage.setItem(
                                              'feishuHistoryTemplates',
                                              JSON.stringify(updatedTemplates)
                                            );
                                          }
                                          console.log(
                                            `✅ [历史模版] 已应用模版 "${t.name}" 的子表配置到 "${template.name}"`
                                          );
                                        }
                                        setShowSheetMappingDropdown(null);
                                      }}
                                      className="cursor-pointer py-3"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <FileSpreadsheet className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t.name}
                                          </span>
                                          {t.id === template.id && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-xl text-blue-700 dark:text-blue-300">
                                              当前
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                          <span>{sheetMappingCount} 个子表配置</span>
                                          <span>•</span>
                                          <span className="truncate max-w-[120px]">
                                            {t.remark || '无备注'}
                                          </span>
                                        </div>
                                      </div>
                                    </DropdownMenuItem>
                                  );
                                })}
                                {historyTemplates.length === 0 && (
                                  <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
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
                              className="h-8 px-3 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 transition-colors"
                            >
                              <Loader2 className="h-3.5 w-3.5 mr-1" />
                              刷新
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
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem(
                                        'feishuHistoryTemplates',
                                        JSON.stringify(updatedTemplates)
                                      );
                                    }
                                    setShowSaveSuccess('配置已保存');
                                    setTimeout(() => setShowSaveSuccess(null), 3000);
                                  }}
                                  className="h-8 px-3 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  保存
                                </Button>
                          </div>
                        </div>
                        {hasSheetMappingErrors && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            ⚠️ 部分工作表的Sheet映射存在问题，请检查配置
                          </p>
                        )}
                        <div className="space-y-3">
                          {(template.selectedTableIds || []).map((tableId: string) => {
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
                                className={`p-3 rounded-xl ${
                                  hasError
                                    ? 'bg-gray-200 dark:bg-gray-800'
                                    : 'bg-gray-50 dark:bg-gray-800/50'
                                } transition-all duration-200`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3 text-xs flex-1">
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
                                          className="h-auto px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all cursor-pointer bg-gray-100 dark:bg-gray-800"
                                        >
                                          <span
                                            className={`font-medium min-w-0 flex-1 truncate ${
                                              hasError
                                                ? 'text-gray-800 dark:text-gray-200'
                                                : 'text-gray-900 dark:text-white'
                                            }`}
                                          >
                                            {table?.name || tableId}
                                          </span>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 flex-shrink-0 text-blue-600">
                                            <path d="m6 9 6 6 6-6"/>
                                          </svg>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="w-72 max-h-60 overflow-y-auto">
                                        <DropdownMenuLabel className="text-sm font-medium">
                                          选择工作表
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setCurrentTemplateForCreate(template);
                                            setShowCreateTableDialog(true);
                                            setShowTableSelectorDropdown(null);
                                          }}
                                          className="cursor-pointer py-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <Plus className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                新建工作表
                                              </span>
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                              创建新的飞书多维表格工作表
                                            </div>
                                          </div>
                                        </DropdownMenuItem>
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
                                                      selectedTableNames: [t.name],
                                                      tableToSheetMapping: {
                                                        ...temp.tableToSheetMapping,
                                                        [t.id]: Object.values(temp.tableToSheetMapping || {})[0] || ''
                                                      }
                                                    }
                                                : temp
                                              );
                                              setHistoryTemplates(updatedTemplates);
                                              if (typeof window !== 'undefined') {
                                                localStorage.setItem(
                                                  'feishuHistoryTemplates',
                                                  JSON.stringify(updatedTemplates)
                                                );
                                              }
                                              console.log(
                                                `✅ [历史模版] 已将模版 "${template.name}" 的工作表从 "${table?.name}" 修改为 "${t.name}"`
                                              );
                                              setShowTableSelectorDropdown(null);
                                              setShowSaveSuccess(`工作表已更新为 "${t.name}"`);
                                              setTimeout(() => setShowSaveSuccess(null), 3000);

                                              // 自动刷新字段匹配
                                              const updatedTemplate = updatedTemplates.find((temp) => temp.id === template.id);
                                              if (updatedTemplate) {
                                                console.log(`🔄 [选择工作表] 自动刷新字段匹配`);
                                                refreshFieldMatches(updatedTemplate);
                                              }
                                            }}
                                            className="cursor-pointer py-3"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                  {t.name}
                                                </span>
                                                {t.id === tableId && (
                                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">
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
                                    <span className="text-purple-600 font-medium">→</span>
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
                                          className="h-auto px-3 py-1.5 text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 rounded transition-all cursor-pointer"
                                        >
                                          <span
                                            className={`font-medium ${
                                              sheetExists
                                                ? 'text-purple-900 dark:text-purple-100'
                                                : 'text-red-900 dark:text-red-100'
                                            }`}
                                          >
                                            {savedSheet} {!sheetExists && '(不存在)'}
                                          </span>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 flex-shrink-0 text-purple-600">
                                            <path d="m6 9 6 6 6-6"/>
                                          </svg>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56 max-h-60 overflow-y-auto">
                                        <DropdownMenuLabel className="text-sm font-medium">
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
                                              if (typeof window !== 'undefined') {
                                                localStorage.setItem(
                                                  'feishuHistoryTemplates',
                                                  JSON.stringify(updatedTemplates)
                                                );
                                              }
                                              console.log(
                                                `✅ [历史模版] 已将模版 "${template.name}" 的工作表 "${table?.name}" 的 Sheet 从 "${savedSheet}" 修改为 "${sheetName}"`
                                              );
                                              setShowSheetSelectorDropdown(null);
                                              setShowSaveSuccess(`Sheet 已更新为 "${sheetName}"`);
                                              setTimeout(() => setShowSaveSuccess(null), 3000);
                                            }}
                                            className="cursor-pointer py-3"
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileSpreadsheet className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {sheetName}
                                              </span>
                                              {sheetName === savedSheet && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">
                                                  当前
                                                </span>
                                              )}
                                            </div>
                                          </DropdownMenuItem>
                                        ))}
                                        {sheetNames.length === 0 && (
                                          <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                            暂无 Sheet，请先上传文件
                                          </div>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              <div className="flex items-center gap-3 text-sm flex-wrap">
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      matchedCount > 0 ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                  ></span>
                                  <span className={`font-medium ${
                                    matchedCount > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                  }`}>
                                    {matchedCount} 匹配
                                  </span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                                  <span className="font-medium text-yellow-700 dark:text-yellow-300">
                                    {unmatchedCount} 未匹配
                                  </span>
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
                                  className="h-8 px-3 text-xs text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 transition-colors"
                                >
                                  {expandedFieldDetails === `${template.id}-${tableId}` ? '收起' : '展开'}
                                </Button>
                                {!sheetExists && (
                                  <span className="flex items-center gap-1 text-red-700 dark:text-red-300 font-medium">
                                    ⚠️ Sheet不存在
                                  </span>
                                )}
                              </div>
                              {/* 默认展开字段详情 */}
                              {(expandedFieldDetails === `${template.id}-${tableId}` || true) && (
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
                                          const feishuFields = Array.isArray(template.tableFields?.[tableId]) ? template.tableFields[tableId] : [];
                                          const matchResults = Array.isArray(matches) ? matches : [];
                                          const matchedFeishuFields = matchResults.filter((m: any) => m.matched).map((m: any) => m.feishuField);
                                          const unusedFeishuFields = feishuFields.filter((f: any) => 
                                            Array.isArray(matchedFeishuFields) && !matchedFeishuFields.includes(f.field_name || f.name)
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
                          [template.id]: { success: false, message: '正在检查字段...' },
                        }));

                        try {
                          // 检查字段匹配情况
                          const sheetNames = templateSheetNames[template.id] || [];
                          const isMultiSheetExcel =
                            sheetNames.length > 1 &&
                            template.tableToSheetMapping &&
                            Object.keys(template.tableToSheetMapping).length > 0;

                          let needsAddFields = false;

                          if (isMultiSheetExcel) {
                            // 多Sheet模式：检查所有工作表
                            for (const [tableId, sheetName] of Object.entries(
                              template.tableToSheetMapping || {}
                            )) {
                              if (!sheetName) continue;

                              const matches = template.fieldMatchResults?.[tableId] || [];
                              const matchedCount = matches.filter((m: any) => m.matched).length;
                              const unmatchedCount = matches.filter((m: any) => !m.matched).length;

                              console.log(`📊 [同步前检查] 工作表 ${tableId}: 匹配 ${matchedCount}, 未匹配 ${unmatchedCount}`);

                              if (matchedCount === 0 && unmatchedCount > 0) {
                                needsAddFields = true;
                                console.log(`⚠️ [同步前检查] 工作表 ${tableId} 匹配字段为0，需要先添加字段`);
                              }
                            }
                          } else {
                            // 单Sheet模式：检查单个工作表
                            const tableId = template.selectedTableIds[0];
                            const matches = template.fieldMatchResults?.[tableId] || [];
                            const matchedCount = matches.filter((m: any) => m.matched).length;
                            const unmatchedCount = matches.filter((m: any) => !m.matched).length;

                            console.log(`📊 [同步前检查] 工作表 ${tableId}: 匹配 ${matchedCount}, 未匹配 ${unmatchedCount}`);

                            if (matchedCount === 0 && unmatchedCount > 0) {
                              needsAddFields = true;
                              console.log(`⚠️ [同步前检查] 工作表 ${tableId} 匹配字段为0，需要先添加字段`);
                            }
                          }

                          // 如果需要添加字段，先添加字段
                          if (needsAddFields) {
                            console.log(`➕ [同步前检查] 开始自动添加字段`);
                            setTemplateSyncStatus((prev) => ({
                              ...prev,
                              [template.id]: { success: false, message: '正在添加字段...' },
                            }));

                            await refreshFieldMatches(template);
                            
                            // 等待字段添加完成
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            
                            console.log(`✅ [同步前检查] 字段添加完成，开始同步`);
                          }

                          // 更新同步状态
                          setTemplateSyncStatus((prev) => ({
                            ...prev,
                            [template.id]: { success: false, message: '正在同步...' },
                          }));

                          // 判断是否是多Sheet Excel
                          const sheetNames2 = templateSheetNames[template.id] || [];
                          const isMultiSheetExcel2 =
                            sheetNames2.length > 1 &&
                            template.tableToSheetMapping &&
                            Object.keys(template.tableToSheetMapping).length > 0;

                          if (isMultiSheetExcel2) {
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
                      className="w-full text-xs border-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      同步上传
                    </Button>

                    {/* 同步状态提示 */}
                    {templateSyncStatus[template.id] && (
                      <div
                        className={`p-3 rounded-xl ${
                          templateSyncStatus[template.id].success
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'bg-gray-200 dark:bg-gray-800'
                        }`}
                      >
                        <p
                          className={`text-xs ${
                            templateSyncStatus[template.id].success
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
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
              </ResizableCard>
          );
        })}
        </div>
      </div>

      {/* 新建工作表对话框 */}
      <CreateNewTableDialog
        open={showCreateTableDialog}
        onOpenChange={setShowCreateTableDialog}
        onCreateTable={handleCreateNewTable}
        loading={creatingTable}
      />

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
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('feishuHistoryTemplates');
                }
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

      {/* 定时任务配置对话框 */}
      {currentTemplateForScheduledTask && (
        <ScheduledTaskConfigDialog
          open={showScheduledTaskDialog}
          onOpenChange={setShowScheduledTaskDialog}
          template={currentTemplateForScheduledTask}
          existingTask={scheduledTasks[currentTemplateForScheduledTask.id]}
          onSave={(task) => {
            setScheduledTasks(prev => ({
              ...prev,
              [task.templateId]: task
            }));
            setShowSaveSuccess('定时任务已保存');
            setTimeout(() => setShowSaveSuccess(null), 3000);
          }}
        />
      )}
    </>
  );
}
