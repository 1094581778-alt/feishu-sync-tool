"use client";

import { useEffect, useState, useRef } from "react";
import { AlertCircle, Monitor, Laptop, X } from "lucide-react";

export function EnvironmentNotice() {
  const [isTauri, setIsTauri] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    // 检测是否在 Tauri 环境中
    const checkEnvironment = () => {
      const tauri = typeof window !== 'undefined' && '__TAURI__' in window;
      setIsTauri(tauri);
    };
    checkEnvironment();
  }, []);

  // 倒计时自动关闭
  useEffect(() => {
    if (!isTauri && !dismissed && mounted) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setDismissed(true);
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isTauri, dismissed, mounted]);

  // 服务端渲染时不显示
  if (!mounted) {
    return null;
  }

  // Tauri 环境不显示提示
  if (isTauri) {
    return null;
  }

  // 已关闭不显示
  if (dismissed) {
    return null;
  }

  // 浏览器环境显示提示
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm relative">
      {/* 关闭按钮和倒计时 */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="text-xs text-amber-600 font-medium">
          {countdown > 0 ? `${countdown}秒后自动关闭` : ''}
        </span>
        <button
          onClick={() => {
            setDismissed(true);
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
          title="关闭提示"
        >
          <X className="h-3 w-3" />
          <span className="font-medium">关闭</span>
        </button>
      </div>

      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 pr-32">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="h-4 w-4 text-amber-700" />
            <h3 className="text-sm font-medium text-amber-800">
              浏览器环境提示
            </h3>
          </div>
          <div className="text-sm text-amber-700 space-y-2">
            <p>
              <strong>当前运行在浏览器环境中</strong>，以下功能可正常使用：
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs">
              <li className="flex items-center gap-1">
                <span className="text-green-600">✅</span>
                <span>历史模板管理</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="text-green-600">✅</span>
                <span>飞书数据同步</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="text-green-600">✅</span>
                <span>Excel 文件上传</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="text-green-600">✅</span>
                <span>字段匹配配置</span>
              </li>
            </ul>
            
            <div className="mt-3 p-3 bg-amber-100 rounded-lg">
              <div className="flex items-start gap-2">
                <Laptop className="h-4 w-4 text-amber-900 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900">
                  <p className="font-semibold mb-1">
                    💡 定时任务功能需要桌面应用版本：
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>真实文件扫描（本地路径）</li>
                    <li>后台定时执行（页面关闭后继续运行）</li>
                    <li>完整的文件系统访问</li>
                  </ul>
                  <p className="mt-2 text-amber-700">
                    <strong>提示：</strong> 历史模板等基础功能可正常使用，仅定时任务功能受限。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
