import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePerformanceMonitor } from '@/utils/performance';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, XCircle } from 'lucide-react';
import type { FeishuTable, UploadResult, Step } from '@/types';
import { formatFileSize } from '@/utils';

interface Step4Props {
  inputMode: 'file' | 'paste';
  selectedFile: File | null;
  pastedContent: string;
  selectedTableIds: string[];
  tables: FeishuTable[];
  uploadResults: Record<string, UploadResult>;
  uploading: boolean;
  uploadResult: UploadResult | null;
  error: string;
  handleUpload: () => void;
  setUploadResults: (results: Record<string, UploadResult>) => void;
  setSelectedFile: (file: File | null) => void;
  setPastedContent: (content: string) => void;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
}

export function Step4({
  inputMode,
  selectedFile,
  pastedContent,
  selectedTableIds,
  tables,
  uploadResults,
  uploading,
  uploadResult,
  error,
  handleUpload,
  setUploadResults,
  setSelectedFile,
  setPastedContent,
  setCurrentStep,
}: Step4Props) {
  // 性能监控
  usePerformanceMonitor('Step4');

  return (
    <Card className="p-10">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            【步骤 4/4】执行上传
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            确认您的输入内容后，点击"开始上传"按钮
          </p>
        </div>

        {/* 显示选择的输入内容 */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
              {inputMode === 'file' ? '📄 文件模式' : '📋 粘贴模式'}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              已选工作表 ({selectedTableIds.length} 个)
            </span>
          </div>

          {/* 显示已选工作表列表 */}
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedTableIds.map(tableId => {
              const table = tables.find(t => t.id === tableId);
              return (
                <span key={tableId} className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded-full border border-gray-200 dark:border-gray-700">
                  📊 {table?.name || tableId}
                </span>
              );
            })}
          </div>

          {inputMode === 'file' && selectedFile && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)} · {selectedFile.type || '未知类型'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {inputMode === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">
                    粘贴的内容预览
                  </p>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 max-h-[200px] overflow-y-auto">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                      {pastedContent.slice(0, 500)}
                      {pastedContent.length > 500 && '...'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    总字数: {pastedContent.length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        {!uploadResult && Object.keys(uploadResults).length === 0 && (
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  开始上传
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={uploading}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回上一步
            </Button>
          </div>
        )}

        {/* 错误提示 */}
        {error && !uploadResult && Object.keys(uploadResults).length === 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* 上传成功 */}
        {Object.keys(uploadResults).length > 0 && (
          <div className="space-y-4">
            <div className="p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                  上传完成！
                </h3>
              </div>

              {selectedFile && (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">文件名</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">文件大小</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">上传时间</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date().toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">同步工作表数</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedTableIds.length} 个
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 每个工作表的上传结果 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                各工作表同步结果：
              </h4>
              {selectedTableIds.map(tableId => {
                const table = tables.find(t => t.id === tableId);
                const result = uploadResults[tableId];
                const isSuccess = result?.syncResult;

                return (
                  <div
                    key={tableId}
                    className={`p-4 rounded-lg border ${
                      isSuccess
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <p className="font-medium text-gray-900 dark:text-white">
                          {table?.name || tableId}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isSuccess
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {isSuccess ? '✅ 成功' : '❌ 失败'}
                      </span>
                    </div>
                    {isSuccess && result?.syncResult && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        <p>✓ {result.syncResult.msg}</p>
                        {result.syncResult.apiCallCount !== undefined && (
                          <p>📊 飞书API调用次数: {result.syncResult.apiCallCount}</p>
                        )}
                        {result.syncResult.syncCount !== undefined && (
                          <p>📈 实际同步行数: {result.syncResult.syncCount}</p>
                        )}
                      </div>
                    )}
                    {!isSuccess && result?.syncError && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                        <p>{result.syncError}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 总体统计 */}
            {Object.keys(uploadResults).length > 0 && (() => {
              const totalApiCalls = Object.values(uploadResults)
                .filter(r => r.syncResult?.apiCallCount !== undefined)
                .reduce((sum, r) => sum + (r.syncResult?.apiCallCount || 0), 0);
              const totalSyncCount = Object.values(uploadResults)
                .filter(r => r.syncResult?.syncCount !== undefined)
                .reduce((sum, r) => sum + (r.syncResult?.syncCount || 0), 0);
              
              if (totalApiCalls > 0 || totalSyncCount > 0) {
                return (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      📊 总体统计
                    </h4>
                    {totalApiCalls > 0 && (
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        飞书API调用总次数: {totalApiCalls}
                      </p>
                    )}
                    {totalSyncCount > 0 && (
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        实际同步总行数: {totalSyncCount}
                      </p>
                    )}
                    {/* 显示字段信息（帮助调试） */}
                    {Object.values(uploadResults).some(r => r.syncResult?.fieldNames && r.syncResult.fieldNames.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                          📋 飞书表格实际字段列表：
                        </p>
                        {Object.entries(uploadResults).map(([tableId, result]) => {
                          if (result.syncResult?.fieldNames && result.syncResult.fieldNames.length > 0) {
                            const table = tables.find(t => t.id === tableId);
                            return (
                              <div key={tableId} className="mt-1">
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  {table?.name || tableId}: {result.syncResult.fieldNames.join(', ')}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setUploadResults({});
                  setCurrentStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                上传更多内容
              </Button>
              <Button
                onClick={() => {
                  setUploadResults({});
                  setSelectedFile(null);
                  setPastedContent('');
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                完成并返回首页
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
