import React, {  useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import WordInfoPortal from './WordInfoPortal';

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
  isLoadingWordData: boolean;
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
  isLoadingWordData,
}: ClickableSimpleBooksProps) => {
  const clickedWordInfoRef = useRef<HTMLDivElement>(null);
  const [clickedElement, setClickedElement] = useState<HTMLElement | null>(null);
  const [previousElement, setPreviousElement] = useState<HTMLElement | null>(null);

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
        ? text          // not sure if this is correct 
        : text
            .replace(/([A-Za-z]+)_(\d+\.\d+)\s/g, '$2 ') // Modified to use numbered groups
            .replace(/([A-Za-z]+)_(\d+)/g, '$2 ')
            .replace(/\//g, '|')
            .replace(/\.(?!\d)/g, '|')
            .replace(/\*/g, '');    // if line stars with * it should be giving : commentary class 
    
      const segments = safeSplitText(transformedText);      // split text in segment using pipes | and double pipes as guideline 
    
      return segments.map((segment, segmentIndex) => {
        if (isTranslation) {                                     // make translation <s> words clickable
          const parts = segment.split(/(<s>.*?<\/s>)/);         //makes the Sanskrit words clickable
    
          return ( 
            <span key={segmentIndex} className={classes.textSegment}>           
              <span className={classes.textContent}>
                {parts.map((part, partIndex) => {             // map through the parts of the segment, match <s> tags and make them clickable
                  if (part.startsWith('<s>') && part.endsWith('</s>')) {
                    const sanskritWord = part.replace(/<\/?s>/g, '').trim();
                    return (
                      <span
                        key={`${segmentIndex}-${partIndex}`}
                        onClick={async (e) => {
                          
                          setClickedElement(e.currentTarget);
                          setSelectedWord(sanskritWord.toLowerCase());
                          setClickedWord(sanskritWord);
                         
                        }}
                        onMouseEnter={() => setHoveredWord(sanskritWord)}    // should be replaced by css classes on hover
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
                  return <span key={`${segmentIndex}-${partIndex}`}>{part}</span>; // when the part is not a Sanskrit word
                })}
                {segmentIndex < segments.length - 1 && (   // add a pipe at the end of the segment to mark end of sentence
                  <span className={classes.pipeMark}>|</span>
                )}   
              </span> 
              {segmentIndex < segments.length - 1 && <br />}   
             
            </span>
          );
        } else {            // if it's not a translation but a text node
          const words = segment.split(/\s+|\+/);    // just split on spaces 
    
          return (
            <span key={segmentIndex} className={classes.textSegment}>
              <span className={classes.textContent}>
                {words.map((word: string, wordIndex: number) => {
                  const trimmedWord = word.trim();
                  if (!trimmedWord) return null;
                  
                  return (
                    <span   // this should be a separate component
                      key={`${segmentIndex}-${wordIndex}`}
                      onClick={async (e) => {

                        setClickedElement(e.currentTarget);
                        setSelectedWord(trimmedWord);
                        setClickedWord(trimmedWord);

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
            
          </span>
          );
        }
      });
    }; // here ends render words, which should be a separate component
  
    return ( //the following line is broken, it renders 
      <div className={`${classes.paragraphContainer} elementClasses`}> 
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
      <WordInfoPortal
        clickedElement={clickedElement}
        previousElement={previousElement}
        wordData={wordData}
        isLoadingDebug={isLoadingWordData}
        onAdditionalWordClick={setClickedAdditionalWord}
        setPreviousElement={setPreviousElement}
      />
    </div>
  );
};

export default ClickableSimpleBooks;