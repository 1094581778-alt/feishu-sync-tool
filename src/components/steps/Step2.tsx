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
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-10 shadow-2xl animate-in slide-in-from-top duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full blur-3xl animate-spin-slow"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/30 rounded-2xl backdrop-blur-md shadow-xl animate-bounce-slow">
              <LayoutGrid className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  步骤 2/4
                </h2>
                <div className="px-3 py-1 bg-white/30 rounded-full backdrop-blur-md">
                  <span className="text-xs font-bold text-white">进行中</span>
                </div>
              </div>
              <p className="text-base font-medium text-white/90">工作表列表概览</p>
            </div>
          </div>
          <p className="text-lg text-white/95 leading-relaxed font-medium">
            请选择要上传文件的工作表（支持多选）
          </p>
          <div className="mt-6 flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-white rounded-full animate-progress"></div>
            </div>
            <span className="text-sm font-bold text-white">50%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden p-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-500 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-5">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl group-hover:rotate-12 transition-transform duration-500">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white/90 mb-2 uppercase tracking-wider">
                  工作表总数
                </p>
                <p className="text-5xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                  {tables.length}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-white/80">实时更新</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-8 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 border-0 shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-500 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-5">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl group-hover:rotate-12 transition-transform duration-500">
                <CheckSquare className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white/90 mb-2 uppercase tracking-wider">
                  已选择
                </p>
                <p className="text-5xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                  {selectedTableIds.length}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-white/80">
                    {selectedTableIds.length > 0 ? '准备就绪' : '等待选择'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-8 bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 border-0 shadow-2xl hover:shadow-violet-500/50 hover:scale-105 transition-all duration-500 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-5">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl group-hover:rotate-12 transition-transform duration-500">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white/90 mb-2 uppercase tracking-wider">
                  字段总数
                </p>
                <p className="text-5xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                  {Object.values(tableFields).reduce((sum, fields) => sum + fields.length, 0)}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-white/80">数据加载</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8 shadow-2xl border-2 border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-8">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="搜索工作表名称或 ID... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative pl-14 h-14 text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl transition-all duration-300 bg-white dark:bg-gray-800 shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-3 flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl border border-blue-200 dark:border-blue-800">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  搜索结果：<span className="text-2xl font-black text-blue-600 dark:text-blue-400">{sortedTables.length}</span> / {tables.length} 个工作表
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={onSelectAll}
              variant="outline"
              size="lg"
              disabled={selectedTableIds.length === tables.length}
              className="h-14 px-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 font-bold text-lg rounded-2xl border-0"
            >
              <CheckSquare className="h-6 w-6 mr-3" />
              全选
            </Button>
            <Button
              onClick={onClearSelection}
              variant="outline"
              size="lg"
              disabled={selectedTableIds.length === 0}
              className="h-14 px-8 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 hover:shadow-xl hover:shadow-gray-500/30 hover:scale-105 transition-all duration-300 font-bold text-lg rounded-2xl border-0"
            >
              <Square className="h-6 w-6 mr-3" />
              取消选择
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="lg"
                  disabled={historyTemplates.length === 0}
                  className="h-14 px-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 font-bold text-lg rounded-2xl border-0"
                >
                  <History className="h-6 w-6 mr-3" />
                  历史模版
                  {historyTemplates.length > 0 && (
                    <span className="ml-3 px-3 py-1 bg-white/30 rounded-full backdrop-blur-sm text-sm font-bold">
                      {historyTemplates.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto rounded-2xl border-2 shadow-2xl">
                <DropdownMenuLabel className="text-base font-bold px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-2xl">
                  选择历史模版
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {historyTemplates.map(template => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950 transition-all duration-300 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                          <FileSpreadsheet className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {template.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg">
                          <Database className="h-3.5 w-3.5" />
                          {template.selectedTableIds?.length || 0} 个工作表
                        </span>
                        {template.remark && (
                          <>
                            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full"></span>
                            <span className="truncate max-w-[150px]">{template.remark}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="default"
                        className="h-10 px-4 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyTemplate(template);
                          onNextStep();
                        }}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        应用
                      </Button>
                      <Button
                        variant="ghost"
                        size="default"
                        className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all duration-200 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除模版 "${template.name}" 吗？`)) {
                            onDeleteTemplate(template.id);
                          }
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-300 font-semibold"
                >
                  <Trash2 className="h-5 w-5 mr-3" />
                  <span className="text-base">清空历史模版</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedTableIds.length > 0 && (
              <Button
                onClick={onSaveTemplate}
                variant="outline"
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300 font-bold text-lg rounded-2xl border-0"
              >
                <Save className="h-6 w-6 mr-3" />
                保存为模版
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-hidden border-2 border-gray-300 dark:border-gray-700 rounded-3xl shadow-xl">
          {loadingTables ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl mb-6 animate-pulse">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">正在加载工作表列表...</p>
              <p className="text-base text-gray-500 dark:text-gray-400">请稍候片刻</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl shadow-2xl mb-6">
                <FileText className="h-12 w-12 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">暂无工作表数据</p>
              <p className="text-base text-gray-500 dark:text-gray-400">请点击"上一步"重新解析链接</p>
            </div>
          ) : sortedTables.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl shadow-2xl mb-6">
                <Search className="h-12 w-12 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">未找到匹配的工作表</p>
              <p className="text-base text-gray-500 dark:text-gray-400">请尝试其他搜索关键词</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <tr>
                    <th className="px-8 py-5 text-left font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        选择
                      </div>
                    </th>
                    <th className="px-8 py-5 text-left font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        工作表名称
                      </div>
                    </th>
                    <th className="px-8 py-5 text-left font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        ID
                      </div>
                    </th>
                    <th className="px-8 py-5 text-left font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        字段数
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTables.map((table, index) => {
                    const isSelected = selectedTableIds.includes(table.id);
                    const fieldCount = tableFields[table.id]?.length || 0;
                    return (
                      <tr
                        key={table.id}
                        className={`border-t-2 border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950 ${isSelected ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900' : ''}`}
                        onClick={() => handleToggleTable(table.id, !isSelected)}
                      >
                        <td className="px-8 py-5">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleTable(table.id, !isSelected);
                              }}
                              className="w-7 h-7 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-500/50 cursor-pointer transition-all duration-300"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 w-7 h-7 bg-blue-600 rounded-xl animate-pulse opacity-30"></div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isSelected ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl shadow-blue-500/30' : 'bg-gray-200 dark:bg-gray-700'} transition-all duration-300`}>
                              <FileSpreadsheet className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                            </div>
                            <span className={`font-bold text-lg ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                              {table.name}
                            </span>
                            {isSelected && (
                              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <code className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-mono font-semibold">
                            {table.id}
                          </code>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-xl text-base font-bold ${fieldCount > 0 ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                              {fieldCount > 0 ? `${fieldCount} 个字段` : '未加载'}
                            </div>
                            {fieldCount > 0 && (
                              <div className="flex gap-1.5">
                                {[...Array(Math.min(fieldCount, 5))].map((_, i) => (
                                  <div key={i} className="w-2 h-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                                ))}
                                {fieldCount > 5 && <div className="w-2 h-2 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full"></div>}
                              </div>
                            )}
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

        {selectedTableIds.length > 0 && (
          <div className="p-8 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl shadow-2xl border-2 border-emerald-400 dark:border-emerald-700 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-xl">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white mb-2">
                  已选择 {selectedTableIds.length} 个工作表
                </p>
                <p className="text-base text-white/90 font-medium">
                  {selectedTableIds.map(id => tables.find(t => t.id === id)?.name).join('、')}
                </p>
              </div>
              <Button
                onClick={onNextStep}
                size="xl"
                className="h-16 px-10 bg-white text-emerald-600 hover:bg-gray-50 hover:shadow-2xl hover:scale-105 transition-all duration-300 font-black text-xl rounded-2xl"
              >
                下一步
                <ChevronRight className="h-7 w-7 ml-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
