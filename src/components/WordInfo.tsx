import React from 'react';
import { Loader } from '@mantine/core';
import { WordEntry, GroupedEntries } from '../types/wordTypes';
import classes from './WordInfo.module.css';

interface WordInfoProps {
  wordData: WordEntry[];
  onAdditionalWordClick: (word: string) => void;
  isLoading: boolean;
}

function WordInfo({ 
  wordData, 
  onAdditionalWordClick, 
  isLoading 
}: WordInfoProps): JSX.Element {
  const groupEntries = (data: WordEntry[]): GroupedEntries => {
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

  if (isLoading) {
    return (
      <div className={classes.loaderContainer}>
        <Loader type="dots" 
        size="sm" 
        color="rgba(191, 191, 191, 1)"  />
      </div>
    );
  }

  if (wordData.length === 0) {
    return <div className={classes.wordInfoContainer} />;
  }

  const groupedEntries = groupEntries(wordData);
  
  return (
    <div className={classes.wordInfoContainer}>
      {Object.entries(groupedEntries).map(([etymologyGroup, entries], groupIndex) => {
        const uniqueWords = Array.from(new Set(entries.map((entry) => entry[0])));
        
        return (
          <div key={groupIndex} className={classes.wordGroup}>
            {uniqueWords.map((word, wordIndex) => (
              <span
                key={`${groupIndex}-${wordIndex}`}
                className={classes.additionalWord}
                onClick={() => onAdditionalWordClick(word)}
              >
                {word}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default WordInfo;