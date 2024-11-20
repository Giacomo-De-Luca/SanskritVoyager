import InflectionTable from './InflectionTable';
import { fetchWordData } from '../pages/Api';
import { useState, useEffect } from 'react';
import DictionaryEntry from './DictionaryEntry';

import classes from './WordDataComponent.module.css';

// Define types for the different entry structures
type InflectionEntry = [string, string]; // [caseAbbr, numberAbbr]
type LongEntry = [
  string,  // entry[0] - word
  string,  // entry[1] - grammar
  InflectionEntry[],  // entry[2] - inflections
  string[],  // entry[3] - inflection_wordsIAST
  string,  // entry[4] - etymology
  string,  // entry[5] - pronunciation
  string[]  // entry[6] - vocabulary entries
];

type ShortEntry = [
  string,  // entry[0] - word
  string,  // entry[1] - unknown/unused
  string[]  // entry[2] - vocabulary entries
];

type WordEntry = LongEntry | ShortEntry;

interface WordDataComponentProps {
  wordData: WordEntry[];
  setWordData: React.Dispatch<React.SetStateAction<WordEntry[]>>;
  isMobile: boolean | undefined;
}

const WordDataComponent = ({ wordData, setWordData, isMobile }: WordDataComponentProps) => {
  const handleWordClick = async (word: string, index: number) => {
    console.log(`Clicked word: ${word}`);
    console.log(`Index: ${index}`);
    fetchWordData(word).then(data => {
      if (!Array.isArray(data)) {
        console.error('Fetched data is not an array:', data);
        return; // Prevent further processing
      }
      console.log(data);  
      setWordData(prevWordData => {
        const newData = [...prevWordData];
        newData.splice(index + 1, 0, ...data);
        console.log(newData);
        return newData;
      });
    });
  }

  // Function to check if the word has appeared before in the list
  const hasWordAppearedBefore = (currentWord: string, currentIndex: number) => {
    return wordData.some((entry, index) => 
      index < currentIndex && entry[0] === currentWord
    );
  };

  return (
    <>
      {wordData && wordData.map((entry, index) => {
        console.log(entry[2]);
        if (entry.length === 7) {
          const longEntry = entry as LongEntry;
          const shouldShowVocabulary = !hasWordAppearedBefore(longEntry[0], index);
          
          return (
            <div>
              <h1 className={classes.mainWord} data-word={longEntry[0]}>
                {longEntry[0]}
              </h1>

              {longEntry[0] !== longEntry[5] && 
                <p className={classes.pronunciation}>
                  {longEntry[5]}
                </p>
              }

              {longEntry[0] !== longEntry[4] && 
                <p className={classes.etymologySection}>
                  <span className={classes.etymologyLabel}>from:</span> 
                  <span className={classes.etymologyTerm}>{longEntry[4]}</span>
                </p>
              }

              <p className={classes.grammarSection}>
                <div className={classes.grammarMain}>{longEntry[1]}</div>
              </p>

              {longEntry[2] && longEntry[2].map((inflection, index) => {
                let caseAbbr = inflection[0];
                let numberAbbr = inflection[1];

                let caseFull;
                switch (caseAbbr.trim()) {
                  case 'Nom': caseFull = 'Nominative'; break;
                  case 'Acc': caseFull = 'Accusative'; break;
                  case 'Voc': caseFull = 'Vocative'; break;
                  case 'Inst': caseFull = 'Instrumental'; break;
                  case 'Dat': caseFull = 'Dative'; break;
                  case 'Abl': caseFull = 'Ablative'; break;
                  case 'Gen': caseFull = 'Genitive'; break;
                  case 'Loc': caseFull = 'Locative'; break;
                  default: caseFull = caseAbbr;
                }

                let numberFull;
                switch (numberAbbr.trim()) {
                  case 'Sg': numberFull = 'Singular'; break;
                  case 'Du': numberFull = 'Dual'; break;
                  case 'Pl': numberFull = 'Plural'; break;
                  default: numberFull = numberAbbr;
                }

                return (
                  <span key={index} className={classes.grammarDetail}>
                    {longEntry[3].length > 1 && (
                      <>
                        {caseFull}, {numberFull}
                        {index < longEntry[2].length - 1 && ' or '}
                      </>
                    )}
                  </span>
                );
              })}
              {!isMobile && (
                <InflectionTable 
                  inflection_wordsIAST={longEntry[3]} 
                  rowcolstitles={longEntry[2]}  
                  useColor={true}
                />
              )}

              {shouldShowVocabulary && (
                <div>
                  <h4 className={classes.vocabularySection}>Vocabulary entries:</h4> 
                  {longEntry[6].map((item: string, index: number) => (  
                    <DictionaryEntry 
                    key={index}
                    entry={item}
                    onWordClick={handleWordClick}
                  />
                  ))}
                </div>
              )}
              <hr />
            </div>
          );
        } else if (entry.length === 3) {
          const shortEntry = entry as ShortEntry;
          const shouldShowVocabulary = !hasWordAppearedBefore(shortEntry[0], index);

          return(
            <div 
              style={{ 
                wordBreak: 'break-word', // Added to ensure words break
                whiteSpace: 'normal', // Changed from pre-wrap
              }}
            >
              <h1 className={classes.mainWord} data-word={shortEntry[0]}>
                {shortEntry[0]}
              </h1>
            
              {shouldShowVocabulary && (
                <div>
                  <h4 className={classes.vocabularySection}>Vocabulary entries:</h4> 
                  {shortEntry[2].map((item: string, index: number) => (  
                    <DictionaryEntry 
                    key={index}
                    entry={item}
                    onWordClick={handleWordClick}
                  />
                  ))}
                </div>
              )}
              <hr />
            </div>    
          );
        }
        else {
          return null;
        }
      })}        
    </>
  );
};

export default WordDataComponent;