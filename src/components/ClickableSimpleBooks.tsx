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
import MetadataComponent from './Metadata';
import {WordEntry, GroupedEntries} from '../types/wordTypes'
import  WordInfo  from './WordInfo';
import { safeSplitText } from './textUtils';





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
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);


  const clickedWordInfoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isLoadingDebug && wordData.length > 0 && clickedWord && clickedWordInfoRef.current) {
      clickedWordInfoRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isLoadingDebug, wordData, clickedWord]);


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
        if (isTranslation) {                                     // make translation <s> words clickable
          const parts = segment.split(/(<s>.*?<\/s>)/);         //makes the Sanskrit words clickable
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
                {parts.map((part, partIndex) => {             //duplicate
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
                   <WordInfo
                    wordData={wordData}
                    onAdditionalWordClick={setClickedAdditionalWord}
                    isLoading={isLoadingDebug}
                  />
                </div>
              )}
            </span>
          );
        } else {            // if it's not a translation but a text node
          const words = segment.split(/\s+|\+/);
          const containsClickedWord = words.some(word => word.trim() === clickedWord);    // this line is broken
    
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
                  <WordInfo
                    wordData={wordData}
                    onAdditionalWordClick={setClickedAdditionalWord}
                    isLoading={isLoadingDebug}
                  />
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




  return (
    <div className={classes.bookContainer}>
      {bookText.metadata && (  
      <MetadataComponent metadata={bookText.metadata} 
      />)}
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
    </div>
  );
};

export default ClickableSimpleBooks;