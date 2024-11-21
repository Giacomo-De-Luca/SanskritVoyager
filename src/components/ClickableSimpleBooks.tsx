import React from 'react';

interface BookText {
  title?: string;
  body?: string;
}

interface ClickableSimpleBooksProps {
  bookText: BookText;
  selectedWord: string;
  setSelectedWord: (word: string) => void;
}

const ClickableSimpleBooks = ({
  bookText,
  selectedWord,
  setSelectedWord,
}: ClickableSimpleBooksProps) => {
    const stripXMLTags = (text: string) => {
        return text.replace(/<[^>]*>/g, '');
      };
    
      const clickableSimpleBooks = Object.values(bookText).map((section, sectionIndex) => {
        // Ensure the section is a string and strip XML tags
        const sutraLines = typeof section === 'string' ? stripXMLTags(section).split('\n') : [];
    
    return (
      <div key={sectionIndex}>
        <h2>Section {sectionIndex + 1}</h2>
        {sutraLines.map((line, lineIndex) => (
          <p key={lineIndex}>
            {line.split(/\s+|\+/).map((word, wordIndex) => {
              const trimmedWord = word.trim();
              return (
                <span
                  key={wordIndex}
                  onClick={() => setSelectedWord(trimmedWord)}
                  style={{
                    color: selectedWord === trimmedWord ? 'orange' : 'inherit',
                    cursor: 'pointer',
                  }}
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

  return <>{clickableSimpleBooks}</>;
};

export default ClickableSimpleBooks;