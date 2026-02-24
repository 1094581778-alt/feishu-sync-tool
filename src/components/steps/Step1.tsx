import { Card } from '@/components/ui/card';
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
  Save,
  Loader2,
  AlertCircle,
  X,
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
  setShowSheetMappingDropdown,
  setShowTableSelectorDropdown,
  setShowSheetSelectorDropdown,
  setExpandedFieldDetails,
  setShowSaveSuccess,
  setDebugInfo,
  onRefreshTables,
}: Step1Props) {
  // 性能监控
  usePerformanceMonitor('Step1');

  // 处理删除历史记录
  const handleDeleteHistory = (index: number) => {
    const newHistory = urlHistory.filter((_, i) => i !== index);
    localStorage.setItem('feishuUrlHistory', JSON.stringify(newHistory));
    setUrlHistory(newHistory);
    console.log('🗑️ [历史记录] 已删除历史记录:', urlHistory[index]);
  };

  // 渲染历史记录列表
  const renderHistoryList = () => {
    if (urlHistory.length === 0) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          <p className="text-xs">暂无历史记录</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {urlHistory.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelectHistoryUrl(url)}
              className="flex-1 justify-start text-left text-xs h-7 px-2 truncate"
              title={url}
            >
              {url}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteHistory(idx)}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              title="删除"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  // 渲染调试信息
  const renderDebugInfo = () => {
    if (!debugInfo || Object.keys(debugInfo).length === 0) return null;

    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            🔬 详细调试信息
          </span>
          <button
            onClick={() => setDebugInfo({})}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            清除
          </button>
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1 font-mono">
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
            <p className={debugInfo.status === 'error' ? 'text-red-600 font-bold' : ''}>
              状态: {debugInfo.status}
            </p>
          )}
          {debugInfo.error && (
            <p className="text-red-600 font-bold">错误: {debugInfo.error}</p>
          )}
          {debugInfo.responseStatus && (
            <p>响应状态: {debugInfo.responseStatus}</p>
          )}
          {debugInfo.tablesCount !== undefined && (
            <p>工作表数量: {debugInfo.tablesCount}</p>
          )}
          {debugInfo.autoSelected && (
            <p className="text-blue-600">自动选中: {debugInfo.autoSelected}</p>
          )}
          {debugInfo.responseData && (
            <details>
              <summary className="cursor-pointer hover:text-blue-600">
                查看完整响应数据
              </summary>
              <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo.responseData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  // 渲染配置完成提示
  const renderConfigComplete = () => {
    if (((inputMode === 'file' && selectedFile) ||
      (inputMode === 'paste' && pastedContent.trim())) &&
      selectedTableIds.length > 0) {
      return (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ✅ 配置已完成，可以开始上传
              </p>
            </div>
            <Button
              onClick={() => setShowSaveTemplateModal(true)}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              保存为模版
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-10">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            【步骤 1/4】输入飞书多维表格链接
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            请粘贴你的飞书多维表格链接，系统将自动解析并获取工作表信息
          </p>
        </div>

        <div>
          <Label htmlFor="feishu-url" className="text-base font-medium mb-3 block">
            🔍 请粘贴飞书多维表格链接：
          </Label>
          <Input
            id="feishu-url"
            type="text"
            value={feishuUrl}
            onChange={(e) => onFeishuUrlChange(e.target.value)}
            placeholder="https://feishu.cn/base/[app_token]?table=[table_id]"
            className="flex-1 text-base py-3"
          />
        </div>

        {/* 历史记录和模版列表 */}
        {(urlHistory.length > 0 || historyTemplates.length > 0) && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-[960px] overflow-y-auto">
            {/* 标签页切换 */}
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`text-xs font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-600 border-transparent hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                📚 历史记录 ({urlHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className={`text-xs font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === 'template'
                    ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-600 border-transparent hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                📋 历史模版 ({historyTemplates.length})
              </button>
            </div>

            {/* 历史记录内容 */}
            {activeTab === 'history' && renderHistoryList()}

            {/* 历史模版内容 */}
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
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          ℹ️ 链接格式示例：https://feishu.cn/base/CqKfbURrcaldFBslTFlcWPzrnXb
        </p>

        <div className="flex gap-3">
          <Button onClick={onParseUrl} disabled={loadingTables || !feishuUrl} className="flex-1">
            {loadingTables ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                解析链接
              </>
            )}
          </Button>
          <Button onClick={onClear} variant="outline" disabled={loadingTables}>
            <Trash2 className="h-4 w-4 mr-2" />
            清除内容
          </Button>
        </div>

        {parsedConfig && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✅ 链接解析成功
              </p>
            </div>
            <p className="text-xs text-green-800 dark:text-green-200 mb-1">
              Spreadsheet Token: {parsedConfig.spreadsheetToken}
            </p>
            {parsedConfig.sheetId && (
              <p className="text-xs text-green-800 dark:text-green-200">
                Sheet ID: {parsedConfig.sheetId}
              </p>
            )}
            {tables.length > 0 && (
              <p className="text-xs text-green-800 dark:text-green-200 mt-2">
                📊 已检测到 {tables.length} 个工作表
              </p>
            )}
          </div>
        )}

        {renderDebugInfo()}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
            </div>
          </div>
        )}

        {renderConfigComplete()}
      </div>
    </Card>
  );
}
