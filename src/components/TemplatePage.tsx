'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  FileSpreadsheet,
  Loader2,
  X,
  Trash2,
  Settings,
} from 'lucide-react';
import type { HistoryTemplate } from '@/types';
import { STORAGE_KEYS } from '@/constants';

interface TemplatePageProps {
  onBack: () => void;
  onLoadTemplate: (templateId: string) => void;
}

export function TemplatePage({ onBack, onLoadTemplate }: TemplatePageProps) {
  const [templates, setTemplates] = useState<HistoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // 加载历史模版
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES);
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    } catch (err) {
      console.error('[TemplatePage] 加载失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 筛选模版
  const filteredTemplates = templates.filter(t => {
    const tName = t.name || '';
    const searchLower = searchText.toLowerCase();
    return (
      tName.toLowerCase().includes(searchLower) ||
      (t.remark && typeof t.remark === 'string' && t.remark.toLowerCase().includes(searchLower))
    );
  });

  // 删除模版
  const handleDeleteTemplate = (id: string) => {
    if (!confirm('确定要删除这个模版吗？')) return;

    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES, JSON.stringify(newTemplates));
  };

  // 导出模版
  const handleExportTemplates = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templates,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `飞书历史模版导出_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导入模版
  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataStr = e.target?.result as string;
        const importData = JSON.parse(dataStr);
        
        if (!importData.templates || !Array.isArray(importData.templates)) {
          throw new Error('无效的导入文件格式');
        }
        
        const existingIds = new Set(templates.map(t => t.id));
        const newTemplates = importData.templates.filter((t: any) => !existingIds.has(t.id));
        const mergedTemplates = [...templates, ...newTemplates];
        
        setTemplates(mergedTemplates);
        localStorage.setItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES, JSON.stringify(mergedTemplates));
        
        alert(`成功导入 ${newTemplates.length} 个模版`);
      } catch (err) {
        alert('导入失败: ' + (err instanceof Error ? err.message : '未知错误'));
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* 顶部标签栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          {/* 标签切换 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-8">
              <h1 className="text-3xl font-bold text-gray-900">
                历史模版
              </h1>
              <span className="text-lg text-gray-500">
                共 {templates.length} 个模版
              </span>
            </div>

            {/* 操作按钮组 */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleImportTemplates}
                className="hidden"
                id="import-templates-input"
              />
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const input = document.getElementById('import-templates-input') as HTMLInputElement;
                  if (input) input.click();
                }}
                className="h-12 px-5 text-base border-gray-300 hover:bg-gray-50"
              >
                <Upload className="h-5 w-5 mr-2 text-gray-600" />
                导入
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleExportTemplates}
                className="h-12 px-5 text-base border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-5 w-5 mr-2 text-gray-600" />
                导出
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onBack}
                className="h-12 px-5 text-base border-gray-300 hover:bg-gray-50"
              >
                <X className="h-5 w-5 mr-2 text-gray-600" />
                返回
              </Button>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="搜索模版名称或备注..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-11 text-base pl-12 border-gray-300 focus:ring-2 focus:ring-green-500"
              />
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 内容展示区 */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-[1800px] mx-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <FileText className="h-32 w-32 text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-500 mb-2">
                {searchText ? '未找到匹配的模版' : '暂无历史模版'}
              </h3>
              <p className="text-lg text-gray-400">
                {searchText ? '请尝试其他搜索关键词' : '配置完成后可以保存为模版'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-6 bg-white border border-gray-200 hover:border-green-500 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => onLoadTemplate(template.id)}
                >
                  {/* 卡片头部 */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 truncate">
                          {template.name}
                        </h3>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-600 text-green-700">
                          {template.inputMode === 'file' ? '文件' : '粘贴'}
                        </Badge>
                      </div>
                      {template.remark && (
                        <p className="text-base text-gray-600 truncate mb-3">
                          {template.remark}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* 状态标签 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm px-3 py-1">
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                      {template.selectedTableIds.length} 个工作表
                    </Badge>
                    {template.tableToSheetMapping && Object.keys(template.tableToSheetMapping).length > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm px-3 py-1">
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        {Object.keys(template.tableToSheetMapping).length} 个子表配置
                      </Badge>
                    )}
                  </div>

                  {/* 上传成功提示 */}
                  <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-green-800 font-medium truncate">
                        配置保存成功
                      </p>
                    </div>
                  </div>

                  {/* 文件信息 */}
                  <div className="px-4 py-3 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="truncate">
                        {template.feishuUrl?.slice(0, 60)}
                      </span>
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                    <span>创建于 {new Date(template.createdAt).toLocaleDateString('zh-CN')}</span>
                    <span className="text-green-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      点击加载模版
                      <FileText className="h-4 w-4" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
