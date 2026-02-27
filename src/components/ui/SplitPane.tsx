'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  storageKey?: string;
}

export function SplitPane({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  minRightWidth = 20,
  storageKey,
}: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= minLeftWidth && parsed <= 100 - minRightWidth) {
          setLeftWidth(parsed);
        }
      }
    }
  }, [storageKey, minLeftWidth, minRightWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const newLeftWidth = ((e.clientX - containerRect.left) / containerWidth) * 100;

    const constrainedWidth = Math.max(
      minLeftWidth,
      Math.min(100 - minRightWidth, newLeftWidth)
    );

    setLeftWidth(constrainedWidth);
  }, [isDragging, minLeftWidth, minRightWidth]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && storageKey) {
      localStorage.setItem(storageKey, leftWidth.toString());
    }
    setIsDragging(false);
  }, [isDragging, storageKey, leftWidth]);

  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
          isDragging ? 'bg-blue-500' : 'hover:bg-blue-300'
        } transition-colors duration-150`}
        onMouseDown={handleMouseDown}
      >
        <div className={`h-8 w-1 rounded-full transition-colors duration-150 ${
          isDragging ? 'bg-white' : 'bg-gray-400 group-hover:bg-blue-400'
        }`} />
      </div>
      
      <div
        className="overflow-hidden transition-all duration-150 flex-1"
      >
        {right}
      </div>
    </div>
  );
}
