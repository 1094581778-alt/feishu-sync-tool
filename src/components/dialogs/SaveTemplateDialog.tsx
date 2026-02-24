import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, FileSpreadsheet } from 'lucide-react';

interface FeishuTable {
  id: string;
  name: string;
}

interface SaveTemplateDialogProps {
  isOpen: boolean;
  isStep3: boolean;
  isStep2?: boolean;
  templateToEdit: any;
  feishuUrl: string;
  selectedTableIds: string[];
  inputMode: string;
  tableToSheetMapping: Record<string, string>;
  tables: FeishuTable[];
  onClose: () => void;
  onSave: (name: string, remark?: string) => void;
  onError: (error: string) => void;
}

export function SaveTemplateDialog({
  isOpen,
  isStep3,
  isStep2,
  templateToEdit,
  feishuUrl,
  selectedTableIds,
  inputMode,
  tableToSheetMapping,
  tables,
  onClose,
  onSave,
  onError,
}: SaveTemplateDialogProps) {
  if (!isOpen) return null;

  const sheetMappingCount = Object.keys(tableToSheetMapping).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {templateToEdit ? '编辑模版' : (isStep3 ? '保存子表配置' : (isStep2 ? '保存为历史模版' : '保存为历史模版'))}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {isStep3 ? '配置名称' : '模版名称'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="template-name"
                type="text"
                placeholder={isStep3 ? '例如：产品表-订单表配置' : (isStep2 ? '例如：每周销售数据工作表选择' : '例如：每周销售数据上传模版')}
                className="w-full"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="template-remark" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                备注（可选）
              </Label>
              <textarea
                id="template-remark"
                placeholder={isStep3 ? '例如：用于批量上传产品和订单数据' : (isStep2 ? '例如：用于每周上传销售数据' : '例如：用于每周上传销售数据到飞书多维表格')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                rows={3}
              />
            </div>

            {isStep3 ? (
              // 步骤3：显示子表配置详情
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-xs text-green-800 dark:text-green-200 mb-2">
                  📋 将保存以下子表配置：
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedTableIds.map(tableId => {
                    const table = tables.find(t => t.id === tableId);
                    const sheetName = tableToSheetMapping[tableId];
                    if (!sheetName) return null;
                    
                    return (
                      <div key={tableId} className="text-xs text-green-900 dark:text-green-100 flex items-center gap-2">
                        <FileSpreadsheet className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{table?.name}</span>
                        <span className="text-green-600 dark:text-green-400">→</span>
                        <span className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded">{sheetName}</span>
                      </div>
                    );
                  })}
                  {sheetMappingCount === 0 && (
                    <p className="text-xs text-green-700 dark:text-green-300 text-center">
                      暂无子表配置
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // 步骤2：显示工作表选择详情
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  📋 模版将包含以下配置：
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 ml-4 list-disc">
                  <li>飞书链接：{feishuUrl.slice(0, 30)}...</li>
                  <li>选中工作表：{selectedTableIds.length} 个</li>
                  {selectedTableIds.length > 0 && (
                    <li>工作表列表：{selectedTableIds.slice(0, 3).map(id => tables.find(t => t.id === id)?.name || '未知').join(', ')}{selectedTableIds.length > 3 ? '...' : ''}</li>
                  )}
                  <li>输入方式：{inputMode === 'file' ? '文件上传' : '粘贴内容'}</li>
                  <li>字段映射：已保存</li>
                  {sheetMappingCount > 0 && <li>子表映射：{sheetMappingCount} 个配置</li>}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => {
                const nameInput = document.getElementById('template-name') as HTMLInputElement;
                const remarkInput = document.getElementById('template-remark') as HTMLTextAreaElement;
                if (nameInput && nameInput.value.trim()) {
                  onSave(nameInput.value.trim(), remarkInput?.value.trim());
                } else {
                  onError(isStep3 ? '请输入配置名称' : '请输入模版名称');
                }
              }}
              className="flex-1"
            >
              确认保存
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
