/**
 * React错误边界组件
 * 捕获子组件树中的JavaScript错误，显示降级UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode;
  /** 错误降级UI渲染函数 */
  fallback?: (error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode;
  /** 错误发生时的回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 错误重置时的回调 */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React错误边界组件
 * 
 * 使用方法:
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, errorInfo, resetError) => (
 *     <div>
 *       <h2>出错了</h2>
 *       <p>{error.message}</p>
 *       <button onClick={resetError}>重试</button>
 *     </div>
 *   )}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新state使下一次渲染显示降级UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 捕获错误并记录错误信息
    this.setState({
      errorInfo,
    });

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 记录错误到控制台
    console.error('ErrorBoundary捕获到错误:', error);
    console.error('错误信息:', errorInfo.componentStack);
  }

  resetErrorBoundary = (): void => {
    // 重置错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // 调用重置回调
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // 显示自定义降级UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!, this.resetErrorBoundary);
      }

      // 默认降级UI
      return (
        <div className="error-boundary p-6 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.31 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">应用出错了</h3>
              <div className="mb-4">
                <p className="text-red-700 mb-2">错误信息: {this.state.error.message}</p>
                {this.state.errorInfo && (
                  <div className="text-sm text-red-600 bg-red-100 p-3 rounded overflow-auto max-h-32">
                    <pre className="whitespace-pre-wrap font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={this.resetErrorBoundary}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  重试
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  刷新页面
                </button>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    onClick={() => {
                      console.error('错误详情:', this.state.error);
                      console.error('错误信息:', this.state.errorInfo);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    开发调试
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

/**
 * 飞书API错误边界
 * 专门用于捕获飞书API相关的错误
 */
interface FeishuErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallback' | 'onError'> {
  /** 飞书应用ID */
  appId?: string;
  /** 飞书应用密钥 */
  appSecret?: string;
}

export function FeishuErrorBoundary({ children, appId, appSecret, ...props }: FeishuErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo): void => {
    // 记录飞书API错误
    console.error('飞书API错误:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      appId: appId ? `${appId.substring(0, 8)}...` : '未配置',
      timestamp: new Date().toISOString(),
    });

    // 可以在这里发送错误到监控服务
  };

  const fallback = (error: Error, errorInfo: ErrorInfo, resetError: () => void) => (
    <div className="feishu-error-boundary p-6 rounded-lg border border-orange-200 bg-orange-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">飞书API连接错误</h3>
          <div className="mb-4">
            <p className="text-orange-700 mb-2">飞书API请求失败: {error.message}</p>
            <div className="text-sm text-orange-600 space-y-2">
              <p>可能的原因:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>飞书应用ID或密钥配置错误</li>
                <li>网络连接异常</li>
                <li>飞书API服务暂时不可用</li>
                <li>应用权限不足</li>
              </ul>
              <div className="mt-3 p-2 bg-orange-100 rounded text-xs">
                <p className="font-medium">当前配置:</p>
                <p>应用ID: {appId ? `${appId.substring(0, 8)}...` : '未配置'}</p>
                <p>应用密钥: {appSecret ? '已配置' : '未配置'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetError}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              重试连接
            </button>
            <button
              type="button"
              onClick={() => {
                // 跳转到配置页面
                const configEvent = new CustomEvent('open-feishu-config');
                window.dispatchEvent(configEvent);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              检查飞书配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      {...props}
      fallback={fallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}