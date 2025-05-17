// ResizablePanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './ResizeHandler.module.css';

export interface ResizablePanelProps {
  /** Title displayed at the top of the panel */
  title?: string;
  /** Content to be rendered inside the panel */
  children: React.ReactNode;
  /** Which breakpoint to initialize the panel height with (index into breakpoints array) */
  initialBreakpointIndex?: number;
  /** Array of height values (in pixels) that the panel can snap to */
  breakpoints?: number[];
  /** Callback function called when the panel height changes */
  onResize?: (height: number) => void;
  /** Optional CSS class name to apply to the panel container */
  className?: string;
}

/**
 * A resizable panel component that appears from the bottom of the screen
 * with fluid touch/mouse interactions for resizing.
 */
const ResizablePanel: React.FC<ResizablePanelProps> = ({
  title = "", 
  children,
  initialBreakpointIndex = 1,
  breakpoints = [150, 300, 500, 700, 850],
  onResize = () => {},
  className = '',
}) => {
  // Initialize height with the selected breakpoint
  const [height, setHeight] = useState<number>(breakpoints[initialBreakpointIndex]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastClientYRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  
  // Find the closest breakpoint to snap to
  const findClosestBreakpoint = (value: number): number => {
    return breakpoints.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  };
  
  // Animation utility function with improved responsiveness
  const animateToHeight = (targetHeight: number, duration = 200): void => {
    // Immediately set a small step in the right direction to eliminate perceived lag
    const initialStep = (targetHeight > height) ? Math.min(targetHeight - height, 5) : Math.max(targetHeight - height, -5);
    setHeight(height + initialStep);
    
    // Then continue with the smooth animation
    const startValue = height + initialStep;
    const startTime = performance.now();
    
    const animate = (currentTime: number): void => {
      const elapsedTime = currentTime - startTime;
      
      // If we've just started (first few ms), accelerate more quickly
      if (elapsedTime < 50) {
        const fastStartProgress = Math.min(elapsedTime / 50, 1);
        // Accelerate faster at the beginning (quadratic instead of linear)
        const adjustedProgress = fastStartProgress * fastStartProgress * 0.2;
        const currentHeight = startValue + (targetHeight - startValue) * adjustedProgress;
        setHeight(currentHeight);
        requestAnimationFrame(animate);
        return;
      }
      
      // After fast start, continue with normal ease animation
      const progress = Math.min((elapsedTime - 50) / (duration - 50), 1);
      
      // Custom ease function with better initial response
      const easeProgress = progress < 0.5 ? 
        2 * progress * progress : 
        -1 + (4 - 2 * progress) * progress;
      
      const currentHeight = startValue + (targetHeight - startValue) * (0.2 + easeProgress * 0.8);
      
      setHeight(currentHeight);
      onResize(currentHeight);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  // Toggle between min and max heights (for double-tap)
  const toggleExpandCollapse = (): void => {
    const minHeight = Math.min(...breakpoints);
    const viewportHeight = window.innerHeight;
    const maxHeight = Math.min(Math.max(...breakpoints), viewportHeight * 0.8);
    
    // If we're closer to the max height, collapse to min, otherwise expand to max
    const targetHeight = (height > (minHeight + maxHeight) / 2) ? minHeight : maxHeight;
    
    // Apply a faster animation for toggle to feel responsive
    animateToHeight(targetHeight, 280);
  };

  // Handle start of drag operation
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent): void => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Drag operation now only handles dragging, not double-tap
    setIsDragging(true);
    startYRef.current = clientY;
    startHeightRef.current = height;
    
    // Initialize velocity tracking
    const now = Date.now();
    lastClientYRef.current = clientY;
    lastTimestampRef.current = now;
    velocityRef.current = 0;
  };
  
  // Handle drag movement
  const handleDrag = (e: MouseEvent | TouchEvent): void => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const now = Date.now();
    
    // Calculate velocity (pixels per millisecond)
    const deltaTime = now - lastTimestampRef.current;
    if (deltaTime > 0) {
      // Negative velocity means panel is growing (dragging up)
      // Positive velocity means panel is shrinking (dragging down)
      const instantVelocity = (clientY - lastClientYRef.current) / deltaTime;
      
      // Smooth out velocity with some averaging
      velocityRef.current = velocityRef.current * 0.7 + instantVelocity * 0.3;
      
      lastTimestampRef.current = now;
      lastClientYRef.current = clientY;
    }
    
    // For natural feeling: dragging up (decreasing clientY) increases panel height
    // dragging down (increasing clientY) decreases panel height
    const deltaY = startYRef.current - clientY;
    
    // Calculate new height within bounds - including viewport constraint
    const minHeight = Math.min(...breakpoints);
    const viewportHeight = window.innerHeight;
    const maxViewportHeight = viewportHeight * 0.8; // 80% of viewport height
    const maxHeight = Math.min(Math.max(...breakpoints), maxViewportHeight);
    
    let newHeight = Math.max(minHeight, Math.min(maxHeight, startHeightRef.current + deltaY));
    
    // Gradually approach breakpoints rather than sudden snapping
    // Only apply gentle nudging during dragging for a more natural feel
    const snapThreshold = 20;
    const closestBreakpoint = findClosestBreakpoint(newHeight);
    const distance = closestBreakpoint - newHeight;
    
    if (Math.abs(distance) < snapThreshold) {
      // Apply gentle attraction force - stronger as you get closer
      const attractionStrength = 0.3 * (1 - Math.abs(distance) / snapThreshold);
      newHeight = newHeight + (distance * attractionStrength);
    }
    
    setHeight(newHeight);
    onResize(newHeight);
  };
  
  // Handle end of dragging
  const handleDragEnd = (): void => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Determine if we have enough velocity for inertial scrolling
    const velocity = velocityRef.current;
    const isFlick = Math.abs(velocity) > 0.5; // Threshold to detect a flick gesture
    
    // Calculate bounds for animation
    const minHeight = Math.min(...breakpoints);
    const viewportHeight = window.innerHeight;
    const maxViewportHeight = viewportHeight * 0.8;
    const maxHeight = Math.min(Math.max(...breakpoints), maxViewportHeight);
    
    if (isFlick) {
      // Convert velocity to distance (pixels) with some multiplier for better feel
      // Negative velocity (upward flick) increases height
      // Positive velocity (downward flick) decreases height
      const velocityMultiplier = 80; // Adjust this for how much "throw" you want
      let projectedHeight = height - (velocity * velocityMultiplier);
      
      // Constrain to bounds
      projectedHeight = Math.max(minHeight, Math.min(maxHeight, projectedHeight));
      
      // Find the closest breakpoint to our projected destination
      const targetBreakpoint = findClosestBreakpoint(projectedHeight);
      
      // Animate to that breakpoint with duration based on distance
      const distance = Math.abs(targetBreakpoint - height);
      const baseDuration = 200;
      const velocityFactor = Math.min(Math.abs(velocity) * 100, 300);
      const duration = baseDuration + velocityFactor;
      
      animateToHeight(targetBreakpoint, duration);
    } else {
      // No significant velocity, just snap to closest breakpoint
      const closestBreakpoint = findClosestBreakpoint(height);
      animateToHeight(closestBreakpoint, 150);
    }
  };
  
  // Monitor window size changes to adjust maximum height
  useEffect(() => {
    const handleResize = (): void => {
      const viewportHeight = window.innerHeight;
      const maxViewportHeight = viewportHeight * 0.8; // 80% of viewport height
      
      // If current height exceeds new max height, reset to max
      if (height > maxViewportHeight) {
        const newHeight = Math.min(height, maxViewportHeight);
        setHeight(newHeight);
        onResize(newHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height, onResize]);

  // Set up and clean up event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => handleDrag(e);
    const handleTouchMove = (e: TouchEvent): void => handleDrag(e);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, height]);
  
  // Ensure initial height doesn't exceed viewport constraint
  useEffect(() => {
    const viewportHeight = window.innerHeight;
    const maxViewportHeight = viewportHeight * 0.8;
    
    if (breakpoints[initialBreakpointIndex] > maxViewportHeight) {
      const suitableHeight = Math.min(breakpoints[initialBreakpointIndex], maxViewportHeight);
      setHeight(suitableHeight);
      onResize(suitableHeight);
    }
  }, [breakpoints, initialBreakpointIndex, onResize]);
  
  // Double-tap handler for entire panel (not just the handle)
  const handlePanelTap = (e: React.MouseEvent | React.TouchEvent): void => {
    // Don't activate when dragging or when it's a drag operation
    if (isDragging || (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0)) return;
    
    // Handle double-tap detection
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;
    
    if (timeSinceLastTap < 300) { // 300ms threshold for double-tap
      toggleExpandCollapse();
      // Prevent default to avoid triggering other events
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  return (
    <div 
      className={`${styles.panelContainer} ${className}`}
      style={{ height: `${height}px` }}
      onMouseDown={handlePanelTap}
      onTouchStart={handlePanelTap}
    >
      {/* Drag handle - still needed for dragging */}
      <div 
        className={`${styles.dragHandle} ${isDragging ? styles.dragHandleGrabbing : ''}`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className={styles.dragIndicator} />
      </div>
      
      {/* Title */}
      {title && title.trim() !== "" && (
        <div className={styles.panelTitle}>
          {title}
        </div>
      )}
      
      {/* Content area with scrolling */}
      <div className={styles.contentArea}>
        {children}
      </div>
    </div>
  );
};

export default ResizablePanel;