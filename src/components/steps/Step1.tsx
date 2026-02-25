import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TemplateList } from '../TemplateList';
import { usePerformanceMonitor } from '@/utils/performance';
import {
  Settings,
  Trash2,
  CheckCircle2,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  ChevronRight,
  History,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  Clock,
  Eraser,
  Lightbulb
} from 'lucide-react';

interface DebugInfo {
  requestId?: string;
  timestamp?: number;
  spreadsheetToken?: string;
  tokenType?: string;
  tokenLength?: number;
  apiUrl?: string;
  status?: string;
  error?: string;
  responseStatus?: number;
  tablesCount?: number;
  autoSelected?: string;
  responseData?: any;
}

interface Step1Props {
  feishuUrl: string;
  feishuAppId: string;
  feishuAppSecret: string;
  urlHistory: string[];
  historyTemplates: any[];
  activeTab: 'history' | 'template';
  loadingTables: boolean;
  parsedConfig: { spreadsheetToken: string; sheetId?: string } | null;
  tables: any[];
  tableFields: Record<string, any[]>;
  error: string;
  debugInfo: DebugInfo;
  inputMode: 'file' | 'paste';
  selectedFile: File | null;
  pastedContent: string;
  selectedTableIds: string[];
  templateFiles: Record<string, File>;
  templateSheetNames: Record<string, string[]>;
  templateSyncStatus: Record<string, { success: boolean; message: string }>;
  showSheetMappingDropdown: string | null;
  showTableSelectorDropdown: string | null;
  showSheetSelectorDropdown: string | null;
  expandedFieldDetails: string | null;
  showSaveSuccess: string | null;
  batchUploadProgress?: string;
  developerMode: boolean;
  onFeishuUrlChange: (url: string) => void;
  onParseUrl: () => void;
  onClear: () => void;
  setActiveTab: (tab: 'history' | 'template') => void;
  onSelectHistoryUrl: (url: string) => void;
  setUrlHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setTemplateFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  setTemplateSheetNames: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setHistoryTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  setTemplateSyncStatus: React.Dispatch<React.SetStateAction<Record<string, { success: boolean; message: string }>>>;
  setTableFields: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  handleImportTemplates: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportTemplates: () => void;
  handleBatchUpload: () => void;
  handleDeleteTemplate: (id: string) => void;
  setTemplateToEdit: React.Dispatch<React.SetStateAction<any | null>>;
  setShowSaveTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFeishuConfig: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSheetMappingDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  setShowTableSelectorDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  setShowSheetSelectorDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  setExpandedFieldDetails: React.Dispatch<React.SetStateAction<string | null>>;
  setShowSaveSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setDebugInfo: React.Dispatch<React.SetStateAction<DebugInfo>>;
  onRefreshTables?: (spreadsheetToken: string) => Promise<void>;
}

export function Step1({
  feishuUrl,
  feishuAppId,
  feishuAppSecret,
  urlHistory,
  historyTemplates,
  activeTab,
  loadingTables,
  parsedConfig,
  tables,
  tableFields,
  error,
  debugInfo,
  inputMode,
  selectedFile,
  pastedContent,
  selectedTableIds,
  templateFiles,
  templateSheetNames,
  templateSyncStatus,
  showSheetMappingDropdown,
  showTableSelectorDropdown,
  showSheetSelectorDropdown,
  expandedFieldDetails,
  showSaveSuccess,
  batchUploadProgress,
  developerMode,
  onFeishuUrlChange,
  onParseUrl,
  onClear,
  setActiveTab,
  onSelectHistoryUrl,
  setUrlHistory,
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
  setShowFeishuConfig,
  setShowSheetMappingDropdown,
  setShowTableSelectorDropdown,
  setShowSheetSelectorDropdown,
  setExpandedFieldDetails,
  setShowSaveSuccess,
  setDebugInfo,
  onRefreshTables,
}: Step1Props) {
  usePerformanceMonitor('Step1');

  const handleDeleteHistory = (index: number) => {
    const newHistory = urlHistory.filter((_, i) => i !== index);
    localStorage.setItem('feishuUrlHistory', JSON.stringify(newHistory));
    setUrlHistory(newHistory);
  };

  const renderHistoryList = () => {
    if (urlHistory.length === 0) {
      return (
        <div className="text-center py-10">
          <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">暂无历史记录</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">您的访问记录将显示在这里</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <History className="h-4 w-4" />
            <span className="font-medium">最近 {urlHistory.length} 条记录</span>
          </div>
          <button
            onClick={() => {
              if (confirm('确定要清除所有历史记录吗？')) {
                localStorage.setItem('feishuUrlHistory', JSON.stringify([]));
                setUrlHistory([]);
              }
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
            title="清除所有历史记录"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>清除全部</span>
          </button>
        </div>
        
        <div className="max-h-56 overflow-y-auto space-y-2">
          {urlHistory.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectHistoryUrl(url)}
              className="w-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              title={url}
              onContextMenu={(e) => {
                e.preventDefault();
                if (confirm(`确定要删除这条历史记录吗？\n${url}`)) {
                  handleDeleteHistory(idx);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <Link2 className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-relaxed">{url}</p>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderDebugInfo = () => {
    if (!developerMode || !debugInfo || Object.keys(debugInfo).length === 0) return null;

    return (
      <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Settings className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">详细调试信息</span>
          </div>
          <button
            onClick={() => setDebugInfo({})}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            清除
          </button>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 font-mono">
          {debugInfo.requestId && <p>请求ID: {debugInfo.requestId}</p>}
          {debugInfo.timestamp && <p>时间戳: {debugInfo.timestamp}</p>}
          {debugInfo.spreadsheetToken && (
            <>
              <p>Spreadsheet Token: {debugInfo.spreadsheetToken}</p>
              <p>Token 类型: {debugInfo.tokenType}</p>
              <p>Token 长度: {debugInfo.tokenLength}</p>
            </>
          )}
          {debugInfo.apiUrl && (
            <p className="break-all">API URL: {debugInfo.apiUrl}</p>
          )}
          {debugInfo.status && (
            <p className={debugInfo.status === 'error' ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
              状态: {debugInfo.status}
            </p>
          )}
          {debugInfo.error && (
            <p className="text-red-600 dark:text-red-400 font-semibold">错误: {debugInfo.error}</p>
          )}
          {debugInfo.responseStatus && (
            <p>响应状态: {debugInfo.responseStatus}</p>
          )}
          {debugInfo.tablesCount !== undefined && (
            <p>工作表数量: {debugInfo.tablesCount}</p>
          )}
          {debugInfo.autoSelected && (
            <p className="text-blue-600 dark:text-blue-400 font-medium">自动选中: {debugInfo.autoSelected}</p>
          )}
          {debugInfo.responseData && (
            <details className="mt-2">
              <summary className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium py-1">
                查看完整响应数据
              </summary>
              <pre className="mt-2.5 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-auto max-h-44 text-xs">
                {JSON.stringify(debugInfo.responseData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  const renderConfigComplete = () => {
    if (((inputMode === 'file' && selectedFile) ||
      (inputMode === 'paste' && pastedContent.trim())) &&
      selectedTableIds.length > 0) {
      return (
        <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-2xl">
          <div className="flex items-start gap-3.5">
            <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/50 rounded-full mt-0.5">
              <CheckCircle className="h-5.5 w-5.5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-100 leading-relaxed">
                配置已完成
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 leading-relaxed">
                可以开始上传数据了
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-0">
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
              <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 pt-0.5">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50 leading-tight">
                步骤 1/4：输入飞书多维表格链接
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                请粘贴你的飞书多维表格链接，系统将自动解析并获取工作表信息
              </p>
            </div>
          </div>
        </div>

        {developerMode && (
          <details className="group rounded-2xl overflow-hidden">
            <summary className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${feishuAppId && feishuAppSecret ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl ${feishuAppId && feishuAppSecret ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'}`}>
                  {feishuAppId && feishuAppSecret ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${feishuAppId && feishuAppSecret ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}`}>
                    {feishuAppId && feishuAppSecret ? '飞书API配置已生效' : '飞书API未配置'}
                  </h3>
                </div>
              </div>
              <ChevronRight className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400 transition-transform group-open:rotate-90" />
            </summary>
            <div className={`p-5 ${feishuAppId && feishuAppSecret ? 'bg-green-50/60 dark:bg-green-900/10' : 'bg-amber-50/60 dark:bg-amber-900/10'}`}>
              {feishuAppId && feishuAppSecret ? (
                <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                  已检测到飞书API配置，系统将使用你的配置进行数据同步
                </p>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    未检测到飞书API配置，部分功能可能受限。请点击下方按钮配置飞书API。
                  </p>
                  <Button
                    onClick={() => setShowFeishuConfig(true)}
                    variant="outline"
                    size="sm"
                    className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    配置飞书API
                  </Button>
                </div>
              )}
              
              <div className="pt-5 mt-5">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      飞书API权限要求
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-3.5 text-xs text-gray-600 dark:text-gray-300 space-y-2.5">
                    <p className="font-semibold">必要权限：</p>
                    <ul className="list-disc list-inside space-y-1.5">
                      <li>docs:document:readonly - 文档只读权限</li>
                      <li>sheet:sheet:readonly - 表格只读权限</li>
                      <li>sheet:sheet:write - 表格写入权限</li>
                      <li>sheet:record:readonly - 记录只读权限</li>
                      <li>sheet:record:write - 记录写入权限</li>
                    </ul>
                  </div>
                </details>
              </div>
            </div>
          </details>
        )}

        <div className="space-y-3.5">
          <Label htmlFor="feishu-url" className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            飞书多维表格链接
          </Label>
          <Input
            id="feishu-url"
            type="text"
            value={feishuUrl}
            onChange={(e) => onFeishuUrlChange(e.target.value)}
            placeholder="https://feishu.cn/base/[app_token]?table=[table_id]"
            className="w-full h-12 bg-gray-50 dark:bg-gray-800/50 border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2 leading-relaxed">
            <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-500 dark:text-amber-400" />
            <span>示例：https://feishu.cn/base/CqKfbURrcaldFBslTFlcWPzrnXb</span>
          </p>
        </div>

        {(urlHistory.length > 0 || historyTemplates.length > 0) && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl overflow-hidden">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-5 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 relative ${
                  activeTab === 'history'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <History className="h-4.5 w-4.5" />
                <span>历史记录</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                  {urlHistory.length}
                </span>
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className={`flex-1 px-5 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 relative ${
                  activeTab === 'template'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <FileSpreadsheet className="h-4.5 w-4.5" />
                <span>历史模板</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                  {historyTemplates.length}
                </span>
                {activeTab === 'template' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            </div>

            <div className="p-5 bg-gray-50 dark:bg-gray-900/50">
              {activeTab === 'history' && renderHistoryList()}

              {activeTab === 'template' && (
                <TemplateList
                  historyTemplates={historyTemplates}
                  templateFiles={templateFiles}
                  templateSheetNames={templateSheetNames}
                  templateSyncStatus={templateSyncStatus}
                  tables={tables}
                  tableFields={tableFields}
                  feishuAppId={feishuAppId}
                  feishuAppSecret={feishuAppSecret}
                  setTemplateFiles={setTemplateFiles}
                  setTemplateSheetNames={setTemplateSheetNames}
                  setHistoryTemplates={setHistoryTemplates}
                  setTemplateSyncStatus={setTemplateSyncStatus}
                  setTableFields={setTableFields}
                  handleImportTemplates={handleImportTemplates}
                  handleExportTemplates={handleExportTemplates}
                  handleBatchUpload={handleBatchUpload}
                  handleDeleteTemplate={handleDeleteTemplate}
                  setTemplateToEdit={setTemplateToEdit}
                  setShowSaveTemplateModal={setShowSaveTemplateModal}
                  showSheetMappingDropdown={showSheetMappingDropdown}
                  setShowSheetMappingDropdown={setShowSheetMappingDropdown}
                  showTableSelectorDropdown={showTableSelectorDropdown}
                  setShowTableSelectorDropdown={setShowTableSelectorDropdown}
                  showSheetSelectorDropdown={showSheetSelectorDropdown}
                  setShowSheetSelectorDropdown={setShowSheetSelectorDropdown}
                  expandedFieldDetails={expandedFieldDetails}
                  setExpandedFieldDetails={setExpandedFieldDetails}
                  showSaveSuccess={showSaveSuccess}
                  setShowSaveSuccess={setShowSaveSuccess}
                  batchUploadProgress={batchUploadProgress}
                  onRefreshTables={onRefreshTables}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3.5">
          <Button 
            onClick={onParseUrl} 
            disabled={loadingTables || !feishuUrl} 
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          >
            {loadingTables ? (
              <>
                <Loader2 className="h-4.5 w-4.5 mr-2.5 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4.5 w-4.5 mr-2.5" />
                解析链接
              </>
            )}
          </Button>
          <Button 
            onClick={onClear} 
            variant="outline" 
            disabled={loadingTables} 
            className="flex-1 sm:flex-none h-12 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Trash2 className="h-4.5 w-4.5 mr-2.5" />
            清除内容
          </Button>
        </div>

        {parsedConfig && (
          <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-2xl">
            <div className="flex items-start gap-3.5">
              <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/50 rounded-full mt-0.5">
                <CheckCircle2 className="h-5.5 w-5.5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100 leading-relaxed">
                  链接解析成功
                </p>
                {developerMode && (
                  <>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1.5 leading-relaxed">
                      Spreadsheet Token: {parsedConfig.spreadsheetToken}
                    </p>
                    {parsedConfig.sheetId && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 leading-relaxed">
                        Sheet ID: {parsedConfig.sheetId}
                      </p>
                    )}
                  </>
                )}
                {tables.length > 0 && (
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2.5 flex items-center gap-2 leading-relaxed">
                    <FileSpreadsheet className="h-4 w-4" />
                    已检测到 {tables.length} 个工作表
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {renderDebugInfo()}

        {error && (
          <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <div className="flex items-start gap-3.5">
              <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/50 rounded-full mt-0.5">
                <AlertCircle className="h-5.5 w-5.5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 leading-relaxed">操作遇到问题</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1.5 leading-relaxed">{error}</p>
                
                {error.includes('链接') || error.includes('URL') ? (
                  <div className="mt-4 space-y-2.5">
                    <p className="text-xs text-red-700 dark:text-red-300 font-semibold">修复建议：</p>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1.5 list-disc pl-4">
                      <li>请检查飞书多维表格链接是否正确</li>
                      <li>确保链接格式为：https://example.feishu.cn/base/&#123;baseId&#125;</li>
                      <li>确认您有访问该表格的权限</li>
                    </ul>
                    <Button
                      onClick={onClear}
                      variant="outline"
                      size="sm"
                      className="mt-2.5 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      清除错误并重试
                    </Button>
                  </div>
                ) : error.includes('API') || error.includes('配置') ? (
                  <div className="mt-4 space-y-2.5">
                    <p className="text-xs text-red-700 dark:text-red-300 font-semibold">修复建议：</p>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1.5 list-disc pl-4">
                      <li>请检查飞书API配置是否正确</li>
                      <li>确认App ID和App Secret有访问权限</li>
                      <li>尝试重新配置飞书API凭证</li>
                    </ul>
                    <Button
                      onClick={() => setShowFeishuConfig(true)}
                      variant="outline"
                      size="sm"
                      className="mt-2.5 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      检查飞书配置
                    </Button>
                  </div>
                ) : error.includes('工作表') || error.includes('表') ? (
                  <div className="mt-4 space-y-2.5">
                    <p className="text-xs text-red-700 dark:text-red-300 font-semibold">修复建议：</p>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1.5 list-disc pl-4">
                      <li>请确认表格中有可访问的工作表</li>
                      <li>检查网络连接是否正常</li>
                      <li>尝试刷新工作表列表</li>
                    </ul>
                    {parsedConfig?.spreadsheetToken && (
                      <Button
                        onClick={() => onRefreshTables && onRefreshTables(parsedConfig.spreadsheetToken)}
                        variant="outline"
                        size="sm"
                        className="mt-2.5 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        刷新工作表
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    <p className="text-xs text-red-700 dark:text-red-300 font-semibold">通用修复建议：</p>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1.5 list-disc pl-4">
                      <li>检查网络连接是否正常</li>
                      <li>刷新页面后重试</li>
                      <li>确认输入内容格式正确</li>
                    </ul>
                    <Button
                      onClick={onClear}
                      variant="outline"
                      size="sm"
                      className="mt-2.5 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      清除错误
                    </Button>
                  </div>
                )}
              </div>
              <button
                onClick={onClear}
                className="flex-shrink-0 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="关闭错误提示"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}

        {renderConfigComplete()}
      </div>
    </div>
  );
}
