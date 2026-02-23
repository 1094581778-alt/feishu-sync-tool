/**
 * 文件处理 Hook
 */
import { useState, useRef } from 'react';
import type { FieldMatchResult, FeishuField } from '@/types';

export interface UseFileHandlerResult {
  selectedFile: File | null;
  excelSheetNames: string[];
  selectedExcelSheet: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setSelectedFile: (file: File | null) => void;
  setSelectedExcelSheet: (sheet: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDrop: (e: React.DragEvent) => Promise<void>;
  handleDragOver: (e: React.DragEvent) => void;
  analyzeExcelSheets: (file: File) => Promise<void>;
}

export function useFileHandler(
  onFileSelected?: (file: File) => void,
  onSheetsAnalyzed?: (sheets: string[]) => void
): UseFileHandlerResult {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [selectedExcelSheet, setSelectedExcelSheet] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 分析 Excel 的 Sheet 列表
  const analyzeExcelSheets = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const sheetNames = workbook.SheetNames;
      setExcelSheetNames(sheetNames);
      
      if (sheetNames.length > 0) {
        setSelectedExcelSheet(sheetNames[0]);
      }
      
      onSheetsAnalyzed?.(sheetNames);
      
      console.log('📊 [Excel] 检测到', sheetNames.length, '个Sheet:', sheetNames);
    } catch (err) {
      console.error('❌ [Excel] 读取Sheet列表失败:', err);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExcelSheetNames([]);
      setSelectedExcelSheet('');
      
      // 读取 Excel 的 Sheet 列表
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        await analyzeExcelSheets(file);
      }
      
      onFileSelected?.(file);
    }
  };

  // 处理拖拽
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setExcelSheetNames([]);
      setSelectedExcelSheet('');
      
      // 读取 Excel 的 Sheet 列表
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        await analyzeExcelSheets(file);
      }
      
      onFileSelected?.(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return {
    selectedFile,
    excelSheetNames,
    selectedExcelSheet,
    fileInputRef,
    setSelectedFile,
    setSelectedExcelSheet,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    analyzeExcelSheets,
  };
}
