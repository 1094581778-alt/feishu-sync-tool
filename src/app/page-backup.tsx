'use client';

import { useState, useRef, useEffect, Fragment as ReactFragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Settings, Save, Table, ChevronRight, Loader2, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Trash2, Copy, FileSpreadsheet, History, Sun, Moon, Monitor, Zap, Coffee, Check, Code, Home, FileUp, Database, CloudUpload, Rocket, Clock, Users, BarChart } from 'lucide-react';
import { FeishuConfig, SaveTemplateDialog, TemplateList, Step1, Step2, Step3, Step4 } from '@/components';
import { Step2Enhanced } from '@/components/steps/Step2Enhanced';
import { parseFeishuUrl, formatFileSize } from '@/utils';
import { STORAGE_KEYS } from '@/constants';
import { useFeishuConfig, useUrlHistory, useHistoryTemplates, useTheme } from '@/hooks';
import { TauriService, isTauri } from '@/services/tauri';

// 从类型文件导入
import type { Step, UploadResult, HistoryTemplate, FieldMatchResult, FeishuTable, FeishuField } from '@/types';

export default function FileUploadPage() {
  // 使用自定义 Hooks
  const { appId: feishuAppId, appSecret: feishuAppSecret, setAppId: setFeishuAppId, setAppSecret: setFeishuAppSecret, saveConfig: saveFeishuConfig } = useFeishuConfig();
  const { history: urlHistory, setHistory: setUrlHistory, addToHistory, removeFromHistory } = useUrlHistory();
  const { templates: historyTemplates, setTemplates: setHistoryTemplates, saveTemplate, updateTemplate, deleteTemplate: handleDeleteTemplate, exportTemplates: handleExportTemplates, importTemplates: handleImportTemplates } = useHistoryTemplates();
  const { theme, themes, toggleTheme, switchTheme } = useTheme();

  const [showFeishuConfig, setShowFeishuConfig] = useState(false);

  // 主应用状态
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  const [feishuUrl, setFeishuUrl] = useState<string>('');
  const [parsedConfig, setParsedConfig] = useState<{ spreadsheetToken: string; sheetId?: string } | null>(null);
  const [tables, setTables] = useState<FeishuTable[]>([]);
  const [fields, setFields] = useState<FeishuField[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [pastedContent, setPastedContent] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [tableChangeCount, setTableChangeCount] = useState(0);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [developerMode, setDeveloperMode] = useState<boolean>(false);
  
  // 部署检查相关状态
  const [previousDeploymentFound, setPreviousDeploymentFound] = useState<boolean>(false);
  
  // 历史模版相关状态
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState<boolean>(false);
  const [templateToEdit, setTemplateToEdit] = useState<HistoryTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'template'>('history'); // 'history' | 'template'
  const [applyingTemplate, setApplyingTemplate] = useState<HistoryTemplate | null>(null); // 当前正在应用的模版
  const [showSheetMappingDropdown, setShowSheetMappingDropdown] = useState<string | null>(null); // 控制子表配置下拉菜单（templateId）
  const [showTableSelectorDropdown, setShowTableSelectorDropdown] = useState<string | null>(null); // 控制工作表选择下拉菜单（tableId）
  const [showSheetSelectorDropdown, setShowSheetSelectorDropdown] = useState<string | null>(null); // 控制 Sheet 选择下拉菜单（tableId）
  const [expandedFieldDetails, setExpandedFieldDetails] = useState<string | null>(null); // 控制字段详情展开（templateId-tableId）
  const [showSaveSuccess, setShowSaveSuccess] = useState<string | null>(null); // 控制保存成功提示（templateId）
  
  // 模版临时状态（用于在步骤1上传文件）
  const [templateFiles, setTemplateFiles] = useState<Record<string, File>>({});
  const [templateSheetNames, setTemplateSheetNames] = useState<Record<string, string[]>>({});

  
  // 多工作表相关状态
  const [tableFieldMatches, setTableFieldMatches] = useState<Record<string, FieldMatchResult[]>>({});
  const [tableFields, setTableFields] = useState<Record<string, FeishuField[]>>({});
  const [uploadResults, setUploadResults] = useState<Record<string, UploadResult>>({});
  const [batchUploadProgress, setBatchUploadProgress] = useState<string>(''); // 批量上传进度信息
  const [templateSyncStatus, setTemplateSyncStatus] = useState<Record<string, { success: boolean; message: string }>>({}); // 模版同步状态
  
  // Excel Sheet相关状态
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [selectedExcelSheet, setSelectedExcelSheet] = useState<string>('');
  const [tableToSheetMapping, setTableToSheetMapping] = useState<Record<string, string>>({}); // 修改结构：TableId -> Sheet
  
  // 字段匹配显示控制
  const [showAllFields, setShowAllFields] = useState<Record<string, boolean>>({});
  
  const [fieldMatchResults, setFieldMatchResults] = useState<FieldMatchResult[]>([]);
  const [analyzingFile, setAnalyzingFile] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  // 包装 setTables 以记录所有调用
  const setTablesWithLog = (value: React.SetStateAction<FeishuTable[]>) => {
    const previousLength = tables.length;
    setTables(value);
    
    // 使用 setTimeout 确保在状态更新后记录
    setTimeout(() => {
      const newValue = typeof value === 'function' ? value(tables) : value;
      console.log('📝 [setTables] 被调用');
      console.log('📝 [setTables] 之前长度:', previousLength);
      console.log('📝 [setTables] 新长度:', newValue.length);
      console.log('📝 [setTables] 新值:', newValue.slice(0, 3));
      console.log('📝 [setTables] 调用堆栈:', new Error().stack);
      setTableChangeCount(prev => prev + 1);
    }, 0);
  };

  // 刷新工作表列表的函数（供TemplateList组件使用）
  const handleRefreshTables = async (spreadsheetToken: string) => {
    console.log('🔄 [刷新工作表] 开始刷新工作表列表');
    console.log('🔄 [刷新工作表] spreadsheetToken:', spreadsheetToken);
    
    setLoadingTables(true);
    setError('');

    try {
      const apiUrl = `${window.location.origin}/api/feishu/tables`;
      const requestBody: any = { token: spreadsheetToken };
      if (feishuAppId && feishuAppSecret) {
        requestBody.appId = feishuAppId;
        requestBody.appSecret = feishuAppSecret;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success && data.tables && data.tables.length > 0) {
        console.log('✅ [刷新工作表] 成功获取工作表，数量:', data.tables.length);
        setTablesWithLog(data.tables);
      } else {
        console.error('❌ [刷新工作表] API 返回错误或无数据:', data);
        const errorMsg = data.error || '刷新工作表列表失败';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('❌ [刷新工作表] 请求失败:', err);
      const errorMsg = err instanceof Error ? err.message : '刷新工作表列表失败';
      setError(errorMsg);
    } finally {
      setLoadingTables(false);
      console.log('✅ [刷新工作表] 刷新完成');
    }
  };

  // 侧边栏导入模板处理函数
  const handleSidebarImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const result = await handleImportTemplates(event);
      if (result.success) {
        alert(`✅ 成功导入 ${result.count || 0} 个模板`);
        // 刷新模板列表
        const savedTemplates = localStorage.getItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES);
        if (savedTemplates) {
          setHistoryTemplates(JSON.parse(savedTemplates));
        }
      } else {
        alert(`❌ 导入失败: ${result.message}`);
      }
    } catch (err) {
      console.error('导入失败:', err);
      alert(`❌ 导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  // 组件挂载日志
  useEffect(() => {
    console.log('🚀 [生命周期] 组件已挂载');
    return () => {
      console.log('🔄 [生命周期] 组件即将卸载');
    };
  }, []);

  // 检查是否有之前的部署
  useEffect(() => {
    const checkDeployment = async () => {
      if (isTauri()) {
        try {
          console.log('🔍 检查是否有之前的部署...');
          const hasPrevious = await TauriService.checkPreviousDeployment();
          setPreviousDeploymentFound(hasPrevious);
          console.log(`📋 部署检查结果: ${hasPrevious ? '发现之前的部署' : '未发现之前的部署'}`);
        } catch (error) {
          console.error('❌ 部署检查失败:', error);
        }
      }
    };
    
    checkDeployment();
  }, []);

  // 设置全局回调函数供 Step3 组件使用
  useEffect(() => {
    (window as any).updateTableToSheetMapping = setTableToSheetMapping;
    (window as any).setSelectedFileWrapper = setSelectedFile;
    
    return () => {
      delete (window as any).updateTableToSheetMapping;
      delete (window as any).setSelectedFileWrapper;
    };
  }, [setTableToSheetMapping, setSelectedFile]);

  // 监听 tables 状态变化
  useEffect(() => {
    console.log('📊 tables 状态变化:', tables.length, '个表');
    if (tables.length > 0) {
      console.log('📋 第一个工作表:', tables[0]);
      console.log('📋 tables 完整内容（前5个）:', tables.slice(0, 5));
    }
  }, [tables]);

  // 从 localStorage 加载配置和历史记录
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') {
      return;
    }
    
    const savedUrl = localStorage.getItem(STORAGE_KEYS.FEISHU_URL);
    const savedTableId = localStorage.getItem(STORAGE_KEYS.FEISHU_TABLE_ID);
    
    console.log('📦 页面加载，检查 localStorage');
    console.log('  保存的 URL:', savedUrl);
    console.log('  保存的 Table ID:', savedTableId);
    
    // 加载飞书配置
    const savedAppId = localStorage.getItem(STORAGE_KEYS.FEISHU_APP_ID) || '';
    const savedAppSecret = localStorage.getItem(STORAGE_KEYS.FEISHU_APP_SECRET) || '';
    if (savedAppId && savedAppSecret) {
      setFeishuAppId(savedAppId);
      setFeishuAppSecret(savedAppSecret);
      console.log('✅ [飞书配置] 已加载用户配置');
    }
    
    // 加载链接历史记录
    // 已移至 useUrlHistory Hook
    
    let urlToUse = '';
    let configToUse = null;
    
    // 优先从 URL 参数读取
    const urlParams = new URLSearchParams(window.location.search);
    const urlParam = urlParams.get('url');
    if (urlParam && urlParam.trim()) {
      console.log('🔗 [URL参数] 检测到链接参数:', urlParam);
      urlToUse = decodeURIComponent(urlParam);
      setFeishuUrl(urlToUse);
      configToUse = parseFeishuUrl(urlToUse);
      setParsedConfig(configToUse);
      
      // 清除 URL 参数（避免刷新时重复）
      window.history.replaceState({}, '', window.location.pathname);
      console.log('✅ [URL参数] 已清除 URL 参数');
    } else if (savedUrl) {
      setFeishuUrl(savedUrl);
      configToUse = parseFeishuUrl(savedUrl);
      setParsedConfig(configToUse);
      urlToUse = savedUrl;
    } else {
      console.log('ℹ️ 没有保存的 URL');
    }
    
    console.log('🔧 解析的配置:', configToUse);
    
    // 不再自动恢复保存的工作表 ID，让用户手动选择
    // if (savedTableId) {
    //   console.log('🔄 [localStorage] 恢复保存的工作表 ID:', savedTableId);
    //   setSelectedTableIds([savedTableId]);
    // }
    
    // 检查是否有历史模版
    const savedTemplates = localStorage.getItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES);
    if (savedTemplates) {
      try {
        const templates = JSON.parse(savedTemplates);
        console.log('📦 [localStorage] 发现历史模版数量:', templates.length);
        if (templates.length > 0) {
          console.log('📋 [localStorage] 第一个历史模版:', {
            name: templates[0].name,
            selectedTableIds: templates[0].selectedTableIds,
            tableToSheetMapping: templates[0].tableToSheetMapping
          });
        }
      } catch (err) {
        console.error('❌ [localStorage] 解析历史模版失败:', err);
      }
    } else {
      console.log('ℹ️ [localStorage] 没有历史模版');
    }
  }, []);

  // 监听 parsedConfig 变化，自动获取工作表列表
  useEffect(() => {
    // 定义获取工作表列表的函数
    const fetchTables = async (token: string) => {
      const requestId = Date.now();
      console.log('🔄 [请求 ' + requestId + '] 开始获取工作表列表');
      console.log('🔄 [请求 ' + requestId + '] token:', token);
      console.log('🔄 [请求 ' + requestId + '] token类型:', typeof token);
      console.log('🔄 [请求 ' + requestId + '] token长度:', token.length);
      console.log('🔄 [请求 ' + requestId + '] 当前 tables.length:', tables.length);
      
      // 更新调试信息
      setDebugInfo((prev: Record<string, any>) => ({
        ...prev,
        requestId,
        token,
        tokenType: typeof token,
        tokenLength: token.length,
        status: 'fetching',
        timestamp: new Date().toISOString()
      }));

      if (!token) {
        const errorMsg = '错误：未找到 Spreadsheet Token';
        console.error('❌ [请求 ' + requestId + ']', errorMsg);
        setError(errorMsg);
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, status: 'error', error: errorMsg }));
        return;
      }

      setLoadingTables(true);
      setError('');

      try {
        // 使用 POST 请求避免代理问题
        const apiUrl = `${window.location.origin}/api/feishu/tables`;
        console.log('🔄 [请求 ' + requestId + '] API URL (POST):', apiUrl);
        console.log('🔄 [请求 ' + requestId + '] token 值:', token);
        console.log('🔄 [请求 ' + requestId + '] token 长度:', token.length);
        
        setDebugInfo((prev: Record<string, any>) => ({ 
          ...prev, 
          apiUrl, 
          method: 'POST'
        }));

        console.log('🔄 [请求 ' + requestId + '] 准备发送 POST 请求...');

        // 构建请求体，包含飞书配置
        const requestBody: any = { token };
        if (feishuAppId && feishuAppSecret) {
          requestBody.appId = feishuAppId;
          requestBody.appSecret = feishuAppSecret;
          console.log('🔄 [请求 ' + requestId + '] 使用用户配置的飞书凭证');
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log('🔄 [请求 ' + requestId + '] POST 请求完成');
        console.log('🔄 [请求 ' + requestId + '] response.status:', response.status);
        console.log('🔄 [请求 ' + requestId + '] response.statusText:', response.statusText);
        console.log('🔄 [请求 ' + requestId + '] response.url:', response.url);
        
        const data = await response.json();
        
        console.log('📊 [请求 ' + requestId + '] API 响应状态:', response.status);
        console.log('📊 [请求 ' + requestId + '] API 响应数据:', data);
        console.log('📊 [请求 ' + requestId + '] data.success:', data.success);
        console.log('📊 [请求 ' + requestId + '] data.tables.length:', data.tables?.length);
        
        setDebugInfo((prev: Record<string, any>) => ({ 
          ...prev, 
          responseStatus: response.status,
          responseData: data
        }));
        
        if (data.success && data.tables && data.tables.length > 0) {
          console.log('✅ [请求 ' + requestId + '] 成功获取工作表，数量:', data.tables.length);
          console.log('📋 [请求 ' + requestId + '] 工作表列表:', data.tables);
          
          // 更新状态
          setTablesWithLog(data.tables);
          console.log('💾 [请求 ' + requestId + '] 已调用 setTables，等待状态更新...');
          
          // 如果正在应用模版，则恢复模版中保存的工作表选择
          if (applyingTemplate) {
            console.log('🔄 [请求 ' + requestId + '] 恢复模版工作表选择:', applyingTemplate.selectedTableIds);
            setSelectedTableIds(applyingTemplate.selectedTableIds);
            setTableFields(applyingTemplate.tableFields || {});
            setTableFieldMatches(applyingTemplate.fieldMatchResults || {});
            setTableToSheetMapping(applyingTemplate.tableToSheetMapping || {});
            setDebugInfo((prev: Record<string, any>) => ({ 
              ...prev, 
              restoredTemplate: applyingTemplate.name,
              restoredTables: applyingTemplate.selectedTableIds.length 
            }));
            // 清除正在应用的模版标记
            setApplyingTemplate(null);
          } else {
            // 正常解析链接，不再自动选中工作表，让用户手动选择
            // const overviewTable = data.tables.find((t: FeishuTable) => t.name.includes('概览'));
            // if (overviewTable) {
            //   console.log('🎯 [请求 ' + requestId + '] 自动选中概览表:', overviewTable.name);
            //   setSelectedTableIds([overviewTable.id]);
            //   setDebugInfo((prev: Record<string, any>) => ({ ...prev, autoSelected: overviewTable.name }));
            // }
          }
          
          setDebugInfo((prev: Record<string, any>) => ({ ...prev, status: 'success', tablesCount: data.tables.length }));
        } else {
          console.error('❌ [请求 ' + requestId + '] API 返回错误或无数据:', data);
          const errorMsg = data.error || '获取工作表列表失败';
          setError(errorMsg);
          setDebugInfo((prev: Record<string, any>) => ({ ...prev, status: 'error', error: errorMsg, details: data }));
        }
      } catch (err) {
        console.error('❌ [请求 ' + requestId + '] 请求失败:', err);
        const errorMsg = err instanceof Error ? err.message : '获取工作表列表失败';
        setError(errorMsg);
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, status: 'error', error: errorMsg, exception: err }));
      } finally {
        setLoadingTables(false);
        console.log('✅ [请求 ' + requestId + '] fetchTables 完成');
        console.log('✅ [请求 ' + requestId + '] 最终 tables.length:', tables.length);
      }
    };

    // 只有当 parsedConfig 有值时才调用
    if (parsedConfig && parsedConfig.spreadsheetToken) {
      console.log('🔔 检测到 parsedConfig 变化，开始获取工作表列表');
      console.log('🔔 parsedConfig:', JSON.stringify(parsedConfig));
      console.log('🔔 spreadsheetToken:', parsedConfig.spreadsheetToken);
      console.log('🔔 spreadsheetToken类型:', typeof parsedConfig.spreadsheetToken);
      console.log('🔔 spreadsheetToken长度:', parsedConfig.spreadsheetToken.length);
      
      setDebugInfo({
        parsedConfig,
        spreadsheetToken: parsedConfig.spreadsheetToken,
        timestamp: new Date().toISOString()
      });
      
      fetchTables(parsedConfig.spreadsheetToken);
    } else {
      console.log('⚠️ parsedConfig 或 spreadsheetToken 为空，跳过获取工作表');
      setDebugInfo((prev: Record<string, any>) => ({ 
        ...prev, 
        status: 'skipped',
        reason: 'parsedConfig 或 spreadsheetToken 为空',
        parsedConfig
      }));
    }
  }, [parsedConfig]); // 只依赖 parsedConfig


  // 解析飞书链接
  const handleParseUrl = () => {
    setError('');
    console.log('🔍 开始解析链接:', feishuUrl);
    
    const config = parseFeishuUrl(feishuUrl);
    console.log('📦 解析结果:', config);
    
    if (config) {
      setParsedConfig(config);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.FEISHU_URL, feishuUrl);
        
        // 使用 Hook 添加到历史记录
        const newHistory = addToHistory(feishuUrl, urlHistory);
        setUrlHistory(newHistory);
        console.log('💾 [历史记录] 已添加链接到历史记录');
      }
      console.log('💾 已保存到 localStorage');
      console.log('✅ 链接解析成功，将自动获取工作表列表');
    } else {
      console.error('❌ 链接解析失败');
      setError('无效的飞书链接格式，请检查链接是否正确');
    }
  };

  // 清除内容
  const handleClear = () => {
    console.log('🗑️ [handleClear] 清除内容被调用');
    
    // 从历史记录中移除当前链接
    if (feishuUrl && urlHistory.includes(feishuUrl)) {
      const newHistory = removeFromHistory(feishuUrl, urlHistory);
      setUrlHistory(newHistory);
      console.log('🗑️ [历史记录] 已从历史记录中移除链接');
    }
    
    setFeishuUrl('');
    setParsedConfig(null);
    setTablesWithLog([]);
    setSelectedTableIds([]);
    setError('');
    localStorage.removeItem(STORAGE_KEYS.FEISHU_URL);
    localStorage.removeItem(STORAGE_KEYS.FEISHU_TABLE_ID);
  };

  // 从历史记录选择链接
  const handleSelectHistoryUrl = (url: string) => {
    setFeishuUrl(url);
    setShowHistory(false);
    console.log('📚 [历史记录] 已选择历史链接:', url);
  };

  // 保存历史模版
  const handleSaveTemplate = (name: string, remark?: string) => {
    if (!feishuUrl || !parsedConfig) {
      setError('请先配置飞书链接并解析工作表');
      return;
    }
    
    if (selectedTableIds.length === 0) {
      setError('请至少选择一个工作表');
      return;
    }
    
    const now = new Date().toISOString();
    const templateId = Date.now().toString();
    
    const newTemplate: HistoryTemplate = {
      id: templateId,
      name,
      remark,
      createdAt: now,
      updatedAt: now,
      feishuUrl,
      spreadsheetToken: parsedConfig.spreadsheetToken,
      selectedTableIds,
      selectedTableNames: selectedTableIds.map(id => tables.find(t => t.id === id)?.name || ''),
      tableFields: { ...tableFields },
      fieldMatchResults: { ...tableFieldMatches },
      inputMode,
      tableToSheetMapping: { ...tableToSheetMapping },
      pastedContent: inputMode === 'paste' ? pastedContent : undefined,
    };
    
    console.log('📦 [保存模版] 模版数据:', {
      name,
      selectedTableIds,
      selectedTableNames: selectedTableIds.map(id => tables.find(t => t.id === id)?.name),
      tableToSheetMapping,
      tableFieldMatches
    });
    
    // 如果是编辑模式，更新现有模版
    if (templateToEdit) {
      updateTemplate(templateToEdit.id, newTemplate);
      console.log('✅ [历史模版] 已更新模版:', name);
    } else {
      // 新增模版
      saveTemplate(newTemplate);
      console.log('✅ [历史模版] 已保存模版:', name);
    }
    
    setShowSaveTemplateModal(false);
    setTemplateToEdit(null);
    
    // 如果是新增模版，切换到历史模版标签页
    if (!templateToEdit) {
      setActiveTab('template');
    }
  };

  // 复用历史模版
  const handleApplyTemplate = (template: HistoryTemplate) => {
    console.log('🔄 [历史模版] 开始应用模版:', template.name);
    console.log('📋 [历史模版] 模版中的工作表 IDs:', template.selectedTableIds);
    console.log('📋 [历史模版] 模版中的 Sheet 映射:', template.tableToSheetMapping);
    console.log('📋 [历史模版] 模版中的字段匹配:', template.fieldMatchResults);
    
    // 设置飞书链接
    if (template.feishuUrl) {
      setFeishuUrl(template.feishuUrl);
    }
    
    // 解析链接
    const config = template.feishuUrl ? parseFeishuUrl(template.feishuUrl) : null;
    if (config) {
      // 先设置正在应用的模版，这样在获取工作表时可以恢复选择
      setApplyingTemplate(template);
      setParsedConfig(config);
      if (template.feishuUrl) {
        localStorage.setItem('feishuUrl', template.feishuUrl);
      }
      
      // 设置其他配置
      if (template.inputMode) {
        setInputMode(template.inputMode);
      }
      if (template.pastedContent) {
        setPastedContent(template.pastedContent);
      }
      
      console.log('✅ [历史模版] 模版应用成功，跳转到步骤3');
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError('模版中的飞书链接格式无效');
    }
  };

  // 从历史模版应用Sheet映射
  const applySheetMappingFromTemplate = async (template: HistoryTemplate) => {
    console.log('🔄 [历史子表] 开始应用模版子表配置:', template.name);
    
    if (!template.tableToSheetMapping || Object.keys(template.tableToSheetMapping).length === 0) {
      console.warn('⚠️ [历史子表] 模版中没有子表配置');
      return;
    }

    let appliedCount = 0;
    const newMapping: Record<string, string> = { ...tableToSheetMapping };
    
    // 遍历模版中的Sheet映射
    Object.entries(template.tableToSheetMapping).forEach(([tableId, sheetName]) => {
      // 检查该工作表是否被选中
      if (selectedTableIds.includes(tableId)) {
        newMapping[tableId] = sheetName as string;
        appliedCount++;
        console.log(`✅ [历史子表] 工作表 ${tableId} -> Sheet "${sheetName}"`);
      } else {
        console.log(`⚠️ [历史子表] 工作表 ${tableId} 未选中，跳过`);
      }
    });

    if (appliedCount > 0) {
      setTableToSheetMapping(newMapping);
      console.log(`✅ [历史子表] 成功应用 ${appliedCount} 个子表配置`);
      
      // 等待状态更新后再进行字段匹配
      setTimeout(async () => {
        // 先确保所有工作表的字段都已加载（跳过自动分析）
        for (const tableId of selectedTableIds) {
          if (!tableFields[tableId] || tableFields[tableId].length === 0) {
            console.log(`🔄 [历史子表] 工作表 ${tableId} 字段未加载，正在获取...`);
            await fetchTableFields(tableId, true); // 传入true跳过自动分析
          }
        }
        
        // 使用正确的Sheet名称进行字段匹配
        if (selectedFile && selectedFile.name.match(/\.(xlsx|xls)$/i)) {
          for (const tableId of selectedTableIds) {
            const sheetName = newMapping[tableId];
            if (sheetName) {
              console.log(`🔄 [历史子表] 开始分析工作表 ${tableId} 的字段匹配，使用Sheet: ${sheetName}`);
              await analyzeFieldMatchingForTable(selectedFile, tableId, sheetName);
            }
          }
        }
      }, 300); // 增加延迟到300ms，确保状态更新完成
    } else {
      console.warn('⚠️ [历史子表] 没有应用到任何子表配置（可能工作表未被选中）');
    }
  };

  // 选择工作表（多选）
  const handleSelectTable = async (tableId: string, checked: boolean) => {
    if (!parsedConfig) {
      setError('请先输入并解析飞书链接');
      return;
    }

    if (checked) {
      // 添加到选中列表
      setSelectedTableIds(prev => [...prev, tableId]);
      
      // 获取该工作表的字段
      await fetchTableFields(tableId);
    } else {
      // 从选中列表移除
      setSelectedTableIds(prev => prev.filter(id => id !== tableId));
      
      // 清除该工作表的字段和匹配结果
      setTableFields(prev => {
        const newFields = { ...prev };
        delete newFields[tableId];
        return newFields;
      });
      setTableFieldMatches(prev => {
        const newMatches = { ...prev };
        delete newMatches[tableId];
        return newMatches;
      });
    }
  };

  // 全选所有工作表
  const handleSelectAll = async () => {
    if (!parsedConfig) {
      setError('请先输入并解析飞书链接');
      return;
    }

    const allTableIds = tables.map(t => t.id);
    setSelectedTableIds(allTableIds);

    // 获取所有工作表的字段
    for (const tableId of allTableIds) {
      await fetchTableFields(tableId);
    }
  };

  // 取消所有选择
  const handleClearSelection = () => {
    setSelectedTableIds([]);
    setTableFields({});
    setTableFieldMatches({});
  };

  // 从第二步应用历史模版
  const handleApplyTemplateFromStep2 = async (template: HistoryTemplate) => {
    if (!parsedConfig) {
      setError('请先输入并解析飞书链接');
      return;
    }

    console.log('🔄 [第二步] 应用历史模版:', template.name);
    
    // 创建工作表名称到ID的映射
    const tableNameToId = new Map<string, string>();
    tables.forEach(table => {
      tableNameToId.set(table.name, table.id);
    });
    
    // 通过工作表名称匹配ID
    const validTableIds: string[] = [];
    const unmatchedTables: string[] = [];
    
    (template.selectedTableIds || []).forEach((tableId, index) => {
      // 先尝试直接匹配ID
      if (tables.some(t => t.id === tableId)) {
        validTableIds.push(tableId);
        return;
      }
      
      // 如果ID不匹配，尝试通过名称匹配
      const tableName = template.selectedTableNames?.[index];
      if (tableName && tableNameToId.has(tableName)) {
        const matchedId = tableNameToId.get(tableName);
        if (matchedId && !validTableIds.includes(matchedId)) {
          validTableIds.push(matchedId);
          console.log(`✅ [第二步] 通过名称匹配: ${tableName} -> ${matchedId}`);
        }
      } else {
        unmatchedTables.push(tableId);
      }
    });
    
    if (validTableIds.length === 0) {
      setError('历史模版中的工作表在当前飞书链接中不存在，无法应用');
      console.warn('⚠️ [第二步] 历史模版中的工作表ID都不存在');
      return;
    }
    
    if (unmatchedTables.length > 0) {
      console.warn(`⚠️ [第二步] 历史模版中的 ${unmatchedTables.length} 个工作表在当前飞书链接中不存在`);
    }
    
    // 恢复工作表选择（只恢复有效的工作表）
    setSelectedTableIds(validTableIds);
    
    // 获取所有选中工作表的字段
    for (const tableId of validTableIds) {
      try {
        await fetchTableFields(tableId);
      } catch (error) {
        console.error(`❌ [第二步] 获取工作表 ${tableId} 字段失败:`, error);
      }
    }

    // 恢复字段映射（只保留有效的工作表）
    if (template.fieldMatchResults) {
      const validFieldMatches: Record<string, FieldMatchResult[]> = {};
      for (const [tableId, matchResult] of Object.entries(template.fieldMatchResults)) {
        if (validTableIds.includes(tableId)) {
          validFieldMatches[tableId] = matchResult;
        }
      }
      setTableFieldMatches(validFieldMatches);
    }

    // 恢复子表映射（只保留有效的工作表）
    if (template.tableToSheetMapping) {
      const validMapping: Record<string, string> = {};
      for (const [tableId, sheetName] of Object.entries(template.tableToSheetMapping)) {
        if (validTableIds.includes(tableId)) {
          validMapping[tableId] = sheetName;
        }
      }
      setTableToSheetMapping(validMapping);
    }

    console.log('✅ [第二步] 历史模版应用成功，共应用', validTableIds.length, '个工作表');
    if (unmatchedTables.length > 0) {
      console.log('ℹ️ [第二步] 有', unmatchedTables.length, '个工作表未找到匹配');
    }
  };

  // 从第二步保存模版
  const handleSaveTemplateFromStep2 = () => {
    if (selectedTableIds.length === 0) {
      setError('请先选择工作表');
      return;
    }
    setTemplateToEdit(null);
    setShowSaveTemplateModal(true);
  };

  // 获取单个工作表的字段
  const fetchTableFields = async (tableId: string, skipAnalysis: boolean = false) => {
    if (!parsedConfig) return;

    try {
      // 构建请求体，包含飞书配置
      const requestBody: any = { token: parsedConfig.spreadsheetToken, tableId };
      if (feishuAppId && feishuAppSecret) {
        requestBody.appId = feishuAppId;
        requestBody.appSecret = feishuAppSecret;
      }

      const response = await fetch(`${window.location.origin}/api/feishu/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (data.success) {
        setTableFields(prev => ({
          ...prev,
          [tableId]: data.fields
        }));
        console.log(`✅ [字段] 已更新工作表 ${tableId} 字段列表，字段数:`, data.fields.length);

        // 如果已选择Excel文件且未跳过分析，分析字段匹配
        if (!skipAnalysis && selectedFile && selectedFile.name.match(/\.(xlsx|xls)$/i)) {
          await analyzeFieldMatchingForTable(selectedFile, tableId);
        }
      } else {
        console.error(`❌ [字段] 获取工作表 ${tableId} 字段失败:`, data.error);
      }
    } catch (err) {
      console.error(`❌ [字段] 获取工作表 ${tableId} 字段请求失败:`, err);
    }
  };

  // 为指定工作表分析字段匹配（支持指定Sheet）
  const analyzeFieldMatchingForTable = async (file: File, tableId: string, sheetName?: string) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setTableFieldMatches(prev => ({ ...prev, [tableId]: [] }));
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // 读取指定的Sheet或第一个Sheet
      const targetSheetName = sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheetName];
      
      if (!worksheet) {
        console.warn(`⚠️ [字段匹配] Sheet "${targetSheetName}" 不存在`);
        setTableFieldMatches(prev => ({ ...prev, [tableId]: [] }));
        return;
      }
      
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false });

      if (jsonData.length === 0) {
        setTableFieldMatches(prev => ({ ...prev, [tableId]: [] }));
        return;
      }

      const excelColumns = Object.keys(jsonData[0]);
      const feishuFields = tableFields[tableId] || [];
      const feishuFieldNames = feishuFields.map(f => f.field_name || f.name || '').filter(Boolean);
      
      // 计算两个字符串的相似度（使用编辑距离算法）
      const calculateSimilarity = (str1: string, str2: string): number => {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        
        // 如果完全相同，相似度为 1
        if (s1 === s2) return 1;
        
        // 如果一个字符串包含另一个字符串，相似度为 0.8
        if (s1.includes(s2) || s2.includes(s1)) return 0.8;
        
        // 计算编辑距离
        const m = s1.length;
        const n = s2.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
              dp[i][j] = dp[i - 1][j - 1];
            } else {
              dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
            }
          }
        }
        
        const maxLen = Math.max(m, n);
        return 1 - dp[m][n] / maxLen;
      };
      
      // 查找最佳匹配
      const findBestMatch = (excelField: string, feishuFields: string[]): { field: string; similarity: number } | null => {
        let bestMatch: { field: string; similarity: number } | null = null;
        
        // 1. 首先尝试精确匹配
        const exactMatch = feishuFields.find(field => field === excelField);
        if (exactMatch) {
          return { field: exactMatch, similarity: 1 };
        }
        
        // 2. 计算相似度，找到最佳匹配
        for (const feishuField of feishuFields) {
          const similarity = calculateSimilarity(excelField, feishuField);
          
          // 如果相似度大于 0.6，认为是潜在匹配
          if (similarity > 0.6) {
            if (!bestMatch || similarity > bestMatch.similarity) {
              bestMatch = { field: feishuField, similarity };
            }
          }
        }
        
        return bestMatch;
      };
      
      const results: FieldMatchResult[] = excelColumns.map(excelField => {
        // 使用智能匹配算法
        const matchResult = findBestMatch(excelField, feishuFieldNames);
        const feishuField = matchResult?.field;
        const similarity = matchResult?.similarity || 0;
        
        // 记录匹配结果
        if (feishuField && similarity > 0.6) {
          console.log(`✅ [字段匹配] Excel字段 "${excelField}" 匹配到飞书字段 "${feishuField}" (相似度: ${(similarity * 100).toFixed(1)}%)`);
        } else {
          console.log(`❌ [字段匹配] Excel字段 "${excelField}" 未匹配到飞书字段 (最佳相似度: ${(similarity * 100).toFixed(1)}%)`);
        }
        
        return {
          excelField,
          feishuField: feishuField || null,
          matched: !!feishuField && similarity > 0.6,
          similarity: similarity,
        };
      });

      setTableFieldMatches(prev => ({ ...prev, [tableId]: results }));
      
      const matchedCount = results.filter(r => r.matched).length;
      console.log(`📊 [字段匹配] 工作表 ${tableId} (Sheet: ${targetSheetName}): Excel列数 ${excelColumns.length}, 匹配成功 ${matchedCount}, 未匹配 ${excelColumns.length - matchedCount}`);
      console.log(`📋 [字段匹配] Excel列名: ${excelColumns.join(', ')}`);
      console.log(`📋 [字段匹配] 飞书字段: ${feishuFieldNames.join(', ')}`);
      
    } catch (err) {
      console.error(`❌ [字段匹配] 分析工作表 ${tableId} 失败:`, err);
    }
  };

  // 获取工作表字段和记录
  const fetchTableDetails = async (token: string, tableId: string) => {
    setLoadingFields(true);
    setLoadingRecords(true);
    setError('');

    // 构建请求体，包含飞书配置
    const requestBody: any = { token, tableId };
    if (feishuAppId && feishuAppSecret) {
      requestBody.appId = feishuAppId;
      requestBody.appSecret = feishuAppSecret;
    }

    try {
      await Promise.all([
        fetch(`${window.location.origin}/api/feishu/fields`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) setFields(data.fields);
            else throw new Error(data.error);
          }),
        fetch(`${window.location.origin}/api/feishu/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...requestBody, pageSize: 10 }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) setRecords(data.records);
            else throw new Error(data.error);
          })
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表数据失败');
    } finally {
      setLoadingFields(false);
      setLoadingRecords(false);
    }
  };

  // 步骤导航
  const nextStep = () => {
    if (currentStep === 1 && !parsedConfig) {
      setError('请先解析飞书链接');
      return;
    }
    if (currentStep === 2 && selectedTableIds.length === 0) {
      setError('请先选择至少一个工作表');
      return;
    }
    if (currentStep === 3) {
      // 检查文件模式下的文件上传
      if (inputMode === 'file' && !selectedFile) {
        setError('请先上传文件');
        return;
      }
      // 检查粘贴模式下的内容
      if (inputMode === 'paste' && !pastedContent.trim()) {
        setError('请先粘贴内容');
        return;
      }
      // 检查是否有工作表未选择Sheet（仅文件模式）
      if (inputMode === 'file' && excelSheetNames.length > 0) {
        const tablesWithoutSheet: string[] = [];
        selectedTableIds.forEach(tableId => {
          if (!tableToSheetMapping[tableId]) {
            const table = tables.find(t => t.id === tableId);
            tablesWithoutSheet.push(table?.name || tableId);
          }
        });
        
        if (tablesWithoutSheet.length > 0) {
          setError(`以下工作表未选择对应的Excel Sheet：${tablesWithoutSheet.join('、')}`);
          return;
        }
      }
    }
    setCurrentStep((prev: Step) => Math.min(prev + 1, 4) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep((prev: Step) => Math.max(prev - 1, 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setUploadResult(null);
      setUploadResults({});
      setExcelSheetNames([]);
      setSelectedExcelSheet('');
      setTableToSheetMapping({});
      
      // 读取Excel的Sheet列表
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        await analyzeExcelSheets(file);
        
        // 为所有选中的工作表分析字段匹配
        if (selectedTableIds.length > 0) {
          await analyzeFieldMatchingForAllTables(file);
        }
      }
    }
  };

  // 处理拖拽
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setUploadResult(null);
      setUploadResults({});
      setExcelSheetNames([]);
      setSelectedExcelSheet('');
      setTableToSheetMapping({});
      
      // 读取Excel的Sheet列表
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        await analyzeExcelSheets(file);
        
        // 为所有选中的工作表分析字段匹配
        if (selectedTableIds.length > 0) {
          await analyzeFieldMatchingForAllTables(file);
        }
      }
    }
  };

  // 分析Excel的Sheet列表
  const analyzeExcelSheets = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const sheetNames = workbook.SheetNames;
      setExcelSheetNames(sheetNames);
      
      // 默认选中第一个Sheet
      if (sheetNames.length > 0) {
        setSelectedExcelSheet(sheetNames[0]);
      }
      
      console.log('📊 [Excel] 检测到', sheetNames.length, '个Sheet:', sheetNames);
    } catch (err) {
      console.error('❌ [Excel] 读取Sheet列表失败:', err);
    }
  };

  // 为所有选中的工作表分析字段匹配
  const analyzeFieldMatchingForAllTables = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return;
    }

    // 确保所有工作表都有字段列表
    for (const tableId of selectedTableIds) {
      if (!tableFields[tableId] || tableFields[tableId].length === 0) {
        console.log(`🔄 [字段匹配] 工作表 ${tableId} 字段列表为空，先同步字段...`);
        await fetchTableFields(tableId);
      }
    }

    // 为每个工作表分析字段匹配
    for (const tableId of selectedTableIds) {
      await analyzeFieldMatchingForTable(file, tableId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 处理粘贴
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    setPastedContent(text);
  };

  // 上传文件或粘贴内容
  const handleUpload = async () => {
    if (inputMode === 'file' && !selectedFile) {
      setError('请先选择文件');
      return;
    }

    if (inputMode === 'paste' && !pastedContent.trim()) {
      setError('请先粘贴内容');
      return;
    }

    if (selectedTableIds.length === 0) {
      setError('请先选择至少一个工作表');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResults({});

    try {
      // 读取文件内容
      let fileContent: Buffer;
      let fileName: string;
      let fileKey: string;
      let fileUrl: string;
      let uploadTime: string;

      if (inputMode === 'file' && selectedFile) {
        const bytes = await selectedFile.arrayBuffer();
        fileContent = Buffer.from(bytes);
        fileName = selectedFile.name;
      } else if (inputMode === 'paste') {
        fileContent = Buffer.from(pastedContent);
        fileName = `paste_${Date.now()}.txt`;
      } else {
        throw new Error('无效的输入模式');
      }

      uploadTime = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // 上传到对象存储（只需上传一次）
      const formData = new FormData();
      const uint8Array = new Uint8Array(fileContent);
      const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
      formData.append('file', blob, fileName);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || uploadData.details || '上传失败');
      }

      fileKey = uploadData.fileKey;
      fileUrl = uploadData.fileUrl;

      // 判断是否是多Sheet Excel
      const isMultiSheetExcel = excelSheetNames.length > 1 && inputMode === 'file' && selectedFile?.name.match(/\.(xlsx|xls)$/i);
      
      // 为每个选中的工作表同步数据
      const results: Record<string, UploadResult> = {};
      
      if (isMultiSheetExcel) {
        // 多Sheet模式：使用 tableToSheetMapping 映射
        for (const [tableId, sheetName] of Object.entries(tableToSheetMapping)) {
          if (!sheetName) continue;
          
          const table = tables.find(t => t.id === tableId);
          
          try {
            const syncFormData = new FormData();
            syncFormData.append('file', selectedFile!);
            syncFormData.append('sheetName', sheetName);
            
            if (parsedConfig) {
              syncFormData.append('spreadsheetToken', parsedConfig.spreadsheetToken);
              syncFormData.append('sheetId', tableId);
            }
            
            // 添加飞书配置
            if (feishuAppId && feishuAppSecret) {
              syncFormData.append('appId', feishuAppId);
              syncFormData.append('appSecret', feishuAppSecret);
            }

            const syncResponse = await fetch('/api/upload', {
              method: 'POST',
              body: syncFormData,
            });

            const syncData = await syncResponse.json();
            
            results[tableId] = {
              ...syncData,
              fileName: `Sheet: ${sheetName}`,
              tableName: table?.name || tableId,
            };
          } catch (err) {
            results[tableId] = {
              success: false,
              fileName: `Sheet: ${sheetName}`,
              tableName: table?.name || tableId,
              syncError: err instanceof Error ? err.message : '同步失败',
            } as any;
          }
        }
      } else {
        // 单Sheet模式：使用 selectedTableIds
        console.log('🎯 [上传] 开始单Sheet模式同步');
        console.log('📋 [上传] 已选工作表列表:', selectedTableIds);
        console.log('📋 [上传] 工作表详情:', selectedTableIds.map(tableId => {
          const table = tables.find(t => t.id === tableId);
          return { id: tableId, name: table?.name || '未知' };
        }));
        
        for (const tableId of selectedTableIds) {
          const table = tables.find(t => t.id === tableId);
          console.log(`🔄 [上传] 正在同步到工作表: ${table?.name} (ID: ${tableId})`);
          
          try {
            const syncFormData = new FormData();
            
            // 重新上传文件到指定工作表
            if (inputMode === 'file' && selectedFile) {
              syncFormData.append('file', selectedFile);
            } else {
              const pasteUint8Array = new Uint8Array(fileContent);
              const pasteBlob = new Blob([pasteUint8Array], { type: 'text/plain' });
              syncFormData.append('file', pasteBlob, fileName);
            }
            
            if (parsedConfig) {
              syncFormData.append('spreadsheetToken', parsedConfig.spreadsheetToken);
              syncFormData.append('sheetId', tableId);
            }
            
            // 添加飞书配置
            if (feishuAppId && feishuAppSecret) {
              syncFormData.append('appId', feishuAppId);
              syncFormData.append('appSecret', feishuAppSecret);
            }

            console.log(`📤 [上传] 发送请求到 /api/upload，工作表: ${table?.name} (ID: ${tableId})`);
            const syncResponse = await fetch('/api/upload', {
              method: 'POST',
              body: syncFormData,
            });

            const syncData = await syncResponse.json();
            console.log(`✅ [上传] 工作表 ${table?.name} 同步完成:`, syncData);
            
            results[tableId] = {
              ...syncData,
              fileName: table?.name || tableId,
              tableName: table?.name || tableId,
            };
          } catch (err) {
            console.error(`❌ [上传] 工作表 ${table?.name} 同步失败:`, err);
            results[tableId] = {
              success: false,
              fileName: table?.name || tableId,
              tableName: table?.name || tableId,
              syncError: err instanceof Error ? err.message : '同步失败',
            } as any;
          }
        }
      }

      setUploadResults(results);
      setSelectedFile(null);
      setPastedContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 批量同步上传所有模版
  const handleBatchUpload = async () => {
    const templatesWithFiles = historyTemplates.filter(template => templateFiles[template.id]);
    
    if (templatesWithFiles.length === 0) {
      setError('没有已上传文件的模版');
      return;
    }

    if (!feishuAppId || !feishuAppSecret) {
      setError('请先配置飞书 App ID 和 App Secret');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResults({});
    setBatchUploadProgress('');

    try {
      const results: Record<string, UploadResult> = {};
      let completedCount = 0;
      const totalCount = templatesWithFiles.length;

      for (const template of templatesWithFiles) {
        const file = templateFiles[template.id];
        if (!file) continue;

        // 更新进度
        completedCount++;
        setBatchUploadProgress(`正在同步 (${completedCount}/${totalCount}): ${template.name}`);

        // 判断是否是多Sheet Excel
        const sheetNames = templateSheetNames[template.id] || [];
        const isMultiSheetExcel = sheetNames.length > 1 && template.tableToSheetMapping && Object.keys(template.tableToSheetMapping).length > 0;

        if (isMultiSheetExcel) {
          // 多Sheet模式：使用 tableToSheetMapping
          for (const [tableId, sheetName] of Object.entries(template.tableToSheetMapping || {})) {
            if (!sheetName) continue;
            
            try {
              const syncFormData = new FormData();
              syncFormData.append('file', file);
              syncFormData.append('sheetName', sheetName as string);
              syncFormData.append('spreadsheetToken', template.spreadsheetToken);
              syncFormData.append('sheetId', tableId);
              syncFormData.append('appId', feishuAppId);
              syncFormData.append('appSecret', feishuAppSecret);

              const syncResponse = await fetch('/api/upload', {
                method: 'POST',
                body: syncFormData,
              });

              const syncData = await syncResponse.json();

              results[`${template.id}-${tableId}`] = {
                ...syncData,
                fileName: `Sheet: ${sheetName}`,
                tableName: `${template.name} - Sheet: ${sheetName}`,
              };
            } catch (err) {
              results[`${template.id}-${tableId}`] = {
                success: false,
                fileName: `Sheet: ${sheetName}`,
                tableName: `${template.name} - Sheet: ${sheetName}`,
                syncError: err instanceof Error ? err.message : '同步失败',
              } as any;
            }
          }
        } else {
          // 单Sheet模式：使用 selectedTableIds
          for (const tableId of template.selectedTableIds) {
            try {
              const syncFormData = new FormData();
              syncFormData.append('file', file);
              syncFormData.append('spreadsheetToken', template.spreadsheetToken);
              syncFormData.append('sheetId', tableId);
              syncFormData.append('appId', feishuAppId);
              syncFormData.append('appSecret', feishuAppSecret);

              const syncResponse = await fetch('/api/upload', {
                method: 'POST',
                body: syncFormData,
              });

              const syncData = await syncResponse.json();

              results[`${template.id}-${tableId}`] = {
                ...syncData,
                fileName: file.name,
                tableName: `${template.name} - ${tableId}`,
              };
            } catch (err) {
              results[`${template.id}-${tableId}`] = {
                success: false,
                fileName: file.name,
                tableName: `${template.name} - ${tableId}`,
                syncError: err instanceof Error ? err.message : '同步失败',
              } as any;
            }
          }
        }
      }

      setUploadResults(results);
      setBatchUploadProgress(`已完成 ${completedCount}/${totalCount} 个模版的同步`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量同步失败，请重试');
      setBatchUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 获取选中的工作表列表
  const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));

  const renderStep2 = () => (
    <Step2Enhanced
      // Step2 相关属性
      tables={tables}
      selectedTableIds={selectedTableIds}
      tableFields={tableFields}
      loadingTables={loadingTables}
      onToggleTable={handleSelectTable}
      onSelectAll={handleSelectAll}
      onClearSelection={handleClearSelection}
      historyTemplates={historyTemplates}
      onApplyTemplate={handleApplyTemplateFromStep2}
      onDeleteTemplate={handleDeleteTemplate}
      onSaveTemplate={handleSaveTemplateFromStep2}
      onNextStep={() => {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      // Step3 相关属性（输入方式）
      inputMode={inputMode}
      setInputMode={setInputMode}
      selectedFile={selectedFile}
      handleFileSelect={handleFileSelect}
      handleDrop={handleDrop}
      handleDragOver={handleDragOver}
      fileInputRef={fileInputRef}
      pastedContent={pastedContent}
      setPastedContent={setPastedContent}
      pasteAreaRef={pasteAreaRef}
      developerMode={developerMode}
    />
  );

  // 渲染第三步：上传文件选择内容粘贴




  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        {/* 侧边栏导航 */}
        <Sidebar 
          className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        >
          <SidebarContent className="py-4">
            {/* 顶部Logo和品牌区域 */}
            <SidebarGroup className="px-5 pb-5 mb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold text-foreground truncate">飞书数据同步</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">高效 · 精准 · 可靠</p>
                </div>
              </div>
            </SidebarGroup>

            {/* 主导航菜单 */}
            <SidebarGroup className="mb-6">
              <SidebarGroupLabel className="px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                数据同步流程
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {/* 步骤1：输入链接 */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentStep === 1}
                      onClick={() => {
                        setCurrentStep(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="gap-3 px-4 py-3 h-auto"
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${currentStep === 1 ? 'bg-primary text-primary-foreground' : currentStep > 1 ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {currentStep > 1 ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          '1'
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`text-sm font-medium truncate ${currentStep === 1 ? 'text-primary' : currentStep > 1 ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          输入表格链接
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          粘贴或输入飞书表格链接
                        </div>
                      </div>
                      {currentStep === 1 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* 步骤2：选择工作表 */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentStep === 2}
                      onClick={() => {
                        if (parsedConfig && currentStep >= 2) {
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={!parsedConfig}
                      className="gap-3 px-4 py-3 h-auto"
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${currentStep === 2 ? 'bg-primary text-primary-foreground' : currentStep > 2 ? 'bg-green-500 text-white' : !parsedConfig ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {currentStep > 2 ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          '2'
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`text-sm font-medium truncate ${currentStep === 2 ? 'text-primary' : currentStep > 2 ? 'text-green-600 dark:text-green-400' : !parsedConfig ? 'text-muted-foreground' : 'text-foreground'}`}>
                          选择工作表
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          选择目标工作表和字段
                        </div>
                      </div>
                      {currentStep === 2 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* 步骤3：选择输入方式 */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentStep === 3}
                      onClick={() => {
                        if (selectedTableIds.length > 0 && currentStep >= 3) {
                          setCurrentStep(3);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={selectedTableIds.length === 0}
                      className="gap-3 px-4 py-3 h-auto"
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${currentStep === 3 ? 'bg-primary text-primary-foreground' : currentStep > 3 ? 'bg-green-500 text-white' : selectedTableIds.length === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {currentStep > 3 ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          '3'
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`text-sm font-medium truncate ${currentStep === 3 ? 'text-primary' : currentStep > 3 ? 'text-green-600 dark:text-green-400' : selectedTableIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                          选择输入方式
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          上传文件或粘贴内容
                        </div>
                      </div>
                      {currentStep === 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* 步骤4：执行上传 */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentStep === 4}
                      onClick={() => {
                        if ((selectedFile || pastedContent) && currentStep >= 4) {
                          setCurrentStep(4);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={!selectedFile && !pastedContent}
                      className="gap-3 px-4 py-3 h-auto"
                    >
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${currentStep === 4 ? 'bg-primary text-primary-foreground' : (!selectedFile && !pastedContent) ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        '4'
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`text-sm font-medium truncate ${currentStep === 4 ? 'text-primary' : (!selectedFile && !pastedContent) ? 'text-muted-foreground' : 'text-foreground'}`}>
                          执行上传
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          确认并执行数据同步
                        </div>
                      </div>
                      {currentStep === 4 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-4" />

            {/* 辅助功能菜单 */}
            <SidebarGroup className="mb-6">
              <SidebarGroupLabel className="px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                辅助功能
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab('history')}
                      isActive={activeTab === 'history'}
                      className="gap-3 px-4 py-2.5"
                    >
                      <History className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm">历史记录</span>
                      {urlHistory.length > 0 && (
                        <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                          {urlHistory.length}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowSaveTemplateModal(true)}
                      className="gap-3 px-4 py-2.5"
                    >
                      <Save className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm">保存模板</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        const input = document.getElementById('sidebar-import-templates-input') as HTMLInputElement;
                        if (input) {
                          input.value = '';
                          input.click();
                        }
                      }}
                      className="gap-3 px-4 py-2.5"
                    >
                      <Upload className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm">导入模板</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleExportTemplates()}
                      className="gap-3 px-4 py-2.5"
                    >
                      <Download className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm">导出模板</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-4" />

            {/* 设置菜单 */}
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowFeishuConfig(true)}
                      className="gap-3 px-4 py-2.5"
                    >
                      <div className="relative flex-shrink-0">
                        <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        {feishuAppId && feishuAppSecret && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className="font-medium text-sm">飞书配置</span>
                      {feishuAppId && feishuAppSecret ? (
                        <span className="ml-auto text-xs text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                      ) : (
                        <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">需配置</span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setDeveloperMode(!developerMode)}
                      className="gap-3 px-4 py-2.5"
                    >
                      <Code className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm">开发者模式</span>
                      <div className="ml-auto flex-shrink-0">
                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${developerMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${developerMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* 主题选择器 */}
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="gap-3 px-4 py-2.5">
                          {theme === 'light' && <Sun className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                          {theme === 'dark' && <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                          {theme === 'system' && <Monitor className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                          {theme === 'highContrast' && <Zap className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                          {theme === 'sepia' && <Coffee className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                          <span className="font-medium text-sm">主题设置</span>
                          <span className="ml-auto text-xs text-muted-foreground capitalize flex-shrink-0">
                            {themes[theme]?.name || theme}
                          </span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel>选择主题</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(themes).map(([key, config]) => (
                          <DropdownMenuItem
                            key={key}
                            onClick={() => switchTheme(key as any)}
                            className={`${theme === key ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            <span className="text-sm">{config.name}</span>
                            {theme === key && (
                              <Check className="h-4 w-4 ml-auto" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* 隐藏的模板导入输入框 */}
            <input
              type="file"
              id="sidebar-import-templates-input"
              accept=".json"
              className="hidden"
              onChange={handleSidebarImport}
            />
          </SidebarContent>
        </Sidebar>

        {/* 主内容区域 */}
        <main className="flex-1 overflow-auto">
          <div className="h-full flex flex-col px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
            {/* 内容容器 - 优化宽度以减少空白 */}
            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
            {/* 顶部操作栏 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    {currentStep === 1 && '输入飞书表格链接'}
                    {currentStep === 2 && '选择工作表'}
                    {currentStep === 3 && '字段匹配和数据验证'}
                    {currentStep === 4 && '执行数据上传'}
                  </h1>
                  {/* 步骤指示器标签 */}
                  <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                    步骤 {currentStep}/4
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {currentStep === 1 && '粘贴飞书多维表格链接，系统将自动解析表格信息'}
                  {currentStep === 2 && '选择要同步数据的工作表和目标字段'}
                  {currentStep === 3 && '匹配数据字段并验证数据格式'}
                  {currentStep === 4 && '确认数据匹配结果并执行上传到飞书表格'}
                </p>
              </div>

              {/* 右侧操作按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 部署检查指示器 */}
                {previousDeploymentFound && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                    title="检测到之前的部署"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">之前已部署</span>
                  </Button>
                )}

                {/* 侧边栏触发器（移动端） */}
                <SidebarTrigger className="md:hidden" />
              </div>
            </div>

            {/* 当前步骤内容 */}
            <div className="animate-in fade-in duration-300 flex-1">
              {currentStep === 1 && (
                <Step1
                  feishuUrl={feishuUrl}
                  feishuAppId={feishuAppId}
                  feishuAppSecret={feishuAppSecret}
                  urlHistory={urlHistory}
                  historyTemplates={historyTemplates}
                  activeTab={activeTab}
                  loadingTables={loadingTables}
                  parsedConfig={parsedConfig}
                  tables={tables}
                  tableFields={tableFields}
                  error={error}
                  debugInfo={debugInfo}
                  inputMode={inputMode}
                  selectedFile={selectedFile}
                  pastedContent={pastedContent}
                  selectedTableIds={selectedTableIds}
                  templateFiles={templateFiles}
                  templateSheetNames={templateSheetNames}
                  templateSyncStatus={templateSyncStatus}
                  showSheetMappingDropdown={showSheetMappingDropdown}
                  showTableSelectorDropdown={showTableSelectorDropdown}
                  showSheetSelectorDropdown={showSheetSelectorDropdown}
                  expandedFieldDetails={expandedFieldDetails}
                  showSaveSuccess={showSaveSuccess}
                  batchUploadProgress={batchUploadProgress}
                  developerMode={developerMode}
                  onFeishuUrlChange={setFeishuUrl}
                  onParseUrl={handleParseUrl}
                  onClear={handleClear}
                  setActiveTab={setActiveTab}
                  onSelectHistoryUrl={handleSelectHistoryUrl}
                  setUrlHistory={setUrlHistory}
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
                  setShowFeishuConfig={setShowFeishuConfig}
                  setShowSheetMappingDropdown={setShowSheetMappingDropdown}
                  setShowTableSelectorDropdown={setShowTableSelectorDropdown}
                  setShowSheetSelectorDropdown={setShowSheetSelectorDropdown}
                  setExpandedFieldDetails={setExpandedFieldDetails}
                  setShowSaveSuccess={setShowSaveSuccess}
                  setDebugInfo={setDebugInfo}
                  onRefreshTables={handleRefreshTables}
                />
              )}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && (
                <Step3
                  inputMode={inputMode}
                  setInputMode={setInputMode}
                  selectedFile={selectedFile}
                  handleFileSelect={handleFileSelect}
                  handleDrop={handleDrop}
                  handleDragOver={handleDragOver}
                  fileInputRef={fileInputRef}
                  pastedContent={pastedContent}
                  setPastedContent={setPastedContent}
                  pasteAreaRef={pasteAreaRef}
                  selectedTableIds={selectedTableIds}
                  tables={tables}
                  tableFieldMatches={tableFieldMatches}
                  tableFields={tableFields}
                  tableToSheetMapping={tableToSheetMapping}
                  excelSheetNames={excelSheetNames}
                  applyingTemplate={applyingTemplate}
                  showAllFields={showAllFields}
                  setShowAllFields={setShowAllFields}
                  loadingFields={loadingFields}
                  fetchTableFields={fetchTableFields}
                  analyzeFieldMatchingForTable={analyzeFieldMatchingForTable}
                  setShowSaveTemplateModal={setShowSaveTemplateModal}
                  historyTemplates={historyTemplates}
                  handleDeleteTemplate={handleDeleteTemplate}
                  applySheetMappingFromTemplate={applySheetMappingFromTemplate}
                  developerMode={developerMode}
                />
              )}
              {currentStep === 4 && (
                <Step4
                  inputMode={inputMode}
                  selectedFile={selectedFile}
                  pastedContent={pastedContent}
                  selectedTableIds={selectedTableIds}
                  tables={tables}
                  uploadResults={uploadResults}
                  uploading={uploading}
                  uploadResult={uploadResult}
                  error={error}
                  handleUpload={handleUpload}
                  setUploadResults={setUploadResults}
                  setSelectedFile={setSelectedFile}
                  setPastedContent={setPastedContent}
                  setCurrentStep={setCurrentStep}
                  developerMode={developerMode}
                />
              )}
            </div>

            {/* 底部导航按钮 */}
            <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <Button
                onClick={prevStep}
                disabled={currentStep === 1}
                variant="outline"
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                上一步
              </Button>
              <Button
                onClick={nextStep}
                disabled={
                  currentStep === 4 ||
                  (currentStep === 1 && !parsedConfig) ||
                  (currentStep === 2 && selectedTableIds.length === 0)
                }
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                {currentStep === 4 ? '完成' : '下一步'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            </div>{/* 关闭内容容器 */}
          </div>
        </main>
      </div>

      {/* 模版保存弹窗 */}
      <SaveTemplateDialog
        isOpen={showSaveTemplateModal}
        isStep3={currentStep === 3}
        isStep2={currentStep === 2}
        templateToEdit={templateToEdit}
        feishuUrl={feishuUrl}
        selectedTableIds={selectedTableIds}
        inputMode={inputMode}
        tableToSheetMapping={tableToSheetMapping}
        tables={tables}
        onClose={() => {
          setShowSaveTemplateModal(false);
          setTemplateToEdit(null);
        }}
        onSave={handleSaveTemplate}
        onError={setError}
      />

      {/* 飞书配置弹窗 */}
      {showFeishuConfig && (
        <FeishuConfig
          onSave={(appId, appSecret) => {
            saveFeishuConfig(appId, appSecret);
            console.log('✅ [飞书配置] 已更新配置');
          }}
          onClose={() => setShowFeishuConfig(false)}
        />
      )}
    </SidebarProvider>
  );
}
