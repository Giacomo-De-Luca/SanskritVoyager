import React from 'react';
import { useState } from 'react';
import { fetchWordData, fetchMultidictData, transliterateText, handleTranslate } from '../pages/Api';
import { Select, MultiSelect, Grid, Textarea, Button, Loader, Text } from '@mantine/core';
import classes from './ClickableSimpleBooks.module.css';





interface BookText {
  title?: string;
  body?: string;
}

interface ClickableSimpleBooksProps {
  bookText: BookText;
  selectedWord: string;
  setSelectedWord: (word: string) => void;
  clickedWord: string | null;
  setClickedWord: React.Dispatch<React.SetStateAction<string | null>>
  setIsLoadingDebug: React.Dispatch<React.SetStateAction<boolean>>
  setWordData: (data: any) => void;
  wordData: WordEntry[];
  setClickedAdditionalWord: (word: string) => void;
  selectedDictionaries: string[];
  hoveredWord: string | null;
  setHoveredWord: React.Dispatch<React.SetStateAction<string | null>>
  isLoadingDebug: boolean;
}

type GroupedEntries = {
  [key: string]: WordEntry[];
};

// Define types for the different entry structures
type InflectionEntry = [string, string]; // [caseAbbr, numberAbbr]
type LongEntry = [
  string,  // entry[0] - word
  string,  // entry[1] - grammar
  InflectionEntry[],  // entry[2] - inflections
  string[],  // entry[3] - inflection_wordsIAST
  string,  // entry[4] - etymology
  string,  // entry[5] - pronunciation
  { [dictionaryName: string]: { [wordName: string]: string[] } }  // entry[6] - vocabulary entries
];

type ShortEntry = [
  string,  // entry[0] - word
  string,  // entry[1] - components
  { [dictionaryName: string]: { [wordName: string]: string[] } }  // entry[6] - vocabulary entries
];

type WordEntry = LongEntry | ShortEntry;

const ClickableSimpleBooks = ({
  bookText,
  selectedWord,
  setSelectedWord,
  clickedWord,
  setClickedWord,
  setIsLoadingDebug,
  setWordData,
  wordData,
  setClickedAdditionalWord,
  selectedDictionaries,
  hoveredWord,
  setHoveredWord,
  isLoadingDebug,
}: ClickableSimpleBooksProps) => {
  const stripXMLTags = (text: string) => {
    return text.replace(/<[^>]*>/g, '');
  };

  const clickableSimpleBooks: React.ReactElement[][] = Object.values(bookText).map((section, sectionIndex) => {
    // Ensure the section is a string and strip XML tags
    const sutraLines = typeof section === 'string' ? stripXMLTags(section).split('\n') : [];


    const [isLoadingDebug, setIsLoadingDebug] = useState(false);

    const clickable_words = sutraLines.map((line, lineIndex) => {
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
                  onClick={async () => {
                    setSelectedWord(trimmedWord);
                    setClickedWord(trimmedWord);
                    setIsLoadingDebug(true);
                    console.log()

                    try {
                      const data = await fetchMultidictData(trimmedWord, selectedDictionaries);
                      console.log(data);
                      setWordData(data);
                    } finally {
                      setIsLoadingDebug(false);
                    }
                  }}
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
              {isLoadingDebug ? (
                <div className={classes.loaderContainer}>
                  <Loader type="dots" size="sm" color='rgba(191, 191, 191, 1)' />
                </div>
              ) : (
                wordData.length > 0 && (() => {
                  const groupedEntries = wordData.reduce<GroupedEntries>((acc, entry) => {
                    const key = entry[4] || 'default';
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(entry);
                    return acc;
                  }, {});

                  return Object.entries(groupedEntries).map(([originalWord, entries], groupIndex) => {
                    const uniqueWords = Array.from(new Set(entries.map(entry => entry[0])));

                    return (
                      <span key={groupIndex} style={{ marginRight: '8px' }}>
                        {uniqueWords.map((word, wordIndex) => (
                          <React.Fragment key={wordIndex}>
                            <span
                              className={classes.additionalWord}
                              onClick={async () => {
                                setClickedAdditionalWord(word);
                              }}
                              style={{
                                cursor: 'pointer',
                                whiteSpace: 'nowrap', // Prevent line breaks within words
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
    });

    return clickable_words;
  });

  return <>{clickableSimpleBooks}</>;
};

export default ClickableSimpleBooks;