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
  const [leftWidth, setLeftWidth] = useState(20);
  const [middleWidth, setMiddleWidth] = useState(40);
  const [dragging, setDragging] = useState<'left' | 'middle' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    const leftMinPercent = (leftMinWidth / totalWidth) * 100;
    const middleMinPercent = (middleMinWidth / totalWidth) * 100;
    const rightMinPercent = (rightMinWidth / totalWidth) * 100;

    if (dragging === 'left') {
      const newLeftWidth = (x / totalWidth) * 100;
      const constrainedLeft = Math.max(leftMinPercent, Math.min(100 - middleMinPercent - rightMinPercent, newLeftWidth));
      
      setLeftWidth(constrainedLeft);
    } else if (dragging === 'middle') {
      const newMiddleWidth = (x / totalWidth) * 100 - leftWidth;
      const constrainedMiddle = Math.max(middleMinPercent, Math.min(100 - leftWidth - rightMinPercent, newMiddleWidth));
      
      setMiddleWidth(constrainedMiddle);
    }
  }, [dragging, leftMinWidth, middleMinWidth, rightMinWidth, leftWidth]);

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
