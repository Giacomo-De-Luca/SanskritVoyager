import InflectionTable from './InflectionTable';
import { fetchWordData } from '../pages/Api';
import { useState, useEffect } from 'react';
import DictionaryEntry from './DictionaryEntry';
import { Text, Divider, Title } from '@mantine/core';

import classes from './WordDataComponent.module.css';


// Define types for the different entry structures
type InflectionEntry = [string, string]; // [caseAbbr, numberAbbr]
type LongEntry = [
  string,  // entry[0] - word
  string,  // entry[1] - grammar
  InflectionEntry[],  // entry[2] - inflections
  string[],  // entry[3] - inflection_wordsIAST
  string,  // entry[4] - derivarion
  string,  // entry[5] - pronunciation
  { [dictionaryName: string]: { [wordName: string]: string[] } }  // entry[6] - vocabulary entries
];

type ShortEntry = [
  string,  // entry[0] - word
  string,  // entry[1] - unknown/unused
  { [dictionaryName: string]: { [wordName: string]: string[] } }  // entry[6] - vocabulary entries
];

type WordEntry = LongEntry | ShortEntry;

interface WordDataComponentProps {
  selectedDictionaries: string[];
  wordData: WordEntry[];
  setWordData: React.Dispatch<React.SetStateAction<WordEntry[]>>;
  isMobile: boolean | undefined;
  setClickedInfoWord: React.Dispatch<React.SetStateAction<string|null>>;
  isTablet:  boolean | undefined;
  isNavabarVisible: boolean;

}

type DictionaryLabels = {
  [key: string]: string;
};


const dictionaryLabels: DictionaryLabels = {
  mw: 'Monier-Williams Sanskrit-English Dictionary',
  ap90: 'Apte Practical Sanskrit-English Dictionary',
  gra: 'Grassmann Wörterbuch zum Rig Veda',
  bhs: 'Edgerton Buddhist Hybrid Sanskrit Dictionary',
};


const WordDataComponent = ({ wordData, setWordData, isMobile, selectedDictionaries, setClickedInfoWord, isTablet, isNavabarVisible }: WordDataComponentProps) => {
  const handleWordClick = async (word: string, index: number) => {
    setClickedInfoWord(word)
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

          // Process dictionary entries, filtering out empty dictionaries
          const processedDictionaries = Object.entries(longEntry[6])
            .filter(([_, words]) => 
              Object.entries(words).some(([_, entries]) => entries.length > 0)
            );
          
          return ( // title first
            <div key={index}>     
              <Title order={1} className={classes.mainWord} data-word={longEntry[0]}>
                {longEntry[0]}
              </Title>

              {longEntry[0] !== longEntry[5] && (  // word components si può rimuovere il p outer? 
                <p
                  className={classes.wordCostituentsContainer}
                
                >
                  {longEntry[5].split(/(-|—(?=\p{L}))/u).map((part, index) => {
                    if (!part.trim()) return part;
                    
                    return (
                      <span
                        key={`pron-${index}`}
                        onClick={() => handleWordClick(part, index)}
                        className={classes.pronunciation}
                      >
                        {part}
                      </span>
                    );
                  })}
                </p>
              )}

              {longEntry[0] !== longEntry[4] && 
                <div className={classes.etymologySection}>
                  <span className={classes.etymologyLabel}>from:</span> 
                  <span className={classes.etymologyTerm}>{longEntry[4]}</span>
                </div>
              }

              <div className={classes.grammarSection}>
                <p 
                className={
                  longEntry[1] === "indeclineable"
                    ? classes.grammarMainIndeclinable
                    : classes.grammarMain
                }
                >
                  {longEntry[1]}
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
                  <span key={index} 
                  className={
                    caseFull && numberFull
                      ? classes.grammarDetail
                      : classes.grammarDetailEmpty
                  }
                  >
                    {longEntry[3].length > 1 && (
                      <>
                        {caseFull}, {numberFull}
                        {index < longEntry[2].length - 1 && ' or '}
                      </>
                    )}
                  </span>
                );
              })}
              {!isMobile && !isTablet && (
                <InflectionTable 
                  inflection_wordsIAST={longEntry[3]} 
                  rowcolstitles={longEntry[2]}  
                  useColor={true}
                />
              )}
              </div>

              

              {shouldShowVocabulary && (
                <div className= {classes.vocabularyWrapper}
                
                >
                  <div className={classes.vocabularySection}>
                    Vocabulary entries:
                  </div> 
                  <div>
                    {Object.entries(longEntry[6]).map(([dictionaryName, words]) => (
                      <div key={dictionaryName}>
                        {/* Render dictionary name */}
                        {processedDictionaries.length > 1 && (
                            <Text className={classes.dictName}>
                                {dictionaryLabels[dictionaryName] || dictionaryName}:
                            </Text>
                          )}
                        {Object.entries(words).map(([wordName, entries]) => (
                          <div key={wordName}
                          
                          style={{
                          paddingTop: '1.25rem'
                          }}>
                            {/* Render word name 
                            <div 
                              className={classes.wordName}
                            >
                              {wordName}:
                              </div>
                             Render each entry for the word */}
                            {Array.isArray(entries) ? 
                              entries.map((entry, index) => (
                                <DictionaryEntry 
                                  key={`${dictionaryName}-${wordName}-${index}`}
                                  entry={entry}
                                  onWordClick={handleWordClick}
                                />
                              ))
                              : null
                            }
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                </div>
              )}
              {/* </hr> */}
            </div>
          );
        } else if (entry.length === 3) {
          const shortEntry = entry as ShortEntry;
          const shouldShowVocabulary = !hasWordAppearedBefore(shortEntry[0], index);

          // Process dictionary entries, filtering out empty dictionaries
          const processedDictionaries = Object.entries(shortEntry[2])
            .filter(([_, words]) => 
              Object.entries(words).some(([_, entries]) => entries.length > 0)
            );
          

          return(
            <div 
              style={{ 
                wordBreak: 'break-word', // Added to ensure words break
                whiteSpace: 'normal', // Changed from pre-wrap
              }}
            >
              <Title order={1} className={classes.mainWord} data-word={shortEntry[0]}>
                {shortEntry[0]}
              </Title>

              {shortEntry[0] !== shortEntry[1] && (  // word components
                <p
                  className={classes.wordCostituentsContainer}

                  style={{ paddingTop: '16px'}}


                
                >
                  {shortEntry[1].split(/(-|—(?=\p{L}))/u).map((part, index) => {
                    if (!part.trim()) return part;
                    
                    return (
                      <span
                        key={`pron-${index}`}
                        onClick={() => handleWordClick(part, index)}
                        className={classes.pronunciation}
                      >
                        {part}
                      </span>
                    );
                  })}
                </p>
              )}

            
              {shouldShowVocabulary && (
                <div className= {classes.vocabularyWrapper}>
                <h4 className={classes.vocabularySection}>Vocabulary entries:</h4> 
                  {Object.entries(shortEntry[2]).map(([dictionaryName, words]) => (
                      <div key={dictionaryName}>
                        {/* Render dictionary name */}
                        {processedDictionaries.length > 1 && (
                            <Text className={classes.dictName}>
                                {dictionaryLabels[dictionaryName] || dictionaryName}:
                            </Text>
                          )}


                    {Object.entries(words).map(([wordName, entries]) => (
                      <div key={wordName}

                      style={{
                        paddingTop: '1.25rem'
                        }}

                      >
                        {/* Render word name 
                        <div 
                          className={classes.wordName}
                        >{wordName}</div>
                           Render each entry for the word */}

                        {Array.isArray(entries) ? 
                            entries.map((entry, index) => (
                              <DictionaryEntry 
                                key={`${dictionaryName}-${wordName}-${index}`}
                                entry={entry}
                                onWordClick={handleWordClick}
                              />
                            ))
                            : null
                          }
        </div>
      ))}
    </div>
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