import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';

interface SegmentMarker {
  segmentNumber: number;
  positionPercent: number; // Position as percentage of content height
  isActive: boolean;
}

interface ScrollbarMarkerOverlayProps {
  matchedSegments: SegmentMarker[];
  onMarkerClick: (segmentNumber: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ScrollbarMarkerOverlay: React.FC<ScrollbarMarkerOverlayProps> = ({ 
  matchedSegments = [],
  onMarkerClick,
  containerRef
}) => {
  // State to track container position
  const [containerRect, setContainerRect] = useState({ right: 0, top: 0, height: 0 });
  
  // Update container position on scroll and resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerRect({
          right: rect.right,
          top: rect.top,
          height: rect.height
        });
      }
    };
    
    // Initial position
    updatePosition();
    
    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [containerRef]);
  
  // Return early if there are no matched segments
  if (matchedSegments.length === 0) {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        right: window.innerWidth - containerRect.right - 12,
        top: containerRect.top,
        height: containerRect.height,
        width: '20px',
        pointerEvents: 'none',
        zIndex: 999
      }}
    >
      {matchedSegments.map(segment => (
        <div
          key={segment.segmentNumber}
          onClick={() => onMarkerClick(segment.segmentNumber)}
          style={{
            position: 'absolute',
            right: '2px', // Position from right edge of container instead of using 0
            top: `${segment.positionPercent}%`,
            width: '8px', // Use consistent width values
            height: segment.isActive ? '24px' : '12px',
            backgroundColor: segment.isActive ? 
              'var(--mantine-color-orange-6)' : 
              'var(--mantine-color-orange-4)',
            borderRadius: '2px',
            transform: 'translateY(-50%)',
            opacity: segment.isActive ? 0.7 : 0.5,
            cursor: 'pointer',
            pointerEvents: 'auto',
            transition: 'all 0.2s ease'
          }}
        />
      ))}
    </div>
  );
};

export default ScrollbarMarkerOverlay;