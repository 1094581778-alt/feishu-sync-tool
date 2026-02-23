import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitor } from '@/utils/performance';
import { FileText, CheckCircle2, Save, Loader2, FileSpreadsheet } from 'lucide-react';

interface Step2Props {
  tables: any[];
  selectedTableIds: string[];
  tableFields: Record<string, any[]>;
  loadingTables: boolean;
  onToggleTable: (tableId: string, isSelected: boolean) => void;
  onSaveTemplate: () => void;
}

export function Step2({
  tables,
  selectedTableIds,
  tableFields,
  loadingTables,
  onToggleTable,
  onSaveTemplate,
}: Step2Props) {
  // 性能监控
  usePerformanceMonitor('Step2');

  return (
    <Card className="p-10">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            【步骤 2/4】工作表列表概览
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            请选择要上传文件的工作表（支持多选）
          </p>
        </div>

        <div className="p-5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-base font-medium text-blue-900 dark:text-blue-100 mb-2">
            📊 已检测到 {tables.length} 个工作表
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ 已选择 {selectedTableIds.length} 个工作表
          </p>
          {selectedTableIds.length > 0 && (
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
              已选：{selectedTableIds.map(id => tables.find(t => t.id === id)?.name).join(', ')}
            </p>
          )}
          {selectedTableIds.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Button onClick={onSaveTemplate} variant="outline" size="sm" className="text-base py-2 px-4">
                <Save className="h-5 w-5 mr-2" />
                保存为模版
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {loadingTables ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
              <p>正在加载工作表列表...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>暂无工作表数据</p>
              <p className="text-xs mt-1">请点击"上一步"重新解析链接</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">选择</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">工作表名称</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">字段数</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => {
                  const isSelected = selectedTableIds.includes(table.id);
                  const fieldCount = tableFields[table.id]?.length || 0;
                  return (
                    <tr
                      key={table.id}
                      className={`border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                      onClick={() => onToggleTable(table.id, !isSelected)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => e.stopPropagation()}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {table.name.includes('概览') && (
                          <span className="inline-flex items-center mr-2">
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                          </span>
                        )}
                        {table.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{table.id}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fieldCount > 0 ? `${fieldCount} 个字段` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selectedTableIds.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 inline mr-2" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100 inline">
              ✅ 已选择 {selectedTableIds.length} 个工作表
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
