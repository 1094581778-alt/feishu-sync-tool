import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { usePerformanceMonitor } from '@/utils/performance';
import { Upload, FileText, Save, Trash2, Settings, FileSpreadsheet, History, Loader2 } from 'lucide-react';
import type { FeishuTable, FeishuField, FieldMatchResult, HistoryTemplate } from '@/types';
import { formatFileSize } from '@/utils';

interface Step3Props {
  inputMode: 'file' | 'paste';
  setInputMode: (mode: 'file' | 'paste') => void;
  selectedFile: File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  pastedContent: string;
  setPastedContent: (content: string) => void;
  pasteAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  selectedTableIds: string[];
  tables: FeishuTable[];
  tableFieldMatches: Record<string, FieldMatchResult[]>;
  tableFields: Record<string, FeishuField[]>;
  tableToSheetMapping: Record<string, string>;
  excelSheetNames: string[];
  applyingTemplate: HistoryTemplate | null;
  showAllFields: Record<string, boolean>;
  setShowAllFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  loadingFields: boolean;
  fetchTableFields: (tableId: string) => void;
  analyzeFieldMatchingForTable: (file: File, tableId: string, sheetName?: string) => Promise<void>;
  setShowSaveTemplateModal: (show: boolean) => void;
  historyTemplates: HistoryTemplate[];
  handleDeleteTemplate: (templateId: string) => void;
  applySheetMappingFromTemplate: (template: HistoryTemplate) => void;
}

export function Step3({
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
  selectedTableIds,
  tables,
  tableFieldMatches,
  tableFields,
  tableToSheetMapping,
  excelSheetNames,
  applyingTemplate,
  showAllFields,
  setShowAllFields,
  loadingFields,
  fetchTableFields,
  analyzeFieldMatchingForTable,
  setShowSaveTemplateModal,
  historyTemplates,
  handleDeleteTemplate,
  applySheetMappingFromTemplate,
}: Step3Props) {
  // 性能监控
  usePerformanceMonitor('Step3');

  const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));

  return (
    <Card className="p-10">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            【步骤 3/4】选择输入方式
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            请选择您想要上传的内容方式：上传文件或粘贴内容
          </p>
        </div>

        {/* 选项卡切换 */}
        <div className="flex gap-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setInputMode('file')}
            className={`px-8 py-4 font-medium text-base transition-colors ${
              inputMode === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📄 上传文件
          </button>
          <button
            onClick={() => setInputMode('paste')}
            className={`px-8 py-4 font-medium text-base transition-colors ${
              inputMode === 'paste'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📋 粘贴内容
          </button>
        </div>

        {/* 智能字段映射提示 */}
        <div className="p-5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                智能字段映射
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* 保存子表按钮 */}
              {selectedTables.length > 0 && Object.keys(tableToSheetMapping).length > 0 && selectedFile && (
                <Button
                  onClick={() => {
                    setShowSaveTemplateModal(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                >
                  <Save className="h-3 w-3 mr-1" />
                  保存子表
                </Button>
              )}
              {/* 历史子表选项 */}
              {selectedTables.length > 0 && historyTemplates.length > 0 && selectedFile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                    >
                      <History className="h-3 w-3 mr-1" />
                      历史子表选项
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
                    <DropdownMenuLabel className="text-xs font-medium">
                      选择历史模版的子表配置
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {historyTemplates.map(template => {
                      const sheetMappingCount = template.tableToSheetMapping 
                        ? Object.keys(template.tableToSheetMapping).length 
                        : 0;
                      return (
                        <div key={template.id} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => applySheetMappingFromTemplate(template)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <FileSpreadsheet className="h-3 w-3 text-purple-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {template.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span>{sheetMappingCount} 个子表配置</span>
                              <span>•</span>
                              <span className="truncate max-w-[100px]">{template.remark || '无备注'}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`确定要删除模版 "${template.name}" 吗？`)) {
                                handleDeleteTemplate(template.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
              {selectedTables.length > 0 && (
                <Button
                  onClick={() => {
                    selectedTableIds.forEach(tableId => fetchTableFields(tableId));
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={loadingFields}
                >
                  {loadingFields ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      同步中...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      同步所有字段
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
            系统将根据字段名称自动匹配以下数据项：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📄</span>
              <span className="text-blue-900 dark:text-blue-100">文件名</span>
              <span className="text-blue-700 dark:text-blue-300">→ 自动匹配</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📏</span>
              <span className="text-blue-900 dark:text-blue-100">文件大小</span>
              <span className="text-blue-700 dark:text-blue-300">→ 自动匹配</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🏷️</span>
              <span className="text-blue-900 dark:text-blue-100">文件类型</span>
              <span className="text-blue-700 dark:text-blue-300">→ 自动匹配</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🔗</span>
              <span className="text-blue-900 dark:text-blue-100">文件链接</span>
              <span className="text-blue-700 dark:text-blue-300">→ 自动匹配</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🕐</span>
              <span className="text-blue-900 dark:text-blue-100">上传时间</span>
              <span className="text-blue-700 dark:text-blue-300">→ 自动匹配</span>
            </div>
          </div>
          
          {/* 已选工作表列表和字段匹配 */}
          {selectedTableIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <div className="mb-2">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  已选工作表（{selectedTableIds.length} 个）及字段匹配：
                </p>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {selectedTableIds.map(tableId => {
                  const table = tables.find(t => t.id === tableId);
                  const matches = tableFieldMatches[tableId] || [];
                  const matchedCount = matches.filter(r => r.matched).length;
                  const totalCount = matches.length;
                  const selectedSheet = tableToSheetMapping[tableId] || '';
                  const hasSheetSelected = !!selectedSheet;
                  
                  return (
                    <div 
                      key={tableId} 
                      className={`p-3 border rounded-lg ${hasSheetSelected 
                        ? 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800' 
                        : 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className={`h-4 w-4 ${hasSheetSelected ? 'text-blue-600' : 'text-red-600'}`} />
                          <div className="flex flex-col">
                            <p className={`text-sm font-medium ${hasSheetSelected ? 'text-gray-900 dark:text-white' : 'text-red-900 dark:text-red-100'}`}>
                              {table?.name || tableId}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {tableId}
                            </p>
                          </div>
                          {!hasSheetSelected && (
                            <span className="px-2 py-0.5 text-xs bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded-full">
                              未选择Sheet
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-green-600">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {matchedCount}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            {totalCount - matchedCount}
                          </span>
                        </div>
                      </div>
                      
                      {/* Excel Sheet选择下拉框 */}
                      {excelSheetNames.length > 0 && (
                        <div className="mb-2">
                          <select
                            value={selectedSheet}
                            onChange={async (e) => {
                              const sheetName = e.target.value;
                              const newMapping = { ...tableToSheetMapping, [tableId]: sheetName };
                              // 通过直接修改状态更新
                              (window as any).updateTableToSheetMapping?.(newMapping);
                              
                              // 重新分析字段匹配
                              if (selectedFile && sheetName) {
                                await analyzeFieldMatchingForTable(selectedFile, tableId, sheetName);
                              }
                            }}
                            className={`w-full px-2 py-1 text-xs border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 ${
                              hasSheetSelected
                                ? 'border-purple-300 dark:border-purple-700 focus:ring-purple-500'
                                : 'border-red-300 dark:border-red-700 focus:ring-red-500'
                            }`}
                          >
                            <option value="">选择Excel工作表（Sheet）...</option>
                            
                            {/* 历史模版选项 */}
                            {applyingTemplate && applyingTemplate.tableToSheetMapping && applyingTemplate.tableToSheetMapping[tableId] && (
                              <option value={applyingTemplate.tableToSheetMapping[tableId]} style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                                📋 历史模版: {applyingTemplate.tableToSheetMapping[tableId]}
                              </option>
                            )}
                            
                            {/* 分隔线 */}
                            {(applyingTemplate && applyingTemplate.tableToSheetMapping && applyingTemplate.tableToSheetMapping[tableId]) && (
                              <option disabled>──────────</option>
                            )}
                            
                            {/* 所有Sheet选项 */}
                            {excelSheetNames.map((name, idx) => (
                              <option key={name} value={name}>
                                Sheet {idx + 1}: {name}
                              </option>
                            ))}
                          </select>
                          
                          {/* 模版提示 */}
                          {applyingTemplate && applyingTemplate.tableToSheetMapping && applyingTemplate.tableToSheetMapping[tableId] && selectedSheet === applyingTemplate.tableToSheetMapping[tableId] && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              💾 已使用历史模版配置
                            </p>
                          )}
                        </div>
                      )}
                      
                      {matches.length > 0 && (
                        <>
                          {/* 显示控制按钮 */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {totalCount - matchedCount > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {totalCount - matchedCount} 个字段未匹配
                                </span>
                              ) : (
                                <span className="text-green-600 font-medium">
                                  ✓ 所有字段已匹配
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => setShowAllFields(prev => ({ ...prev, [tableId]: !prev[tableId] }))}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {showAllFields[tableId] ? '只显示未匹配' : '显示全部'}
                            </button>
                          </div>
                          
                          {/* 显示飞书实际字段列表（帮助调试） */}
                          {tableFields[tableId] && tableFields[tableId].length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  飞书表格字段列表（共 {tableFields[tableId].length} 个）：
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-1">
                                {tableFields[tableId].map(f => {
                                  const fieldName = f.name || f.field_name || f.id;
                                  const isMatched = matches.some(m => m.feishuField === fieldName || m.feishuField === f.id);
                                  return (
                                    <span
                                      key={f.id}
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        isMatched
                                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                                          : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                                      }`}
                                    >
                                      {fieldName}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* 字段匹配列表 */}
                          <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {(showAllFields[tableId] ? matches : matches.filter(r => !r.matched)).map((result, idx) => {
                              const originalIdx = matches.indexOf(result);
                              return (
                                <div
                                  key={originalIdx}
                                  className={`flex items-center justify-between p-2 rounded text-xs ${
                                    result.matched
                                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-l-4 border-green-500'
                                      : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-l-4 border-red-500'
                                  }`}
                                >
                                  <div className="flex-1">
                                    <span className="font-medium">{result.excelField}</span>
                                    {result.feishuField && result.similarity !== undefined && (
                                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                                        → {result.feishuField}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {result.similarity !== undefined && (
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {result.matched ? `${(result.similarity * 100).toFixed(0)}%` : `${(result.similarity * 100).toFixed(0)}%`}
                                      </span>
                                    )}
                                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                                      result.matched
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-500 text-white'
                                    }`}>
                                      {result.matched ? '✓ 已匹配' : '✗ 未匹配'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {!(showAllFields[tableId] ? matches : matches.filter(r => !r.matched)).length && (
                              <p className="text-xs text-green-600 dark:text-green-400 text-center py-2">
                                {showAllFields[tableId] ? '没有字段数据' : '所有字段均已匹配！'}
                              </p>
                            )}
                          </div>
                          
                          {/* 日期格式提示 */}
                          {selectedFile && tableFields[tableId] && tableFields[tableId].some(field => {
                            const fieldName = field.field_name || field.name || '';
                            const lowerName = fieldName.toLowerCase();
                            return lowerName.includes('日期') || lowerName.includes('date') || lowerName.includes('时间') || lowerName.includes('time');
                          }) && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                              <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                                📅 日期字段格式支持：
                              </p>
                              <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                                <p>• 标准格式：2026-02-03、2026/02/03</p>
                                <p>• 紧凑格式：20260203（自动转换为 2026-02-03）</p>
                                <p>• 时间格式：202602031230（自动转换为 2026-02-03 12:30）</p>
                                <p>• 时间戳：1704268800 或 1704268800000</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {matches.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedFile ? '等待选择Sheet后分析...' : '等待选择文件后分析...'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 上传文件区域 */}
        {inputMode === 'file' && (
          <div>
            <Label className="text-sm font-medium mb-2 block">
              📄 上传文件区域
            </Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                selectedFile
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
              }`}
            >
              {!selectedFile ? (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    拖拽文件到此处或点击选择文件
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    支持所有文件类型
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    选择文件
                  </Label>
                </>
              ) : (
                <div className="space-y-4">
                  <FileText className="mx-auto h-12 w-12 text-blue-600" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    已选择文件
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    大小: {formatFileSize(selectedFile.size)}
                  </p>
                  <Button
                    onClick={() => {
                      (window as any).setSelectedFileWrapper?.(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    重新选择
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 粘贴内容区域 */}
        {inputMode === 'paste' && (
          <div>
            <Label className="text-sm font-medium mb-2 block">
              📋 粘贴内容区域
            </Label>
            <textarea
              ref={pasteAreaRef}
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="请在此粘贴文本内容..."
              className="w-full min-h-[300px] px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                当前字数: {pastedContent.length}
              </p>
              <Button
                onClick={() => setPastedContent('')}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                清除内容
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
