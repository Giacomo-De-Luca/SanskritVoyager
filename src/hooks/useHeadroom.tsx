import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';

// UseLayoutEffect will show warning if used during ssr, e.g. with Next.js
// UseIsomorphicEffect removes it by replacing useLayoutEffect with useEffect during ssr
export const useIsomorphicEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

export const isFixed = (current: number, fixedAt: number) => current <= fixedAt;
export const isPinned = (current: number, previous: number) => current <= previous;
export const isReleased = (current: number, previous: number, fixedAt: number) =>
  !isPinned(current, previous) && !isFixed(current, fixedAt);

export const isPinnedOrReleased = (
  current: number,
  fixedAt: number,
  isCurrentlyPinnedRef: React.MutableRefObject<boolean>,
  isScrollingUp: boolean,
  onPin?: () => void,
  onRelease?: () => void
) => {
  const isInFixedPosition = isFixed(current, fixedAt);
  if (isInFixedPosition && !isCurrentlyPinnedRef.current) {
    isCurrentlyPinnedRef.current = true;
    onPin?.();
  } else if (!isInFixedPosition && isScrollingUp && !isCurrentlyPinnedRef.current) {
    isCurrentlyPinnedRef.current = true;
    onPin?.();
  } else if (!isInFixedPosition && isCurrentlyPinnedRef.current) {
    isCurrentlyPinnedRef.current = false;
    onRelease?.();
  }
};

interface ScrollPosition {
  x: number;
  y: number;
}

// Container scroll hook - replaces useWindowScroll
function useContainerScroll(containerRef: React.RefObject<HTMLElement>) {
  const [position, setPosition] = useState<ScrollPosition>({ x: 0, y: 0 });

  const getScrollPosition = useCallback((): ScrollPosition => {
    if (!containerRef.current) {
      return { x: 0, y: 0 };
    }
    return {
      x: containerRef.current.scrollLeft,
      y: containerRef.current.scrollTop,
    };
  }, [containerRef]);

  const scrollTo = useCallback(({ x, y }: Partial<ScrollPosition>) => {
    if (!containerRef.current) return;
    
    const scrollOptions: ScrollToOptions = { behavior: 'smooth' };
    
    if (typeof x === 'number') {
      scrollOptions.left = x;
    }
    
    if (typeof y === 'number') {
      scrollOptions.top = y;
    }
    
    containerRef.current.scrollTo(scrollOptions);
  }, [containerRef]);

  useEffect(() => {
    if (!containerRef.current) {
        // Reset position when container doesn't exist
        setPosition({ x: 0, y: 0 });
        return;
      }

    const container = containerRef.current;
    
    const handleScroll = () => {
      setPosition(getScrollPosition());
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Set initial position
    setPosition(getScrollPosition());
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, getScrollPosition]);

  return [position, scrollTo] as const;
}

// Container scroll direction hook - replaces useScrollDirection
export const useContainerScrollDirection = (containerRef: React.RefObject<HTMLElement>) => {
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let resizeTimer: NodeJS.Timeout | undefined;

    const onResize = () => {
      setIsResizing(true);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setIsResizing(false);
      }, 300); // Reset the resizing flag after a timeout
    };

    const onScroll = () => {
      if (isResizing) {
        return; // Skip scroll events if resizing is in progress
      }
      const currentScrollTop = container.scrollTop;
      setIsScrollingUp(currentScrollTop < lastScrollTop);
      setLastScrollTop(currentScrollTop);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [lastScrollTop, isResizing, containerRef]);

  return isScrollingUp;
};

interface UseContainerHeadroomInput {
  /** Ref to the scrolling container */
  containerRef: React.RefObject<HTMLElement>;
  /** Number in px at which element should be fixed */
  fixedAt?: number;
  /** Called when element is pinned */
  onPin?: () => void;
  /** Called when element is at fixed position */
  onFix?: () => void;
  /** Called when element is unpinned */
  onRelease?: () => void;
}

// Main container headroom hook
export function useContainerHeadroom({ 
  containerRef, 
  fixedAt = 0, 
  onPin, 
  onFix, 
  onRelease 
}: UseContainerHeadroomInput) {
  const isCurrentlyPinnedRef = useRef(false);
  const isScrollingUp = useContainerScrollDirection(containerRef);
  const [{ y: scrollPosition }] = useContainerScroll(containerRef);

  useIsomorphicEffect(() => {
    isPinnedOrReleased(
      scrollPosition,
      fixedAt,
      isCurrentlyPinnedRef,
      isScrollingUp,
      onPin,
      onRelease
    );
  }, [scrollPosition, fixedAt, isScrollingUp, onPin, onRelease]);

  useIsomorphicEffect(() => {
    if (isFixed(scrollPosition, fixedAt)) {
      onFix?.();
    }
  }, [scrollPosition, fixedAt, onFix]);

  if (isFixed(scrollPosition, fixedAt) || isScrollingUp) {
    return true;
  }

  return false;
}