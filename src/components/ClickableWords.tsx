import React from 'react';
import { Loader } from '@mantine/core';
import classes from './ClickableWords.module.css';
import { WordEntry, GroupedEntries } from '../types/wordTypes';

interface ClickableWordsProps {
  lines: string[];
  selectedWord: string;
  setSelectedWord: (word: string) => void;
  hoveredWord: string | null;
  setHoveredWord: (word: string | null) => void;
  selectedDictionaries: string[];
  wordData: WordEntry[];
  isLoadingWordData: boolean;
  clickedWord: string | null;
  setClickedWord: (word: string | null) => void;
  onWordClick?: (word: string) => void;
  onAdditionalWordClick?: (word: string) => void;
}

const ClickableWords: React.FC<ClickableWordsProps> = ({
  lines,
  selectedWord,
  setSelectedWord,
  hoveredWord,
  setHoveredWord,
  selectedDictionaries,
  wordData,
  isLoadingWordData,
  clickedWord,
  setClickedWord,
  onWordClick,
  onAdditionalWordClick
}) => {
  const handleWordClick = async (trimmedWord: string) => {
    setSelectedWord(trimmedWord);
    setClickedWord(trimmedWord);
    if (onWordClick) {
      onWordClick(trimmedWord);
    }
  };

  const handleAdditionalWordClick = (word: string) => {
    if (onAdditionalWordClick) {
      onAdditionalWordClick(word);
    }
  };

  return (
    <>
      {lines.map((line, lineIndex) => {
        const words = line.split(/\s+|\+/);
        const hasClickedWord = words.some(word => word.trim() === clickedWord);

        return (
          <div key={lineIndex} style={{ marginBottom: '8px' }}>
            <p>
              {words.map((word: string, wordIndex: number) => {
                const trimmedWord = word.trim();
                return (
                  <span
                    key={wordIndex}
                    onClick={() => handleWordClick(trimmedWord)}
                    onMouseEnter={() => setHoveredWord(trimmedWord)}
                    onMouseLeave={() => setHoveredWord(null)}
                    style={{ 
                      color: selectedWord === trimmedWord ? 'orange' : 'inherit',
                      ...(hoveredWord === trimmedWord ? { color: 'gray' } : {}),
                      cursor: 'pointer',
                    }}
                  >
                    {word + ' '}
                  </span>
                );
              })}
            </p>
            {hasClickedWord && (
              <p style={{ paddingLeft: '16px', color: '#666', marginTop: '4px' }}>
                {isLoadingWordData ? (
                  <div className={classes.loaderContainer}>
                    <Loader type="dots" size="sm" color='rgba(191, 191, 191, 1)' />
                  </div>
                ) : (
                  wordData.length > 0 && (() => {
                    const groupedEntries = wordData.reduce<GroupedEntries>((acc, entry) => {
                      const key = entry[4] as string || 'default';
                      if (!acc[key]) {
                        acc[key] = [];
                      }
                      acc[key].push(entry);
                      return acc;
                    }, {});

                    return Object.entries(groupedEntries).map(([originalWord, entries], groupIndex) => {
                        const uniqueWords = Array.from(new Set(
                            entries.map(entry => entry[0]).filter((word): word is string => 
                              typeof word === 'string'
                            )
                          ));
                      return (
                        <span key={groupIndex} style={{ marginRight: '8px' }}>
                          {uniqueWords.map((word, wordIndex) => (
                            <React.Fragment key={wordIndex}>
                              <span
                                className={classes.additionalWord}
                                onClick={() => handleAdditionalWordClick(word as string)}
                                style={{
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  marginRight: wordIndex < uniqueWords.length - 1 ? '4px' : '0',
                                }}
                              >
                                {word}
                              </span>
                              {wordIndex < uniqueWords.length - 1 && (
                                <span style={{ margin: '0 4px', color: '#666' }}>|</span>
                              )}
                            </React.Fragment>
                          ))}
                        </span>
                      );
                    });
                  })()
                )}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
};

export default ClickableWords;