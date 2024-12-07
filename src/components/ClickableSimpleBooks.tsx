import React, { useState, useEffect, useRef } from 'react';
import {
  fetchWordData,
  fetchMultidictData,
  transliterateText,
  handleTranslate,
} from '../pages/Api';
import {
  Select,
  MultiSelect,
  Grid,
  Textarea,
  Button,
  Loader,
  Text,
  Accordion,
  Title
  
} from '@mantine/core';
import { useScrollIntoView } from '@mantine/hooks';
import classes from './ClickableSimpleBooks.module.css';
import { BookText, TextElement, Metadata }  from '../types/bookTypes';



interface ClickableSimpleBooksProps {
  bookText: BookText;
  selectedWord: string;
  setSelectedWord: (word: string) => void;
  clickedWord: string | null;
  setClickedWord: React.Dispatch<React.SetStateAction<string | null>>;
  setWordData: (data: any) => void;
  wordData: WordEntry[];
  setClickedAdditionalWord: (word: string) => void;
  selectedDictionaries: string[];
  hoveredWord: string | null;
  setHoveredWord: React.Dispatch<React.SetStateAction<string | null>>;
  textType: string;
}

type GroupedEntries = {
  [key: string]: WordEntry[];
};

// Define types for the different entry structures
type InflectionEntry = [string, string]; // [caseAbbr, numberAbbr]
type LongEntry = [
  string, // entry[0] - word
  string, // entry[1] - grammar
  InflectionEntry[], // entry[2] - inflections
  string[], // entry[3] - inflection_wordsIAST
  string, // entry[4] - etymology
  string, // entry[5] - pronunciation
  { [dictionaryName: string]: { [wordName: string]: string[] } } // entry[6] - vocabulary entries
];

type ShortEntry = [
  string, // entry[0] - word
  string, // entry[1] - components
  { [dictionaryName: string]: { [wordName: string]: string[] } } // entry[6] - vocabulary entries
];

type WordEntry = LongEntry | ShortEntry;


const ClickableSimpleBooks = ({
  bookText,
  selectedWord,
  setSelectedWord,
  clickedWord,
  setClickedWord,
  setWordData,
  wordData,
  setClickedAdditionalWord,
  selectedDictionaries,
  textType,
  hoveredWord,
  setHoveredWord,
}: ClickableSimpleBooksProps) => {
  const [visibleLines, setVisibleLines] = useState(100);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);

  
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleLines(prevVisibleLines => prevVisibleLines + 100);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, []);

  const clickedWordInfoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isLoadingDebug && wordData.length > 0 && clickedWord && clickedWordInfoRef.current) {
      clickedWordInfoRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isLoadingDebug, wordData, clickedWord]);


  const groupEntries = (data: typeof wordData) => {
    const groupedEntries: GroupedEntries = {};
    for (const entry of data) {
      const key = entry[4] || 'default';
      if (!groupedEntries[key]) {
        groupedEntries[key] = [];
      }
      groupedEntries[key].push(entry);
    }
    return groupedEntries;
  };

  const getTextStyle = (attributes?: Record<string, string>) => {
    const styles: React.CSSProperties = {};
    if (attributes) {
      if (attributes.rend === 'bold') {
        styles.fontWeight = 'bold';
      }
      if (attributes.rend === 'it') {
        styles.fontStyle = 'italic';
      }
    }
    return styles;
  };


  const renderTextElement = (element: TextElement): React.ReactNode => {
    const elementClasses = [
      classes[element.tag] || '',
      element.attributes?.rend === 'bold' ? classes.bold : '',
      element.attributes?.rend === 'it' ? classes.italic : '',
    ].filter(Boolean).join(' ');
  
    const isSeparatorOnlyLine = (text: string) => {
      const trimmed = text.trim();
      return trimmed === '||' || trimmed === '//' || trimmed === '*||*' || trimmed === '*//*';
    };

    const renderWords = (text: string, isTranslation: boolean = false) => {
      // Skip rendering if it's just a separator line // should be changed in the future
      if (isSeparatorOnlyLine(text)) {
        return null;
      }

      const safeSplitText = (text: string): string[] => {
        // Try the modern approach first
        try {
          // Original regex with lookbehind
          return text.split(/(?<!\|)\|(?!\|)/);
        } catch (e) {
          // Fallback approach for browsers without lookbehind support
          const segments: string[] = [];
          let currentSegment = '';
          
          // Iterate through the text character by character
          for (let i = 0; i < text.length; i++) {
            if (text[i] === '|') {
              // Check if it's part of '||'
              if (text[i-1] === '|' || text[i+1] === '|') {
                currentSegment += '|';
              } else {
                // It's a single pipe, split here
                segments.push(currentSegment);
                currentSegment = '';
              }
            } else {
              currentSegment += text[i];
            }
          }
          
          // Don't forget the last segment
          if (currentSegment) {
            segments.push(currentSegment);
          }
          
          return segments;
        }
      };

      // Only apply transformations to non-translated text
      const transformedText = isTranslation 
        ? text 
        : text
            .replace(/([A-Za-z]+)_(\d+\.\d+)\s/g, '$2 ') // Modified to use numbered groups
            .replace(/([A-Za-z]+)_(\d+)/g, '$2 ')
            .replace(/\//g, '|')
            .replace(/\.(?!\d)/g, '|')
            .replace(/\*/g, '');
    
      const segments = safeSplitText(transformedText);
    
      return segments.map((segment, segmentIndex) => {
        if (isTranslation) {
          const parts = segment.split(/(<s>.*?<\/s>)/);
          const containsClickedWord = parts.some(part => {
            if (part.startsWith('<s>') && part.endsWith('</s>')) {
              const word = part.replace(/<\/?s>/g, '').trim();
              return word === clickedWord;
            }
            return false;
          });
    
          return (
            <span key={segmentIndex} className={classes.textSegment}>
              <span className={classes.textContent}>
                {parts.map((part, partIndex) => {
                  if (part.startsWith('<s>') && part.endsWith('</s>')) {
                    const sanskritWord = part.replace(/<\/?s>/g, '').trim();
                    return (
                      <span
                        key={`${segmentIndex}-${partIndex}`}
                        onClick={async () => {
                          setSelectedWord(sanskritWord.toLowerCase());
                          setClickedWord(sanskritWord);
                          setIsLoadingDebug(true);
                          try {
                            const data = await fetchMultidictData(sanskritWord, selectedDictionaries);
                            setWordData(data);
                          } finally {
                            setIsLoadingDebug(false);
                          }
                        }}
                        onMouseEnter={() => setHoveredWord(sanskritWord)}
                        onMouseLeave={() => setHoveredWord(null)}
                        className={`
                          ${classes.word}
                          ${classes.sanskritWord}
                          ${selectedWord === sanskritWord ? classes.selectedWord : ''}
                          ${hoveredWord === sanskritWord ? classes.hoveredWord : ''}
                        `}
                      >
                        {sanskritWord + ' '}
                      </span>
                    );
                  }
                  return <span key={`${segmentIndex}-${partIndex}`}>{part}</span>;
                })}
                {segmentIndex < segments.length - 1 && (
                  <span className={classes.pipeMark}>|</span>
                )}
              </span>
              {segmentIndex < segments.length - 1 && <br />}
                {containsClickedWord && (
                <div ref={clickedWordInfoRef} className={classes.wordInfo}>
                  {isLoadingDebug ? (
                    <div className={classes.loaderContainer}>
                      <Loader type="dots" size="sm" color="rgba(191, 191, 191, 1)" />
                    </div>
                  ) : (
                    renderClickedWordInfo()
                  )}
                </div>
              )}
            </span>
          );
        } else {
          const words = segment.split(/\s+|\+/);
          const containsClickedWord = words.some(word => word.trim() === clickedWord);
    
          return (
            <span key={segmentIndex} className={classes.textSegment}>
              <span className={classes.textContent}>
                {words.map((word: string, wordIndex: number) => {
                  const trimmedWord = word.trim();
                  if (!trimmedWord) return null;
                  
                  return (
                    <span
                      key={`${segmentIndex}-${wordIndex}`}
                      onClick={async () => {
                        setSelectedWord(trimmedWord);
                        setClickedWord(trimmedWord);
                        setIsLoadingDebug(true);
                        try {
                          const data = await fetchMultidictData(trimmedWord, selectedDictionaries);
                          setWordData(data);
                        } finally {
                          setIsLoadingDebug(false);
                        }
                      }}
                      onMouseEnter={() => setHoveredWord(trimmedWord)}
                      onMouseLeave={() => setHoveredWord(null)}
                      className={`
                        ${classes.word}
                        ${selectedWord === trimmedWord ? classes.selectedWord : ''}
                        ${hoveredWord === trimmedWord ? classes.hoveredWord : ''}
                      `}
                    >
                      {word + ' '}
                    </span>
                  );
                })}
                {segmentIndex < segments.length - 1 && (
                  <span className={classes.pipeMark}>|</span>
                )}
              </span>
              {segmentIndex < segments.length - 1 && <br />}
              {containsClickedWord && (
              <div ref={clickedWordInfoRef} className={classes.wordInfo}>
                {isLoadingDebug ? (
                  <div className={classes.loaderContainer}>
                    <Loader type="dots" size="sm" color="rgba(191, 191, 191, 1)" />
                  </div>
                ) : (
                  renderClickedWordInfo()
                )}
              </div>
            )}
          </span>
          );
        }
      });
    };
  
    return (
      <div className={elementClasses}>
      {element.text && (
        <div className={`${classes.lineContainer} ${
          textType === 'or' ? classes.originalOnly : 
          textType === 'tran' ? classes.translationOnly : ''
        }`}>
          {/* Only render original text if textType is 'both' or 'or' */}
          {(textType === 'both' || textType === 'or') && (
            <div className={classes.originalText}>
              {renderWords(element.text)}
            </div>
          )}
          
          {/* Only render translated text if textType is 'both' or 'tran' */}
          {element.translated_text && (textType === 'both' || textType === 'tran') && (
            <div className={`${classes.translatedText} ${
              textType === 'tran' ? classes.translationOnly : ''
            }`}>
              {renderWords(element.translated_text, true)}
            </div>
          )}
        </div>
      )}

      {element.children?.map((child, index) => (
        <React.Fragment key={index}>
          {renderTextElement(child)}
        </React.Fragment>
      ))}
    </div>
  );
};


  const renderClickedWordInfo = () => {
    if (!isLoadingDebug && wordData.length > 0) {
      const groupedEntries = groupEntries(wordData);
      return Object.entries(groupedEntries).map(([originalWord, entries], groupIndex) => {
        const uniqueWords = Array.from(new Set(entries.map((entry) => entry[0])));
        return (
          <span key={groupIndex} style={{ marginRight: '8px' }}>
            {uniqueWords.map((word, wordIndex) => (
              <React.Fragment key={wordIndex}>
                <span
                  className={classes.additionalWord}
                  onClick={() => setClickedAdditionalWord(word)}
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
    }
    return null;
  };

  const renderMetadata = () => {
    const metadata = bookText.metadata;
    if (!metadata) return null;

    return (
      <>
        <Title order={1} className={classes.bookTitle}>
          {metadata.original_title}
        </Title>
        
        {metadata.author && (
          <Text size="lg" className={classes.authorLine}>
            by {metadata.author}
          </Text>
        )}

        <Accordion className={classes.metadataAccordion}>
          <Accordion.Item value="metadata">
            <Accordion.Control
              className={classes.accordionTitle}
              >
                Additional Information
              </Accordion.Control>
            <Accordion.Panel>
              {metadata.publisher && (
                <Text className={classes.metadataItem}>
                  <b>Publisher:</b> {metadata.publisher}
                </Text>
              )}
              
              {metadata.publication_date && (
                <Text className={classes.metadataItem}>
                  <b>Publication Date:</b> {metadata.publication_date}
                </Text>
              )}
              
              {metadata.source && (
                <Text className={classes.metadataItem}>
                  <b>Source:</b> {metadata.source}
                </Text>
              )}
              
              {metadata.license && (
                <Text className={classes.metadataItem}>
                  <b>License:</b>{' '}
                  <a href={metadata.license.target} target="_blank" rel="noopener noreferrer">
                    {metadata.license.text}
                  </a>
                </Text>
              )}

              {metadata.contributors && metadata.contributors.length > 0 && (
                <div className={classes.metadataItem}>
                  <Text><b>Contributors:</b></Text>
                  <div className={classes.contributorsList}>
                    {metadata.contributors.map((contributor, index) => (
                      <Text key={index} className={classes.contributorItem}>
                        <b>{contributor.role.charAt(0).toUpperCase() + contributor.role.slice(1)}:</b> {contributor.name}
                        {contributor.when && ` (${contributor.when})`}
                      </Text>
                    ))}
                  </div>
                </div>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </>
    );
  };


  return (
    <div className={classes.bookContainer}>
      {renderMetadata()}
      <div className={`${classes.textContent} ${
        textType === 'or' ? classes.originalOnly :
        textType === 'tran' ? classes.translationOnly : ''
      }`}>
        {bookText.body?.map((element, index) => (
          <React.Fragment key={index}>
            {renderTextElement(element)}
          </React.Fragment>
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: '1px' }} />
    </div>
  );
};

export default ClickableSimpleBooks;