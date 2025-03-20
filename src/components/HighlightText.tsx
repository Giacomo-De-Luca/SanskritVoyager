import React, { useEffect, useRef } from 'react';
import Mark from 'mark.js';
import classes from './AdvancedSearch.module.css';

interface HighlightTextProps {
  text: string;
  query: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, query }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && query && query.trim()) {

      
      const instance = new Mark(containerRef.current);
      const searchTerms = query.trim().split(/\s+/);
      instance.mark(searchTerms, {
        separateWordSearch: true,
        diacritics: true,           // Enable diacritic insensitivity
        accuracy: 'complementary',  // Improved matching for diacritics
        caseSensitive: false        // Case insensitive matching
      });
    }
  }, [text, query]);

  return (
    <div ref={containerRef} className={classes.highlightedBox}>
      {text}
    </div>
  );
};

export default HighlightText;