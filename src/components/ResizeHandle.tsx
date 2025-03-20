import React, { useRef, useEffect, useState } from 'react';
import { useMantineTheme } from '@mantine/core';

interface ResizeHandleProps {
  onResize: (height: number) => void;
  snapPoints?: number[];
  minHeight?: number;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
  onResize, 
  snapPoints = [0.3, 0.5, 0.75], // Default snap points as percentages of viewport height
  minHeight = 150 // Minimum height in pixels
}) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const theme = useMantineTheme();
  const viewportHeight = window.innerHeight;
  const headerHeight = 56; // Your fixed header height

  // Calculate available height (viewport minus header)
  const availableHeight = viewportHeight - headerHeight;

  // Touch event handlers
  const handleTouchStart = (e: any) => {
    const touchY = e.touches[0].clientY;
    setStartY(touchY);
    
    // Find the parent element with height
    const resizableElement = handleRef.current?.parentElement;
    if (!resizableElement) return;
    setStartHeight(resizableElement.offsetHeight);
    setIsDragging(true);
    
    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchMove = (e: any) => {
    if (!isDragging) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - startY;
    
    // Calculate new height (invert deltaY since dragging down should reduce height)
    const newHeight = Math.max(minHeight, startHeight - deltaY);
    
    // Don't exceed available height
    const boundedHeight = Math.min(availableHeight * 0.9, newHeight);
    
    // Update immediately for smooth dragging
    onResize(boundedHeight);
    
    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    // Get current height of parent
    const resizableElement = handleRef.current?.parentElement;
    const currentHeight = resizableElement?.offsetHeight;
    
    // Calculate current percentage of available height
    const currentPercent = currentHeight? currentHeight / availableHeight : 50;
    
    // Find closest snap point
    let closestSnapPoint = snapPoints[0];
    let minDistance = Math.abs(currentPercent - snapPoints[0]);
    
    snapPoints.forEach(point => {
      const distance = Math.abs(currentPercent - point);
      if (distance < minDistance) {
        minDistance = distance;
        closestSnapPoint = point;
      }
    });
    
    // Apply the closest snap point
    onResize(availableHeight * closestSnapPoint);
    
    setIsDragging(false);
  };

  // Add listeners that work outside the component
  useEffect(() => {
    const handleMove = (e: any) => {
      if (isDragging) {
        handleTouchMove(e);
      }
    };

    const handleEnd = () => {
      if (isDragging) {
        handleTouchEnd();
      }
    };

    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, startY, startHeight]);


  return (
    <div 
      ref={handleRef}
      onTouchStart={handleTouchStart}
      style={{
        width: '100%',
        height: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'ns-resize',
        userSelect: 'none',
        touchAction: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '4px',
          borderRadius: '2px',
        }}
      />
    </div>
  );
};

export default ResizeHandle;