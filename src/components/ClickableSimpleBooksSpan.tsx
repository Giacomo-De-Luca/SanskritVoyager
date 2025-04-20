import React from 'react';
import classes from './ClickableSimpleBooks.module.css'; // Reuse styles if applicable

interface BookSpanProps {
  wordText: string; // The text to display (e.g., "word ")
  wordKey: string; // Unique key for React
  isSanskrit?: boolean; // Optional flag for specific styling
}

const BookSpan: React.FC<BookSpanProps> = ({
    wordText,
    wordKey,
    isSanskrit = false,
  }) => {
  // Calculate className based only on props relevant to this specific word
  const className = `
    ${classes.word}
    ${isSanskrit ? classes.sanskritWord : ''}
  `.trim(); // Use trim() to remove leading/trailing whitespace

  // console.log(`Rendering WordSpan: ${wordText.trim()}, isSelected: ${isSelected}`); // Optional: for debugging

  return (
    <span key={wordKey} 
    data-word-text={wordText.trim()}
    data-word-key={wordKey}
    className={className}>
      {wordText}
    </span>
  );
};

// Memoize the component: It will only re-render if its own props change.
export default React.memo(BookSpan);