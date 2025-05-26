import React, { useState } from 'react'; // React for JSX, useState for managing state

type SectionType = {
  sutra_text: string | null;
  commentary_text: string | null;
};

type BookTextType = {
  [key: string]: SectionType;
};

interface ClickableBookWordsProps {
  bookText: BookTextType;
  selectedWord: string;
  setSelectedWord: (word: string) => void;
  clickedWord: string | null;
}

export const ClickableBookWords: React.FC<ClickableBookWordsProps> = ({
  bookText,
  selectedWord,
  setSelectedWord,
}) => {
  const clickable_book_words = Object.values(bookText).map((section: SectionType, sectionIndex: number) => {
    const sutraLines = typeof section.sutra_text === 'string' ? section.sutra_text.split('\n') : [];
    const commentaryLines = typeof section.commentary_text === 'string' ? section.commentary_text.split('\n') : [];

    const clickable_words = commentaryLines.map((line, lineIndex) => {
      const words = line.split(/\s+|\+/);
      const hasClickedWord = words.some(word => word.trim() === clickedWord);

    return (
      <div key={sectionIndex}>
        <h2>Section {sectionIndex + 1}</h2>
        {sutraLines.map((line: string, lineIndex: number) => (
          <p key={lineIndex}>



            {line.split(/\s+|\+/).map((word: string, wordIndex: number) => {
              const trimmedWord = word.trim();
              return (
                <span
                  key={wordIndex}
                  onClick={() => setSelectedWord(trimmedWord)}
                  style={{ color: selectedWord === trimmedWord ? 'orange' : 'inherit' }}
                >
                  {word + ' '}
                </span>
              );
            })}
          </p>
        ))}
        <h3>Commentary</h3>
        {commentaryLines.map((line: string, lineIndex: number) => (
          <p key={lineIndex}>
            {line.split(/\s+|\+/).map((word: string, wordIndex: number) => {
              const trimmedWord = word.trim();
              return (
                <span
                  key={wordIndex}
                  onClick={() => setSelectedWord(trimmedWord)}
                  style={{ color: selectedWord === trimmedWord ? 'orange' : 'inherit' }}
                >
                  {word + ' '}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    );
  });

  return <>{clickable_book_words}</>;
};