import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { FileText, CheckCircle2, Loader2, FileSpreadsheet, Search, CheckSquare, Square, History, Trash2, Save, ChevronRight, ArrowRight, Sparkles, LayoutGrid, Database, Layers, Filter, X, Zap } from 'lucide-react';
import type { HistoryTemplate } from '@/types';

interface Step2Props {
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
}

export function Step2({
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
}: Step2Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateSelectedTableIds, setTemplateSelectedTableIds] = useState<string[]>([]);

  const filteredTables = tables.filter(table => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      table.name.toLowerCase().includes(query) ||
      table.id.toLowerCase().includes(query)
    );
  });

  const handleToggleTable = (tableId: string, isSelected: boolean) => {
    onToggleTable(tableId, isSelected);
    if (searchQuery && filteredTables.length === 1) {
      setSearchQuery('');
    }
    setTemplateSelectedTableIds([]);
  };

  const handleApplyTemplate = (template: HistoryTemplate) => {
    setTemplateSelectedTableIds(template.selectedTableIds || []);
    onApplyTemplate(template);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="搜索工作表名称或 ID..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortedTables = (() => {
    if (templateSelectedTableIds.length === 0) {
      return filteredTables;
    }

    const templateSelectedSet = new Set(templateSelectedTableIds);
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

  return (
    <Card className="p-8 sm:p-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            步骤 2/4：选择工作表
          </h2>
          <p className="text-base text-muted-foreground">
            请选择要上传文件的工作表（支持多选）
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">已选择工作表</p>
                <p className="text-2xl font-bold text-foreground">{selectedTableIds.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">已选择字段</p>
                <p className="text-2xl font-bold text-foreground">{selectedTableIds.reduce((sum, tableId) => sum + (tableFields[tableId]?.length || 0), 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索工作表名称或 ID... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>搜索结果：{sortedTables.length} / {tables.length} 个工作表</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={onSelectAll}
              variant="outline"
              disabled={selectedTableIds.length === tables.length}
              size="sm"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              全选
            </Button>
            <Button
              onClick={onClearSelection}
              variant="outline"
              disabled={selectedTableIds.length === 0}
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              取消选择
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={historyTemplates.length === 0}
                >
                  <History className="h-4 w-4 mr-2" />
                  历史模版
                  {historyTemplates.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                      {historyTemplates.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel className="text-sm font-medium">选择历史模版</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {historyTemplates.map(template => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {template.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{template.selectedTableIds?.length || 0} 个工作表</span>
                        {template.remark && (
                          <>
                            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                            <span className="truncate max-w-[120px]">{template.remark}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(template);
                        onNextStep();
                      }}
                    >
                      应用
                    </Button>
                  </DropdownMenuItem>
                ))}
                {historyTemplates.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm('确定要删除所有历史模版吗？')) {
                      historyTemplates.forEach(template => {
                        onDeleteTemplate(template.id);
                      });
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清空历史模版
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedTableIds.length > 0 && (
              <Button
                onClick={onSaveTemplate}
                variant="outline"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                保存为模版
              </Button>
            )}
          </div>
        </div>

        {/* 工作表列表 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {loadingTables ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">正在加载工作表列表...</p>
              <p className="text-sm text-muted-foreground">请稍候片刻</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">暂无工作表数据</p>
              <p className="text-sm text-muted-foreground">请点击"上一步"重新解析链接</p>
            </div>
          ) : sortedTables.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">未找到匹配的工作表</p>
              <p className="text-sm text-muted-foreground">请尝试其他搜索关键词</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        选择
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        工作表名称
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        ID
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        字段数
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTables.map((table) => {
                    const isSelected = selectedTableIds.includes(table.id);
                    const fieldCount = tableFields[table.id]?.length || 0;
                    return (
                      <tr
                        key={table.id}
                        className={`border-t border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                        onClick={() => handleToggleTable(table.id, !isSelected)}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleTable(table.id, !isSelected);
                            }}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-700 text-muted-foreground'}`}>
                              <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {table.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded text-xs font-mono">
                            {table.id}
                          </code>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`px-3 py-1 rounded text-xs font-medium ${fieldCount > 0 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'}`}>
                            {fieldCount > 0 ? `${fieldCount} 个字段` : '未加载'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 已选择提示 */}
        {selectedTableIds.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    已选择 {selectedTableIds.length} 个工作表
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    {selectedTableIds.map(id => tables.find(t => t.id === id)?.name).join('、')}
                  </p>
                </div>
              </div>
              <Button
                onClick={onNextStep}
                size="sm"
              >
                下一步
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
