import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MousePointer2, X } from 'lucide-react';

interface HighlightOverlayProps {
  onSelectionComplete: (rect: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  onSelectionComplete,
  onCancel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && startPos && currentPos) {
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      
      if (width > 10 && height > 10) {
        const rect = {
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          width,
          height,
        };
        onSelectionComplete(rect);
      }
    }
    
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
  }, [isDragging, startPos, currentPos, onSelectionComplete]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Calculate selection box
  const selectionBox = React.useMemo(() => {
    if (!startPos || !currentPos) return null;
    
    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    return { left, top, width, height };
  }, [startPos, currentPos]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/30 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Instructions */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
        <MousePointer2 className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-slate-700">
          Click and drag to select an area
        </span>
        <span className="text-xs text-slate-500">Press ESC to cancel</span>
      </div>

      {/* Selection Box */}
      {selectionBox && (
        <>
          <div
            className="absolute border-2 border-purple-500 bg-purple-500/20 pointer-events-none"
            style={{
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          >
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
            
            {/* Dimensions label */}
            <div className="absolute -top-8 left-0 bg-purple-500 text-white text-xs px-2 py-1 rounded font-mono">
              {Math.round(selectionBox.width)} × {Math.round(selectionBox.height)}
            </div>
          </div>

          {/* Dim everything outside selection */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top */}
            <div
              className="absolute bg-black/50"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: selectionBox.top,
              }}
            />
            {/* Bottom */}
            <div
              className="absolute bg-black/50"
              style={{
                top: selectionBox.top + selectionBox.height,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Left */}
            <div
              className="absolute bg-black/50"
              style={{
                top: selectionBox.top,
                left: 0,
                width: selectionBox.left,
                height: selectionBox.height,
              }}
            />
            {/* Right */}
            <div
              className="absolute bg-black/50"
              style={{
                top: selectionBox.top,
                left: selectionBox.left + selectionBox.width,
                right: 0,
                height: selectionBox.height,
              }}
            />
          </div>
        </>
      )}

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 rounded-full shadow-lg transition-all"
      >
        <X className="w-4 h-4" />
        Cancel
      </button>
    </div>
  );
};