'use client';

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface SplitPaneProps {
  orientation?: 'vertical' | 'horizontal';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  storageKey?: string;
  children?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
}

export function SplitPane({
  orientation = 'vertical',
  defaultSize = 256,
  minSize = 200,
  maxSize = 400,
  storageKey,
  children,
  left,
  right,
  defaultLeftWidth,
  minLeftWidth,
  minRightWidth,
}: SplitPaneProps) {
  const isLegacyMode = left !== undefined || right !== undefined;
  const isVertical = orientation === 'vertical';
  
  const initialSize = isLegacyMode 
    ? (defaultLeftWidth ?? 50)
    : defaultSize;
  
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) {
          if (isLegacyMode) {
            const minW = minLeftWidth ?? 20;
            const maxW = 100 - (minRightWidth ?? 20);
            if (parsed >= minW && parsed <= maxW) {
              setSize(parsed);
            }
          } else {
            const minW = minSize;
            const maxW = maxSize;
            if (parsed >= minW && parsed <= maxW) {
              setSize(parsed);
            }
          }
        }
      }
    }
  }, [storageKey, isLegacyMode, minLeftWidth, minRightWidth, minSize, maxSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    let newSize: number;
    
    if (isLegacyMode) {
      const containerSize = isVertical ? containerRect.width : containerRect.height;
      const clientPos = isVertical ? e.clientX : e.clientY;
      const containerStart = isVertical ? containerRect.left : containerRect.top;
      
      newSize = ((clientPos - containerStart) / containerSize) * 100;
      
      const minW = minLeftWidth ?? 20;
      const maxW = 100 - (minRightWidth ?? 20);
      newSize = Math.max(minW, Math.min(maxW, newSize));
    } else {
      const clientPos = isVertical ? e.clientX : e.clientY;
      const containerStart = isVertical ? containerRect.left : containerRect.top;
      
      newSize = clientPos - containerStart;
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
    }

    setSize(newSize);
  }, [isDragging, isVertical, isLegacyMode, minLeftWidth, minRightWidth, minSize, maxSize]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && storageKey) {
      localStorage.setItem(storageKey, size.toString());
    }
    setIsDragging(false);
  }, [isDragging, storageKey, size]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isVertical ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, isVertical]);

  const getStyle = () => {
    if (isLegacyMode) {
      return isVertical 
        ? { width: `${size}%` }
        : { height: `${size}%` };
    } else {
      return isVertical
        ? { width: `${size}px` }
        : { height: `${size}px` };
    }
  };

  if (isLegacyMode) {
    return (
      <div ref={containerRef} className="flex w-full h-full">
        <div
          className="overflow-hidden transition-all duration-150"
          style={getStyle()}
        >
          {left}
        </div>
        
        <div
          className={`flex-shrink-0 ${isVertical ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'} flex items-center justify-center group ${
            isDragging ? 'bg-blue-500' : 'hover:bg-blue-300'
          } transition-colors duration-150`}
          onMouseDown={handleMouseDown}
        >
          <div className={`${isVertical ? 'h-8 w-1' : 'w-8 h-1'} rounded-full transition-colors duration-150 ${
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

  const childArray = React.Children.toArray(children);
  const firstChild = childArray[0];
  const secondChild = childArray[1];

  return (
    <div ref={containerRef} className="flex w-full h-full">
      <div
        className="overflow-hidden transition-all duration-150"
        style={getStyle()}
      >
        {firstChild}
      </div>
      
      <div
        className={`flex-shrink-0 ${isVertical ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'} flex items-center justify-center group ${
          isDragging ? 'bg-blue-500' : 'hover:bg-blue-300'
        } transition-colors duration-150`}
        onMouseDown={handleMouseDown}
      >
        <div className={`${isVertical ? 'h-8 w-1' : 'w-8 h-1'} rounded-full transition-colors duration-150 ${
          isDragging ? 'bg-white' : 'bg-gray-400 group-hover:bg-blue-400'
        }`} />
      </div>
      
      <div
        className="overflow-hidden transition-all duration-150 flex-1"
      >
        {secondChild}
      </div>
    </div>
  );
}
