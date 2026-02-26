'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  History,
  Trash2,
  Save,
  ArrowRight,
  Sparkles,
  Database,
  Layers,
  Clock,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
  FileUp,
  Clipboard,
  File,
  FileType,
  Check,
  AlertCircle,
  Info,
  Plus,
  Edit,
} from 'lucide-react';
import type { HistoryTemplate } from '@/types';

interface Step2TemplateSelectionProps {
  tables: any[];
  selectedTableIds: string[];
  tableFields: Record<string, any[]>;
  loadingTables: boolean;
  historyTemplates: HistoryTemplate[];
  onApplyTemplate: (template: HistoryTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSaveTemplate: () => void;
  onManualSelect: () => void;
  onNextStep: () => void;
  developerMode?: boolean;
}

export function Step2TemplateSelection({
  tables,
  selectedTableIds,
  tableFields,
  loadingTables,
  historyTemplates,
  onApplyTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  onManualSelect,
  onNextStep,
  developerMode = false,
}: Step2TemplateSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<HistoryTemplate | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  const filteredTemplates = historyTemplates.filter(template => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const templateName = template.name || '';
    return (
      templateName.toLowerCase().includes(query) ||
      (template.remark && typeof template.remark === 'string' && template.remark.toLowerCase().includes(query))
    );
  });

  const handleApplyTemplate = (template: HistoryTemplate) => {
    setSelectedTemplate(template);
    onApplyTemplate(template);
  };

  const handleConfirmAndProceed = () => {
    if (selectedTemplate) {
      onNextStep();
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              选择历史模板或手动配置
            </h2>
            <p className="text-sm text-muted-foreground">
              快速使用历史模板开始，或手动选择工作表进行自定义配置
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              {historyTemplates.length} 个模板可用
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {historyTemplates.length === 0 ? (
            <Card className="p-12 border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/30 mb-6">
                  <FileText className="h-16 w-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  暂无历史模板
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  您还没有保存任何历史模板。完成一次数据同步配置后，可以将其保存为模板以便下次快速使用。
                </p>
                <Button
                  onClick={onManualSelect}
                  variant="default"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  开始手动配置
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <History className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">历史模板</h3>
                      <p className="text-sm text-muted-foreground">选择一个模板快速开始</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={onSaveTemplate}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    保存当前配置
                  </Button>
                </div>

                <div className="relative mb-6">
                  <FileSpreadsheet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索模板名称或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTemplates.map((template) => {
                    const isSelected = selectedTemplate?.id === template.id;
                    const isExpanded = expandedTemplateId === template.id;
                    const tableCount = template.selectedTableIds?.length || 0;

                    return (
                      <Card
                        key={template.id}
                        className={`p-5 border-2 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md'
                            : 'border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:shadow-sm'
                        }`}
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {isSelected ? (
                                  <Check className="h-5 w-5" />
                                ) : (
                                  <FileText className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground text-base">
                                  {template.name}
                                </h4>
                                {template.remark && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {template.remark}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTemplateId(isExpanded ? null : template.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTemplate(template.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Database className="h-3.5 w-3.5" />
                            {tableCount} 个工作表
                          </span>
                          <span className="flex items-center gap-1">
                            <FileType className="h-3.5 w-3.5" />
                            {template.inputMode === 'file' ? '文件上传' : '内容粘贴'}
                          </span>
                          {template.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(template.createdAt)}
                            </span>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                包含的工作表
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {template.selectedTableIds?.map((tableId, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    表 {index + 1}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {template.tableToSheetMapping && Object.keys(template.tableToSheetMapping).length > 0 && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                  Sheet映射配置
                                </Label>
                                <div className="text-xs text-muted-foreground">
                                  已配置 {Object.keys(template.tableToSheetMapping).length} 个映射关系
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-primary/20">
                            <div className="flex items-center gap-2 text-sm text-primary font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              已选择此模板，点击下方按钮继续
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Settings className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">需要自定义配置？</h3>
                      <p className="text-sm text-muted-foreground">
                        手动选择工作表和配置字段映射
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={onManualSelect}
                    variant="outline"
                    className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                    手动配置
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${
                selectedTemplate 
                  ? 'bg-green-500/10' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {selectedTemplate ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Info className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">操作指南</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate 
                    ? '模板已就绪，可以继续' 
                    : '选择一个模板开始'}
                </p>
              </div>
            </div>

            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-sm text-green-700 dark:text-green-300">
                      已选择模板
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {selectedTemplate.name}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">工作表数量</span>
                    <span className="font-medium">{selectedTemplate.selectedTableIds?.length || 0} 个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">输入方式</span>
                    <span className="font-medium">
                      {selectedTemplate.inputMode === 'file' ? '文件上传' : '内容粘贴'}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmAndProceed}
                  variant="default"
                  size="lg"
                  className="w-full flex items-center gap-2"
                >
                  使用此模板继续
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Zap className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    选择一个历史模板以快速开始
                  </p>
                  <div className="flex items-center gap-2 animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">提示</p>
                      <p className="text-xs">
                        历史模板保存了您之前的配置，包括工作表选择、字段映射等信息，可以快速复用。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {developerMode && (
            <Card className="p-4 border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>开发者模式已启用</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
