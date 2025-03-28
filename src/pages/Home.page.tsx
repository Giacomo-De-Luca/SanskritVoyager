import React, { useState, useEffect, useRef } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea, Button, Loader, Text, Stack, ActionIcon, Skeleton, useMantineTheme } from '@mantine/core';
import { FileInput } from '@mantine/core';
import { ComboboxItem, Container, lighten, darken, ScrollArea } from '@mantine/core';
import { useDisclosure, useDebouncedState, useMediaQuery } from '@mantine/hooks';
import WordDataComponent from '@/components/WordDataComponent';
import { fetchWordData, fetchMultidictData, transliterateText, handleTranslate } from './Api';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavbarSimple } from '@/components/NavbarSimple';
import { IconVocabularyOff, IconChevronUp, IconChevronDown, IconChevronsRight, IconChevronRight } from '@tabler/icons-react';
import { IconClipboardCheck, IconCopy, IconClipboard } from '@tabler/icons-react';
import classes from './HomePage.module.css';
import { UiSwitch } from '@/components/HeaderSearch';
import DictionarySelectComponent from '@/components/DictionarySelect';
import BookSelect from '@/components/BookSelect';
import ClickableSimpleBooks from '@/components/ClickableSimpleBooks';
import ClickableWords from '@/components/ClickableWords';
import { WordEntry, GroupedEntries } from '../types/wordTypes';
import { BookText, TextElement } from '../types/bookTypes';
import TranslationControl from '@/components/TranslationControl';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import AdvancedSearch from '@/components/AdvancedSearch';
import { SearchResult } from '@/types/searchTypes';

import { fetchBookText } from '../utils/apiService';


// unused
interface Translation {
  English: string;
  Sanskrit: string;
}

export function HomePage() {

    
  // ----- General state -----
  const [text, setText] = useState('');
  const [scheme, setScheme] = useState<ComboboxItem>({ value: 'IAST', label: 'IAST' });
  const [textTranslit, setTextTranslit] = useDebouncedState('', 100);
  const [translatedText, setTranslatedText] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [bookTitle, setBookTitle] = useState<string | null>(null);
  const [bookText, setBookText] = useState<BookText>({});
  const [textType, setTextType] = useState('both');
  const [selectedDictionaries, setSelectedDictionaries] = useState<string[]>([]);
  const [isWordInfoVisible, setIsWordInfoVisible] = useState(false);
  const [displayInflectionTables, setDisplayInflectionTables] = useState(false);
  const [isLoadingWordData, setIsLoadingWordData] = useState(false);
  const [isAdvancedSearchVisible, handleAdvancedSearch] = useDisclosure(false);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  // ----- Derived state -----
  const isTextEmpty = text === "" && Object.keys(bookText).length === 0;
  const words = textTranslit ? textTranslit.split(/\s+|\\+/) : [];
  const lines = textTranslit ? textTranslit.split('\n') : [];
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [wordData, setWordData] = useState<WordEntry[]>([]);
  const [clickedAdditionalWord, setClickedAdditionalWord] = useState<string | null>(null);
  const [clickedInfoWord, setClickedInfoWord] = useState<string | null>(null);
  
  // ----- Media queries -----
  const isSmallMobile = useMediaQuery('(max-height: 724px)');
  const isMobile = useMediaQuery('(max-width: 600px)');
  const isTablet = useMediaQuery('(max-width: 1100px)');
  const shouldUseColumn = isMobile || (isTablet && isNavbarVisible);
  
  // ----- Constants -----
  const headerHeight = 56;
  const availableHeight = viewportHeight - headerHeight;

  const [isLoadingBook, setIsLoadingBook] = useState(false);


  const [advancedSearchResults, setAdvancedSearchResults] = useState<SearchResult | null>(null);
  const [targetSegmentNumber, setTargetSegmentNumber] = useState<number | null>(null);
  const [query, setQuery] = useState<string>('');
  const [matchedBookSegments, setMatchedBookSegments] = useState<number[]>([]);
  

  // Effect to track viewport size
  useEffect(() => {
    function handleResize() {
      setViewportHeight(window.innerHeight);
    }
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  // Effect to show word info when advanced search is visible
  useEffect(() => {
    if (isAdvancedSearchVisible) {
      setIsWordInfoVisible(true);
    }
  }, [isAdvancedSearchVisible]);
  
  // Effect to scroll to clicked word
  useEffect(() => {
    if (clickedAdditionalWord) {
      let element = document.querySelector(`h1[data-word="${clickedAdditionalWord}"]`);
      setIsWordInfoVisible(true);
      handleAdvancedSearch.close()
      
      if (!element) {
        const allH1s = document.querySelectorAll('h1');
        for (const h1 of allH1s) {
          if (h1.textContent?.trim() === clickedAdditionalWord) {
            element = h1;
            break;
          }
        }
      }
      if (element) {
        setTimeout(() => {
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      setClickedAdditionalWord(null);
    }
  }, [clickedAdditionalWord]);
  
  // Effect to scroll to word data
  useEffect(() => {
    if (wordData.length > 0) {
      setTimeout(() => {
        const targetWord = clickedInfoWord || wordData[0][0];
        let element = document.querySelector(`h1[data-word="${targetWord}"]`);
        
        if (!element) {
          const allH1s = document.querySelectorAll('h1');
          for (const h1 of allH1s) {
            if (h1.textContent?.trim() === targetWord) {
              element = h1;
              break;
            }
          }
        }
  
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [wordData, clickedInfoWord]);
  
  // Effect to select single word
  useEffect(() => {
    if (textTranslit && words.length === 1) {
      setSelectedWord(words[0].trim());
    }
  }, [textTranslit, words]);
  
  // Effect to show word info when a word is selected
  useEffect(() => {
    if (selectedWord !== '') {
      setIsWordInfoVisible(true);
    }
  }, [selectedWord]);
  
  // Effect to fetch word data when a word is selected
  useEffect(() => {
    if (selectedWord) {
      setIsLoadingWordData(true);
      fetchMultidictData(selectedWord, selectedDictionaries).then(data => {
        setWordData(data);
        setIsLoadingWordData(false);
        handleAdvancedSearch.close();

      }).catch(() => {
        setIsLoadingWordData(false);
      });
    }
  }, [selectedWord, selectedDictionaries]);
  
  // Effect to fetch book text when a book is selected
  useEffect(() => {
    if (bookTitle) {
      const fetchData = async () => {
        try {
          setIsLoadingBook(true);
          
          try {
            // Always try the API first
            await fetchBookFromApi(bookTitle);
          } catch (apiError) {
            // If API fails, try the local resource
            console.log("API fetch failed, trying local resource");
            const response = await fetch(`/public/resources/books/${bookTitle}.json`);
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.status}`);
            }
            const data = await response.json();
            setBookText(data);
          }
        } catch (error) {
          console.error("Error loading book:", error);
        } finally {

          
          setIsLoadingBook(false);
          console.log('book text:', bookText);
        }
      };
    
      fetchData();
    }
  }, [bookTitle]);

    // Function to fetch a book from the API
  const fetchBookFromApi = async (title: string) => {
    try {
      const bookData = await fetchBookText(title);
      setBookText(bookData);
      // here it should be scrolling to the segment number 
    } catch (error) {
      console.error("Error fetching book from API:", error);
      throw error;
    }
  };
  
  // ----- Functions -----
  
  // Toggle navbar visibility
  const toggleNavbar = () => {
    setIsNavbarVisible(prevState => !prevState);
  };
  
  // Transliterate text
  const handleTransliteration = async (inputText: string, newValue?: string) => {
    const selectedValue = newValue || scheme.value;
    const transliteratedText = await transliterateText(inputText, selectedValue);
    setTextTranslit(transliteratedText);
  };
  
  // Translate text
  const updateTranslate = async (inputText: string) => {
    setLoading(true);
    const response = await handleTranslate(inputText);
    setTranslatedText(response.translation);
    setLoading(false);
  };
  
  // Calculate heights based on viewport
  const vhActual = `${availableHeight}px`;
  const vhActualHalf = `${availableHeight / 2}px`;


  // now the main page
  // mainContainer wrapping everything
      // header fixed on top
      // contentBox with all the space under the header
          // navbarBox with the navbar
          // when it isn't mobile and the navbar isn't visible:
          // wholeGrid for the whole grid
              // when text or title isn't null:
              // textDisplay grid column
                  //scrollContainer
                      //clickableWords for user-input
                      //clickableSimpleBooks for books
              // same condition as before, when text or title isn't null
              // wordInfoHalfColumn
                  //chevron container
                  //scrollContainer
                      //advancedSearch
                      //wordContainer
              // when text and title are null:
              // wordInfoFull column
                  //chevron container
                  //scrollContainer
                      //advancedSearch
                      //wordContainer

  // to do: simply make an object with the styles for half and full
  // according to the condition: when text or title isn't null
  // select class and style set
  // and display the chevronContainer
  // then add a good sliding transition from left to right when text appears
  // and a good sliding transition from right to left when the column is closed


      



  
  return (
    <div className={classes.mainContainer}>
      <HeaderSearch
        onSearch={setSelectedWord}
        onToggleNavbar={toggleNavbar}
        isMobile={isMobile}
        isNavbarVisible={isNavbarVisible}
      />

      <div 
        className={classes.contentBox}
        style={{ 
          display: 'flex',
          overflow: 'hidden',
          position: 'fixed',
          width: '100%',
          height: vhActual,
          bottom: 0,
        }}
      >  
        <div
          className={classes.navbarBox}
          style={{ 
            width: isNavbarVisible ? 
              (isMobile ? '100vw' : (isTablet ? '350px' : '350px')) : 0,
          }}
        >
          {isNavbarVisible && (
            <NavbarSimple
              isNavbarVisible={isNavbarVisible}
              isMobile={isMobile}
              isTablet={isTablet}
              isSmallMobile={isSmallMobile}
              scheme={scheme}
              setScheme={setScheme}
              handleTransliteration={handleTransliteration}
              selectedDictionaries={selectedDictionaries}
              setSelectedDictionaries={setSelectedDictionaries}
              bookTitle={bookTitle}
              setBookTitle={setBookTitle}
              textType={textType}
              setTextType={setTextType}
              text={text}
              setText={setText}
              setIsNavbarVisible={setIsNavbarVisible}
              handleAdvancedSearch={handleAdvancedSearch}
            />
          )}
        </div>

        {!(isMobile && isNavbarVisible) && (
          <Grid 
            className={classes.wholeGrid}
            justify="space-around"
            align="stretch"
            style={{ 
              display: 'flex', 
              flexDirection: shouldUseColumn ? 'column' : 'row',
              flexWrap: 'nowrap',
              justifyContent: 'left',
              transition: 'padding-left 0.3s ease',
              paddingRight: isMobile ? '16px' : '8px',
              paddingLeft: isMobile ? '16px' : '8px',
              position: 'relative',
              width: '100%',
              paddingTop: '8px',
            }}
          >
            {(text !== '' || bookTitle !== null) ? (
              <Grid.Col 
                span={
                  isMobile ? 12 : 
                  isTablet && isNavbarVisible ? 12 : 
                  ((selectedWord !== "" && isWordInfoVisible) || (isWordInfoVisible && isAdvancedSearchVisible) ?  6 : 12)
                }
                className={`${classes.textDisplay}`}
                style={{
                  paddingTop: '0px',
                  height: isMobile ? 
                    (isWordInfoVisible ? 
                      vhActualHalf 
                    : vhActual) :
                    isTablet && isNavbarVisible ? 
                      (isWordInfoVisible ? vhActualHalf : vhActual) : 
                      vhActual,
                  width: isMobile ? '100%' : (isWordInfoVisible ? '50%' : '100%'),
                  paddingLeft: isMobile ? '8%' : 
                    (isTablet ? 
                      (isNavbarVisible ? 
                        (isWordInfoVisible ? '10%' : '10%') : 
                        (isWordInfoVisible ? '12%' : '22%')) :
                      (isNavbarVisible ? 
                        (isWordInfoVisible ? '10%' : '25%') : 
                        (isWordInfoVisible ? '18%' : '28%'))),
                  paddingRight: isMobile ? '8%' : 
                    (isTablet ? 
                      (isNavbarVisible ? 
                        (isWordInfoVisible ? '10%' : '10%') : 
                        (isWordInfoVisible ? '3%' : '20%')) :
                      (isNavbarVisible ? 
                        (isWordInfoVisible ? '3%' : '25%') : 
                        (isWordInfoVisible ? '3%' : '28%'))),
                  transition: 'all 0.3s ease',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  paddingBottom: '0px'
                }}
              >
                <div className={classes.scrollContainer}
                  style={{
                    borderBottom: 
                      (isMobile && isWordInfoVisible) || 
                      (isTablet && isNavbarVisible && isWordInfoVisible) ? 
                        '1px solid lightgray' : 'none',
                  }}
                >
                  {textTranslit !== '' && (
                    <ClickableWords
                      lines={lines}
                      textTranslit={textTranslit}
                      selectedWord={selectedWord}
                      setSelectedWord={setSelectedWord}
                      hoveredWord={hoveredWord}
                      setHoveredWord={setHoveredWord}
                      selectedDictionaries={selectedDictionaries}
                      wordData={wordData}
                      isLoadingWordData={isLoadingWordData}
                      clickedWord={clickedWord}
                      setClickedWord={setClickedWord}
                      setClickedAdditionalWord={setClickedAdditionalWord}
                      setIsLoadingWordData={setIsLoadingWordData}
                    />
                  )}

                  <ClickableSimpleBooks
                    bookText={bookText}
                    selectedWord={selectedWord}
                    setSelectedWord={setSelectedWord}
                    clickedWord={clickedWord}
                    setClickedWord={setClickedWord}
                    setWordData={setWordData}
                    wordData={wordData}
                    setClickedAdditionalWord={setClickedAdditionalWord}
                    selectedDictionaries={selectedDictionaries}
                    hoveredWord={hoveredWord}
                    setHoveredWord={setHoveredWord}
                    textType={textType}
                    isLoadingWordData={isLoadingWordData}
                    targetSegmentNumber={targetSegmentNumber}
                    setTargetSegmentNumber={setTargetSegmentNumber}
                    query={query}
                    matchedBookSegments={matchedBookSegments}
                  />
                </div>
              </Grid.Col>
            ) : null}

            {/* Here starts the wordInfo column */}

            {(text !== '' || bookTitle !== null) ? (
              // First make sure wordInfoVisible is true, then check any of the other conditions
              isWordInfoVisible && (
                (Array.isArray(wordData) && wordData.length > 0) || 
                isLoadingWordData || 
                isAdvancedSearchVisible
              ) ? (
                <Grid.Col 
                  span={
                    isWordInfoVisible ? 
                      (isMobile ? 12 : isTablet ? 
                        (isNavbarVisible ? 12 : 6) : 6) : 0
                  }
                  className={`${classes.wordInfoHalf} ${classes.wordInfoTransition}`}
                  style={{
                    overflowY: 'auto',
                    position: 'relative',
                    opacity: !isWordInfoVisible ? 0 : 1,
                    visibility: !isWordInfoVisible ? 'hidden' : 'visible',
                    transition: 'all 0.3s ease',
                    paddingTop: '0px',
                    height: isWordInfoVisible ? 
                      (isMobile ? 
                        vhActualHalf : 
                        (isTablet ? 
                          (isNavbarVisible ? vhActualHalf : vhActual) : 
                          vhActual)) : 0,
                    width: isWordInfoVisible ? 
                      (isMobile ? '100%' : isTablet ? 
                        (isNavbarVisible ? '100%' : '50%') : '50%') : 0,
                    paddingLeft: isWordInfoVisible ? 
                      (isMobile ? '4%' : isTablet ? 
                        (isNavbarVisible ? '10%' : '3%') : 
                        (isNavbarVisible ? '3%' : '3%')) : 0,
                    paddingRight: isWordInfoVisible ? 
                      (isMobile ? '4%' : isTablet ? 
                        (isNavbarVisible ? '10%' : '12%') : 
                        (isNavbarVisible ? '10%' : '18%')) : 0,
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    paddingBottom: '0px'
                  }}
                >
  

                  <div className={classes.chevronContainer}>
                    <ActionIcon 
                      className={classes.chevronButton}
                      onClick={() => setIsWordInfoVisible(!isWordInfoVisible)}
                      data-rotated={!isWordInfoVisible}
                      aria-label={isWordInfoVisible ? "Collapse word info" : "Expand word info"}
                      variant="transparent"
                      size="md"
                      style={{
                        right: isMobile ? '4px' : '-0px',
                        top: isMobile ? 0 : '20px',
                      }}
                    >
                      {isMobile ? 
                        <IconChevronDown size={20} stroke={1.5} /> : 
                        <IconChevronRight size={20} stroke={1.5} />
                      }
                    </ActionIcon>
                  </div>

                  <div className={classes.scrollContainer}>
                    {isLoadingWordData ? (
                      <LoadingSkeleton />
                    ) : isAdvancedSearchVisible ? (
                      <AdvancedSearch
                          advancedSearchResults={advancedSearchResults}
                          setAdvancedSearchResults={setAdvancedSearchResults}
                          isMobile={isMobile} 
                          query={query}
                          setQuery={setQuery}
                          onSearch={(params) => {
                            console.log('Advanced search params:', params);
                          }}
                          setTargetSegmentNumber = {setTargetSegmentNumber}
                          onOpenText={(textId, bookTitle) => {
                            // Store both the ID and title
                            setBookTitle(bookTitle);
                            setIsWordInfoVisible(true);                                        
                                                
                          }}
                          matchedBookSegments={matchedBookSegments}
                          setMatchedBookSegments={setMatchedBookSegments}
                        />
                    ) : (
                      <WordDataComponent
                        wordData={wordData}
                        setWordData={setWordData}
                        selectedDictionaries={selectedDictionaries}
                        isMobile={isMobile}
                        setClickedInfoWord={setClickedInfoWord}
                        isTablet={isTablet}
                        isNavabarVisible={isNavbarVisible}
                        setDisplayInflectionTables={setDisplayInflectionTables}
                        displayInflectionTables={displayInflectionTables}
                      />
                    )}
                  </div>
                </Grid.Col>
              ) : null
            ) : (
              <Grid.Col 
                span={12}
                className={`${classes.wordInfoFull}`}
                style={{
                  paddingTop: '0px',
                  maxHeight: vhActual,
                  width: '100%',
                  paddingLeft: isMobile ? '4%' : 
                    (isTablet ? 
                      (isNavbarVisible ? '12%' : '22%') :
                      (isNavbarVisible ? '25%' : '28%')),
                  paddingRight: isMobile ? '4%' : 
                    (isTablet ? 
                      (isNavbarVisible ? '12%' : '22%') :
                      (isNavbarVisible ? '25%' : '28%')),
                  transition: 'padding-right 0.3s ease',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  paddingBottom: '0px'
                }}
              >
                <div className={classes.scrollContainer}>
                  {wordData.length < 1 && isLoadingWordData ? (
                    <LoadingSkeleton />
                  ) : isAdvancedSearchVisible ? (
                    <AdvancedSearch 
                        setAdvancedSearchResults={setAdvancedSearchResults}
                        advancedSearchResults={advancedSearchResults}
                        isMobile={isMobile}
                        setTargetSegmentNumber={setTargetSegmentNumber}
                        query={query}
                        setQuery={setQuery}
                        onSearch={(params) => {
                          console.log('Advanced search params:', params);
                        }}
                        onOpenText={(textId, bookTitle) => {
                          // Store both the ID and title
                          setBookTitle(bookTitle);
                          setIsWordInfoVisible(true);
                          
                      
                        }}
                        matchedBookSegments={matchedBookSegments}
                        setMatchedBookSegments={setMatchedBookSegments}
                      />
                  ) : (
                    <WordDataComponent
                      wordData={wordData}
                      setWordData={setWordData}
                      selectedDictionaries={selectedDictionaries}
                      isMobile={isMobile}
                      setClickedInfoWord={setClickedInfoWord}
                      isTablet={isTablet}
                      isNavabarVisible={isNavbarVisible}
                      setDisplayInflectionTables={setDisplayInflectionTables}
                      displayInflectionTables={displayInflectionTables}
                    />
                  )}
                </div>
              </Grid.Col>
            )}
          </Grid>
        )}
      </div>
    </div>
  );
}