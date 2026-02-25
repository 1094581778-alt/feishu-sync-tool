import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FeishuConfigProps {
  onSave: (appId: string, appSecret: string) => void;
  onClose: () => void;
}

export function FeishuConfig({ onSave, onClose }: FeishuConfigProps) {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 从 localStorage 加载已保存的配置
    const savedAppId = localStorage.getItem('feishuAppId') || '';
    const savedAppSecret = localStorage.getItem('feishuAppSecret') || '';
    setAppId(savedAppId);
    setAppSecret(savedAppSecret);
  }, []);

  const handleSave = () => {
    if (!appId.trim() || !appSecret.trim()) {
      setError('请填写完整的飞书 App ID 和 App Secret');
      return;
    }

    localStorage.setItem('feishuAppId', appId.trim());
    localStorage.setItem('feishuAppSecret', appSecret.trim());
    onSave(appId.trim(), appSecret.trim());
    setSaved(true);
    setError('');
    
    setTimeout(() => {
      onClose();
      setSaved(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              飞书配置
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            请输入飞书应用的 App ID 和 App Secret，用于调用飞书 API。
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="appId" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                飞书 App ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="appId"
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="cli_xxxxxxxxxxxxxxxx"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                示例：cli_xxxxxxxxxxxxxxxx
              </p>
            </div>

            <div>
              <Label htmlFor="appSecret" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                飞书 App Secret <span className="text-red-500">*</span>
              </Label>
              <Input
                id="appSecret"
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxx"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                请在飞书开放平台获取
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-900 dark:text-red-100">
                  {error}
                </p>
              </div>
            )}

            {saved && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                <p className="text-sm text-green-900 dark:text-green-100">
                  ✓ 配置已保存
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                className="flex-1"
              >
                保存配置
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

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 获取方式：访问 <a href="https://open.feishu.cn/app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">飞书开放平台</a> → 创建应用 → 凭证与基础信息
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
