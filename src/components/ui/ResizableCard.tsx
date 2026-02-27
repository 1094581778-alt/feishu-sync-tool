'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Grip } from 'lucide-react';

interface ResizableCardProps {
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  storageKey?: string;
  className?: string;
  onResize?: (width: number, height: number) => void;
}

type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se';

export function ResizableCard({
  children,
  defaultWidth = 400,
  defaultHeight = 300,
  minWidth = 200,
  minHeight = 150,
  maxWidth,
  maxHeight,
  storageKey,
  className = '',
  onResize,
}: ResizableCardProps) {
  const [dimensions, setDimensions] = useState({ width: defaultWidth, height: defaultHeight });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>('se');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startDimensions, setStartDimensions] = useState({ width: 0, height: 0 });
  const [startPosition, setStartPosition] = useState({ left: 0, top: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const getViewportBounds = useCallback(() => {
    return {
      maxWidth: maxWidth || 99999,
      maxHeight: maxHeight || 99999,
    };
  }, [maxWidth, maxHeight]);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.width && parsed.height) {
            const bounds = getViewportBounds();
            const validWidth = Math.max(minWidth, Math.min(bounds.maxWidth, parsed.width));
            const validHeight = Math.max(minHeight, Math.min(bounds.maxHeight, parsed.height));
            setDimensions({ width: validWidth, height: validHeight });
          }
        } catch (e) {
          console.error('Failed to parse saved dimensions:', e);
        }
      }
    }
  }, [storageKey, minWidth, minHeight, getViewportBounds]);

  const getCursorStyle = (direction: ResizeDirection) => {
    switch (direction) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      default:
        return 'nwse-resize';
    }
  };

  const handleMouseDown = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartDimensions({ width: dimensions.width, height: dimensions.height });
    setStartPosition({ left: rect.left, top: rect.top });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const bounds = getViewportBounds();
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    let newWidth = startDimensions.width;
    let newHeight = startDimensions.height;

    switch (resizeDirection) {
      case 'se':
        newWidth = startDimensions.width + deltaX;
        newHeight = startDimensions.height + deltaY;
        break;
      case 'sw':
        newWidth = startDimensions.width - deltaX;
        newHeight = startDimensions.height + deltaY;
        break;
      case 'ne':
        newWidth = startDimensions.width + deltaX;
        newHeight = startDimensions.height - deltaY;
        break;
      case 'nw':
        newWidth = startDimensions.width - deltaX;
        newHeight = startDimensions.height - deltaY;
        break;
    }

    newWidth = Math.max(minWidth, Math.min(bounds.maxWidth, newWidth));
    newHeight = Math.max(minHeight, Math.min(bounds.maxHeight, newHeight));

    setDimensions({ width: newWidth, height: newHeight });
    onResize?.(newWidth, newHeight);
  }, [isResizing, resizeDirection, startPos, startDimensions, minWidth, minHeight, getViewportBounds, onResize]);

  const handleMouseUp = useCallback(() => {
    if (isResizing && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(dimensions));
    }
    setIsResizing(false);
  }, [isResizing, storageKey, dimensions]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = getCursorStyle(resizeDirection);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp, resizeDirection]);

  const bounds = getViewportBounds();

  const cornerHandleClass = (direction: ResizeDirection) => `
    absolute w-5 h-5 flex items-center justify-center transition-all duration-150 z-20
    ${isResizing && resizeDirection === direction 
      ? 'bg-primary text-primary-foreground scale-110' 
      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
    }
  `;

  return (
    <div
      ref={containerRef}
      className={`relative bg-card text-card-foreground rounded-xl shadow-md hover:shadow-lg duration-300 overflow-hidden border border-gray-200 dark:border-gray-800 ${className} ${
        isResizing ? 'ring-2 ring-primary/50' : ''
      }`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        maxWidth: `${bounds.maxWidth}px`,
        maxHeight: `${bounds.maxHeight}px`,
      }}
    >
      <div className="w-full h-full overflow-auto">
        {children}
      </div>

      <div
        className={`${cornerHandleClass('nw')} top-0 left-0 rounded-br-lg cursor-nwse-resize`}
        onMouseDown={handleMouseDown('nw')}
      >
        <Grip className="h-3 w-3 rotate-45" />
      </div>

      <div
        className={`${cornerHandleClass('ne')} top-0 right-0 rounded-bl-lg cursor-nesw-resize`}
        onMouseDown={handleMouseDown('ne')}
      >
        <Grip className="h-3 w-3 -rotate-45" />
      </div>

      <div
        className={`${cornerHandleClass('sw')} bottom-0 left-0 rounded-tr-lg cursor-nesw-resize`}
        onMouseDown={handleMouseDown('sw')}
      >
        <Grip className="h-3 w-3 -rotate-45" />
      </div>

      <div
        className={`${cornerHandleClass('se')} bottom-0 right-0 rounded-tl-lg cursor-nwse-resize`}
        onMouseDown={handleMouseDown('se')}
      >
        <Grip className="h-3 w-3 rotate-45" />
      </div>

      {isResizing && (
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-primary/90 text-primary-foreground text-xs rounded-lg font-mono shadow-lg z-30">
          {Math.round(dimensions.width)} × {Math.round(dimensions.height)}
        </div>
      )}
    </div>
  );
}
