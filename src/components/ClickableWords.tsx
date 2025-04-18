import React, { useState } from 'react';
import { ActionIcon } from '@mantine/core';
import { IconCopy, IconCopyCheck, IconClipboard, IconClipboardCheck } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import classes from './ClickableWords.module.css';
import { WordEntry } from '../types/wordTypes';
import WordInfoPortal from './WordInfoPortal';

interface ClickableWordsProps {
  lines: string[];
  selectedWord: string;
  textTranslit: string;
  setSelectedWord: (word: string) => void;
  selectedDictionaries: string[];
  wordData: WordEntry[];
  isLoadingWordData: boolean;
  clickedWord: string | null;
  setClickedWord: (word: string | null) => void;
  onWordClick?: (word: string) => void;
  onAdditionalWordClick?: (word: string) => void;
  setClickedAdditionalWord: (word: string) => void;
  setIsLoadingWordData: (isLoading: boolean) => void;

}

const ClickableWords: React.FC<ClickableWordsProps> = ({
  lines,
  selectedWord,
  setSelectedWord,
  wordData,
  isLoadingWordData,
  setIsLoadingWordData,
  clickedWord,
  setClickedWord,
  onWordClick,
  onAdditionalWordClick,
  textTranslit,
  setClickedAdditionalWord
}) => {
  const [clickedElement, setClickedElement] = useState<HTMLElement | null>(null);
  const [previousElement, setPreviousElement] = useState<HTMLElement | null>(null);
  const clipboard = useClipboard({ timeout: 500 });

  const handleWordClick = async (trimmedWord: string, event: React.MouseEvent<HTMLSpanElement>) => {
    setClickedElement(event.currentTarget);
    setSelectedWord(trimmedWord);
    setClickedWord(trimmedWord);
    //setIsLoadingWordData(true);
    if (onWordClick) {
      onWordClick(trimmedWord);
    }
    
  };

  return (
    <>
      {textTranslit !== "" && (
        <ActionIcon
          className={classes.copyButton}
          onClick={() => clipboard.copy(lines.join('\n'))}
          variant="subtle"
          size="md"
          aria-label="Copy text"
        >
          {clipboard.copied ? (
            <IconClipboardCheck size={20} stroke={1.5} />
          ) : (
            < IconClipboard size={20} stroke={1.5} />
          )}
        </ActionIcon>
      )}
      
      <div style={{ marginTop: '4.5rem' }}>
        {lines.map((line, lineIndex) => {
          const words = line.split(/\s+|\+/);
          return (
            <div key={lineIndex} style={{ marginBottom: '8px' }}>
              <p>
                {words.map((word: string, wordIndex: number) => {
                  const trimmedWord = word.trim();
                  return (
                    <span
                     className={`
                          ${classes.word}
                          ${selectedWord === trimmedWord ? classes.selectedWord : ''}
                          `}
                      key={wordIndex}
                      onClick={(e) => handleWordClick(trimmedWord, e)}
                    >
                      {word + ' '}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>

      <WordInfoPortal
        clickedElement={clickedElement}
        previousElement={previousElement}
        wordData={wordData}
        isLoadingDebug={isLoadingWordData}
        onAdditionalWordClick={setClickedAdditionalWord}
        setPreviousElement={setPreviousElement}
      />
    </>
  );
};

export default ClickableWords;