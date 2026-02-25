import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export const TauriService = {
  async openFile(): Promise<string | null> {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Excel文件',
            extensions: ['xlsx', 'xls'],
          },
        ],
      });
      return selected as string | null;
    } catch (error) {
      console.error('打开文件失败:', error);
      return null;
    }
  },

  async saveFile(defaultName: string): Promise<string | null> {
    try {
      const selected = await open({
        save: true,
        defaultPath: defaultName,
        filters: [
          {
            name: 'Excel文件',
            extensions: ['xlsx'],
          },
        ],
      });
      return selected as string | null;
    } catch (error) {
      console.error('保存文件失败:', error);
      return null;
    }
  },

  async getAppVersion(): Promise<string> {
    try {
      return await invoke('get_app_version');
    } catch (error) {
      console.error('获取版本失败:', error);
      return '1.0.0';
    }
  },

  async greet(name: string): Promise<string> {
    try {
      return await invoke('greet', { name });
    } catch (error) {
      console.error('Greet失败:', error);
      return '';
    }
  },

  async checkPreviousDeployment(): Promise<boolean> {
    try {
      return await invoke('check_previous_deployment');
    } catch (error) {
      console.error('检查部署失败:', error);
      return false;
    }
  },
};

export const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
};
