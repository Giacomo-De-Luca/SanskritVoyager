import React, { useState, useEffect, useRef, useCallback } from 'react';
import WordInfoPortal from '../WordInfoPortal';
import classes from './ClickableSimpleBooks.module.css';
import { BookText, TextElement, Metadata } from '../../types/bookTypes';
import MetadataComponent from '../metadata/Metadata';
import { WordEntry } from '../../types/wordTypes';
import { safeSplitText } from './textUtils';
import HighlightText from '../HighlightText';
import { Accordion } from '@mantine/core';
import { useThrottledCallback, useThrottledState } from '@mantine/hooks';
import ScrollMarkers from './ClickableSimpleMarkers';
import BookSpan from './ClickableSimpleBooksSpan';

interface ClickableSimpleBooksProps {
  bookText: BookText;


  wordData: WordEntry[];
  textType: string;
  isLoadingWordData: boolean;
  targetSegmentNumber: number | null;
  setTargetSegmentNumber: React.Dispatch<React.SetStateAction<number | null>>;
  query: string;
  matchedBookSegments: number[];
  setSelectedWord: (word: string) => void;
  setClickedAdditionalWord: (word: string) => void;
  //setWordData: (data: any) => void;
  // selectedDictionaries: string[];
}

const ClickableSimpleBooks = ({
  bookText,
  setSelectedWord,
  wordData,
  setClickedAdditionalWord,
  textType,
  isLoadingWordData,
  targetSegmentNumber,
  query,
  matchedBookSegments,
}: ClickableSimpleBooksProps) => {
  


  const [clickedElement, setClickedElement] = useState<HTMLElement | null>(null);
  
  const highlightedSpanRef = useRef<HTMLElement | null>(null);


  // Create a global note counter to ensure unique IDs
  const noteCounterRef = useRef<number>(0);  
  // Map to store stable note IDs
  const noteIdMapRef = useRef<Map<string, number>>(new Map());

  
  // Create a Map to store refs to segment elements
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());  
  // Reference to the main container element
  const containerRef = useRef<HTMLDivElement>(null);
  // State for processed marker positions

  // this should be a ref
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);


   const renderCount = useRef(0);
   renderCount.current++;
   console.log(`ClickableSimpleBooks render #${renderCount.current}`);


  // effect 1: RESET  
  // Clear the ref map and reset the note counter when the book changes
  useEffect(() => {
    segmentRefs.current = new Map();
    setInitialRenderComplete(false); // Reset initial render flag
    noteCounterRef.current = 0; // Reset note counter for each new book
    noteIdMapRef.current = new Map(); // Reset the note ID map
    console.log("Segment refs map and note counter reset due to book change");
  }, [bookText]);

  
    // Create a reusable scroll function that doesn't trigger re-renders
    const scrollToSegment = useCallback((segmentNumber: number) => {
      if (!bookText.body) return;
      
      console.log(`Scrolling to segment ${segmentNumber}`);
      
      // Wait for refs to be populated
      const timeoutId = setTimeout(() => {
        // Try to get the element from our refs map
        const targetElement = segmentRefs.current.get(segmentNumber);
        
        if (targetElement) {
          // Scroll to the element
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.warn(`No ref found for segment ${segmentNumber}`);
          
          // Fallback to DOM query
          const domElement = document.getElementById(`segment-${segmentNumber}`) || 
                            document.querySelector(`[data-segment-number="${segmentNumber}"]`);
          
          if (domElement) {
            domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      
    }, [bookText.body]);

    // Effect just calls the function when targetSegmentNumber changes
    useEffect(() => {
      if (targetSegmentNumber !== null) {
        scrollToSegment(targetSegmentNumber);
      }
    }, [targetSegmentNumber, scrollToSegment]);

    // Effect 2: Set initial render complete flag after a delay
 useEffect(() => {
    // Only run if not already complete and book has content
    if (!initialRenderComplete && bookText.body && bookText.body.length > 0) {
      const timer = setTimeout(() => {
        console.log("Setting initial render complete flag to true.");
        setInitialRenderComplete(true); // Use state setter
      }, 500); // Delay to allow refs to populate

      return () => clearTimeout(timer);
    }
    // Depend on bookText to re-run this effect for new books,
    // and initialRenderComplete to prevent re-running after it's true.
  }, [bookText, initialRenderComplete]);

    const handleWordClick = useCallback((e: React.MouseEvent<HTMLElement>, wordToSelect: string) => {
            const currentElement = e.currentTarget;
    
            // --- Portal Positioning ---
            setClickedElement(currentElement); // Still needed for the portal positioning
    
            // --- Highlighting Logic ---
            // Remove highlight from the previously highlighted element, if any
            if (highlightedSpanRef.current && highlightedSpanRef.current !== currentElement) {
              highlightedSpanRef.current.classList.remove(classes.selectedWord);
            }
    
            // Add highlight to the current element
            currentElement.classList.add(classes.selectedWord);
    
            // Update the ref to the currently highlighted element
            highlightedSpanRef.current = currentElement;
    
            // --- Call Parent Function ---
            // This does NOT trigger a re-render of ClickableSimpleBooks
            setSelectedWord(wordToSelect);
    
          }, [setSelectedWord]); // Include classes.selectedWord if it might change (unlikely)


  const renderTextElement = (element: TextElement): React.ReactNode => {
    console.log("Processing element:", JSON.stringify(element));
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
            // Removes a lettered prefix_ before a number.decimal (e.g., "word_1.2 " -> "1.2 ").
            .replace(/([A-Za-z]+)_(\d+\.\d+)\s/g, '$2 ')
            // Removes a lettered prefix_ before a number (e.g., "word_1" -> "1").
            .replace(/([A-Za-z]+)_(\d+)/g, '$2 ')
            // Replaces all forward slashes with pipe characters.
            .replace(/\//g, '|')
            // Replaces periods not followed by a digit with pipe characters (preserves decimal points).
            .replace(/\.(?!\d)/g, '|')
            // Removes all asterisk characters.
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
                    const sanskritWordRaw = part.replace(/<\/?s>/g, '').trim();
                    const sanskritWordProcessed = sanskritWordRaw.toLowerCase();

                    return (

                      <BookSpan
                        key={`${segmentIndex}-${partIndex}`}
                        wordText={sanskritWordRaw + ' '}
                        wordKey={`${segmentIndex}-${partIndex}`}
                        // Pass boolean directly based on current selectedWord
                        isSanskrit={true}
                        // Pass the memoized handler
                        onClick={(e) => handleWordClick(e, sanskritWordProcessed)}
                      />
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

                    <BookSpan
                                          wordText={word + ' '} // Display original word with space
                                          wordKey={`${segmentIndex}-${wordIndex}`}
                                          // Pass boolean directly
                                          // Pass the memoized handler
                                          onClick={(e) => handleWordClick(e, trimmedWord)}
                    />



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

    if (element.tag === 'lg' && element.attributes?.id) {
      const labelText = element.attributes.id; // Use the id as label text
      
      return (
        <>
          {/* Render the label separately */}
          <div 
            className={`
              ${classes.label} 
              ${isTargetSegment ? classes.highlightedSegment : ''}
              ${isMatchedSegment ? classes.matchedSegment : ''}
            `}
            data-segment-number={segmentNumber}
            ref={setSegmentRef}
            id={segmentNumber !== null ? `segment-${segmentNumber}` : undefined}
          >
            {labelText}
          </div>
          
          {/* Render the children with normal styling */}
          {element.children?.map((child, childIndex) => (
            <React.Fragment key={`lg-label-child-${childIndex}`}>
              {renderTextElement(child)}
            </React.Fragment>
          ))}
        </>
      );
    }

    

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


    if (element.tag === 'pb' || element.tag === 'milestone') {
      let pageText = '';
      // 'attributes' is already defined above, using element.attributes (plural)
      const attributes = element.attributes || {};
  
      if (element.tag === 'pb') {
        let base = "--- Page";
        if (attributes.n) { // Check attributes.n
          console.log('Found Page number:', attributes.n);
          base += ` ${attributes.n}`;
        }
        if (attributes.ed) { // Check attributes.ed
          base += ` (${attributes.ed})`;
        }
        pageText = `${base} ---`;
      } else if (element.tag === 'milestone') {
        const unit = attributes.unit || 'Milestone'; 
        let n_val = attributes.n || ''; 
        pageText = `--- ${unit}${n_val ? ' ' + n_val : ''} ---`;
      }
      
      // For pb/milestone, we render the pageText and then ALSO render its children, if any.
      return (
        <div 
          className={`
            ${classes.paragraphContainer} 
            ${classes.pageBreak} /* Apply specific styling for page breaks */
            ${elementClasses} /* Apply general classes from the element tag */
          `}
          data-segment-number={segmentNumber}
          ref={setSegmentRef}
          id={segmentNumber !== null ? `segment-${segmentNumber}` : undefined}
          onClick={() => {
            console.log('Clicked page/milestone:', attributes.n, attributes.ed, attributes.unit);
          }}
        >
          <div className={classes.pageBreakTextContainer}>{pageText}</div> {/* Display the page/milestone text */}
          
          {/* Recursively render children of pb/milestone elements */}
          {element.children?.map((child, index) => {
            const childWithType = { // Ensure type is passed down if needed
              ...child,
              attributes: {
                ...child.attributes,
                type: child.attributes?.type || element.attributes?.type
              }
            };
            return (
              <React.Fragment key={index}>
                {renderTextElement(childWithType)}
              </React.Fragment>
            );
          })}
        </div>
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
      {matchedBookSegments.length > 0 && (
          <ScrollMarkers
              containerRef={containerRef}
              segmentRefs={segmentRefs}
              matchedBookSegments={matchedBookSegments}
              activeSegment={targetSegmentNumber} // For highlighting the active marker
              onSegmentClick={scrollToSegment}
              initialRenderComplete={initialRenderComplete}
          />
        )}      
      <WordInfoPortal
        clickedElement={clickedElement}
        wordData={wordData}
        isLoadingDebug={isLoadingWordData}
        onAdditionalWordClick={setClickedAdditionalWord}
      />
    </div>
  );
};

export default React.memo(ClickableSimpleBooks);