import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import WordInfo from './WordInfo';
import classes from './ClickableSimpleBooks.module.css';

interface WordInfoPortalProps {
  clickedElement: HTMLElement | null;
  previousElement: HTMLElement | null;
  wordData: any[];
  isLoadingDebug: boolean;
  onAdditionalWordClick: (word: string) => void;
  setPreviousElement: (element: HTMLElement | null) => void;
}

const WordInfoPortal: React.FC<WordInfoPortalProps> = ({
  clickedElement,
  previousElement,
  wordData,
  isLoadingDebug,
  onAdditionalWordClick,
  setPreviousElement
}) => {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!clickedElement) return;

    // Clean up previous container
    if (previousElement) {
      const previousContainer = previousElement.nextElementSibling as HTMLElement;
      if (previousContainer?.classList.contains(classes.wordInfo)) {
        previousContainer.remove();
      }
    }

    // Create new container
    const container = document.createElement('div');
    container.className = classes.wordInfo;
    clickedElement.parentNode?.insertBefore(container, clickedElement.nextSibling);

    // Store references
    setPortalContainer(container);
    setPreviousElement(clickedElement);

    // Cleanup
    return () => {
      if (container.parentNode) {
        container.remove();
      }
    };
  }, [clickedElement, previousElement, setPreviousElement]);

  // Effect for scrolling behavior
  useEffect(() => {
    if (!isLoadingDebug && wordData.length > 0 && portalContainer) {
      portalContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isLoadingDebug, wordData, portalContainer]);

  if (!portalContainer) return null;

  return createPortal(
    <WordInfo
      wordData={wordData}
      onAdditionalWordClick={onAdditionalWordClick}
      isLoading={isLoadingDebug}
    />,
    portalContainer
  );
};

export default WordInfoPortal;