import type { HistoryTemplate } from '@/types';

export async function readExcelData(
  template: HistoryTemplate,
  tableId: string,
  file: File
): Promise<Record<string, any>[]> {
  if (!file) return [];

  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = template.tableToSheetMapping?.[tableId];
  
  if (!sheetName) return [];

  const actualSheetName = workbook.SheetNames.find(
    (name) => name.toLowerCase() === sheetName.toLowerCase()
  ) || sheetName;
  
  if (!workbook.Sheets[actualSheetName]) return [];

  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(
    workbook.Sheets[actualSheetName], 
    { raw: false, dateNF: 'yyyy-mm-dd' }
  );

  console.log(`📊 [Excel读取] 工作表 ${tableId}，Sheet: ${actualSheetName}，数据行数: ${jsonData.length}`);
  console.log(`📊 [Excel读取] 字段列表:`, jsonData.length > 0 ? Object.keys(jsonData[0]) : []);

  return jsonData;
}

export async function readExcelSheetNames(file: File): Promise<string[]> {
  if (!file) return [];

  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  return workbook.SheetNames;
}

export async function readExcelWorkbook(file: File) {
  if (!file) return null;

  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}
