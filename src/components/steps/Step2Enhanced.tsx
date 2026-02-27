'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ResizableCard } from '@/components/ui/ResizableCard';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  Search,
  CheckSquare,
  Square,
  History,
  Trash2,
  Save,
  ChevronRight,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  Database,
  Layers,
  Filter,
  X,
  Zap,
  Upload,
  FileUp,
  Clipboard,
  File,
  FileType,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { HistoryTemplate } from '@/types';

interface Step2EnhancedProps {
  // Step2 相关属性
  tables: any[];
  selectedTableIds: string[];
  tableFields: Record<string, any[]>;
  loadingTables: boolean;
  onToggleTable: (tableId: string, isSelected: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  historyTemplates: HistoryTemplate[];
  onApplyTemplate: (template: HistoryTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSaveTemplate: () => void;
  onNextStep: () => void;
  
  // Step3 相关属性
  inputMode: 'file' | 'paste';
  setInputMode: (mode: 'file' | 'paste') => void;
  selectedFile: File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  pastedContent: string;
  setPastedContent: (content: string) => void;
  pasteAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  developerMode?: boolean;
}

export function Step2Enhanced({
  // Step2 属性
  tables,
  selectedTableIds,
  tableFields,
  loadingTables,
  onToggleTable,
  onSelectAll,
  onClearSelection,
  historyTemplates,
  onApplyTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  onNextStep,
  
  // Step3 属性
  inputMode,
  setInputMode,
  selectedFile,
  handleFileSelect,
  handleDrop,
  handleDragOver,
  fileInputRef,
  pastedContent,
  setPastedContent,
  pasteAreaRef,
  developerMode = false,
}: Step2EnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateSelectedTableIds, setTemplateSelectedTableIds] = useState<string[]>([]);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'input'>('tables');
  const [isDragActive, setIsDragActive] = useState(false);
  
  // 过滤表格
  const safeTables = Array.isArray(tables) ? tables : [];
  const safeSelectedTableIds = Array.isArray(selectedTableIds) ? selectedTableIds : [];
  const safeTemplateSelectedTableIds = Array.isArray(templateSelectedTableIds) ? templateSelectedTableIds : [];
  
  const filteredTables = safeTables.filter(table => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const tableName = table.name || '';
    const tableId = table.id || '';
    return (
      tableName.toLowerCase().includes(query) ||
      tableId.toLowerCase().includes(query)
    );
  });

  // 根据模板选择高亮显示表格
  const sortedTables = (() => {
    if (safeTemplateSelectedTableIds.length === 0) {
      return filteredTables;
    }

    const templateSelectedSet = new Set(safeTemplateSelectedTableIds);
    const selectedTables: any[] = [];
    const otherTables: any[] = [];

    filteredTables.forEach(table => {
      if (templateSelectedSet.has(table.id)) {
        selectedTables.push(table);
      } else {
        otherTables.push(table);
      }
    });

    return [...selectedTables, ...otherTables];
  })();

  // 处理表格选择
  const handleToggleTable = (tableId: string, isSelected: boolean) => {
    onToggleTable(tableId, isSelected);
    if (searchQuery && filteredTables.length === 1) {
      setSearchQuery('');
    }
    setTemplateSelectedTableIds([]);
  };

  // 应用模板
  const handleApplyTemplate = (template: HistoryTemplate) => {
    setTemplateSelectedTableIds(template.selectedTableIds || []);
    onApplyTemplate(template);
    setShowTemplatePreview(true);
    setTimeout(() => setShowTemplatePreview(false), 3000);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K 聚焦搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="搜索工作表名称或 ID..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // 切换到输入方式选择
      if (selectedTableIds.length > 0 && e.key === 'Enter' && activeTab === 'tables') {
        e.preventDefault();
        setActiveTab('input');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTableIds.length, activeTab]);

  // 文件处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e);
  };

  // 粘贴内容处理
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    setPastedContent(pasted);
  };

  // 是否可以进入下一步
  const canProceed = selectedTableIds.length > 0 && (
    (inputMode === 'file' && selectedFile) || 
    (inputMode === 'paste' && pastedContent.trim())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 历史模板区域 */}
      {historyTemplates.length > 0 && (
        <ResizableCard
          defaultWidth={500}
          defaultHeight={280}
          minWidth={300}
          minHeight={180}
          maxWidth={1400}
          maxHeight={800}
          storageKey="step2-history-templates-size"
          className="p-0"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <History className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">历史模板</h3>
                  <p className="text-sm text-muted-foreground">快速应用之前的配置模板</p>
                </div>
              </div>
              
              <Button
                onClick={onSaveTemplate}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                保存当前为模板
              </Button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {historyTemplates.map((template) => (
                  <ResizableCard
                    key={template.id}
                    defaultWidth={240}
                    defaultHeight={180}
                    minWidth={220}
                    minHeight={150}
                    maxWidth={360}
                    maxHeight={280}
                    storageKey={`template-card-${template.id}`}
                    className="p-4"
                  >
                    <div 
                      className="flex items-start justify-between gap-2 h-full cursor-pointer group"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <h4 className="font-medium text-foreground truncate">
                            {template.name}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 break-words">
                          {template.remark || '暂无描述'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Database className="h-3 w-3" />
                            {template.selectedTableIds?.length || 0} 个表
                          </span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <FileType className="h-3 w-3" />
                            {template.inputMode === 'file' ? '文件上传' : '内容粘贴'}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTemplate(template.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </ResizableCard>
                ))}
              </div>
            </div>
          </div>
        </ResizableCard>
      )}

      {/* 工作表选择区域 */}
      <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">选择工作表</h3>
              <p className="text-sm text-muted-foreground">选择要同步数据的目标工作表</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedTableIds.length > 0 && (
              <Button
                onClick={onClearSelection}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                清除选择
              </Button>
            )}
            {tables.length > 0 && (
              <Button
                onClick={onSelectAll}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                全选
              </Button>
            )}
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索工作表名称或 ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* 表格列表 */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {loadingTables ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">正在加载工作表...</p>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? '没有找到匹配的工作表' : '暂无可用工作表'}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery('')}
                      className="mt-2"
                    >
                      清除搜索条件
                    </Button>
                  )}
                </div>
              ) : (
                sortedTables.map((table) => {
                  const isSelected = safeSelectedTableIds.includes(table.id);
                  const isTemplateSelected = safeTemplateSelectedTableIds.includes(table.id);
                  const fieldCount = tableFields[table.id]?.length || 0;

                  return (
                    <div
                      key={table.id}
                      className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        isSelected
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : isTemplateSelected
                          ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                      onClick={() => handleToggleTable(table.id, !isSelected)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">
                              {table.name}
                            </h4>
                            {isTemplateSelected && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5 border-yellow-400 text-yellow-700 dark:text-yellow-400">
                                模板推荐
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              ID: {table.id.substring(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {fieldCount} 个字段
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {fieldCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {fieldCount} 字段
                          </Badge>
                        )}
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 ${
                          isSelected ? 'text-primary' : ''
                        }`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 底部统计信息 */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="text-sm text-muted-foreground">
                已选择 <span className="font-semibold text-foreground">{selectedTableIds.length}</span> 个工作表
                {selectedTableIds.length > 0 && (
                  <span className="ml-2">
                    ({selectedTableIds.length}/{tables.length})
                  </span>
                )}
              </div>
            </div>
          </Card>

      {/* 底部操作栏 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            提示: 使用 Ctrl/Cmd + K 快速搜索工作表
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {developerMode && (
            <div className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              开发者模式已启用
            </div>
          )}
          
          {showTemplatePreview && (
            <Badge variant="outline" className="animate-in slide-in-from-right-5">
              模板已应用
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}