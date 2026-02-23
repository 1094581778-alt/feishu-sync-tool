/**
 * 应用全局状态管理 (Zustand)
 */

import { create } from 'zustand';
import type { Step, UploadResult, HistoryTemplate, FieldMatchResult, FeishuTable, FeishuField } from '@/types';

// 历史模版相关状态
interface TemplateState {
  showSaveTemplateModal: boolean;
  templateToEdit: HistoryTemplate | null;
  activeTab: 'history' | 'template';
  applyingTemplate: HistoryTemplate | null;
  showSheetMappingDropdown: string | null;
  templateFiles: Record<string, File>;
  templateSheetNames: Record<string, string[]>;
  templateSyncStatus: Record<string, { success: boolean; message: string }>;
}

// 文件上传相关状态
interface UploadState {
  selectedFile: File | null;
  uploading: boolean;
  uploadResult: UploadResult | null;
  error: string;
  pastedContent: string;
  inputMode: 'file' | 'paste';
  debugInfo: Record<string, any>;
}

// 飞书相关状态
interface FeishuState {
  feishuUrl: string;
  parsedConfig: { spreadsheetToken: string; sheetId?: string } | null;
  tables: FeishuTable[];
  fields: FeishuField[];
  records: any[];
  selectedTableIds: string[];
  tableFields: Record<string, FeishuField[]>;
}

// 加载状态
interface LoadingState {
  loadingTables: boolean;
  loadingFields: boolean;
  loadingRecords: boolean;
  analyzingFile: boolean;
}

// Excel 相关状态
interface ExcelState {
  excelSheetNames: string[];
  selectedExcelSheet: string;
  tableToSheetMapping: Record<string, string>;
  fileContent: Uint8Array | null;
  fileName: string;
  uploadResults: Record<string, UploadResult>;
  batchUploadProgress: string;
}

// 字段匹配状态
interface FieldMatchState {
  fieldMatchResults: FieldMatchResult[];
  tableFieldMatches: Record<string, FieldMatchResult[]>;
  showAllFields: Record<string, boolean>;
}

// UI 状态
interface UIState {
  currentStep: Step;
  showFeishuConfig: boolean;
  showHistory: boolean;
  tableChangeCount: number;
}

// 应用状态接口
interface AppState extends TemplateState, UploadState, FeishuState, LoadingState, ExcelState, FieldMatchState, UIState {
  // 模版操作
  setShowSaveTemplateModal: (show: boolean) => void;
  setTemplateToEdit: (template: HistoryTemplate | null) => void;
  setActiveTab: (tab: 'history' | 'template') => void;
  setApplyingTemplate: (template: HistoryTemplate | null) => void;
  setShowSheetMappingDropdown: (id: string | null) => void;
  setTemplateFiles: (files: Record<string, File>) => void;
  setTemplateSheetNames: (names: Record<string, string[]>) => void;
  setTemplateSyncStatus: (status: Record<string, { success: boolean; message: string }>) => void;
  
  // 文件操作
  setSelectedFile: (file: File | null) => void;
  setUploading: (uploading: boolean) => void;
  setUploadResult: (result: UploadResult | null) => void;
  setError: (error: string) => void;
  setPastedContent: (content: string) => void;
  setInputMode: (mode: 'file' | 'paste') => void;
  setDebugInfo: (info: Record<string, any>) => void;
  
  // 飞书操作
  setFeishuUrl: (url: string) => void;
  setParsedConfig: (config: { spreadsheetToken: string; sheetId?: string } | null) => void;
  setTables: (tables: FeishuTable[]) => void;
  setFields: (fields: FeishuField[]) => void;
  setRecords: (records: any[]) => void;
  setSelectedTableIds: (ids: string[]) => void;
  setTableFields: (fields: Record<string, FeishuField[]>) => void;
  
  // 加载操作
  setLoadingTables: (loading: boolean) => void;
  setLoadingFields: (loading: boolean) => void;
  setLoadingRecords: (loading: boolean) => void;
  setAnalyzingFile: (analyzing: boolean) => void;
  
  // Excel 操作
  setExcelSheetNames: (names: string[]) => void;
  setSelectedExcelSheet: (sheet: string) => void;
  setTableToSheetMapping: (mapping: Record<string, string>) => void;
  setFileContent: (content: Uint8Array | null) => void;
  setFileName: (name: string) => void;
  setUploadResults: (results: Record<string, UploadResult>) => void;
  setBatchUploadProgress: (progress: string) => void;
  
  // 字段匹配操作
  setFieldMatchResults: (results: FieldMatchResult[]) => void;
  setTableFieldMatches: (matches: Record<string, FieldMatchResult[]>) => void;
  setShowAllFields: (show: Record<string, boolean>) => void;
  
  // UI 操作
  setCurrentStep: (step: Step) => void;
  setShowFeishuConfig: (show: boolean) => void;
  setShowHistory: (show: boolean) => void;
  incrementTableChangeCount: () => void;
  
  // 重置操作
  resetUpload: () => void;
  resetFeishu: () => void;
  resetAll: () => void;
}

/**
 * 创建应用 Store
 */
export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  currentStep: 1,
  
  // 模版状态
  showSaveTemplateModal: false,
  templateToEdit: null,
  activeTab: 'history',
  applyingTemplate: null,
  showSheetMappingDropdown: null,
  templateFiles: {},
  templateSheetNames: {},
  templateSyncStatus: {},
  
  // 文件上传状态
  selectedFile: null,
  uploading: false,
  uploadResult: null,
  error: '',
  pastedContent: '',
  inputMode: 'file',
  debugInfo: {},
  
  // 飞书状态
  feishuUrl: '',
  parsedConfig: null,
  tables: [],
  fields: [],
  records: [],
  selectedTableIds: [],
  tableFields: {},
  
  // 加载状态
  loadingTables: false,
  loadingFields: false,
  loadingRecords: false,
  analyzingFile: false,
  
  // Excel 状态
  excelSheetNames: [],
  selectedExcelSheet: '',
  tableToSheetMapping: {},
  fileContent: null,
  fileName: '',
  uploadResults: {},
  batchUploadProgress: '',
  
  // 字段匹配状态
  fieldMatchResults: [],
  tableFieldMatches: {},
  showAllFields: {},
  
  // UI 状态
  showFeishuConfig: false,
  showHistory: false,
  tableChangeCount: 0,
  
  // 模版操作
  setShowSaveTemplateModal: (show) => set({ showSaveTemplateModal: show }),
  setTemplateToEdit: (template) => set({ templateToEdit: template }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setApplyingTemplate: (template) => set({ applyingTemplate: template }),
  setShowSheetMappingDropdown: (id) => set({ showSheetMappingDropdown: id }),
  setTemplateFiles: (files) => set({ templateFiles: files }),
  setTemplateSheetNames: (names) => set({ templateSheetNames: names }),
  setTemplateSyncStatus: (status) => set({ templateSyncStatus: status }),
  
  // 文件操作
  setSelectedFile: (file) => set({ selectedFile: file }),
  setUploading: (uploading) => set({ uploading }),
  setUploadResult: (result) => set({ uploadResult: result }),
  setError: (error) => set({ error }),
  setPastedContent: (content) => set({ pastedContent: content }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setDebugInfo: (info) => set({ debugInfo: info }),
  
  // 飞书操作
  setFeishuUrl: (url) => set({ feishuUrl: url }),
  setParsedConfig: (config) => set({ parsedConfig: config }),
  setTables: (tables) => set({ tables }),
  setFields: (fields) => set({ fields }),
  setRecords: (records) => set({ records }),
  setSelectedTableIds: (ids) => set({ selectedTableIds: ids }),
  setTableFields: (fields) => set({ tableFields: fields }),
  
  // 加载操作
  setLoadingTables: (loading) => set({ loadingTables: loading }),
  setLoadingFields: (loading) => set({ loadingFields: loading }),
  setLoadingRecords: (loading) => set({ loadingRecords: loading }),
  setAnalyzingFile: (analyzing) => set({ analyzingFile: analyzing }),
  
  // Excel 操作
  setExcelSheetNames: (names) => set({ excelSheetNames: names }),
  setSelectedExcelSheet: (sheet) => set({ selectedExcelSheet: sheet }),
  setTableToSheetMapping: (mapping) => set({ tableToSheetMapping: mapping }),
  setFileContent: (content) => set({ fileContent: content }),
  setFileName: (name) => set({ fileName: name }),
  setUploadResults: (results) => set({ uploadResults: results }),
  setBatchUploadProgress: (progress) => set({ batchUploadProgress: progress }),
  
  // 字段匹配操作
  setFieldMatchResults: (results) => set({ fieldMatchResults: results }),
  setTableFieldMatches: (matches) => set({ tableFieldMatches: matches }),
  setShowAllFields: (show) => set({ showAllFields: show }),
  
  // UI 操作
  setCurrentStep: (step) => set({ currentStep: step }),
  setShowFeishuConfig: (show) => set({ showFeishuConfig: show }),
  setShowHistory: (show) => set({ showHistory: show }),
  incrementTableChangeCount: () => set((state) => ({ tableChangeCount: state.tableChangeCount + 1 })),
  
  // 重置操作
  resetUpload: () => set({
    selectedFile: null,
    uploading: false,
    uploadResult: null,
    error: '',
    pastedContent: '',
    fileContent: null,
    fileName: '',
  }),
  
  resetFeishu: () => set({
    feishuUrl: '',
    parsedConfig: null,
    tables: [],
    fields: [],
    records: [],
    selectedTableIds: [],
    tableFields: {},
    tableToSheetMapping: {},
    tableFieldMatches: {},
  }),
  
  resetAll: () => set({
    currentStep: 1,
    showSaveTemplateModal: false,
    templateToEdit: null,
    activeTab: 'history',
    applyingTemplate: null,
    showSheetMappingDropdown: null,
    templateFiles: {},
    templateSheetNames: {},
    templateSyncStatus: {},
    selectedFile: null,
    uploading: false,
    uploadResult: null,
    error: '',
    pastedContent: '',
    inputMode: 'file',
    debugInfo: {},
    feishuUrl: '',
    parsedConfig: null,
    tables: [],
    fields: [],
    records: [],
    selectedTableIds: [],
    tableFields: {},
    loadingTables: false,
    loadingFields: false,
    loadingRecords: false,
    analyzingFile: false,
    excelSheetNames: [],
    selectedExcelSheet: '',
    tableToSheetMapping: {},
    fileContent: null,
    fileName: '',
    uploadResults: {},
    batchUploadProgress: '',
    fieldMatchResults: [],
    tableFieldMatches: {},
    showAllFields: {},
    showFeishuConfig: false,
    showHistory: false,
    tableChangeCount: 0,
  }),
}));

/**
 * 选择器 hooks
 */
export const useCurrentStep = () => useAppStore((state) => state.currentStep);
export const useUploadState = () => useAppStore((state) => ({
  selectedFile: state.selectedFile,
  uploading: state.uploading,
  uploadResult: state.uploadResult,
  error: state.error,
}));
export const useFeishuState = () => useAppStore((state) => ({
  tables: state.tables,
  selectedTableIds: state.selectedTableIds,
  feishuUrl: state.feishuUrl,
  parsedConfig: state.parsedConfig,
}));
