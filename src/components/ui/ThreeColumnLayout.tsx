'use client';

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';

interface ThreeColumnLayoutProps {
  left: ReactNode;
  middle: ReactNode;
  right: ReactNode;
  leftMinWidth?: number;
  middleMinWidth?: number;
  rightMinWidth?: number;
  storageKey?: string;
}

export function ThreeColumnLayout({
  left,
  middle,
  right,
  leftMinWidth = 200,
  middleMinWidth = 300,
  rightMinWidth = 300,
  storageKey = 'three-column-layout',
}: ThreeColumnLayoutProps) {
  // 根据屏幕尺寸动态设置初始比例
  const getInitialLayout = () => {
    if (typeof window === 'undefined') return { left: 20, middle: 40 };
    
    const screenWidth = window.innerWidth;
    
    // 小屏幕（< 1366px）：更紧凑的布局
    if (screenWidth < 1366) {
      return { left: 18, middle: 38 };
    }
    // 中等屏幕（1366px - 1600px）：标准布局
    if (screenWidth < 1600) {
      return { left: 20, middle: 40 };
    }
    // 大屏幕（> 1600px）：更宽松的布局
    return { left: 20, middle: 40 };
  };

  const [leftWidth, setLeftWidth] = useState(getInitialLayout().left);
  const [middleWidth, setMiddleWidth] = useState(getInitialLayout().middle);
  const [dragging, setDragging] = useState<'left' | 'middle' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听窗口大小变化，动态调整最小宽度百分比
  const [minWidthPercents, setMinWidthPercents] = useState({
    left: 15,
    middle: 20,
    right: 20,
  });

  useEffect(() => {
    const handleResize = () => {
      // 窗口大小改变时，重新计算最小宽度百分比
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const totalWidth = rect.width;
        
        setMinWidthPercents({
          left: Math.min(25, (leftMinWidth / totalWidth) * 100),
          middle: Math.min(30, (middleMinWidth / totalWidth) * 100),
          right: Math.min(30, (rightMinWidth / totalWidth) * 100),
        });
      }
    };

    handleResize();
    
    // 使用 debounce 避免频繁触发
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [leftMinWidth, middleMinWidth, rightMinWidth]);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.left && parsed.middle) {
            setLeftWidth(parsed.left);
            setMiddleWidth(parsed.middle);
          }
        } catch (e) {
          console.error('Failed to parse saved layout:', e);
        }
      }
    }
  }, [storageKey]);

  const saveLayout = useCallback(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({
        left: leftWidth,
        middle: middleWidth,
      }));
    }
  }, [storageKey, leftWidth, middleWidth]);

  const handleMouseDown = useCallback((divider: 'left' | 'middle') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(divider);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const totalWidth = rect.width;
    const x = e.clientX - rect.left;

    if (dragging === 'left') {
      const newLeftWidth = (x / totalWidth) * 100;
      const constrainedLeft = Math.max(minWidthPercents.left, Math.min(100 - minWidthPercents.middle - minWidthPercents.right, newLeftWidth));
      
      setLeftWidth(constrainedLeft);
    } else if (dragging === 'middle') {
      const newMiddleWidth = (x / totalWidth) * 100 - leftWidth;
      const constrainedMiddle = Math.max(minWidthPercents.middle, Math.min(100 - leftWidth - minWidthPercents.right, newMiddleWidth));
      
      setMiddleWidth(constrainedMiddle);
    }
  }, [dragging, minWidthPercents, leftWidth]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      saveLayout();
      setDragging(null);
    }
  }, [dragging, saveLayout]);

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const rightWidth = Math.max(0, 100 - leftWidth - middleWidth);

  return (
    <div ref={containerRef} className="flex w-full h-full">
      <div
        className="overflow-hidden transition-all duration-150"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>
      
      <div
        className={`flex-shrink-0 w-1.5 cursor-col-resize flex items-center justify-center group ${
          dragging === 'left' ? 'bg-blue-500' : 'hover:bg-blue-300'
        } transition-colors duration-150`}
        onMouseDown={handleMouseDown('left')}
      >
        <div className={`h-8 w-1 rounded-full transition-colors duration-150 ${
          dragging === 'left' ? 'bg-white' : 'bg-gray-400 group-hover:bg-blue-400'
        }`} />
      </div>
      
      <div
        className="overflow-hidden transition-all duration-150"
        style={{ width: `${middleWidth}%` }}
      >
        {middle}
      </div>
      
      <div
        className={`flex-shrink-0 w-1.5 cursor-col-resize flex items-center justify-center group ${
          dragging === 'middle' ? 'bg-blue-500' : 'hover:bg-blue-300'
        } transition-colors duration-150`}
        onMouseDown={handleMouseDown('middle')}
      >
        <div className={`h-8 w-1 rounded-full transition-colors duration-150 ${
          dragging === 'middle' ? 'bg-white' : 'bg-gray-400 group-hover:bg-blue-400'
        }`} />
      </div>
      
      <div
        className="overflow-hidden transition-all duration-150 flex-1"
        style={{ width: `${rightWidth}%` }}
      >
        {right}
      </div>
    </div>
  );
}
