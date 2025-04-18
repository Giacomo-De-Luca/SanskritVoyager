import React, { useState, useEffect, useRef, useCallback } from 'react';
import WordInfoPortal from './WordInfoPortal';
import classes from './ClickableSimpleBooks.module.css';
import { BookText, TextElement, Metadata } from '../types/bookTypes';
import MetadataComponent from './Metadata';
import { WordEntry } from '../types/wordTypes';
import { safeSplitText } from './textUtils';
import HighlightText from './HighlightText';
import { Accordion } from '@mantine/core';

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
  textType: string;
  isLoadingWordData: boolean;
  targetSegmentNumber: number | null;
  setTargetSegmentNumber: React.Dispatch<React.SetStateAction<number | null>>;
  query: string;
  matchedBookSegments: number[];
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
  isLoadingWordData,
  targetSegmentNumber,
  setTargetSegmentNumber,
  query,
  matchedBookSegments,
}: ClickableSimpleBooksProps) => {
  const clickedWordInfoRef = useRef<HTMLDivElement>(null);
  const [clickedElement, setClickedElement] = useState<HTMLElement | null>(null);
  const [previousElement, setPreviousElement] = useState<HTMLElement | null>(null);
  
  // Create a global note counter to ensure unique IDs
  const noteCounterRef = useRef<number>(0);
  
  // Map to store stable note IDs
  const noteIdMapRef = useRef<Map<string, number>>(new Map());
  
  // Create a Map to store refs to segment elements
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Reference to the main container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for processed marker positions
  const [processedMatches, setProcessedMatches] = useState<Array<{ 
    segmentNumber: number; 
    positionPercent: number; 
    isActive: boolean; 
  }>>([]);
  
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);

  // Clear the ref map and reset the note counter when the book changes
  useEffect(() => {
    segmentRefs.current = new Map();
    setInitialRenderComplete(false);
    setProcessedMatches([]);
    noteCounterRef.current = 0; // Reset note counter for each new book
    noteIdMapRef.current = new Map(); // Reset the note ID map
    console.log("Segment refs map and note counter reset due to book change");
  }, [bookText]);

  // Effect to track when initial render is complete
  useEffect(() => {
    if (bookText.body && bookText.body?.length > 0) {
      const timer = setTimeout(() => {
        setInitialRenderComplete(true);
        console.log("Initial render completed, calculating markers...");
        
        // If we have matched segments, calculate their positions
        if (matchedBookSegments.length > 0) {
          calculateMarkerPositions();
        }
      }, 500); // Allow time for rendering to complete
      
      return () => clearTimeout(timer);
    }
  }, [bookText]);

  // Function to calculate marker positions
  const calculateMarkerPositions = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const totalHeight = container.scrollHeight;
    
    // Only calculate vertical positions as percentages of total height
    const segmentPositions = matchedBookSegments
      .map(segmentNumber => {
        const element = segmentRefs.current.get(segmentNumber);
        if (!element) return null;
        
        // Simple percentage calculation
        const positionPercent = (element.offsetTop / totalHeight) * 100;
        
        return {
          segmentNumber,
          positionPercent: Math.max(0, Math.min(100, positionPercent)),
          isActive: segmentNumber === targetSegmentNumber
        };
      })
      .filter((pos): pos is {segmentNumber: number; positionPercent: number; isActive: boolean} => pos !== null);

    
    console.log(`Calculated ${segmentPositions.length} marker positions`);
    setProcessedMatches(segmentPositions);
  }, [matchedBookSegments, targetSegmentNumber]);

  // Calculate marker positions whenever matched segments change
  useEffect(() => {
    if (matchedBookSegments.length > 0 && initialRenderComplete) {
      const timeoutId = setTimeout(() => {
        calculateMarkerPositions();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [matchedBookSegments, initialRenderComplete, calculateMarkerPositions]);
  
  // When target segment changes, only update active state instead of full recalculation
  useEffect(() => {
    if (processedMatches.length > 0) {
      setProcessedMatches(prev => 
        prev.map(match => ({
          ...match,
          isActive: match.segmentNumber === targetSegmentNumber
        }))
      );
    }
  }, [targetSegmentNumber]);

  // Scroll to target segment using refs
  useEffect(() => {
    if (targetSegmentNumber !== null && bookText.body) {
      console.log(`Scrolling to segment ${targetSegmentNumber}`);
      
      // Wait for refs to be populated
      const timeoutId = setTimeout(() => {
        // Try to get the element from our refs map
        const targetElement = segmentRefs.current.get(targetSegmentNumber);
        
        if (targetElement) {
          // Scroll to the element
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight class for visual focus
          targetElement.classList.add(classes.highlightedSegment);
          
          // Remove highlight after animation completes
          setTimeout(() => {
            targetElement.classList.remove(classes.highlightedSegment);
          }, 3000);
        } else {
          console.warn(`No ref found for segment ${targetSegmentNumber}`);
          
          // Fallback to DOM query
          const domElement = document.getElementById(`segment-${targetSegmentNumber}`) || 
                            document.querySelector(`[data-segment-number="${targetSegmentNumber}"]`);
          
          if (domElement) {
            domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [bookText, targetSegmentNumber]);

  const [containerRightEdge, setContainerRightEdge] = useState(0);
  
  // Function to calculate and update the right edge position
  const updateRightEdgePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate distance from right edge of viewport to right edge of container
      const rightEdgePosition = window.innerWidth - rect.right - 16;
      setContainerRightEdge(rightEdgePosition);
    }
  }, []);
  
  // Update position on mount, resize, and when dependencies change
  useEffect(() => {
    // Initial calculation
    updateRightEdgePosition();
    
    // Create resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateRightEdgePosition();
    });
    
    // Observe the container
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Add window resize listener
    window.addEventListener('resize', updateRightEdgePosition);
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateRightEdgePosition);
    };
  }, [updateRightEdgePosition]);

  const renderTextElement = (element: TextElement): React.ReactNode => {
    // Determine element classes for styling
    const elementClasses = [
      classes[element.tag] || '',
      element.attributes?.rend === 'bold' ? classes.bold : '',
      element.attributes?.rend === 'it' ? classes.italic : '',
      element.attributes?.type ? classes[element.attributes.type] : '',
    ].filter(Boolean).join(' ');
    
    // Extract segment number from different possible locations
    const segmentNumber = element.segment_number !== undefined ? element.segment_number : 
                        (element.attributes?.id ? 
                          parseInt(element.attributes.id.replace('segment-', '')) : 
                          null);
    
    // Add special classes for target or matched segments
    const isTargetSegment = segmentNumber !== null && 
                           segmentNumber !== undefined && 
                           segmentNumber === targetSegmentNumber;
    
    const isMatchedSegment = segmentNumber !== null && 
                             segmentNumber !== undefined && 
                             matchedBookSegments.includes(segmentNumber);

    // Ref callback function to store reference to this segment element
    const setSegmentRef = (el: HTMLDivElement | null) => {
      if (el && segmentNumber !== null && segmentNumber !== undefined) {
        segmentRefs.current.set(segmentNumber, el);
      }
    };
    
    // Helper to determine if text is just separators
    const isSeparatorOnlyLine = (text: string) => {
      const trimmed = text.trim();
      return trimmed === '||' || trimmed === '//' || trimmed === '*||*' || trimmed === '*//*';
    };

    const renderWords = (text: string, isTranslation: boolean = false) => {
      // Skip rendering if it's just a separator line
      if (!text || isSeparatorOnlyLine(text)) {
        return null;
      }

      // Text transformations
      const transformedText = isTranslation 
        ? text 
        : text
            .replace(/([A-Za-z]+)_(\d+\.\d+)\s/g, '$2 ')
            .replace(/([A-Za-z]+)_(\d+)/g, '$2 ')
            .replace(/\//g, '|')
            .replace(/\.(?!\d)/g, '|')
            .replace(/\*/g, '');
    
      const segments = safeSplitText(transformedText);
    
      return segments.map((segment, segmentIndex) => {
        if (isTranslation) {
          const parts = segment.split(/(<s>.*?<\/s>)/);
    
          return ( 
            <span key={segmentIndex} className={classes.textSegment}>           
              <span className={classes.textContent}>
                {parts.map((part, partIndex) => {
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
                        className={`
                          ${classes.word}
                          ${classes.sanskritWord}
                          ${selectedWord === sanskritWord ? classes.selectedWord : ''}   
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
            </span>
          );
        } else {
          const words = segment.match(/\|\||\||\+|[^\s+|]+/g) || [];
    
          return (
            <span key={segmentIndex} className={classes.textSegment}>
              <span className={classes.textContent}>
                {words.map((word: string, wordIndex: number) => {
                  const trimmedWord = word.trim();
                  if (!trimmedWord) return null;
                  
                  return (
                    <span
                      key={`${segmentIndex}-${wordIndex}`}
                      onClick={async (e) => {
                        setClickedElement(e.currentTarget);
                        setSelectedWord(trimmedWord);
                        setClickedWord(trimmedWord);
                      }}
                      className={`
                        ${classes.word}
                        ${selectedWord === trimmedWord ? classes.selectedWord : ''}
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
    };

    // Handle notes at the element level
    if (element.tag === 'note') {
      const noteContent = element.text || '';
      
      // Create a unique key for this note based on its position in the document
      const noteKey = `note-${element.tag}-${element.segment_number || ''}-${element.text?.substring(0, 20) || ''}`;
      
      // Check if this note already has an ID
      let noteNumber = noteIdMapRef.current.get(noteKey);
      if (noteNumber === undefined) {
        // Only assign a new number if this is the first time we've seen this note
        noteNumber = ++noteCounterRef.current;
        noteIdMapRef.current.set(noteKey, noteNumber);
      }
      
      const noteId = `note-${noteNumber}`;

      return (
        <Accordion variant="default" 
        radius="md" 
        className={classes.noteAccordion}
        classNames={{
          root: classes.noteAccordionRoot,
          panel: classes.noteAccordionPanel,
          item: classes.noteAccordionItem,
          control: classes.noteAccordionControl
        }}>
          <Accordion.Item value={noteId}>
            <Accordion.Control className={classes.noteAccordionControl}>
              <span className={classes.noteNumber}>{noteNumber}</span>
            </Accordion.Control>
            <Accordion.Panel className={classes.noteAccordionPanel}>
              {/* First render the direct text content */}
              {noteContent && renderWords(noteContent)}
              
              {/* Then recursively render any children */}
              {element.children?.map((noteChild, noteChildIndex) => (
                <React.Fragment key={`note-child-${noteChildIndex}`}>
                  {renderTextElement(noteChild)}
                </React.Fragment>
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      );
    }
  
    return (
      <div 
        className={`
          ${classes.paragraphContainer} 
          ${elementClasses} 
          ${isTargetSegment ? classes.highlightedSegment : ''}
          ${isMatchedSegment ? classes.matchedSegment : ''}
          `
        }
        data-segment-number={segmentNumber}
        ref={setSegmentRef}
        id={segmentNumber !== null ? `segment-${segmentNumber}` : undefined}
      >
        {element.text && (
          <div className={`${classes.lineContainer} ${
            textType === 'or' ? classes.originalOnly : 
            textType === 'tran' ? classes.translationOnly : ''
          }`}>
            {(textType === 'both' || textType === 'or') && (
              <div className={classes.originalText}>
                {isTargetSegment || isMatchedSegment ?  (
                  <HighlightText text={element.text} query={query} />
                ) : (
                  renderWords(element.text)
                )}
              </div>
            )}
            
            {element.translated_text && (textType === 'both' || textType === 'tran') && (
              <div className={`${classes.translatedText} ${
                textType === 'tran' ? classes.translationOnly : ''
              }`}>
                {isTargetSegment || isMatchedSegment ? (
                  <HighlightText text={element.translated_text} query={query} />
                ) : (
                  renderWords(element.translated_text, true)
                )}
              </div>
            )}
          </div>
        )}

        {element.children?.map((child, index) => {
          const childWithType = {
            ...child,
            attributes: {
              ...child.attributes,
              type: child.attributes?.type || element.attributes?.type
            }
          };

          // Handle notes that are children of elements
          if (child.tag === 'note') {
            const noteContent = childWithType.text || '';
            
            // Create a unique key for this note based on its position in the document
            const noteKey = `note-child-${segmentNumber || ''}-${index}-${child.text?.substring(0, 20) || ''}`;
            
            // Check if this note already has an ID
            let noteNumber = noteIdMapRef.current.get(noteKey);
            if (noteNumber === undefined) {
              // Only assign a new number if this is the first time we've seen this note
              noteNumber = ++noteCounterRef.current;
              noteIdMapRef.current.set(noteKey, noteNumber);
            }
            
            const noteId = `note-${noteNumber}`;
            
            return (
              <Accordion 
                variant="default" 
                radius="md" 
                className={classes.noteAccordion}
                key={noteId}
                classNames={{
                  root: classes.noteAccordionRoot,
                  panel: classes.noteAccordionPanel,
                  item: classes.noteAccordionItem,
                  control: classes.noteAccordionControl
                }}
              >
                <Accordion.Item value={noteId}>
                  <Accordion.Control className={classes.noteAccordionControl}>
                    <span className={classes.noteNumber}>{noteNumber}</span>
                  </Accordion.Control>
                  <Accordion.Panel className={classes.noteAccordionPanel}>
                    {/* First render the direct text content */}
                    {noteContent && renderWords(noteContent)}
                    
                    {/* Then recursively render any children */}
                    {childWithType.children?.map((noteChild, noteChildIndex) => (
                      <React.Fragment key={`note-child-${noteChildIndex}`}>
                        {renderTextElement(noteChild)}
                      </React.Fragment>
                    ))}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            );
          }
          
          return (
            <React.Fragment key={index}>
              {renderTextElement(childWithType)}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className={classes.bookContainer} ref={containerRef} style={{ position: 'relative' }}>
      {bookText.metadata && (  
        <MetadataComponent metadata={bookText.metadata} />
      )}
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

      {/* Simplified marker container directly in component */}
      {processedMatches.length > 0 && (
        <div className={classes.markerContainer}
        style = {{ right: `${containerRightEdge}px` }}>
          {processedMatches.map(segment => (
            <div
              key={segment.segmentNumber}
              onClick={() => setTargetSegmentNumber(segment.segmentNumber)}
              className={`${classes.marker} ${segment.isActive ? classes.activeMarker : ''}`}
              style={{ top: `${segment.positionPercent}%` }}
              title={`Go to segment ${segment.segmentNumber}`}
            />
          ))}
        </div>
      )}
      
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