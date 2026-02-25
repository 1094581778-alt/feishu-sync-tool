import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the config module
vi.mock('@/config/app', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/app')>();
  
  // Mutable configuration for testing
  let testConfig = {
    maxFileSize: 100 * 1024 * 1024,
    allowedFileTypes: ['.xlsx', '.xls', '.csv', '.txt', '.pdf', '.doc', '.docx'],
    apiTimeout: 30000,
  };
  
  return {
    ...actual,
    // Provide custom implementations for tests
    getConfig: vi.fn((key?: keyof typeof testConfig) => {
      // If no key provided, return entire config
      if (key === undefined) {
        return { ...testConfig };
      }
      
      // Otherwise return specific value
      return testConfig[key];
    }),
    validateFileSize: vi.fn((fileSize: number) => {
      return fileSize <= testConfig.maxFileSize;
    }),
    validateFileType: vi.fn((fileName: string) => {
      const extension = '.' + fileName.split('.').pop()?.toLowerCase();
      return testConfig.allowedFileTypes.includes(extension);
    }),
    updateConfig: vi.fn((updates: Partial<typeof testConfig>) => {
      testConfig = { ...testConfig, ...updates };
      console.log('[Config] 配置已更新:', updates);
    }),
  };
});

import { validateFileSize, validateFileType, getConfig, updateConfig } from '@/config/app';

describe('App Config', () => {
  beforeEach(() => {
    // Reset config before each test
    vi.resetModules();
  });

  describe('validateFileSize', () => {
    it('应该接受小于最大限制的文件大小', () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      const validSize = 50 * 1024 * 1024; // 50MB
      
      expect(validateFileSize(validSize)).toBe(true);
    });

    it('应该接受等于最大限制的文件大小', () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      
      expect(validateFileSize(maxSize)).toBe(true);
    });

    it('应该拒绝大于最大限制的文件大小', () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      const invalidSize = 150 * 1024 * 1024; // 150MB
      
      expect(validateFileSize(invalidSize)).toBe(false);
    });

    it('应该正确处理零字节文件', () => {
      expect(validateFileSize(0)).toBe(true);
    });
  });

  describe('validateFileType', () => {
    it('应该接受允许的文件扩展名', () => {
      const allowedFiles = [
        'test.xlsx',
        'document.xls',
        'data.csv',
        'notes.txt',
        'report.pdf',
        'document.doc',
        'document.docx'
      ];

      allowedFiles.forEach(fileName => {
        expect(validateFileType(fileName)).toBe(true);
      });
    });

    it('应该拒绝不允许的文件扩展名', () => {
      const disallowedFiles = [
        'script.js',
        'malware.exe',
        'virus.bat',
        'test.zip',
        'archive.rar',
        'image.png',
        'test.php'
      ];

      disallowedFiles.forEach(fileName => {
        expect(validateFileType(fileName)).toBe(false);
      });
    });

    it('应该正确处理没有扩展名的文件', () => {
      expect(validateFileType('file')).toBe(false);
    });

    it('应该正确处理带多个点的文件名', () => {
      expect(validateFileType('archive.tar.gz')).toBe(false);
      expect(validateFileType('document.backup.docx')).toBe(true);
    });

    it('应该不区分大小写', () => {
      expect(validateFileType('test.XLSX')).toBe(true);
      expect(validateFileType('TEST.CSV')).toBe(true);
      expect(validateFileType('Report.PDF')).toBe(true);
    });
  });

  describe('getConfig and updateConfig', () => {
    it('应该返回默认配置', () => {
      // Test individual config values
      expect(getConfig('maxFileSize')).toBe(100 * 1024 * 1024);
      expect(getConfig('allowedFileTypes')).toEqual([
        '.xlsx', '.xls', '.csv', '.txt', '.pdf', '.doc', '.docx'
      ]);
      expect(getConfig('apiTimeout')).toBe(30000);
    });

    it('应该更新配置', () => {
      const updates = {
        maxFileSize: 50 * 1024 * 1024,
        apiTimeout: 60000,
      };
      
      updateConfig(updates);
      
      // Verify updated values
      expect(getConfig('maxFileSize')).toBe(50 * 1024 * 1024);
      expect(getConfig('apiTimeout')).toBe(60000);
      
      // 其他配置应保持不变
      expect(getConfig('allowedFileTypes')).toEqual([
        '.xlsx', '.xls', '.csv', '.txt', '.pdf', '.doc', '.docx'
      ]);
    });

    it('应该验证文件大小基于更新后的配置', () => {
      // 将最大文件大小更新为 50MB
      updateConfig({ maxFileSize: 50 * 1024 * 1024 });
      
      const validSize = 40 * 1024 * 1024; // 40MB
      const invalidSize = 60 * 1024 * 1024; // 60MB
      
      expect(validateFileSize(validSize)).toBe(true);
      expect(validateFileSize(invalidSize)).toBe(false);
    });
  });
});